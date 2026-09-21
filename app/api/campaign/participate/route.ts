import { NextResponse } from 'next/server';
import { db, getMySQLPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, name, mobile, email, city, restaurant_id, dish_id, consent, terms_accepted } = body;

    const cleanMobile = (mobile || '').replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }
    const finalName = name?.trim() || 'Foodie Follower';
    const finalEmail = (email?.trim() && email.includes('@')) ? email.trim() : `${cleanMobile}@foodtour.com`;
    const finalCity = city?.trim() || 'Pune';
    const isConsentGiven = Boolean(consent || terms_accepted);
    if (!isConsentGiven) {
      return NextResponse.json({ success: false, error: 'Please accept campaign communication terms' }, { status: 400 });
    }

    // 1. Direct values passed from client (highest priority)
    let restaurantName = (body.restaurant_name || '').trim();
    let dishName = (body.dish_name || '').trim();
    let restLat = body.latitude ? parseFloat(body.latitude) : 18.5204;
    let restLng = body.longitude ? parseFloat(body.longitude) : 73.8407;

    // 2. If dish_name or restaurant_name is missing or generic, check user journey steps for this session
    if ((!dishName || !restaurantName || restaurantName === 'Local Food Spot' || dishName === 'Signature Specialty') && session_id) {
      try {
        const pool = getMySQLPool();
        if (pool) {
          const [steps] = await pool.query<RowDataPacket[]>(
            `SELECT metadata FROM user_journey_steps WHERE session_id = ? AND (step_name = 'dish_selected' OR step_name = 'eating' OR step_name = 'restaurant_selected' OR step_name = 'pass') ORDER BY id DESC LIMIT 10`,
            [session_id]
          );
          if (steps && steps.length > 0) {
            for (const s of steps) {
              try {
                const meta = typeof s.metadata === 'string' ? JSON.parse(s.metadata) : s.metadata;
                if ((!dishName || dishName === 'Signature Specialty') && meta?.dish_name) {
                  dishName = String(meta.dish_name).trim();
                }
                if ((!restaurantName || restaurantName === 'Local Food Spot') && meta?.restaurant_name) {
                  restaurantName = String(meta.restaurant_name).trim();
                }
              } catch {}
            }
          }
        }
      } catch (stepErr) {
        console.warn('Fallback journey step lookup warning:', stepErr);
      }
    }

    // 3. Fallback to DB lookup by ID if still missing
    if (!restaurantName && restaurant_id) {
      const rest = await db.getRestaurantById(parseInt(restaurant_id, 10));
      if (rest) {
        restaurantName = rest.name;
        if (rest.latitude) restLat = rest.latitude;
        if (rest.longitude) restLng = rest.longitude;
      }
    }

    if (!dishName && dish_id) {
      const d = await db.getDishById(parseInt(dish_id, 10));
      if (d) {
        dishName = d.name;
      }
    }

    // 4. Default fallbacks
    if (!restaurantName) restaurantName = "Local Food Spot";
    if (!dishName) dishName = "Signature Specialty";

    const participant = await db.createParticipant({
      session_id: session_id || `sess_${Date.now()}`,
      name: finalName,
      mobile: cleanMobile,
      email: finalEmail.toLowerCase(),
      city: finalCity,
      restaurant_name: restaurantName,
      dish_name: dishName,
      consent: isConsentGiven ? 1 : 0,
      terms_accepted: 1
    });

    // Record visit on global map
    if (restaurant_id) {
      await db.recordVisit({
        session_id: participant.session_id,
        restaurant_id: parseInt(restaurant_id, 10),
        restaurant_name: restaurantName,
        dish_id: dish_id ? parseInt(dish_id, 10) : null,
        dish_name: dishName,
        city: finalCity,
        latitude: restLat,
        longitude: restLng
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        participation_id: participant.participation_id,
        participant,
        message: "Congratulations! You have completed Bakasur Ka Food Tour and your contest participation is confirmed!"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Participation submission failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
