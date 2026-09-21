import { NextResponse } from 'next/server';
import { fetchLiveNearbyPlaces } from '@/lib/livePlaces';

export const dynamic = 'force-dynamic';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'pune': { lat: 18.5204, lng: 73.8407 },
  'mumbai': { lat: 18.9222, lng: 72.8317 },
  'delhi': { lat: 28.6507, lng: 77.2334 },
  'bengaluru': { lat: 12.9452, lng: 77.5704 },
  'bangalore': { lat: 12.9452, lng: 77.5704 },
  'hyderabad': { lat: 17.4416, lng: 78.4983 },
  'kolkata': { lat: 22.5528, lng: 88.3533 },
  'thane': { lat: 19.1860, lng: 72.9750 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'nashik': { lat: 19.9975, lng: 73.7898 }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = parseFloat(searchParams.get('latitude') || searchParams.get('lat') || '');
    const lngParam = parseFloat(searchParams.get('longitude') || searchParams.get('lng') || '');
    const city = searchParams.get('city') || 'Pune';
    const area = searchParams.get('area') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let targetLat = latParam;
    let targetLng = lngParam;

    if (isNaN(targetLat) || isNaN(targetLng)) {
      const cityKey = city.toLowerCase().trim();
      const defaultCoords = CITY_COORDS[cityKey] || CITY_COORDS['pune'];
      targetLat = defaultCoords.lat;
      targetLng = defaultCoords.lng;
    }

    // Fetch REAL-WORLD live restaurants directly via Live Places API around user's exact coordinates
    const liveRestaurants = await fetchLiveNearbyPlaces(targetLat, targetLng, city);

    return NextResponse.json({
      success: true,
      count: liveRestaurants.length,
      isLiveAPI: true,
      data: liveRestaurants.slice(0, limit)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch live nearby restaurants';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
