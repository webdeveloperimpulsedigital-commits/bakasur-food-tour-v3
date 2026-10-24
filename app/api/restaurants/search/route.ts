import { NextResponse } from 'next/server';
import { fetchLocationFromIP } from '@/lib/ipLocation';
import { parseSwiggyRestaurantUrl, CITY_COORDINATES } from '@/lib/apifySwiggy';
import { parseZomatoUrl } from '@/lib/zomatoEngine';
import { lookupGazetteer } from '@/lib/locationResolver';
import {
  fetchVerifiedNearbyRestaurants,
  verifySwiggyRestaurant,
  toVerifiedRestaurant
} from '@/lib/verifiedRestaurants';
import { searchRestaurantsAnywhere } from '@/lib/restaurantSearch';

export const dynamic = 'force-dynamic';

/**
 * Multi-Source Restaurant Search across Zomato, Swiggy, Google, and verified registry.
 *
 * - No query      -> verified restaurants nearest to the user.
 * - With a query  -> searches across Zomato, Swiggy, Google, and verified registry.
 * - Handles exclusive Zomato restaurants (e.g. Badshahi Boarding House),
 *   exclusive Swiggy restaurants, and Google discoveries.
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
    const gazetteerMatch = cityKey ? (CITY_COORDINATES[cityKey] || lookupGazetteer(cityKey)) : null;
    if (!hasUserCoords && gazetteerMatch) {
      lat = gazetteerMatch.lat;
      lng = gazetteerMatch.lng;
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

    // 1. No query -> closest verified restaurants to the user
    if (!query) {
      const nearby = userCoords ? await fetchVerifiedNearbyRestaurants(lat, lng, 5) : [];
      return NextResponse.json({
        success: true,
        count: nearby.length,
        isLiveAPI: true,
        verification: 'multi_source_verified',
        userCoords,
        data: nearby
      });
    }

    // 2. Pasted Swiggy URL / id -> verify that exact restaurant only (works for any city)
    const parsedSwiggy = parseSwiggyRestaurantUrl(query);
    if (parsedSwiggy.isSwiggyUrl && parsedSwiggy.restaurantId) {
      const result = await verifySwiggyRestaurant(parsedSwiggy.restaurantId, userCoords || undefined);
      const data = result.verified ? [toVerifiedRestaurant(result.profile, userCoords)] : [];
      return NextResponse.json({
        success: true,
        count: data.length,
        isLiveAPI: true,
        verification: 'multi_source_verified',
        data,
        ...(data.length === 0 ? { message: 'This Swiggy restaurant could not be verified.' } : {})
      });
    }

    // 3. Pasted Zomato URL -> search that exact restaurant by name and city
    const parsedZomato = parseZomatoUrl(query);
    if (parsedZomato.isZomatoUrl && parsedZomato.name) {
      const result = await searchRestaurantsAnywhere(parsedZomato.name, userCoords, { selectedCity: parsedZomato.city || city });
      return NextResponse.json({
        success: true,
        count: result.data.length,
        isLiveAPI: true,
        verification: 'multi_source_verified',
        scope: result.scope,
        searchedLocation: result.searchedLocation,
        data: result.data
      });
    }

    // 4. Name / cuisine / dish search across Zomato, Swiggy, and Google in any location
    const result = await searchRestaurantsAnywhere(query, userCoords, { selectedCity: city });
    return NextResponse.json({
      success: true,
      count: result.data.length,
      isLiveAPI: true,
      verification: 'multi_source_verified',
      scope: result.scope,
      searchedLocation: result.searchedLocation,
      spellingSuggestion: result.spellingSuggestion,
      ...(result.message ? { message: result.message } : {}),
      data: result.data
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
