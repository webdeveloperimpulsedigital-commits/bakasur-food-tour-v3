'use client';

import React, { useEffect, useState } from 'react';

export interface TourMapPoint {
  id: number;
  name: string;
  address?: string;
  city: string;
  latitude: number;
  longitude: number;
  rating?: number;
  image?: string;
  total_visits: number;
  featured_dish?: string;
  isCurrentUserSpot?: boolean;
}

interface InteractiveTourMapProps {
  sessionId?: string;
  currentUserSpot?: {
    name: string;
    city: string;
    dishName: string;
    latitude?: number;
    longitude?: number;
  } | null;
  onSelectPoint?: (point: TourMapPoint) => void;
  onStatsLoaded?: (stats: { foodSpots: number; mustTryDishes: number; citiesCount: number }) => void;
}

const CITY_COORDINATES: Record<string, { x: number; y: number }> = {
  pune: { x: 33, y: 64 },
  mumbai: { x: 27, y: 58 },
  thane: { x: 28, y: 57 },
  delhi: { x: 36, y: 22 },
  'new delhi': { x: 36, y: 22 },
  bengaluru: { x: 37, y: 76 },
  bangalore: { x: 37, y: 76 },
  kolkata: { x: 62, y: 46 },
  hyderabad: { x: 43, y: 62 },
  ahmedabad: { x: 24, y: 47 },
  jaipur: { x: 28, y: 35 },
  indore: { x: 39, y: 46 },
  goa: { x: 31, y: 72 },
  chennai: { x: 43, y: 78 },
  lucknow: { x: 48, y: 34 },
  chandigarh: { x: 35, y: 19 },
  guwahati: { x: 80, y: 36 }
};

function getMapCoordinates(point: TourMapPoint): { x: number; y: number } {
  const cityKey = point.city?.toLowerCase().trim() || '';
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (cityKey.includes(key)) return coords;
  }
  if (point.latitude && point.longitude) {
    const x = Math.max(18, Math.min(82, ((point.longitude - 68.5) / (97.5 - 68.5)) * 100));
    const y = Math.max(16, Math.min(84, ((35.5 - point.latitude) / (35.5 - 8.0)) * 100));
    return { x, y };
  }
  return { x: 33, y: 64 };
}

export const InteractiveTourMap: React.FC<InteractiveTourMapProps> = ({
  sessionId,
  currentUserSpot,
  onSelectPoint,
  onStatsLoaded
}) => {
  const [points, setPoints] = useState<TourMapPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<TourMapPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TourMapPoint | null>(null);

  // Fetch live points and stats from /api/campaign/map
  useEffect(() => {
    async function loadData() {
      try {
        const url = sessionId ? `/api/campaign/map?session_id=${encodeURIComponent(sessionId)}` : '/api/campaign/map';
        const res = await fetch(url);
        const json = await res.json();

        if (json.success && json.data) {
          let list: TourMapPoint[] = json.data.points || [];

          // If currentUserSpot is passed, ensure it is in the list and flagged
          if (currentUserSpot) {
            const userLat = currentUserSpot.latitude || 18.5204;
            const userLng = currentUserSpot.longitude || 73.8407;

            const existingIdx = list.findIndex(
              p => p.name.toLowerCase() === currentUserSpot.name.toLowerCase() || p.isCurrentUserSpot
            );

            if (existingIdx !== -1) {
              list[existingIdx] = {
                ...list[existingIdx],
                name: currentUserSpot.name,
                city: currentUserSpot.city,
                featured_dish: currentUserSpot.dishName,
                latitude: userLat,
                longitude: userLng,
                isCurrentUserSpot: true
              };
            } else {
              list.unshift({
                id: 999999,
                name: currentUserSpot.name,
                city: currentUserSpot.city,
                latitude: userLat,
                longitude: userLng,
                rating: 4.9,
                total_visits: 1,
                featured_dish: currentUserSpot.dishName,
                isCurrentUserSpot: true
              });
            }
          }

          // Sort so that isCurrentUserSpot is first
          list.sort((a, b) => (b.isCurrentUserSpot ? 1 : 0) - (a.isCurrentUserSpot ? 1 : 0));

          setPoints(list);
          const activeUserSpot = list.find(p => p.isCurrentUserSpot) || list[0] || null;
          setSelectedPoint(activeUserSpot);

          if (json.data.stats && onStatsLoaded) {
            onStatsLoaded(json.data.stats);
          }
        }
      } catch (err) {
        console.warn('Map data load error:', err);
      }
    }
    loadData();
  }, [sessionId, currentUserSpot]);

  const currentUserPoint = points.find(p => p.isCurrentUserSpot) || (currentUserSpot ? {
    id: 999999,
    name: currentUserSpot.name,
    city: currentUserSpot.city,
    featured_dish: currentUserSpot.dishName,
    latitude: currentUserSpot.latitude || 18.5204,
    longitude: currentUserSpot.longitude || 73.8407,
    total_visits: 1,
    isCurrentUserSpot: true
  } : null);

  // User position on map
  const userCoords = currentUserPoint ? getMapCoordinates(currentUserPoint) : { x: 33, y: 64 };

  // Other visited spots (Red) for overlay (up to 8 points across India)
  const otherPoints = points.filter(p => !p.isCurrentUserSpot).slice(0, 8);

  return (
    <div className="w-full relative flex items-center justify-center select-none overflow-visible py-0.5">
      {/* Clean Map Graphic Container */}
      <div className="relative w-full aspect-[436/270] max-h-[250px] md:max-h-[500px] flex items-center justify-center">
        {/* Background Graphic: Clean India Tour Illustration with Bakasur */}
        <img
          src="/images/food_tour/india_tour_illustration.png"
          alt="India Tour Map"
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Highlight Current User's Visited Spot in GREEN (#10B981) */}
        {currentUserPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${userCoords.x}%`,
              top: `${userCoords.y}%`,
              transform: 'translate(-50%, -100%)',
              zIndex: 35
            }}
            className="cursor-pointer group flex flex-col items-center"
            onClick={() => {
              setSelectedPoint(currentUserPoint);
              if (onSelectPoint) onSelectPoint(currentUserPoint);
            }}
            onMouseEnter={() => setHoveredPoint(currentUserPoint)}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Sleek Attached Name Badge (Green) */}
            <div className="bg-[#059669] text-white text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xl border border-white/90 whitespace-nowrap mb-1 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>📍 {currentUserPoint.name} (Aap)</span>
            </div>

            {/* Glowing Pulsing Outer Aura (Green) */}
            <div className="relative flex items-center justify-center">
              <span className="absolute -inset-2.5 rounded-full bg-emerald-500/50 animate-ping" />
              <span className="absolute -inset-4 rounded-full bg-emerald-400/25 animate-pulse" />

              {/* Green Pin Drop Marker */}
              <div className="relative flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#10B981] border-2 border-white shadow-xl flex items-center justify-center text-white ring-2 ring-[#059669]/60 animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                </div>
                <div className="w-1.5 h-1.5 bg-[#10B981] rotate-45 -mt-1 shadow-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Highlight Existing User Spots in RED (#DC2626) */}
        {otherPoints.map((pt, idx) => {
          const coords = getMapCoordinates(pt);
          // Apply slight offset so spots in same city/coordinates do not overlap
          const isCloseToUser = Math.abs(coords.x - userCoords.x) < 5 && Math.abs(coords.y - userCoords.y) < 5;
          const angle = (idx * 55 * Math.PI) / 180;
          const radius = isCloseToUser ? 7 : (idx % 2 === 0 ? 3 : 0);
          const displayX = Math.max(16, Math.min(84, coords.x + Math.cos(angle) * radius));
          const displayY = Math.max(14, Math.min(84, coords.y + Math.sin(angle) * radius));

          return (
            <div
              key={`tour-point-${pt.id}-${pt.name}-${idx}`}
              style={{
                position: 'absolute',
                left: `${displayX}%`,
                top: `${displayY}%`,
                transform: 'translate(-50%, -100%)',
                zIndex: 20
              }}
              className="cursor-pointer group flex flex-col items-center"
              onClick={() => {
                setSelectedPoint(pt);
                if (onSelectPoint) onSelectPoint(pt);
              }}
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <div className="relative flex flex-col items-center hover:scale-125 transition-transform">
                <div className="w-5 h-5 rounded-full bg-[#DC2626] border-2 border-white shadow-md flex items-center justify-center text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                </div>
                <div className="w-1 h-1 bg-[#DC2626] rotate-45 -mt-0.5" />
              </div>
            </div>
          );
        })}

        {/* Tooltip on Hover / Tap for any spot */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${getMapCoordinates(hoveredPoint).x}%`,
              top: `${Math.max(8, getMapCoordinates(hoveredPoint).y - 14)}%`,
              transform: 'translate(-50%, -100%)',
              zIndex: 40
            }}
            className="bg-[#08173E] text-white rounded-xl px-2.5 py-1.5 shadow-2xl text-[10px] whitespace-nowrap pointer-events-none border border-white/20 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className={`font-black ${hoveredPoint.isCurrentUserSpot ? 'text-emerald-400' : 'text-red-400'}`}>
              {hoveredPoint.isCurrentUserSpot ? '🟢 Aapka Spot: ' : '🔴 '}{hoveredPoint.name}
            </div>
            <div className="text-[9px] text-slate-300">
              🍽️ {hoveredPoint.featured_dish || 'Specialty'} • 📍 {hoveredPoint.city}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
