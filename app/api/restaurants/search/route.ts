import { NextResponse } from 'next/server';
import { fetchLocationFromIP } from '@/lib/ipLocation';
import { parseSwiggyRestaurantUrl, CITY_COORDINATES } from '@/lib/apifySwiggy';
import {
  fetchVerifiedNearbyRestaurants,
  verifySwiggyRestaurant,
  toVerifiedRestaurant
} from '@/lib/verifiedRestaurants';
import { searchRestaurantsAnywhere } from '@/lib/restaurantSearch';

export const dynamic = 'force-dynamic';

/**
 * Restaurant search (strict verified mode, location-independent).
 *
 * - No query      -> verified restaurants nearest to the user (default list).
 * - With a query  -> any restaurant in any city: a typed location ("Prashant Corner Thane",
 *                    "Misal in Thane", "Vaishali, FC Road Pune") is searched at that place;
 *                    otherwise around the user, then across major cities by restaurant name.
 *
 * Only restaurants that pass full Swiggy verification are returned
 * (see lib/verifiedRestaurants.ts). No restaurant is ever synthesized from the
 * user's typed text, autocomplete suggestions, OpenStreetMap, or seed data.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim();
    const city = (searchParams.get('city') || '').trim();
    let lat = parseFloat(searchParams.get('lat') || searchParams.get('latitude') || '');
    let lng = parseFloat(searchParams.get('lng') || searchParams.get('longitude') || '');
    let hasUserCoords = !isNaN(lat) && !isNaN(lng);

    // Resolve the user's position: explicit coords -> selected city centre -> IP geolocation
    const cityKey = city.toLowerCase();
    if (!hasUserCoords && cityKey && CITY_COORDINATES[cityKey]) {
      lat = CITY_COORDINATES[cityKey].lat;
      lng = CITY_COORDINATES[cityKey].lng;
      hasUserCoords = true;
    } else if (!hasUserCoords) {
      const forwarded = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const cfIp = request.headers.get('cf-connecting-ip');
      const clientIp = (cfIp || forwarded?.split(',')[0] || realIp || '').trim();
      const ipGeo = await fetchLocationFromIP(clientIp);
      if (ipGeo) {
        lat = ipGeo.lat;
        lng = ipGeo.lng;
        hasUserCoords = true;
      }
    }

    const userCoords = hasUserCoords ? { lat, lng } : null;

    // 1. No query -> closest verified restaurants to the user (the ONLY place user location limits results)
    if (!query) {
      const nearby = userCoords ? await fetchVerifiedNearbyRestaurants(lat, lng, 5) : [];
      return NextResponse.json({
        success: true,
        count: nearby.length,
        isLiveAPI: true,
        verification: 'swiggy_strict',
        userCoords,
        data: nearby
      });
    }

    // 2. Pasted Swiggy URL / id -> verify that exact restaurant only (works for any city)
    const parsedUrl = parseSwiggyRestaurantUrl(query);
    if (parsedUrl.isSwiggyUrl && parsedUrl.restaurantId) {
      const result = await verifySwiggyRestaurant(parsedUrl.restaurantId, userCoords || undefined);
      const data = result.verified ? [toVerifiedRestaurant(result.profile, userCoords)] : [];
      return NextResponse.json({
        success: true,
        count: data.length,
        isLiveAPI: true,
        verification: 'swiggy_strict',
        data,
        ...(data.length === 0 ? { message: 'This Swiggy restaurant could not be verified.' } : {})
      });
    }

    // 3. Name / cuisine / dish search in any location -> verified matches only
    const result = await searchRestaurantsAnywhere(query, userCoords, { selectedCity: city });
    return NextResponse.json({
      success: true,
      count: result.data.length,
      isLiveAPI: true,
      verification: 'swiggy_strict',
      scope: result.scope,
      searchedLocation: result.searchedLocation,
      ...(result.message ? { message: result.message } : {}),
      data: result.data
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
