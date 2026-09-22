'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';

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

export const InteractiveTourMap: React.FC<InteractiveTourMapProps> = ({
  sessionId,
  currentUserSpot,
  onSelectPoint,
  onStatsLoaded
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [points, setPoints] = useState<TourMapPoint[]>([]);
  const [activePoint, setActivePoint] = useState<TourMapPoint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userCenterCoords, setUserCenterCoords] = useState<[number, number]>([18.5204, 73.8407]);

  // 1. Fetch live map points and stats
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        const url = sessionId
          ? `/api/campaign/map?session_id=${encodeURIComponent(sessionId)}`
          : '/api/campaign/map';
        const res = await fetch(url);
        const json = await res.json();

        if (!isCancelled && json.success && json.data) {
          let list: TourMapPoint[] = (json.data.points || []).filter(
            (p: any) => typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude)
          );

          // If currentUserSpot is passed, ensure it is in the list and uniquely marked as current user
          if (currentUserSpot && currentUserSpot.name) {
            const userLat = currentUserSpot.latitude || 18.5204;
            const userLng = currentUserSpot.longitude || 73.8407;
            setUserCenterCoords([userLat, userLng]);

            // Clear any stale isCurrentUserSpot flags on other points
            list.forEach(p => {
              if (p.name.toLowerCase() !== currentUserSpot.name.toLowerCase()) {
                p.isCurrentUserSpot = false;
              }
            });

            const existingIdx = list.findIndex(
              p => p.name && p.name.toLowerCase() === currentUserSpot.name.toLowerCase()
            );

            if (existingIdx !== -1) {
              list[existingIdx] = {
                ...list[existingIdx],
                name: currentUserSpot.name,
                city: currentUserSpot.city || list[existingIdx].city,
                featured_dish: currentUserSpot.dishName || list[existingIdx].featured_dish,
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
          } else if (json.data?.currentUserPoint) {
            const cur = json.data.currentUserPoint;
            setUserCenterCoords([cur.latitude, cur.longitude]);
          }

          // Sort so currentUserSpot is first
          list.sort((a, b) => (b.isCurrentUserSpot ? 1 : 0) - (a.isCurrentUserSpot ? 1 : 0));

          setPoints(list);
          const current = list.find(p => p.isCurrentUserSpot) || list[0] || null;
          setActivePoint(current);

          if (json.data.stats && onStatsLoaded) {
            onStatsLoaded(json.data.stats);
          }
        }
      } catch (err) {
        console.warn('Failed to load map data:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [sessionId, currentUserSpot]);

  // 2. Initialize and render Leaflet Google Map
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (isCancelled || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // Default center: Current user location if available, otherwise Pune or India center
      const currentPoint = points.find(p => p.isCurrentUserSpot);
      const initialLat = currentPoint?.latitude || currentUserSpot?.latitude || 18.5204;
      const initialLng = currentPoint?.longitude || currentUserSpot?.longitude || 73.8407;
      const initialZoom = currentPoint ? 12 : 5;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false, // Custom placed zoom control
        attributionControl: false
      });

      // Google Maps Standard Road Tile Layer
      const googleTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      });
      googleTileLayer.addTo(map);

      // Add neat top-left zoom control
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Helper function to create custom DivIcons
      // BLUE PIN for Current User, RED PIN for Existing Visited Spots
      const markersLayer = L.layerGroup().addTo(map);

      let userMarkerInstance: any = null;

      // Track coordinates to avoid overlapping pins for spots in the exact same location
      const coordCounter = new Map<string, number>();

      points.forEach((point) => {
        const isCurrent = Boolean(point.isCurrentUserSpot);
        let pointLat = point.latitude;
        let pointLng = point.longitude;

        if (!isCurrent) {
          const coordKey = `${pointLat.toFixed(3)}_${pointLng.toFixed(3)}`;
          const count = coordCounter.get(coordKey) || 0;
          coordCounter.set(coordKey, count + 1);

          if (count > 0) {
            // Fan out in a spiral/circle offset so each pin is clearly visible & clickable
            const angle = (count * 50 * Math.PI) / 180;
            const radius = 0.0035 * Math.ceil(count / 7);
            pointLat += Math.cos(angle) * radius;
            pointLng += Math.sin(angle) * radius;
          }
        }

        if (isCurrent) {
          // BLUE PIN: Current User's Visited Spot
          const blueIcon = L.divIcon({
            className: 'custom-user-blue-pin',
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
                <!-- Attached Name Tag -->
                <div style="background-color: #1D4ED8; color: white; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border: 2px solid #ffffff; white-space: nowrap; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
                  <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #93C5FD;"></span>
                  <span>📍 ${point.name} (Aap)</span>
                </div>
                <!-- Teardrop Pin Marker -->
                <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 6px 16px rgba(37,99,235,0.5); display: flex; align-items: center; justify-content: center;">
                    <div style="width: 9px; height: 9px; border-radius: 50%; background-color: #FFFFFF;"></div>
                  </div>
                  <div style="position: absolute; bottom: -4px; width: 8px; height: 8px; background-color: #2563EB; transform: rotate(45deg);"></div>
                </div>
              </div>
            `,
            iconSize: [32, 54],
            iconAnchor: [16, 54]
          });

          const marker = L.marker([point.latitude, point.longitude], {
            icon: blueIcon,
            zIndexOffset: 1000
          });

          marker.bindPopup(`
            <div style="font-family: inherit; padding: 4px 6px; min-width: 140px; text-align: left;">
              <div style="display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #1D4ED8; background: #DBEAFE; padding: 1px 6px; border-radius: 4px; margin-bottom: 4px;">
                Aapka Visited Spot
              </div>
              <div style="font-weight: 900; font-size: 13px; color: #0F172A; line-height: 1.2;">
                ${point.name}
              </div>
              <div style="font-size: 11px; color: #1E293B; margin-top: 4px; font-weight: 600;">
                🍽️ ${point.featured_dish || 'Specialty Dish'}
              </div>
              <div style="font-size: 10px; color: #64748B; margin-top: 2px;">
                📍 ${point.city}
              </div>
            </div>
          `);

          marker.on('click', () => {
            setActivePoint(point);
            if (onSelectPoint) onSelectPoint(point);
          });

          marker.addTo(markersLayer);
          userMarkerInstance = marker;
        } else {
          // RED PIN: Existing Visited Restaurants
          const redIcon = L.divIcon({
            className: 'custom-existing-red-pin',
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
                <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #DC2626; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(220,38,38,0.4); display: flex; align-items: center; justify-content: center;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #FFFFFF;"></div>
                  </div>
                  <div style="position: absolute; bottom: -3px; width: 6px; height: 6px; background-color: #DC2626; transform: rotate(45deg);"></div>
                </div>
              </div>
            `,
            iconSize: [20, 26],
            iconAnchor: [10, 26]
          });

          const marker = L.marker([pointLat, pointLng], {
            icon: redIcon,
            zIndexOffset: 100
          });

          marker.bindPopup(`
            <div style="font-family: inherit; padding: 4px 6px; min-width: 130px; text-align: left;">
              <div style="display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #DC2626; background: #FEE2E2; padding: 1px 6px; border-radius: 4px; margin-bottom: 4px;">
                Bakasur Food Stop
              </div>
              <div style="font-weight: 800; font-size: 12px; color: #0F172A; line-height: 1.2;">
                ${point.name}
              </div>
              <div style="font-size: 11px; color: #334155; margin-top: 3px;">
                🍽️ ${point.featured_dish || 'Famous Food'}
              </div>
              <div style="font-size: 10px; color: #64748B; margin-top: 2px;">
                📍 ${point.city}
              </div>
            </div>
          `);

          marker.on('click', () => {
            setActivePoint(point);
            if (onSelectPoint) onSelectPoint(point);
          });

          marker.addTo(markersLayer);
        }
      });

      // Save map instance
      mapInstanceRef.current = map;

      // Invalidate size and auto open user popup after brief delay
      setTimeout(() => {
        if (!isCancelled && map) {
          map.invalidateSize();
          if (userMarkerInstance) {
            userMarkerInstance.openPopup();
          }
        }
      }, 250);
    }

    if (points.length > 0) {
      initMap();
    }

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points, currentUserSpot]);

  // Center on Current User Pin
  const handleZoomToUser = () => {
    if (!mapInstanceRef.current) return;
    const current = points.find(p => p.isCurrentUserSpot);
    if (current) {
      mapInstanceRef.current.flyTo([current.latitude, current.longitude], 13, { duration: 1.2 });
    } else if (currentUserSpot?.latitude && currentUserSpot?.longitude) {
      mapInstanceRef.current.flyTo([currentUserSpot.latitude, currentUserSpot.longitude], 13, { duration: 1.2 });
    }
  };

  // View All India
  const handleViewAllIndia = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([21.5, 78.9], 5, { duration: 1.2 });
  };

  return (
    <div className="w-full h-full relative rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200/90 shadow-md select-none bg-[#e5e3df]">
      {/* Actual Google Maps Container (Zero extra white space) */}
      <div
        ref={mapContainerRef}
        id="tour-leaflet-map"
        className="w-full h-full min-h-[260px] xs:min-h-[280px] sm:min-h-[320px] md:min-h-[440px] lg:min-h-[500px] z-10"
      />

      {/* Floating Map Action Controls (Top-Right) */}
      <div className="absolute top-2.5 right-2.5 z-30 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={handleZoomToUser}
          type="button"
          title="Zoom to My Visited Spot"
          className="bg-white/95 hover:bg-white text-blue-600 p-2 rounded-xl shadow-md border border-slate-200 hover:shadow-lg active:scale-95 transition-all flex items-center gap-1 text-[11px] font-black cursor-pointer backdrop-blur-xs"
        >
          <Navigation className="w-3.5 h-3.5 fill-blue-600" />
          <span className="hidden xs:inline">Aapka Spot</span>
        </button>

        <button
          onClick={handleViewAllIndia}
          type="button"
          title="View All India Tour Spots"
          className="bg-white/95 hover:bg-white text-slate-700 p-2 rounded-xl shadow-md border border-slate-200 hover:shadow-lg active:scale-95 transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer backdrop-blur-xs"
        >
          <Compass className="w-3.5 h-3.5 text-slate-700" />
          <span className="hidden xs:inline">All India</span>
        </button>
      </div>

      {/* Pin Legend Overlay (Bottom-Left) */}
      <div className="absolute bottom-2.5 left-2.5 z-30 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-[10px] font-bold flex items-center gap-3 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-xs inline-block" />
          <span className="text-[#0B1B48]">Aapka Spot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs inline-block" />
          <span className="text-slate-600">Existing Spots</span>
        </div>
      </div>

      {/* Cute Bakasur Mascot Peek (Bottom-Right) */}
      <div className="absolute bottom-1 right-2 z-30 pointer-events-none opacity-90 hidden xs:block">
        <img
          src="/images/food_tour/shukriya_map_photo.png"
          alt="Bakasur Map"
          className="w-12 h-12 sm:w-14 sm:h-14 object-contain filter drop-shadow-md"
        />
      </div>

      {/* Loading Overlay */}
      {isLoading && points.length === 0 && (
        <div className="absolute inset-0 z-40 bg-white/70 backdrop-blur-xs flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200">
            <span className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-xs font-black text-[#0B1B48]">Google Map Load Ho Raha Hai...</span>
          </div>
        </div>
      )}
    </div>
  );
};
