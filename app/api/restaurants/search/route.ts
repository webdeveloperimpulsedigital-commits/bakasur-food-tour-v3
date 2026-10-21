import { NextResponse } from 'next/server';
import type { Restaurant } from '@/lib/db';
import { searchLivePlaces, fetchLiveNearbyPlaces, getDeterministicPlaceId, isDishOrFoodQuery, pickCuisineImage } from '@/lib/livePlaces';
import { parseRestaurantQuery } from '@/lib/locationParser';
import { searchRestaurantsSwiggyZomato } from '@/lib/foodSearchEngine';
import { getDishVisualAssets, isPureVegRestaurantName } from '@/lib/dishAssets';
import { fetchLocationFromIP } from '@/lib/ipLocation';
import { isApifyConfigured, fetchSwiggyRestaurantViaApify, parseSwiggyRestaurantUrl, CITY_COORDINATES } from '@/lib/apifySwiggy';

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
  console.log('[SEARCH ROUTE] GET called with url:', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const city = searchParams.get('city') || '';
    let lat = parseFloat(searchParams.get('lat') || searchParams.get('latitude') || '');
    let lng = parseFloat(searchParams.get('lng') || searchParams.get('longitude') || '');
    let hasExplicitCoords = !isNaN(lat) && !isNaN(lng);
    let hasUserCoords = hasExplicitCoords;

    // If city is explicitly given (e.g. Bangalore) and no explicit lat/lng, use city's center coordinates
    const cityKey = city.toLowerCase().trim();
    if (!hasExplicitCoords && cityKey && CITY_COORDINATES[cityKey]) {
      lat = CITY_COORDINATES[cityKey].lat;
      lng = CITY_COORDINATES[cityKey].lng;
      hasUserCoords = true;
    } else if (!hasUserCoords) {
      // If no city and no coordinates, resolve via IP address
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

    // Check if query is a Swiggy restaurant URL
    const parsedSwiggyUrl = parseSwiggyRestaurantUrl(trimmedQ);
    const effectiveCity = parsedSwiggyUrl.city || city || 'Pune';
    const effectiveSearchName = parsedSwiggyUrl.name || trimmedQ;

    // 1. Fetch real-time restaurants directly from Live APIs (Photon, Nominatim, Google Suggest)
    const liveSpots = await searchLivePlaces({
      query: effectiveSearchName,
      city: effectiveCity,
      lat: hasUserCoords ? lat : undefined,
      lng: hasUserCoords ? lng : undefined
    }).catch(() => []);

    const seenNames = new Set<string>();
    const combinedSpots: Restaurant[] = [];

    // If direct Swiggy URL was pasted, add the exact restaurant as top result
    if (parsedSwiggyUrl.isSwiggyUrl && parsedSwiggyUrl.restaurantId) {
      const restNum = parseInt(parsedSwiggyUrl.restaurantId, 10);
      const urlName = parsedSwiggyUrl.name || 'Selected Swiggy Restaurant';
      seenNames.add(urlName.toLowerCase());
      combinedSpots.push({
        id: !isNaN(restNum) ? restNum : 3241,
        swiggy_id: parsedSwiggyUrl.restaurantId,
        name: urlName,
        description: 'Authentic Specialty & Live Swiggy Menu',
        address: `${effectiveCity}`,
        area: effectiveCity,
        city: effectiveCity,
        latitude: hasUserCoords ? lat : 12.9716,
        longitude: hasUserCoords ? lng : 77.5946,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        is_campaign_active: 1,
        total_visits: 1200,
        status: 'active'
      } as any);
    }

    // 1. Priority: Live Swiggy Scraper via Apify ("thirdwatch/swiggy-scraper")
    if (isApifyConfigured() && !isNoise) {
      try {
        const swiggyRests = await fetchSwiggyRestaurantViaApify(trimmedQ, city || 'Pune', {
          maxResults: 10,
          lat: hasUserCoords ? lat : undefined,
          lng: hasUserCoords ? lng : undefined
        });
        for (const s of swiggyRests) {
          const cleanName = s.name.trim();
          const lower = cleanName.toLowerCase();
          if (!seenNames.has(lower)) {
            seenNames.add(lower);
            const swiggyId = parseInt(s.restaurant_id, 10);
            combinedSpots.push({
              id: !isNaN(swiggyId) ? swiggyId : getDeterministicPlaceId(cleanName, s.city, s.area_name),
              swiggy_id: s.restaurant_id,
              name: cleanName,
              description: `${s.cuisine.slice(0, 3).join(' • ')} | ${s.cost_for_two}`,
              address: s.address,
              area: s.area_name || s.locality || city || 'Pune',
              city: s.city || city || 'Pune',
              latitude: hasUserCoords ? lat : (s.city ? 12.9716 : 18.5204),
              longitude: hasUserCoords ? lng : (s.city ? 77.5946 : 73.8407),
              rating: s.rating,
              image: s.image_url || pickCuisineImage(cleanName),
              is_campaign_active: 1,
              total_visits: 1200,
              status: 'active',
              // Rich Swiggy metadata
              cuisine: s.cuisine,
              cost_for_two: s.cost_for_two,
              cost_for_two_rupees: s.cost_for_two_rupees,
              delivery_time: s.delivery_time,
              delivery_time_minutes: s.delivery_time_minutes,
              rating_count: s.rating_count,
              google_rating: s.google_rating,
              google_rating_count: s.google_rating_count,
              offers: s.offers,
              badges: s.badges,
              swiggy_url: s.url,
              url: s.url
            } as any);
          }
        }
      } catch (apifyErr) {
        console.warn('Apify restaurant search notice:', apifyErr);
      }
    }

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

    // 3. Attach Live GPS Distance & Validate Strict Pure Veg
    const distanceEnriched = combinedSpots.map(r => {
      let distanceKm: number | null = null;
      if (hasUserCoords && r.latitude && r.longitude) {
        distanceKm = calculateDistance(lat, lng, r.latitude, r.longitude);
      }
      const isPureVeg = isPureVegRestaurantName(r.name) || r.is_veg === 1;
      return {
        ...r,
        is_veg: isPureVeg ? 1 : (r.is_veg ?? 0),
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
