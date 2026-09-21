import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, user_location, latitude, longitude, restaurant_id, dish_id } = body;

    if (!session_id) {
      return NextResponse.json({ success: false, error: 'session_id is required' }, { status: 400 });
    }

    const session = await db.createOrUpdateSession({
      session_id,
      user_location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      restaurant_id: restaurant_id ? parseInt(restaurant_id, 10) : null,
      dish_id: dish_id ? parseInt(dish_id, 10) : null,
      current_stage: 'stage_1',
      food_meter_percentage: 20,
      aur_khilo_clicks: 0
    });

    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start campaign session';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
