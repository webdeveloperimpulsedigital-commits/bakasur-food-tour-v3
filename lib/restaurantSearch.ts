/**
 * Location-independent restaurant search (strict verified mode).
 * ------------------------------------------------------------------
 * Users can find ANY restaurant in ANY city, not just around where they are:
 *
 *   1. Typed location  - "Prashant Corner Thane", "Mamledar Misal in Thane",
 *                        "Vaishali, FC Road Pune", "restaurants in Thane"
 *                        -> search is performed AT that location.
 *   2. Name only       - searched around the user first; if no restaurant NAME
 *                        matches there, major cities across India are searched
 *                        (name matches only, so no irrelevant far-away results).
 *
 * The user's location only drives the default nearby list and "km away".
 * Every returned restaurant passes full Swiggy verification
 * (lib/verifiedRestaurants.ts). Nothing is ever synthesized.
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
  resolveLocation
} from './locationResolver';

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

function mergeScored(target: Map<string, ScoredVerifiedRestaurant>, list: ScoredVerifiedRestaurant[]) {
  for (const s of list) {
    const id = String(s.restaurant.swiggy_id || s.restaurant.id);
    const prev = target.get(id);
    if (!prev || s.score > prev.score) target.set(id, s);
  }
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

      // "restaurants in Thane" -> verified restaurants at that location
      if (isGenericSearch(parsed.nameQuery)) {
        const nearby = await fetchVerifiedNearbyRestaurants(loc.lat, loc.lng, 10);
        const data = nearby.map(r => withUserDistance(r, userCoords));
        return {
          data,
          scope: 'typed_location',
          searchedLocation,
          ...(data.length === 0 ? { message: `No verified restaurants found in ${loc.label}.` } : {})
        };
      }

      const jobs: Array<Promise<ScoredVerifiedRestaurant[]>> = [
        searchVerifiedScored(parsed.nameQuery, loc, { userCoords, maxDistanceKm: radius })
      ];
      // A trailing city word may also be part of a real name ("Taste of Pune"): try the full text near the user too
      if (parsed.via === 'trailing' && userCoords) {
        jobs.push(searchVerifiedScored(query, userCoords, { userCoords, nameOnly: true }));
      }
      (await Promise.all(jobs)).forEach(list => mergeScored(merged, list));

      const data = rank(Array.from(merged.values()), loc);
      return {
        data,
        scope: 'typed_location',
        searchedLocation,
        ...(data.length === 0
          ? { message: `No verified restaurant matching "${parsed.nameQuery}" found in ${loc.label}.` }
          : {})
      };
    }
    // Location text could not be resolved -> treat the whole query as a name (below)
  }

  // ------------------------------------------------------------------
  // 2. Name / dish / cuisine search around the user
  // ------------------------------------------------------------------
  if (userCoords) {
    mergeScored(merged, await searchVerifiedScored(query, userCoords, { userCoords }));
  }

  // Any verified local match (restaurant name, cuisine, or a dish they actually serve) answers the query;
  // only when nothing at all matches nearby do we look for the name in other cities.
  const hasLocalMatch = merged.size > 0;
  if (hasLocalMatch || query.replace(/[^a-z0-9]/gi, '').length < 4) {
    const data = rank(Array.from(merged.values()), null);
    return {
      data,
      scope: 'near_user',
      searchedLocation: userCoords ? { label: 'Your location', ...userCoords } : null,
      ...(data.length === 0 ? { message: `No verified restaurant found for "${query}".` } : {})
    };
  }

  // ------------------------------------------------------------------
  // 3. Not found nearby -> look for that restaurant NAME in major cities
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

  // Far-away cities contribute name matches only; drop local cuisine/dish noise when a real name match exists
  let finalList = Array.from(merged.values());
  if (finalList.some(s => s.nameScore >= 60)) finalList = finalList.filter(s => s.nameScore >= 60);

  const data = rank(finalList, null);
  return {
    data,
    scope: data.length > 0 ? 'multi_city' : 'none',
    searchedLocation: null,
    ...(data.length === 0
      ? { message: `No verified restaurant found for "${query}". Try adding the area or city, e.g. "${query}, Thane".` }
      : {})
  };
}
