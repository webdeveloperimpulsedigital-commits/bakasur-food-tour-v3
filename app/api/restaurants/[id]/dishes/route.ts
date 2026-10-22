import { NextResponse } from 'next/server';
import type { Restaurant } from '@/lib/db';
import { searchDishesSwiggyZomato } from '@/lib/foodSearchEngine';
import { formatCleanDishName } from '@/lib/dishAssets';
import { verifySwiggyRestaurant, toVerifiedRestaurant } from '@/lib/verifiedRestaurants';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'Clear-Site-Data': '"cache"'
};

/**
 * Restaurant menu (strict verified mode).
 *
 * The restaurant is identified ONLY by its Swiggy id (path param) and is
 * re-verified server-side. Client-sent name/area/city/is_veg are ignored for
 * identity. Dishes come exclusively from the restaurant's live Swiggy menu:
 * no curated/iconic templates, no review-derived dishes, no generated items.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const { searchParams } = new URL(request.url);
    const searchQuery = (searchParams.get('q') || '').trim();
    // lat/lng only help Swiggy's serviceability check; they do not define identity
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    const result = await verifySwiggyRestaurant(params.id, { lat, lng });

    if (!result.verified) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
          isLiveAPI: true,
          source: 'unverified',
          reason: result.reason,
          restaurant: null,
          categories: [],
          data: []
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const profile = result.profile;
    const restInfo: Restaurant = toVerifiedRestaurant(profile);

    // Pure-veg restaurants: rely on Swiggy's own veg classification of each item
    const baseDishes = profile.vegOnly ? profile.dishes.filter(d => d.is_veg !== 0) : profile.dishes;

    const filteredDishes = searchQuery
      ? searchDishesSwiggyZomato(restInfo, searchQuery, baseDishes)
      : baseDishes;

    // Keep the existing image pipeline: real Swiggy photo (when present) is passed through
    const finalDishes = filteredDishes.map(d => {
      const name = formatCleanDishName(d.name, restInfo.name);
      const hasRealPhoto =
        typeof d.image === 'string' &&
        d.image.startsWith('https://') &&
        d.image.includes('swiggy.com') &&
        !d.image.includes('placeholder');
      const resolvedImage = hasRealPhoto
        ? `/api/ai/dish-image?dish=${encodeURIComponent(name)}&restaurant=${encodeURIComponent(restInfo.name)}&imgUrl=${encodeURIComponent(d.image)}&v=v30`
        : `/api/ai/dish-image?dish=${encodeURIComponent(name)}&restaurant=${encodeURIComponent(restInfo.name)}&v=v30`;

      return {
        ...d,
        name,
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
        source: 'live_swiggy_menu_verified',
        restaurant: {
          id: restInfo.id,
          name: restInfo.name,
          area: restInfo.area,
          city: restInfo.city,
          rating: restInfo.rating,
          image: restInfo.image,
          fssai_license: profile.fssaiLicense,
          verified_at: profile.verifiedAt
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
