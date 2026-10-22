import { NextResponse } from 'next/server';
import type { Restaurant, Dish } from '@/lib/db';
import { db } from '@/lib/db';
import { searchDishesSwiggyZomato } from '@/lib/foodSearchEngine';
import { formatCleanDishName, isDishVeg } from '@/lib/dishAssets';
import { verifySwiggyRestaurant, toVerifiedRestaurant } from '@/lib/verifiedRestaurants';
import { generateLiveMenuForRestaurant, inferDishCategory } from '@/lib/liveMenu';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'Clear-Site-Data': '"cache"'
};

/**
 * Restaurant menu (strict verified mode).
 * Supports live Swiggy restaurants and database-verified heritage restaurants.
 * Dishes come from verified live menu or authentic curated dishes.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const { searchParams } = new URL(request.url);
    const searchQuery = (searchParams.get('q') || '').trim();
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    let restInfo: Restaurant | null = null;
    let baseDishes: Dish[] = [];
    let fssaiLicense: string | null = null;
    let verifiedAt: string | null = null;
    let source = 'live_swiggy_menu_verified';
    let failReason = 'Restaurant not found or unverified';

    // 1. Try Swiggy verification
    const swiggyResult = await verifySwiggyRestaurant(params.id, { lat, lng });
    if (swiggyResult.verified) {
      const profile = swiggyResult.profile;
      restInfo = toVerifiedRestaurant(profile);
      baseDishes = profile.vegOnly ? profile.dishes.filter(d => d.is_veg !== 0) : profile.dishes;
      fssaiLicense = profile.fssaiLicense || null;
      verifiedAt = profile.verifiedAt || null;
    } else {
      failReason = swiggyResult.reason;
      // 2. Check database verified registry
      const numId = parseInt(params.id, 10);
      if (!isNaN(numId)) {
        const dbRest = await db.getRestaurantById(numId);
        if (dbRest && dbRest.is_verified === 1) {
          restInfo = dbRest;
          fssaiLicense = dbRest.fssai_license || null;
          verifiedAt = dbRest.verified_at || new Date().toISOString();
          source = 'verified_registry';

          const liveDishes = generateLiveMenuForRestaurant({
            id: dbRest.id,
            name: dbRest.name,
            description: dbRest.description,
            area: dbRest.area,
            city: dbRest.city,
            is_veg: dbRest.is_veg
          });

          const dbDishes = await db.getDishesByRestaurant(dbRest.id).catch(() => []);
          const combined = [...liveDishes];
          const seenNames = new Set(liveDishes.map(d => d.name.toLowerCase().trim()));
          for (const d of dbDishes) {
            if (!seenNames.has(d.name.toLowerCase().trim())) {
              combined.push(d);
              seenNames.add(d.name.toLowerCase().trim());
            }
          }
          baseDishes = combined;
        }
      }
    }

    if (!restInfo) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
          isLiveAPI: true,
          source: 'unverified',
          reason: failReason,
          restaurant: null,
          categories: [],
          data: []
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const filteredDishes = searchQuery
      ? searchDishesSwiggyZomato(restInfo, searchQuery, baseDishes)
      : baseDishes;

    const finalDishes = filteredDishes.map(d => {
      const name = formatCleanDishName(d.name, restInfo!.name);
      const isLocalPhoto = typeof d.image === 'string' && d.image.startsWith('/images/food/');
      const hasRealPhoto =
        typeof d.image === 'string' &&
        d.image.startsWith('https://') &&
        d.image.includes('swiggy.com') &&
        !d.image.includes('placeholder');

      let resolvedImage: string;
      if (isLocalPhoto) {
        resolvedImage = d.image;
      } else if (hasRealPhoto) {
        resolvedImage = `/api/ai/dish-image?dish=${encodeURIComponent(name)}&restaurant=${encodeURIComponent(restInfo!.name)}&imgUrl=${encodeURIComponent(d.image)}&v=v30`;
      } else {
        resolvedImage = `/api/ai/dish-image?dish=${encodeURIComponent(name)}&restaurant=${encodeURIComponent(restInfo!.name)}&v=v30`;
      }

      // Accurate veg / non-veg classification
      let isVeg = d.is_veg !== undefined ? Number(d.is_veg) : (isDishVeg(name) ? 1 : 0);
      if (restInfo?.is_veg === 1) isVeg = 1;

      const category = d.category || inferDishCategory(name, d.description);

      return {
        ...d,
        name,
        is_veg: isVeg,
        category,
        image: resolvedImage,
        proxy_image: hasRealPhoto ? `/api/swiggy-image?url=${encodeURIComponent(d.image)}` : resolvedImage,
        flying_image: resolvedImage
      };
    });

    const categories = Array.from(new Set(finalDishes.map(d => d.category || 'Menu')));

    return NextResponse.json(
      {
        success: true,
        count: finalDishes.length,
        isLiveAPI: true,
        source,
        restaurant: {
          id: restInfo.id,
          name: restInfo.name,
          area: restInfo.area,
          city: restInfo.city,
          rating: restInfo.rating,
          image: restInfo.image,
          fssai_license: fssaiLicense,
          verified_at: verifiedAt
        },
        categories,
        data: finalDishes
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dishes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
