import { NextResponse } from 'next/server';
import { db, Dish } from '@/lib/db';
import { generateLiveMenuForRestaurant } from '@/lib/liveMenu';
import { getDishVisualAssets } from '@/lib/dishAssets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const restId = parseInt(params.id, 10);
    const { searchParams } = new URL(request.url);
    const restName = searchParams.get('name') || '';
    const restArea = searchParams.get('area') || '';
    const restCity = searchParams.get('city') || '';
    const searchQuery = (searchParams.get('q') || '').trim().toLowerCase();

    if (isNaN(restId)) {
      return NextResponse.json({ success: false, error: 'Invalid restaurant id' }, { status: 400 });
    }

    // 1. Fetch restaurant profile (from DB or query params)
    let restInfo = await db.getRestaurantById(restId);
    const requestedName = (restName || '').trim();
    const isExactDbMatch = Boolean(
      restInfo && requestedName && restInfo.name.toLowerCase().trim() === requestedName.toLowerCase()
    );

    let dbDishes: Dish[] = [];
    if (isExactDbMatch) {
      try {
        dbDishes = await db.getDishesByRestaurant(restId);
      } catch {
        dbDishes = [];
      }
    }

    if (!restInfo || !isExactDbMatch) {
      restInfo = {
        id: restId,
        name: requestedName || restInfo?.name || 'Iconic Food Joint',
        area: restArea || restInfo?.area || 'Local Area',
        city: restCity || restInfo?.city || 'Pune',
        description: 'Authentic culinary specialty & live menu',
        address: `${restArea ? restArea + ', ' : ''}${restCity || 'Pune'}`,
        latitude: 18.5204,
        longitude: 73.8407,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        is_campaign_active: 1,
        total_visits: 1200,
        status: 'active'
      };
    }

    // 2. Generate accurate live menu specifically tailored to this restaurant's identity & cuisine
    const liveDishes = generateLiveMenuForRestaurant(restInfo);

    // 3. Merge dishes seamlessly (deduped by dish name, keeping all live items)
    const seenNames = new Set<string>();
    const finalDishes: Dish[] = [];

    const sourceList = [...dbDishes, ...liveDishes];
    for (const d of sourceList) {
      const cleanName = d.name.toLowerCase().trim();
      if (!seenNames.has(cleanName)) {
        seenNames.add(cleanName);
        finalDishes.push(d);
      }
    }

    // 4. If searchQuery is provided, filter or search across universal cuisine specialties
    if (searchQuery) {
      const qTokens = searchQuery.split(/\s+/).filter(Boolean);
      
      // Match within current restaurant's menu
      let matchingDishes = finalDishes.filter(d => {
        const text = `${d.name} ${d.description || ''}`.toLowerCase();
        return qTokens.every(token => text.includes(token)) || text.includes(searchQuery);
      });

      // If fewer than 5 matches, also search across all CUISINE_MENUS and ICONIC_RESTAURANT_DISHES
      if (matchingDishes.length < 8) {
        const { CUISINE_MENUS, ICONIC_RESTAURANT_DISHES } = await import('@/lib/liveMenu');
        
        // 4a. Check Iconic restaurant dishes
        for (const dishesList of Object.values(ICONIC_RESTAURANT_DISHES)) {
          for (const item of dishesList) {
            const text = `${item.name} ${item.description}`.toLowerCase();
            if ((qTokens.every(token => text.includes(token)) || text.includes(searchQuery)) && !seenNames.has(item.name.toLowerCase().trim())) {
              seenNames.add(item.name.toLowerCase().trim());
              matchingDishes.push({
                id: restId * 1000 + matchingDishes.length + 1,
                restaurant_id: restId,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image,
                rating: item.rating,
                popularity: item.popularity,
                is_recommended: 1,
                status: 'active'
              });
            }
          }
        }

        // 4b. Check all cuisine menus
        for (const profile of CUISINE_MENUS) {
          for (const item of profile.dishes) {
            const text = `${item.name} ${item.description}`.toLowerCase();
            if ((qTokens.every(token => text.includes(token)) || text.includes(searchQuery)) && !seenNames.has(item.name.toLowerCase().trim())) {
              seenNames.add(item.name.toLowerCase().trim());
              matchingDishes.push({
                id: restId * 1000 + matchingDishes.length + 1,
                restaurant_id: restId,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image,
                rating: item.rating,
                popularity: item.popularity,
                is_recommended: 1,
                status: 'active'
              });
            }
          }
        }
      }

      // Sort by relevance:
      // 1. Dish name contains a word starting with the query (e.g. "Momos" for "mo", "Pav" for "pav")
      // 2. Dish name starts with query
      // 3. Dish name contains query
      // 4. Popularity
      matchingDishes.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();

        const aWordStart = aName.split(/[\s,/-]+/).some(w => w.startsWith(searchQuery)) ? 2 : 0;
        const bWordStart = bName.split(/[\s,/-]+/).some(w => w.startsWith(searchQuery)) ? 2 : 0;
        if (aWordStart !== bWordStart) return bWordStart - aWordStart;

        const aStarts = aName.startsWith(searchQuery) ? 1 : 0;
        const bStarts = bName.startsWith(searchQuery) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        const aIncludes = aName.includes(searchQuery) ? 1 : 0;
        const bIncludes = bName.includes(searchQuery) ? 1 : 0;
        if (aIncludes !== bIncludes) return bIncludes - aIncludes;

        return (b.popularity || 0) - (a.popularity || 0);
      });

      return NextResponse.json({
        success: true,
        count: matchingDishes.length,
        data: matchingDishes.map(d => ({
          ...d,
          image: getDishVisualAssets(d.name, d.image).plateImage
        }))
      });
    }

    return NextResponse.json({
      success: true,
      count: finalDishes.length,
      data: finalDishes.map(d => ({
        ...d,
        image: getDishVisualAssets(d.name, d.image).plateImage
      }))
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dishes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
