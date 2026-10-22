/**
 * Location-independent restaurant search (strict verified mode).
 * ------------------------------------------------------------------
 * Users can find ANY restaurant in ANY city, not just around where they are:
 *
 *   1. Typed location  - "Prashant Corner Thane", "Mamledar Misal in Thane",
 *                        "Vaishali FC Road", "Vaishali, FC Road Pune", "restaurants in Thane"
 *                        -> search is performed AT that location.
 *   2. Name only       - searched in verified registry (famous heritage landmarks)
 *                        and around the user; if no restaurant NAME matches locally,
 *                        major cities across India are searched.
 *
 * The user's location only drives the default nearby list and "km away".
 * Every returned restaurant is verified (via verified heritage registry or Swiggy).
 * No fake, non-existent, or synthesized restaurants are ever displayed.
 */

import {
  fetchVerifiedNearbyRestaurants,
  haversineKm,
  searchVerifiedScored,
  scoreNameMatch,
  type ScoredVerifiedRestaurant,
  type VerifiedRestaurant
} from './verifiedRestaurants';
import {
  MAJOR_SEARCH_HUBS,
  getHubCoordinates,
  isGenericSearch,
  lookupGazetteer,
  parseLocationFromQuery,
  resolveLocation,
  type ResolvedLocation
} from './locationResolver';
import { db, type Restaurant } from './db';
import { generateLiveMenuForRestaurant } from './liveMenu';
import { isDishRelevantToSearch } from './dishAssets';

const RESULT_LIMIT = 15;
const HUB_CONCURRENCY = 7;
const HUB_SKIP_RADIUS_KM = 25; // hubs this close to the user are already covered by the local search
const CITY_RADIUS_KM = 30;
const AREA_RADIUS_KM = 12;

type Coords = { lat: number; lng: number };

export interface AnywhereSearchResult {
  data: VerifiedRestaurant[];
  scope: 'typed_location' | 'near_user' | 'multi_city' | 'none';
  searchedLocation: { label: string; lat: number; lng: number } | null;
  message?: string;
}

function withUserDistance(r: VerifiedRestaurant, user: Coords | null): VerifiedRestaurant {
  if (!user) {
    const { distanceKm: _omit, ...rest } = r as VerifiedRestaurant & { distanceKm?: number };
    return rest as VerifiedRestaurant;
  }
  return { ...r, distanceKm: haversineKm(user.lat, user.lng, r.latitude, r.longitude) };
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[(),\-&]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function getRestaurantKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and|&)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Score a database-verified heritage restaurant against the search query.
 */
function scoreDbRestaurant(
  rawQuery: string,
  r: Restaurant,
  targetLoc?: ResolvedLocation | null
): { score: number; nameScore: number } {
  const cleanQ = rawQuery.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  const qTokens = tokenizeText(cleanQ);
  if (qTokens.length === 0) return { score: 0, nameScore: 0 };

  const parsed = parseLocationFromQuery(cleanQ);
  const nameQ = (parsed.nameQuery || cleanQ).trim();

  // If a specific target location is searched, restaurant must be in or near that location
  if (targetLoc) {
    const distToTarget = haversineKm(targetLoc.lat, targetLoc.lng, r.latitude, r.longitude);
    const maxRadius = targetLoc.kind === 'area' ? AREA_RADIUS_KM : CITY_RADIUS_KM;
    const rCity = (r.city || '').toLowerCase();
    const rArea = (r.area || '').toLowerCase();
    const locText = (parsed.locationText || targetLoc.label).toLowerCase();
    const textMatch = rCity.includes(locText) || locText.includes(rCity) || rArea.includes(locText) || locText.includes(rArea);
    if (distToTarget > maxRadius && !textMatch) {
      return { score: 0, nameScore: 0 };
    }
  }

  // 1. Direct name match using strict scoring
  const directScore = scoreNameMatch(cleanQ, r.name);
  const parsedScore = nameQ ? scoreNameMatch(nameQ, r.name) : 0;
  let nameScore = Math.max(directScore, parsedScore);

  // 2. Token overlap: e.g. query "Vaishali FC Road" vs "Vaishali Restaurant, FC Road"
  const noiseWords = new Set(['hotel', 'restaurant', 'pure', 'veg', 'the', 'and', 'bar', 'cafe', 'stall']);
  const rNameTokens = tokenizeText(r.name).filter(t => !noiseWords.has(t));
  const qMeaningful = qTokens.filter(t => !noiseWords.has(t));

  const matchedNameTokens = rNameTokens.filter(rt =>
    qMeaningful.some(qt => qt === rt || rt.startsWith(qt) || qt.startsWith(rt))
  );

  if (rNameTokens.length > 0 && matchedNameTokens.length === rNameTokens.length && nameScore < 80) {
    nameScore = 80;
  } else if (rNameTokens.length > 0 && matchedNameTokens.length > 0 && nameScore === 0) {
    const matchRatio = matchedNameTokens.length / rNameTokens.length;
    nameScore = Math.round(matchRatio * 75);
  }

  // 3. Locality bonus: does query contain restaurant area or city?
  const locTokens = tokenizeText(`${r.area || ''} ${r.city || ''}`);
  const hasLocMatch = locTokens.some(lt => lt.length >= 2 && qTokens.some(qt => qt === lt || (qt.length >= 4 && lt.includes(qt))));

  let totalScore = nameScore;
  if (hasLocMatch && nameScore >= 50) {
    totalScore = Math.min(100, nameScore + 20); // strong bonus for matching both restaurant and locality!
  }

  return { score: totalScore, nameScore };
}

/**
 * Searches database-verified registry restaurants.
 */
async function searchDbVerified(
  rawQuery: string,
  userCoords: Coords | null,
  targetLoc?: ResolvedLocation | null
): Promise<ScoredVerifiedRestaurant[]> {
  try {
    const allDb = await db.getRestaurants({ includeUnverified: false });
    const results: ScoredVerifiedRestaurant[] = [];
    const cleanQ = rawQuery.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();

    // Check if query is a dish / food search
    const isDishQuery = cleanQ.length >= 4 && !isGenericSearch(cleanQ);

    for (const r of allDb) {
      if (r.status !== 'active') continue;
      const { score, nameScore } = scoreDbRestaurant(cleanQ, r, targetLoc);

      let finalScore = score;
      let finalNameScore = nameScore;

      // If name didn't match, check if this restaurant serves the searched dish
      if (finalScore === 0 && isDishQuery) {
        const dishes = generateLiveMenuForRestaurant({
          id: r.id,
          name: r.name,
          description: r.description,
          area: r.area,
          city: r.city,
          is_veg: r.is_veg
        });
        const hasDish = dishes.some(d => isDishRelevantToSearch(d.name, cleanQ));
        if (hasDish) {
          finalScore = 75; // high score for serving the searched dish
          finalNameScore = 0;
        }
      }

      if (finalScore >= 50) {
        results.push({
          restaurant: {
            id: r.id,
            name: r.name,
            area: r.area,
            city: r.city,
            address: r.address,
            latitude: r.latitude,
            longitude: r.longitude,
            rating: r.rating,
            image: r.image,
            description: r.description || '',
            is_campaign_active: r.is_campaign_active ?? 1,
            total_visits: r.total_visits || 0,
            status: r.status || 'active',
            is_verified: 1,
            verification_source: 'verified_registry',
            fssai_license: r.fssai_license || null,
            verified_at: r.verified_at || new Date().toISOString(),
            cuisine: r.cuisine_tags || ['Heritage Landmark', 'Authentic Dining'],
            distanceKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, r.latitude, r.longitude) : undefined
          },
          score: finalScore,
          nameScore: finalNameScore
        });
      }
    }
    return results;
  } catch (err) {
    console.warn('searchDbVerified error:', err);
    return [];
  }
}

function mergeScored(target: Map<string, ScoredVerifiedRestaurant>, list: ScoredVerifiedRestaurant[]) {
  for (const s of list) {
    const key = getRestaurantKey(s.restaurant.name);
    // Check if an entry for this restaurant already exists (same id, or same normalized name & location)
    let existingKey: string | null = null;
    for (const [k, existing] of target.entries()) {
      const sameId = String(existing.restaurant.swiggy_id || existing.restaurant.id) === String(s.restaurant.swiggy_id || s.restaurant.id);
      const sameNameAndClose =
        getRestaurantKey(existing.restaurant.name) === key &&
        haversineKm(existing.restaurant.latitude, existing.restaurant.longitude, s.restaurant.latitude, s.restaurant.longitude) <= 1.5;

      if (sameId || sameNameAndClose) {
        existingKey = k;
        break;
      }
    }

    if (existingKey) {
      const prev = target.get(existingKey)!;
      // Prefer DB-verified entry if it has richer metadata/curated menu, or entry with higher match score
      if (
        s.score > prev.score ||
        (s.restaurant.verification_source === 'verified_registry' && prev.restaurant.verification_source !== 'verified_registry')
      ) {
        target.delete(existingKey);
        target.set(String(s.restaurant.swiggy_id || s.restaurant.id), s);
      }
    } else {
      target.set(String(s.restaurant.swiggy_id || s.restaurant.id), s);
    }
  }
}

/**
 * Filter out low-confidence dish noise for name queries (e.g. searching "ABC" shouldn't return
 * 8 restaurants that just serve "Abc Juice" when no other restaurant is relevant).
 */
function filterResults(candidates: ScoredVerifiedRestaurant[], query: string): ScoredVerifiedRestaurant[] {
  const hasStrongNameMatch = candidates.some(s => s.nameScore >= 60);
  if (hasStrongNameMatch) {
    // When there's a strong name match, drop weak dish-only matches
    return candidates.filter(s => s.nameScore >= 50);
  }

  // If NO restaurant matches by name:
  // Allow dish matches only if the query is a recognized food/dish query
  const cleanTerm = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isKnownDishWord = /^(tea|bun|dal|veg|egg|dum|fish|crab|bhel|puri|dosa|idli|vada|soup|rice|roti|naan|curry|pizza|burger|pasta|taco|wrap|roll|chai|kathi|thali|kebab|tikka|chaat|poha|upma|misal|omelet|omelette|cheela|chilla|khichdi|pav|bhaji|mastani|kulfi|falooda|sundae|cake|pastry|momo|momos|biryani|paneer|chicken|mutton|shawarma)$/i.test(cleanTerm);

  if (cleanTerm.length < 4 && !isKnownDishWord) {
    // Short random acronyms/codes like "ABC" or "XYZ" should NOT match arbitrary restaurants
    return candidates.filter(s => s.nameScore >= 50);
  }

  return candidates;
}

function rank(list: ScoredVerifiedRestaurant[], anchor: Coords | null): VerifiedRestaurant[] {
  return list
    .slice()
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (anchor) {
        const da = haversineKm(anchor.lat, anchor.lng, a.restaurant.latitude, a.restaurant.longitude);
        const db = haversineKm(anchor.lat, anchor.lng, b.restaurant.latitude, b.restaurant.longitude);
        return da - db;
      }
      return (a.restaurant.distanceKm ?? Infinity) - (b.restaurant.distanceKm ?? Infinity);
    })
    .map(s => s.restaurant)
    .slice(0, RESULT_LIMIT);
}

export async function searchRestaurantsAnywhere(
  rawQuery: string,
  userCoords: Coords | null,
  options: { selectedCity?: string } = {}
): Promise<AnywhereSearchResult> {
  const query = (rawQuery || '').trim();
  if (query.length < 2) return { data: [], scope: 'none', searchedLocation: null };

  const merged = new Map<string, ScoredVerifiedRestaurant>();
  const parsed = parseLocationFromQuery(query);

  // ------------------------------------------------------------------
  // 1. Query names a location -> search AT that location
  // ------------------------------------------------------------------
  if (parsed.locationText) {
    const loc = await resolveLocation(parsed.locationText, userCoords);
    if (loc) {
      const searchedLocation = { label: loc.label, lat: loc.lat, lng: loc.lng };
      const radius = loc.kind === 'area' ? AREA_RADIUS_KM : CITY_RADIUS_KM;

      // Search DB verified restaurants in this location
      const dbMatches = await searchDbVerified(query, userCoords, loc);
      mergeScored(merged, dbMatches);

      // "restaurants in Thane" -> verified restaurants at that location
      if (isGenericSearch(parsed.nameQuery)) {
        const nearby = await fetchVerifiedNearbyRestaurants(loc.lat, loc.lng, 10);
        const data = nearby.map(r => withUserDistance(r, userCoords));
        // Merge DB verified entries in this location if any
        for (const s of dbMatches) {
          if (!data.some(d => getRestaurantKey(d.name) === getRestaurantKey(s.restaurant.name))) {
            data.unshift(s.restaurant);
          }
        }
        return {
          data: data.slice(0, RESULT_LIMIT),
          scope: 'typed_location',
          searchedLocation,
          ...(data.length === 0 ? { message: `No verified restaurants found in ${loc.label}.` } : {})
        };
      }

      // Search Swiggy verified at this location
      const jobs: Array<Promise<ScoredVerifiedRestaurant[]>> = [
        searchVerifiedScored(parsed.nameQuery, loc, { userCoords, maxDistanceKm: radius })
      ];
      if (parsed.via === 'trailing' && userCoords) {
        jobs.push(searchVerifiedScored(query, userCoords, { userCoords, nameOnly: true }));
      }
      (await Promise.all(jobs)).forEach(list => mergeScored(merged, list));

      const filtered = filterResults(Array.from(merged.values()), query);
      const data = rank(filtered, loc);
      return {
        data,
        scope: 'typed_location',
        searchedLocation,
        ...(data.length === 0
          ? { message: `No verified restaurant matching "${parsed.nameQuery}" found in ${loc.label}.` }
          : {})
      };
    }
  }

  // ------------------------------------------------------------------
  // 2. Search Database-Verified Registry (Heritage Landmarks across India)
  // ------------------------------------------------------------------
  const dbVerifiedMatches = await searchDbVerified(query, userCoords, null);
  mergeScored(merged, dbVerifiedMatches);

  // ------------------------------------------------------------------
  // 3. Name / dish / cuisine search around the user (Swiggy verified)
  // ------------------------------------------------------------------
  if (userCoords) {
    mergeScored(merged, await searchVerifiedScored(query, userCoords, { userCoords }));
  }

  // Check if we have strong local or DB matches
  const filteredLocal = filterResults(Array.from(merged.values()), query);
  const hasLocalMatch = filteredLocal.length > 0;

  if (hasLocalMatch || query.replace(/[^a-z0-9]/gi, '').length < 4) {
    const data = rank(filteredLocal, null);
    return {
      data,
      scope: 'near_user',
      searchedLocation: userCoords ? { label: 'Your location', ...userCoords } : null,
      ...(data.length === 0 ? { message: `No verified restaurant found for "${query}".` } : {})
    };
  }

  // ------------------------------------------------------------------
  // 4. Not found locally -> look for restaurant NAME in major cities across India
  // ------------------------------------------------------------------
  const hubKeys: string[] = [];
  const selected = (options.selectedCity || '').toLowerCase().trim();
  if (selected && lookupGazetteer(selected)) hubKeys.push(selected);
  for (const h of MAJOR_SEARCH_HUBS) if (!hubKeys.includes(h)) hubKeys.push(h);

  const hubs = hubKeys
    .map(k => getHubCoordinates(k) || lookupGazetteer(k))
    .filter((h): h is { lat: number; lng: number; label: string } => Boolean(h))
    .filter(h => !userCoords || haversineKm(userCoords.lat, userCoords.lng, h.lat, h.lng) > HUB_SKIP_RADIUS_KM)
    .filter((h, i, arr) => arr.findIndex(x => x.lat === h.lat && x.lng === h.lng) === i);

  const hubResults = await mapWithConcurrency(hubs, HUB_CONCURRENCY, hub =>
    searchVerifiedScored(query, hub, { userCoords, nameOnly: true, maxVerify: 3, maxDistanceKm: CITY_RADIUS_KM + 10 })
  );
  hubResults.forEach(list => mergeScored(merged, list));

  const filteredFinal = filterResults(Array.from(merged.values()), query);
  const data = rank(filteredFinal, null);

  return {
    data,
    scope: data.length > 0 ? 'multi_city' : 'none',
    searchedLocation: null,
    ...(data.length === 0
      ? { message: `No verified restaurant found for "${query}". Try adding the area or city, e.g. "${query}, Thane".` }
      : {})
  };
}
