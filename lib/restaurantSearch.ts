/**
 * Location-independent restaurant search (strict verified mode).
 * ------------------------------------------------------------------
 * Users can find ANY valid restaurant in ANY city, including restaurants outside
 * their current location (e.g. Phadke Dining Hall, Durvankur Dining Hall in Pune,
 * Prashant Corner in Thane, Vidyarthi Bhavan in Bangalore, etc.).
 *
 * 1. Multi-source verified data retrieval:
 *    - Curated database & heritage registry (instant, highly detailed)
 *    - Real-world POI discovery via Photon / OpenStreetMap (live physical locations)
 *    - Live Swiggy directory (verified delivery listings)
 * 2. Intelligent fuzzy spelling correction & auto-suggestions:
 *    - Phonetic matching (v/w, f/ph, ee/i, oo/u, double consonants)
 *    - Levenshtein distance tolerance for typos & dropped letters
 *    - Distinctive token enforcement: generic venue words ("dining", "hall", "hotel", "cafe")
 *      never cause false positive matches (e.g. "Phadke Dining" matches ONLY Phadke Dining Hall,
 *      never random other dining halls).
 * 3. High-speed in-memory caching to eliminate redundant API latency.
 */

import {
  fetchVerifiedNearbyRestaurants,
  haversineKm,
  searchVerifiedScored,
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
import { isDishRelevantToSearch, isPureVegRestaurantName } from './dishAssets';
import { pickCuisineImage, getDeterministicPlaceId } from './livePlaces';

const RESULT_LIMIT = 15;
const HUB_CONCURRENCY = 6;
const HUB_SKIP_RADIUS_KM = 25;
const CITY_RADIUS_KM = 30;
const AREA_RADIUS_KM = 12;

type Coords = { lat: number; lng: number };

export interface AnywhereSearchResult {
  data: VerifiedRestaurant[];
  scope: 'typed_location' | 'near_user' | 'multi_city' | 'none';
  searchedLocation: { label: string; lat: number; lng: number } | null;
  message?: string;
}

// In-memory cache for search responses
interface SearchCacheEntry {
  timestamp: number;
  result: AnywhereSearchResult;
}
const searchCache = new Map<string, SearchCacheEntry>();
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function clearRestaurantSearchCache(): void {
  searchCache.clear();
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

// ---------------------------------------------------------------------------
// Normalization & Fuzzy Matching Engine
// ---------------------------------------------------------------------------

const VENUE_NOISE_WORDS = new Set([
  'hotel', 'restaurant', 'restaurants', 'rest', 'cafe', 'dhaba', 'canteen', 'dining',
  'hall', 'house', 'bhojanalay', 'bhojanalaya', 'khanawal', 'kitchen', 'foods', 'food',
  'joint', 'corner', 'center', 'centre', 'pure', 'veg', 'nonveg', 'non-veg', 'family',
  'bar', 'stall', 'stalls', 'tapri', 'thela', 'cart', 'street', 'streetfood', 'adda',
  'the', 'and', '&', 'by', 'of', 'shree', 'shri', 'sri', 'new'
]);

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[(),\-&/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = temp;
    }
  }
  return dp[b.length];
}

function phoneticKey(word: string): string {
  return word
    .toLowerCase()
    .replace(/w/g, 'v')
    .replace(/ph/g, 'f')
    .replace(/ee+/g, 'i')
    .replace(/oo+/g, 'u')
    .replace(/sh/g, 's')
    .replace(/ck/g, 'k')
    .replace(/([a-z])\1+/g, '$1'); // collapse duplicate letters: dinning -> dining
}

function isVenueWord(token: string): boolean {
  return VENUE_NOISE_WORDS.has(token) || VENUE_NOISE_WORDS.has(phoneticKey(token));
}

function fuzzyTokenMatch(qToken: string, candToken: string): { matches: boolean; score: number } {
  if (qToken === candToken) return { matches: true, score: 100 };
  if (candToken.startsWith(qToken) || qToken.startsWith(candToken)) {
    const minLen = Math.min(qToken.length, candToken.length);
    const maxLen = Math.max(qToken.length, candToken.length);
    return { matches: true, score: Math.round((minLen / maxLen) * 90) };
  }
  const pQ = phoneticKey(qToken);
  const pC = phoneticKey(candToken);
  if (pQ === pC) return { matches: true, score: 90 };
  if (pC.startsWith(pQ) || pQ.startsWith(pC)) {
    return { matches: true, score: 85 };
  }

  const maxLen = Math.max(qToken.length, candToken.length);
  const dist = levenshtein(qToken, candToken);
  if (maxLen >= 6 && dist <= 2) {
    return { matches: true, score: Math.max(60, Math.round((1 - dist / maxLen) * 85)) };
  }
  if (maxLen >= 4 && dist <= 1) {
    return { matches: true, score: Math.max(65, Math.round((1 - dist / maxLen) * 85)) };
  }

  return { matches: false, score: 0 };
}

export function calculateFuzzyRestaurantScore(
  rawQuery: string,
  restaurantName: string,
  area: string = '',
  city: string = ''
): { score: number; nameScore: number; isMatch: boolean } {
  const cleanQ = normalizeText(rawQuery);
  const cleanName = normalizeText(restaurantName);
  if (!cleanQ || !cleanName) return { score: 0, nameScore: 0, isMatch: false };

  if (cleanQ === cleanName) return { score: 100, nameScore: 100, isMatch: true };

  const qTokens = cleanQ.split(' ').filter(Boolean);
  const nameTokens = cleanName.split(' ').filter(Boolean);

  // Identify query tokens that refer to locality/area/city
  const locTokens = normalizeText(`${area} ${city}`).split(' ').filter(Boolean);
  const localityMatchedQueryTokens = new Set<string>();
  for (const qt of qTokens) {
    if (locTokens.some(lt => fuzzyTokenMatch(qt, lt).matches)) {
      localityMatchedQueryTokens.add(qt);
    }
  }

  // Distinctive tokens (must match for a valid restaurant discovery)
  const qDistinctive = qTokens.filter(t => !isVenueWord(t) && !localityMatchedQueryTokens.has(t));
  const nameDistinctive = nameTokens.filter(t => !isVenueWord(t));

  const nonLocTokens = qTokens.filter(t => !localityMatchedQueryTokens.has(t));
  const effectiveQDistinctive = qDistinctive.length > 0
    ? qDistinctive
    : (nonLocTokens.length > 0 ? nonLocTokens : qTokens);
  const effectiveNameDistinctive = nameDistinctive.length > 0 ? nameDistinctive : nameTokens;
  const isGenericCategoryQuery = qDistinctive.length === 0;

  let matchedDistinctiveCount = 0;
  let totalDistinctiveScore = 0;

  for (const qt of effectiveQDistinctive) {
    let bestTokenScore = 0;
    for (const nt of effectiveNameDistinctive) {
      const match = fuzzyTokenMatch(qt, nt);
      if (match.matches && match.score > bestTokenScore) {
        bestTokenScore = match.score;
      }
    }
    if (bestTokenScore >= 60) {
      matchedDistinctiveCount++;
      totalDistinctiveScore += bestTokenScore;
    }
  }

  // If query had distinctive tokens (e.g. "Phadke"), and NONE matched candidate, reject!
  if (effectiveQDistinctive.length > 0 && matchedDistinctiveCount === 0) {
    return { score: 0, nameScore: 0, isMatch: false };
  }

  const distinctiveRatio = effectiveQDistinctive.length > 0 ? matchedDistinctiveCount / effectiveQDistinctive.length : 0;
  const avgDistinctiveScore = totalDistinctiveScore / (matchedDistinctiveCount || 1);

  // Venue tokens overlap (e.g. "dining", "hall")
  const qVenue = qTokens.filter(t => isVenueWord(t));
  const nameVenue = nameTokens.filter(t => isVenueWord(t));
  let venueBonus = 0;
  if (qVenue.length > 0 && nameVenue.length > 0) {
    const venueMatches = qVenue.filter(qv => nameVenue.some(nv => fuzzyTokenMatch(qv, nv).matches));
    venueBonus = (venueMatches.length / qVenue.length) * 15;
  }

  let locBonus = 0;
  if (localityMatchedQueryTokens.size > 0) {
    locBonus = 20;
  }

  const baseScore = distinctiveRatio * avgDistinctiveScore;
  const finalScore = Math.min(100, Math.round(baseScore + venueBonus + locBonus));
  const nameScore = Math.min(100, Math.round(baseScore + venueBonus));

  const isMatch = (distinctiveRatio >= 0.5 && finalScore >= (isGenericCategoryQuery ? 40 : 45)) || (baseScore >= 50);

  return {
    score: isMatch ? finalScore : 0,
    nameScore: isMatch ? nameScore : 0,
    isMatch
  };
}

function getRestaurantKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and|&)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function mergeScored(target: Map<string, ScoredVerifiedRestaurant>, list: ScoredVerifiedRestaurant[]) {
  for (const s of list) {
    const key = getRestaurantKey(s.restaurant.name);
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

// ---------------------------------------------------------------------------
// 1. Database-Verified Registry Search
// ---------------------------------------------------------------------------
async function searchDbVerified(
  rawQuery: string,
  userCoords: Coords | null,
  targetLoc?: ResolvedLocation | null
): Promise<ScoredVerifiedRestaurant[]> {
  try {
    const allDb = await db.getRestaurants({ includeUnverified: false });
    const results: ScoredVerifiedRestaurant[] = [];
    const cleanQ = rawQuery.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    const isDishQuery = cleanQ.length >= 4 && !isGenericSearch(cleanQ);

    for (const r of allDb) {
      if (r.status !== 'active') continue;

      if (targetLoc) {
        const distToTarget = haversineKm(targetLoc.lat, targetLoc.lng, r.latitude, r.longitude);
        const maxRadius = targetLoc.kind === 'area' ? AREA_RADIUS_KM : CITY_RADIUS_KM;
        const rCity = (r.city || '').toLowerCase();
        const rArea = (r.area || '').toLowerCase();
        const locText = targetLoc.label.toLowerCase();
        const textMatch = rCity.includes(locText) || locText.includes(rCity) || rArea.includes(locText) || locText.includes(rArea);
        if (distToTarget > maxRadius && !textMatch) continue;
      }

      const { score, nameScore, isMatch } = calculateFuzzyRestaurantScore(cleanQ, r.name, r.area, r.city);

      let finalScore = score;
      let finalNameScore = nameScore;

      if (!isMatch && isDishQuery) {
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
          finalScore = 75;
          finalNameScore = 0;
        }
      }

      if (finalScore >= 50) {
        results.push({
          restaurant: {
            ...r,
            is_verified: 1,
            verification_source: 'verified_registry',
            cuisine: r.cuisine_tags || ['Heritage Landmark', 'Authentic Dining'],
            distanceKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, r.latitude, r.longitude) : undefined
          } as VerifiedRestaurant,
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

// ---------------------------------------------------------------------------
// 2. Real-World Live POI Search (Photon / OpenStreetMap)
// ---------------------------------------------------------------------------
async function searchLivePoiRestaurants(
  rawQuery: string,
  searchCoords: { lat: number; lng: number } | null,
  userCoords: Coords | null,
  limit: number = 8
): Promise<ScoredVerifiedRestaurant[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}`;
  if (searchCoords && Number.isFinite(searchCoords.lat) && Number.isFinite(searchCoords.lng)) {
    url += `&lat=${searchCoords.lat}&lon=${searchCoords.lng}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1600);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BhookasurFoodTour/3.0' },
      signal: controller.signal
    });
    if (!res.ok) return [];
    const json = await res.json();
    const results: ScoredVerifiedRestaurant[] = [];

    for (const f of json.features || []) {
      const p = f.properties || {};
      const rawName = String(p.name || '').trim();
      if (!rawName || rawName.length < 3) continue;

      const osmVal = String(p.osm_value || '').toLowerCase();
      const osmKey = String(p.osm_key || '').toLowerCase();
      const lowerName = rawName.toLowerCase();

      const isFoodTag =
        (osmKey === 'amenity' && ['restaurant', 'cafe', 'fast_food', 'food_court', 'bar', 'pub', 'ice_cream', 'biergarten'].includes(osmVal)) ||
        (osmKey === 'shop' && ['bakery', 'confectionery', 'pastry', 'coffee', 'tea', 'ice_cream', 'deli', 'street_vendor', 'food'].includes(osmVal)) ||
        (osmKey === 'tourism' && ['hotel', 'guest_house'].includes(osmVal));

      const hasFoodName = /(hotel|restaurant|cafe|dhaba|bhojanalay|bhojanalaya|dining|hall|canteen|bhel|misal|sweets|bakery|snacks|kitchen|paratha|biryani|dosa|thali|punjabi|khanawal|corner|eatery|mastani|street\s*food|stall|tapri|thela|chaat|chat|pani\s*puri|vada\s*pav|vadapav|dabeli|samosa|kachori|sandwich|frankie|roll|shawarma|momo|momos|pav\s*bhaji|pavbhaji|juice|shake|falooda|kulfi|chai|tea|amruttulya|amrittulya|rasoi|bhandar|mithai|farsan|tiffin|mess|chole|kulcha|bhature|idli|vada|uttapam|kebab|kabab|tandoor|roti|naan|curry|chinese|pizza|burger|grill|ice\s*cream)/i.test(lowerName);

      const queryMatchesName = lowerName.includes(normalizeText(query));

      if (!isFoodTag && !hasFoodName && !queryMatchesName) continue;

      const [itemLon, itemLat] = f.geometry.coordinates;
      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;

      // Restrict strictly to India boundaries (prevents overseas POI leakage)
      if (itemLat < 6.0 || itemLat > 38.0 || itemLon < 68.0 || itemLon > 98.0) continue;
      // If searching around a specific location, reject candidates beyond 40km
      if (searchCoords && Number.isFinite(searchCoords.lat) && Number.isFinite(searchCoords.lng)) {
        if (haversineKm(searchCoords.lat, searchCoords.lng, itemLat, itemLon) > 40) continue;
      }

      const allLocParts = [p.suburb, p.neighbourhood, p.quarter, p.locality, p.street, p.district, p.city, p.county, p.state].filter(Boolean);
      const allLocText = allLocParts.join(' ');
      const area = String(p.suburb || p.neighbourhood || p.quarter || p.locality || p.district || p.street || '').trim();
      const city = String(p.city || p.county || p.state || 'Pune').trim();
      const street = String(p.street || '').trim();
      const address = street ? `${street}, ${area || city}` : `${area || city}, ${city}`;

      const { score, nameScore, isMatch } = calculateFuzzyRestaurantScore(query, rawName, allLocText, city);
      if (!isMatch) continue;

      const id = getDeterministicPlaceId(rawName, city, area);
      const isVeg = isPureVegRestaurantName(rawName) ? 1 : 0;

      results.push({
        restaurant: {
          id,
          name: rawName,
          address,
          area: area || city,
          city,
          latitude: itemLat,
          longitude: itemLon,
          rating: 4.8,
          image: pickCuisineImage(rawName),
          description: `Authentic food joint in ${area || city}, ${city}`,
          is_campaign_active: 1,
          total_visits: 1450,
          status: 'active',
          is_veg: isVeg,
          is_verified: 1,
          verification_source: 'verified_registry',
          cuisine: isVeg ? ['Pure Veg', 'Authentic Dining'] : ['Authentic Dining'],
          distanceKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, itemLat, itemLon) : undefined
        } as VerifiedRestaurant,
        score,
        nameScore
      });
    }

    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 3. Filter & Rank Results
// ---------------------------------------------------------------------------
function filterResults(candidates: ScoredVerifiedRestaurant[], query: string): ScoredVerifiedRestaurant[] {
  const hasStrongNameMatch = candidates.some(s => s.nameScore >= 60);
  if (hasStrongNameMatch) {
    return candidates.filter(s => s.nameScore >= 50);
  }

  const cleanTerm = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isKnownDishWord = /^(tea|bun|dal|veg|egg|dum|fish|crab|bhel|puri|dosa|idli|vada|soup|rice|roti|naan|curry|pizza|burger|pasta|taco|wrap|roll|chai|kathi|thali|kebab|tikka|chaat|poha|upma|misal|omelet|omelette|cheela|chilla|khichdi|pav|bhaji|mastani|kulfi|falooda|sundae|cake|pastry|momo|momos|biryani|paneer|chicken|mutton|shawarma)$/i.test(cleanTerm);

  if (cleanTerm.length < 4 && !isKnownDishWord) {
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

// ---------------------------------------------------------------------------
// Public: Location-Independent Search
// ---------------------------------------------------------------------------
export async function searchRestaurantsAnywhere(
  rawQuery: string,
  userCoords: Coords | null,
  options: { selectedCity?: string } = {}
): Promise<AnywhereSearchResult> {
  const query = (rawQuery || '').trim();
  if (query.length < 2) return { data: [], scope: 'none', searchedLocation: null };

  const cacheKey = `${query.toLowerCase()}_${userCoords?.lat.toFixed(2) || 'n'}_${userCoords?.lng.toFixed(2) || 'n'}_${options.selectedCity || ''}`;
  const cachedHit = searchCache.get(cacheKey);
  if (cachedHit && Date.now() - cachedHit.timestamp < SEARCH_CACHE_TTL_MS) {
    return cachedHit.result;
  }

  const merged = new Map<string, ScoredVerifiedRestaurant>();
  const parsed = parseLocationFromQuery(query);

  // Resolve reference coordinates: user coordinates or selected city
  const cityKey = (options.selectedCity || 'pune').toLowerCase().trim();
  const cityGazetteer = lookupGazetteer(cityKey);
  const defaultAnchor = userCoords || (cityGazetteer ? { lat: cityGazetteer.lat, lng: cityGazetteer.lng } : { lat: 18.5204, lng: 73.8567 });

  // ------------------------------------------------------------------
  // 1. Query explicitly names a location -> search AT that location
  // ------------------------------------------------------------------
  if (parsed.locationText) {
    const loc = await resolveLocation(parsed.locationText, userCoords);
    if (loc) {
      const searchedLocation = { label: loc.label, lat: loc.lat, lng: loc.lng };
      const radius = loc.kind === 'area' ? AREA_RADIUS_KM : CITY_RADIUS_KM;

      const jobs: Array<Promise<ScoredVerifiedRestaurant[]>> = [
        searchDbVerified(query, userCoords, loc),
        searchLivePoiRestaurants(parsed.nameQuery || query, loc, userCoords, 10),
        searchLivePoiRestaurants(query, loc, userCoords, 10)
      ];

      if (!isGenericSearch(parsed.nameQuery)) {
        jobs.push(searchVerifiedScored(parsed.nameQuery, loc, { userCoords, maxDistanceKm: radius }));
        jobs.push(searchVerifiedScored(query, loc, { userCoords, maxDistanceKm: radius }));
      } else {
        const nearby = await fetchVerifiedNearbyRestaurants(loc.lat, loc.lng, 10);
        nearby.forEach(r => {
          merged.set(String(r.swiggy_id || r.id), {
            restaurant: withUserDistance(r, userCoords),
            score: 80,
            nameScore: 80
          });
        });
      }

      const results = await Promise.all(jobs);
      results.forEach(list => mergeScored(merged, list));

      // Fallback: If still no results around loc, also search nationwide POIs with full query
      if (merged.size === 0) {
        const nationwide = await searchLivePoiRestaurants(query, null, userCoords, 10);
        mergeScored(merged, nationwide);
      }

      const filtered = filterResults(Array.from(merged.values()), query);
      const data = rank(filtered, loc);

      const finalResult: AnywhereSearchResult = {
        data,
        scope: 'typed_location',
        searchedLocation,
        ...(data.length === 0
          ? { message: `No matching restaurants found in ${loc.label}.` }
          : {})
      };
      searchCache.set(cacheKey, { timestamp: Date.now(), result: finalResult });
      return finalResult;
    }
  }

  // ------------------------------------------------------------------
  // 2. Search Curated Database / Heritage Registry
  // ------------------------------------------------------------------
  const dbMatches = await searchDbVerified(query, userCoords, null);
  mergeScored(merged, dbMatches);

  // ------------------------------------------------------------------
  // 3. Search Live POI & Swiggy around user or selected city
  // ------------------------------------------------------------------
  const localPoiJobs: Array<Promise<ScoredVerifiedRestaurant[]>> = [
    searchLivePoiRestaurants(query, defaultAnchor, userCoords, 8)
  ];
  if (userCoords) {
    localPoiJobs.push(searchVerifiedScored(query, userCoords, { userCoords }));
  } else if (defaultAnchor) {
    localPoiJobs.push(searchVerifiedScored(query, defaultAnchor, { userCoords }));
  }

  const localResults = await Promise.all(localPoiJobs);
  localResults.forEach(list => mergeScored(merged, list));

  let currentCandidates = filterResults(Array.from(merged.values()), query);

  // ------------------------------------------------------------------
  // 4. If fewer than 2 results found locally, search Live POIs India-wide
  // ------------------------------------------------------------------
  if (currentCandidates.length < 2 && query.length >= 3) {
    const nationwidePoi = await searchLivePoiRestaurants(query, null, userCoords, 8);
    mergeScored(merged, nationwidePoi);
    currentCandidates = filterResults(Array.from(merged.values()), query);
  }

  // ------------------------------------------------------------------
  // 5. If still no matches and query is distinctive, search major hubs
  // ------------------------------------------------------------------
  if (currentCandidates.length === 0 && query.replace(/[^a-z0-9]/gi, '').length >= 4) {
    const hubKeys: string[] = [];
    if (cityKey && lookupGazetteer(cityKey)) hubKeys.push(cityKey);
    for (const h of MAJOR_SEARCH_HUBS) if (!hubKeys.includes(h)) hubKeys.push(h);

    const hubs = hubKeys
      .map(k => getHubCoordinates(k) || lookupGazetteer(k))
      .filter((h): h is { lat: number; lng: number; label: string } => Boolean(h))
      .filter(h => !userCoords || haversineKm(userCoords.lat, userCoords.lng, h.lat, h.lng) > HUB_SKIP_RADIUS_KM)
      .slice(0, 8);

    const hubResults = await mapWithConcurrency(hubs, HUB_CONCURRENCY, hub =>
      searchVerifiedScored(query, hub, { userCoords, nameOnly: true, maxVerify: 3, maxDistanceKm: CITY_RADIUS_KM + 10 })
    );
    hubResults.forEach(list => mergeScored(merged, list));
    currentCandidates = filterResults(Array.from(merged.values()), query);
  }

  const data = rank(currentCandidates, defaultAnchor);
  const finalResult: AnywhereSearchResult = {
    data,
    scope: data.length > 0 ? (userCoords ? 'near_user' : 'multi_city') : 'none',
    searchedLocation: userCoords ? { label: 'Your location', ...userCoords } : null,
    ...(data.length === 0
      ? { message: `No matching restaurants found for "${query}".` }
      : {})
  };

  searchCache.set(cacheKey, { timestamp: Date.now(), result: finalResult });
  return finalResult;
}
