import { NextResponse } from 'next/server';
import { db, Dish } from '@/lib/db';
import { generateLiveMenuForRestaurant } from '@/lib/liveMenu';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const restId = parseInt(params.id, 10);
    if (isNaN(restId)) {
      return NextResponse.json({ success: false, error: 'Invalid restaurant id' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('query') || '').toLowerCase().trim();

    let restaurant = await db.getRestaurantById(restId);
    let dbDishes: Dish[] = [];

    if (!restaurant) {
      restaurant = {
        id: restId,
        name: 'Selected Food Joint',
        area: 'Pune',
        city: 'Pune',
        description: 'Authentic local food spot & culinary specialty',
        address: 'Pune, Maharashtra',
        latitude: 18.5204,
        longitude: 73.8407,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        is_campaign_active: 1,
        total_visits: 1200,
        status: 'active'
      };
    } else {
      try {
        dbDishes = await db.getDishesByRestaurant(restId);
      } catch {
        dbDishes = [];
      }
    }

    const liveDishes = generateLiveMenuForRestaurant(restaurant);
    const seen = new Set<string>();
    const allDishes: Dish[] = [];

    for (const d of [...dbDishes, ...liveDishes]) {
      const key = d.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        allDishes.push(d);
      }
    }

    const filtered = query
      ? allDishes.filter(d => d.name.toLowerCase().includes(query) || (d.description && d.description.toLowerCase().includes(query)))
      : allDishes;

    return NextResponse.json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to search dishes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
