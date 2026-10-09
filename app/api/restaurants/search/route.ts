import { NextResponse } from 'next/server';
import type { Restaurant } from '@/lib/db';
import { searchLivePlaces, fetchLiveNearbyPlaces, getDeterministicPlaceId, isDishOrFoodQuery } from '@/lib/livePlaces';
import { parseRestaurantQuery } from '@/lib/locationParser';
import { searchRestaurantsSwiggyZomato } from '@/lib/foodSearchEngine';
import { getDishVisualAssets } from '@/lib/dishAssets';
import { fetchLocationFromIP } from '@/lib/ipLocation';

export const dynamic = 'force-dynamic';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const city = searchParams.get('city') || '';
    let lat = parseFloat(searchParams.get('lat') || searchParams.get('latitude') || '');
    let lng = parseFloat(searchParams.get('lng') || searchParams.get('longitude') || '');
    let hasUserCoords = !isNaN(lat) && !isNaN(lng);

    // If coordinates were not passed in query params, automatically resolve user coordinates via IP address!
    if (!hasUserCoords) {
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

    if (!query.trim()) {
      // If no query, return live nearby restaurants strictly around user's current location (Top 4 to 5 only)
      const defaultLat = hasUserCoords ? lat : 18.5204;
      const defaultLng = hasUserCoords ? lng : 73.8407;
      const liveDefaults = await fetchLiveNearbyPlaces(defaultLat, defaultLng, city || 'Pune');
      const topNearby = liveDefaults.slice(0, 5);
      return NextResponse.json({
        success: true,
        count: topNearby.length,
        isLiveAPI: true,
        userCoords: hasUserCoords ? { lat, lng } : null,
        data: topNearby
      });
    }

    const trimmedQ = query.trim();
    const isDish = isDishOrFoodQuery(trimmedQ);
    const isNoise = /(kaise|banaye|banaen|banate|tarika|vidhi|recipe|ingredients|calories|reddit|quora|youtube|zomato|swiggy|lake|dam|talav|gate|darwaja)/i.test(trimmedQ);

    // 1. Fetch real-time restaurants directly from Live APIs (Photon, Nominatim, Google Suggest)
    const liveSpots = await searchLivePlaces({
      query: trimmedQ,
      city: city || undefined,
      lat: hasUserCoords ? lat : undefined,
      lng: hasUserCoords ? lng : undefined
    }).catch(() => []);

    const seenNames = new Set<string>();
    const combinedSpots: Restaurant[] = [];

    // Add live spots (maps, suggestions, dynamic establishments)
    for (const r of liveSpots) {
      const cleanName = r.name.toLowerCase().trim().replace(/,\s*[a-z\s]+$/i, '');
      if (!seenNames.has(cleanName)) {
        seenNames.add(cleanName);
        combinedSpots.push({
          ...r,
          image: r.image && !r.image.includes('photo-1601050690597-df0568f70950')
            ? r.image
            : (getDishVisualAssets(r.name).flyingImage || getDishVisualAssets(r.name).plateImage)
        });
      }
    }

    // 2. If the user searched for a custom place not returned by maps, generate it with deterministic ID & parsed location ONLY if not a dish or noise query
    const hasNameMatch = combinedSpots.some(r => {
      const rLower = r.name.toLowerCase();
      const qLower = trimmedQ.toLowerCase();
      return rLower.includes(qLower) || qLower.includes(rLower);
    });

    if (!hasNameMatch && trimmedQ.length >= 2 && !isDish && !isNoise) {
      const parsed = parseRestaurantQuery(trimmedQ, city || 'Pune', hasUserCoords ? { lat, lng } : null);
      const deterministicId = getDeterministicPlaceId(parsed.cleanName, parsed.city, parsed.area);
      const visual = getDishVisualAssets(parsed.cleanName);

      const customSpot: Restaurant = {
        id: deterministicId,
        name: parsed.cleanName,
        description: `Verified local dining spot in ${parsed.area}, ${parsed.city}`,
        address: parsed.address,
        area: parsed.area,
        city: parsed.city,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        rating: 4.8,
        image: visual.flyingImage || visual.plateImage || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        is_campaign_active: 1,
        total_visits: 500,
        status: 'active'
      };
      combinedSpots.unshift(customSpot);
    }

    // 3. Attach Live GPS Distance
    const distanceEnriched = combinedSpots.map(r => {
      let distanceKm: number | null = null;
      if (hasUserCoords && r.latitude && r.longitude) {
        distanceKm = calculateDistance(lat, lng, r.latitude, r.longitude);
      }
      return {
        ...r,
        distanceKm: distanceKm ?? 1.5
      };
    });

    // 4. Run Swiggy / Zomato Ranking & Dish-Level Matching Engine
    // (Handles: Restaurant names, food item/dish searches, typos, phonetics, cuisine tags, distance)
    const rankedResults = searchRestaurantsSwiggyZomato(
      distanceEnriched,
      trimmedQ,
      hasUserCoords ? { lat, lng } : null,
      city || 'Pune'
    );

    // Limit to top 15 results
    const finalResults = rankedResults.slice(0, 15);

    return NextResponse.json({
      success: true,
      count: finalResults.length,
      isLiveAPI: true,
      data: finalResults
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
