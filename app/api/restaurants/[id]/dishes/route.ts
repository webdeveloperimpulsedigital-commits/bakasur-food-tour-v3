import { NextResponse } from 'next/server';
import type { Dish, Restaurant } from '@/lib/db';
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
    const isVeg = isVegParam === 'true' || isVegParam === '1' ||
      resolvedName.toLowerCase().includes('pure veg') ||
      (resolvedName.toLowerCase().includes('veg') && !resolvedName.toLowerCase().includes('non-veg'));
    
    const restInfo: Restaurant = {
      id: restId,
      name: resolvedName,
      area: restArea || 'Local Area',
      city: restCity || 'Pune',
      description: `Authentic culinary specialty & live menu at ${resolvedName}`,
      address: `${restArea ? restArea + ', ' : ''}${restCity || 'Pune'}`,
      latitude: !isNaN(latParam) ? latParam : 18.5204,
      longitude: !isNaN(lngParam) ? lngParam : 73.8407,
      rating: 4.8,
      is_veg: isVeg ? 1 : 0,
      image: visual.plateImage || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
      is_campaign_active: 1,
      total_visits: 1200,
      status: 'active'
    };

    const seenNames = new Set<string>();
    const baseDishes: Dish[] = [];
    let usedSource = 'curated_culinary_catalog';

    // 2. Priority 1: Live Apify Swiggy Scraper ("thirdwatch/swiggy-scraper") & Swiggy Live Menu
    if (isApifyConfigured()) {
      try {
        const swiggyRestId = swiggyIdParam || (restId > 0 && restId < 890000 ? String(restId) : undefined);
        const apifyDishes = await fetchSwiggyDishesViaApify(restInfo.name, restInfo.city, {
          restaurantId: swiggyRestId,
          lat: restInfo.latitude,
          lng: restInfo.longitude
        });

        if (apifyDishes && apifyDishes.length > 0) {
          usedSource = 'apify_swiggy';
          for (const d of apifyDishes) {
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
      } catch (apifyErr) {
        console.warn('Apify Swiggy menu scraper notice:', apifyErr);
      }
    }

    // 3. Priority 2: Google Cloud Places API live extraction from customer reviews
    if (baseDishes.length < 8) {
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
    }

    // 4. Priority 3: Authentic Restaurant Signature Menu & Cuisine Catalog
    if (baseDishes.length < 8) {
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
      }
    }

    // 5. Run Swiggy / Zomato Dish Search Engine if a search filter is requested
    const filteredDishes = searchQuery
      ? searchDishesSwiggyZomato(restInfo, searchQuery, baseDishes)
      : baseDishes;

    // Preserve authentic Swiggy CDN food photography! Only fallback to AI endpoint if no photo exists
    const finalDishes = filteredDishes.map(d => {
      const hasRealPhoto = Boolean(
        d.image &&
        typeof d.image === 'string' &&
        (d.image.startsWith('http://') || d.image.startsWith('https://')) &&
        !d.image.includes('placeholder')
      );

      const resolvedImage = hasRealPhoto
        ? d.image
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
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dishes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
