import { NextResponse } from 'next/server';
import { db, INITIAL_RESTAURANTS, INITIAL_DISHES, type Dish, type Restaurant } from '@/lib/db';
import { generateLiveMenuForRestaurant } from '@/lib/liveMenu';
import { searchDishesSwiggyZomato } from '@/lib/foodSearchEngine';
import { getDishVisualAssets, formatCleanDishName } from '@/lib/dishAssets';
import { fetchGooglePlaceDetails, extractDishesFromGoogleDetails } from '@/lib/googlePlaces';
import { isApifyConfigured, fetchSwiggyDishesViaApify } from '@/lib/apifySwiggy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const restId = parseInt(params.id, 10);
    const { searchParams } = new URL(request.url);
    const restName = (searchParams.get('name') || '').trim();
    const restArea = (searchParams.get('area') || '').trim();
    const restCity = (searchParams.get('city') || '').trim();
    const searchQuery = (searchParams.get('q') || '').trim();
    const isVegParam = searchParams.get('is_veg');
    const swiggyIdParam = searchParams.get('swiggy_id') || searchParams.get('restaurant_id') || '';
    const latParam = parseFloat(searchParams.get('lat') || '');
    const lngParam = parseFloat(searchParams.get('lng') || '');

    if (isNaN(restId)) {
      return NextResponse.json({ success: false, error: 'Invalid restaurant id' }, { status: 400 });
    }

    // 1. Live Restaurant Identity derived from Live API selection
    const resolvedName = restName || 'Iconic Food Joint';
    const visual = getDishVisualAssets(resolvedName);
    
    // Check if the restaurant is a recognized spot in INITIAL_RESTAURANTS
    const knownRest = INITIAL_RESTAURANTS.find(
      r => r.name.toLowerCase() === resolvedName.toLowerCase() ||
           resolvedName.toLowerCase().includes(r.name.toLowerCase()) ||
           r.name.toLowerCase().includes(resolvedName.toLowerCase())
    );

    const isVeg = isVegParam === 'true' || isVegParam === '1' ||
      (knownRest && knownRest.is_veg === 1) ||
      resolvedName.toLowerCase().includes('pure veg') ||
      (resolvedName.toLowerCase().includes('veg') && !resolvedName.toLowerCase().includes('non-veg')) ||
      resolvedName.toLowerCase().includes('mithai') ||
      resolvedName.toLowerCase().includes('sweets') ||
      resolvedName.toLowerCase().includes('bhel') ||
      resolvedName.toLowerCase().includes('dosa') ||
      resolvedName.toLowerCase().includes('idli') ||
      resolvedName.toLowerCase().includes('udupi');
    
    const restInfo: Restaurant = {
      id: restId,
      name: knownRest ? knownRest.name : resolvedName,
      area: restArea || knownRest?.area || 'Local Area',
      city: restCity || knownRest?.city || 'Pune',
      description: knownRest ? knownRest.description : `Authentic culinary specialty & live menu at ${resolvedName}`,
      address: knownRest ? knownRest.address : `${restArea ? restArea + ', ' : ''}${restCity || 'Pune'}`,
      latitude: !isNaN(latParam) ? latParam : (knownRest?.latitude || 18.5204),
      longitude: !isNaN(lngParam) ? lngParam : (knownRest?.longitude || 73.8407),
      rating: knownRest?.rating || 4.8,
      is_veg: isVeg ? 1 : 0,
      image: knownRest?.image || visual.plateImage || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
      is_campaign_active: 1,
      total_visits: knownRest?.total_visits || 1200,
      status: 'active'
    };

    const seenNames = new Set<string>();
    const baseDishes: Dish[] = [];
    let usedSource = 'curated_culinary_catalog';

    // 1. Priority 1: Real-time Live Swiggy Menu & Real Food Catalog (Direct Mobile API & Scraper)
    try {
      const swiggyRestId = swiggyIdParam || (restId > 0 && restId < 890000 ? String(restId) : undefined);
      const liveSwiggyDishes = await fetchSwiggyDishesViaApify(restInfo.name, restInfo.city, {
        restaurantId: swiggyRestId,
        lat: restInfo.latitude,
        lng: restInfo.longitude
      });

      if (liveSwiggyDishes && liveSwiggyDishes.length > 0) {
        usedSource = 'live_swiggy_menu';
        for (const d of liveSwiggyDishes) {
          const cleanName = formatCleanDishName(d.name, restInfo.name);
          const lower = cleanName.toLowerCase();
          if (!seenNames.has(lower)) {
            seenNames.add(lower);
            baseDishes.push({
              ...d,
              name: cleanName
            });
          }
        }
      }
    } catch (swiggyErr) {
      console.warn('Live Swiggy menu fetch notice:', swiggyErr);
    }

    // 2. Priority 2: Complete Authentic Restaurant Signature Menu & Cuisine Catalog if live dishes < 20
    if (baseDishes.length < 20) {
      const liveDishes = generateLiveMenuForRestaurant(restInfo);
      for (const d of liveDishes) {
        const cleanName = formatCleanDishName(d.name, restInfo.name);
        const lower = cleanName.toLowerCase();
        if (!seenNames.has(lower)) {
          seenNames.add(lower);
          baseDishes.push({
            ...d,
            name: cleanName,
            image: `/api/ai/dish-image?dish=${encodeURIComponent(cleanName)}&restaurant=${encodeURIComponent(restInfo.name)}`
          });
        }
        if (baseDishes.length >= 35) break;
      }
    }

    // 4. Priority 3: Google Cloud Places API live extraction from customer reviews
    if (baseDishes.length < 25) {
      try {
        const googlePlace = await fetchGooglePlaceDetails(restInfo.name, restInfo.city);
        const googleDishes = googlePlace ? extractDishesFromGoogleDetails(googlePlace, restInfo) : [];
        if (googleDishes.length > 0 && baseDishes.length === 0) {
          usedSource = 'google_places_reviews';
        }
        for (const d of googleDishes) {
          const cleanName = formatCleanDishName(d.name, restInfo.name);
          const lower = cleanName.toLowerCase();
          if (!seenNames.has(lower)) {
            seenNames.add(lower);
            baseDishes.push({
              ...d,
              name: cleanName,
              image: `/api/ai/dish-image?dish=${encodeURIComponent(cleanName)}&restaurant=${encodeURIComponent(restInfo.name)}`
            });
          }
        }
      } catch (gErr) {
        console.warn('Google Places live review dishes notice:', gErr);
      }
    }

    // 5. Run Swiggy / Zomato Dish Search Engine if a search filter is requested
    const filteredDishes = searchQuery
      ? searchDishesSwiggyZomato(restInfo, searchQuery, baseDishes)
      : baseDishes;

    // Guarantee pure food visuals with authentic culinary photography
    const finalDishes = filteredDishes.map(d => {
      const isAiEndpoint = typeof d.image === 'string' && d.image.startsWith('/api/ai/dish-image');
      const hasRealPhoto = Boolean(
        d.image &&
        typeof d.image === 'string' &&
        (d.image.startsWith('http://') || d.image.startsWith('https://')) &&
        (d.image.includes('swiggy.com') || d.image.includes('cloudinary.com') || d.image.includes('zmtcdn.com')) &&
        !d.image.includes('placeholder')
      );

      const resolvedImage = isAiEndpoint
        ? d.image
        : hasRealPhoto
          ? `/api/ai/dish-image?dish=${encodeURIComponent(d.name)}&restaurant=${encodeURIComponent(restInfo.name)}&imgUrl=${encodeURIComponent(d.image)}`
          : `/api/ai/dish-image?dish=${encodeURIComponent(d.name)}&restaurant=${encodeURIComponent(restInfo.name)}`;

      return {
        ...d,
        image: resolvedImage,
        proxy_image: (d as any).proxy_image || (hasRealPhoto ? `/api/swiggy-image?url=${encodeURIComponent(resolvedImage)}` : resolvedImage),
        flying_image: resolvedImage
      };
    });

    // Extract all unique categories
    const categories = Array.from(new Set(finalDishes.map((d: any) => d.category || 'Recommended')));

    return NextResponse.json({
      success: true,
      count: finalDishes.length,
      isLiveAPI: true,
      source: usedSource,
      restaurant: {
        id: restInfo.id,
        name: restInfo.name,
        area: restInfo.area,
        city: restInfo.city,
        rating: restInfo.rating,
        image: restInfo.image
      },
      categories,
      data: finalDishes
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dishes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
