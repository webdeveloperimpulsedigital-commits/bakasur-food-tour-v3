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
    const latParam = parseFloat(searchParams.get('lat') || searchParams.get('latitude') || '');
    const lngParam = parseFloat(searchParams.get('lng') || searchParams.get('longitude') || '');
    const hasExplicitCoords = !isNaN(latParam) && !isNaN(lngParam);

    const userCoords = hasExplicitCoords ? { lat: latParam, lng: lngParam } : null;

    // 1. No query -> closest verified restaurants to the user ONLY if explicit coordinates were provided
    if (!query) {
      if (!hasExplicitCoords) {
        return NextResponse.json({
          success: true,
          count: 0,
          isLiveAPI: true,
          verification: 'multi_source_verified',
          userCoords: null,
          data: []
        });
      }

      const nearby = await fetchVerifiedNearbyRestaurants(latParam, lngParam, 5);
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
