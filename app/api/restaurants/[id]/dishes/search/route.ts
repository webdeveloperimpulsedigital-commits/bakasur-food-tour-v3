import { NextResponse } from 'next/server';
import type { Dish, Restaurant } from '@/lib/db';
import { generateLiveMenuForRestaurant } from '@/lib/liveMenu';
import { searchDishesSwiggyZomato } from '@/lib/foodSearchEngine';
import { getDishVisualAssets, formatCleanDishName } from '@/lib/dishAssets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const restId = parseInt(params.id, 10);
    if (isNaN(restId)) {
      return NextResponse.json({ success: false, error: 'Invalid restaurant id' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim();
    const restName = (searchParams.get('name') || '').trim();
    const restArea = (searchParams.get('area') || '').trim();
    const restCity = (searchParams.get('city') || '').trim();
    const isVegParam = searchParams.get('is_veg');

    const resolvedName = restName || 'Selected Food Joint';
    const visual = getDishVisualAssets(resolvedName);
    const isVeg = isVegParam === 'true' || isVegParam === '1' ||
      resolvedName.toLowerCase().includes('pure veg') ||
      (resolvedName.toLowerCase().includes('veg') && !resolvedName.toLowerCase().includes('non-veg'));

    const restaurant: Restaurant = {
      id: restId,
      name: resolvedName,
      area: restArea || 'Pune',
      city: restCity || 'Pune',
      description: `Authentic local food spot & culinary specialty at ${resolvedName}`,
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

    const liveDishes = generateLiveMenuForRestaurant(restaurant);
    const seen = new Set<string>();
    const allDishes: Dish[] = [];

    for (const d of liveDishes) {
      const cleanName = formatCleanDishName(d.name, restaurant.name);
      const key = cleanName.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        allDishes.push({
          ...d,
          name: cleanName,
          image: getDishVisualAssets(cleanName, d.image).plateImage
        });
      }
    }

    const matchedDishes = searchDishesSwiggyZomato(restaurant, query, allDishes);

    return NextResponse.json({
      success: true,
      count: matchedDishes.length,
      isLiveAPI: true,
      data: matchedDishes
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Dish search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
