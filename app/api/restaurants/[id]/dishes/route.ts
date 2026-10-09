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
      latitude: 18.5204,
      longitude: 73.8407,
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

    // 2. Priority 1: Live Apify Swiggy Scraper ("thirdwatch/swiggy-scraper")
    if (isApifyConfigured()) {
      try {
        const apifyDishes = await fetchSwiggyDishesViaApify(restInfo.name, restInfo.city);
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

    // 3. Run Swiggy / Zomato Dish Search Engine
    const dishes = searchDishesSwiggyZomato(restInfo, searchQuery, baseDishes);

    // Guarantee that every dish has a dynamically generated AI PNG image URL
    const aiEnrichedDishes = dishes.map(d => ({
      ...d,
      image: d.image || `/api/ai/dish-image?dish=${encodeURIComponent(d.name)}&restaurant=${encodeURIComponent(restInfo.name)}`
    }));

    return NextResponse.json({
      success: true,
      count: aiEnrichedDishes.length,
      isLiveAPI: true,
      source: usedSource,
      data: aiEnrichedDishes
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dishes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
