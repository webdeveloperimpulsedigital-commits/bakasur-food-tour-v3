import { NextResponse } from 'next/server';
import { verifySwiggyRestaurant, toVerifiedRestaurant } from '@/lib/verifiedRestaurants';

export const dynamic = 'force-dynamic';

/**
 * Restaurant detail (strict verified mode).
 * The id is the Swiggy restaurant id. Returns 404 unless the restaurant passes
 * full verification; never returns placeholder restaurants or generated menus.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await Promise.resolve(context.params);
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    const result = await verifySwiggyRestaurant(params.id, { lat, lng });
    if (!result.verified) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found or not verified', reason: result.reason },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...toVerifiedRestaurant(result.profile),
        dishes: result.profile.dishes
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch restaurant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
