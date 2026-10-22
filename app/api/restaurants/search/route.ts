import { NextResponse } from 'next/server';
import { fetchLocationFromIP } from '@/lib/ipLocation';
import { parseSwiggyRestaurantUrl, CITY_COORDINATES } from '@/lib/apifySwiggy';
import {
  fetchVerifiedNearbyRestaurants,
  searchVerifiedRestaurants,
  verifySwiggyRestaurant,
  toVerifiedRestaurant
} from '@/lib/verifiedRestaurants';

export const dynamic = 'force-dynamic';

/**
 * Restaurant search (strict verified mode).
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

    // Resolve search location: explicit coords -> selected city centre -> IP geolocation
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

    if (!hasUserCoords) {
      // Without a location we cannot verify serviceable, nearby restaurants
      return NextResponse.json({ success: true, count: 0, isLiveAPI: true, verification: 'swiggy_strict', userCoords: null, data: [] });
    }

    const userCoords = { lat, lng };

    // 1. No query -> closest verified restaurants
    if (!query) {
      const nearby = await fetchVerifiedNearbyRestaurants(lat, lng, 5);
      return NextResponse.json({
        success: true,
        count: nearby.length,
        isLiveAPI: true,
        verification: 'swiggy_strict',
        userCoords,
        data: nearby
      });
    }

    // 2. Pasted Swiggy URL / id -> verify that exact restaurant only
    const parsedUrl = parseSwiggyRestaurantUrl(query);
    if (parsedUrl.isSwiggyUrl && parsedUrl.restaurantId) {
      const result = await verifySwiggyRestaurant(parsedUrl.restaurantId, userCoords);
      const data = result.verified ? [toVerifiedRestaurant(result.profile, userCoords)] : [];
      return NextResponse.json({ success: true, count: data.length, isLiveAPI: true, verification: 'swiggy_strict', data });
    }

    // 3. Name / cuisine / dish search -> verified matches only
    const results = await searchVerifiedRestaurants(query, lat, lng, 15);
    return NextResponse.json({
      success: true,
      count: results.length,
      isLiveAPI: true,
      verification: 'swiggy_strict',
      data: results
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
