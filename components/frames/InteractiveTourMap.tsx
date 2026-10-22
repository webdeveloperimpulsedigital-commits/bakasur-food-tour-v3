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
  stopNumber?: number;
}

export interface CurrentUserSpotInfo {
  name: string;
  city: string;
  dishName: string;
  latitude?: number;
  longitude?: number;
  stopNumber?: number;
}

interface InteractiveTourMapProps {
  sessionId?: string;
  currentUserSpot?: CurrentUserSpotInfo | null;
  currentUserSpots?: CurrentUserSpotInfo[];
  onSelectPoint?: (point: TourMapPoint) => void;
  onStatsLoaded?: (stats: { foodSpots: number; mustTryDishes: number; citiesCount: number }) => void;
  onShareUserSpot?: () => void;
}

export const InteractiveTourMap: React.FC<InteractiveTourMapProps> = ({
  sessionId,
  currentUserSpot,
  currentUserSpots,
  onSelectPoint,
  onStatsLoaded,
  onShareUserSpot
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

          // Determine all user visited spots (either passed via prop or retrieved from DB by session_id)
          const propSpots: CurrentUserSpotInfo[] = (currentUserSpots && currentUserSpots.length > 0)
            ? currentUserSpots
            : (currentUserSpot && currentUserSpot.name ? [currentUserSpot] : []);

          const dbSpots: CurrentUserSpotInfo[] = (json.data.currentUserSpots && Array.isArray(json.data.currentUserSpots))
            ? json.data.currentUserSpots.map((s: any, idx: number) => ({
                name: s.name,
                city: s.city,
                dishName: s.featured_dish || 'Specialty Dish',
                latitude: s.latitude,
                longitude: s.longitude,
                stopNumber: s.stopNumber || idx + 1
              }))
            : [];

          // Prefer propSpots if provided by active interactive flow, otherwise dbSpots from database
          const rawUserSpots = propSpots.length > 0 ? propSpots : dbSpots;

          // Helper to normalize restaurant names for accurate matching
          const normalizeKey = (name: string): string => {
            if (!name) return '';
            const base = name.split(/[,-]/)[0].trim().toLowerCase();
            const clean = base
              .replace(/\b(hotel|restaurant|pure veg|veg|cafe|stall|bhel|snacks|the|special|bar|and)\b/gi, '')
              .replace(/[^a-z0-9]/g, '')
              .trim();
            return clean || base.replace(/[^a-z0-9]/g, '');
          };

          // Strictly deduplicate and assign sequential stop numbers: Stop 1, Stop 2
          const cleanUserSpots: CurrentUserSpotInfo[] = [];
          const seenKeys = new Set<string>();
          rawUserSpots.forEach((s) => {
            const k = normalizeKey(s.name);
            if (k && !seenKeys.has(k)) {
              seenKeys.add(k);
              cleanUserSpots.push({
                ...s,
                stopNumber: cleanUserSpots.length + 1
              });
            }
          });

          // Build a map of normalized user restaurant keys to sequential stop number
          const userKeyStopMap = new Map<string, number>();
          cleanUserSpots.forEach(s => {
            userKeyStopMap.set(normalizeKey(s.name), s.stopNumber!);
          });

          // Update existing points in list: mark ONLY active user spots as isCurrentUserSpot with their sequential stopNumber
          list.forEach(p => {
            const k = normalizeKey(p.name);
            const userStopNum = userKeyStopMap.get(k);
            if (userStopNum !== undefined) {
              p.isCurrentUserSpot = true;
              p.stopNumber = userStopNum;
              const matchedUserSpot = cleanUserSpots.find(s => s.stopNumber === userStopNum);
              if (matchedUserSpot?.dishName) {
                p.featured_dish = matchedUserSpot.dishName;
              }
            } else {
              p.isCurrentUserSpot = false;
              p.stopNumber = undefined;
            }
          });

          // If a user spot from cleanUserSpots isn't in list yet, insert it at the beginning
          // (only when it has a real location; never plot a spot at a default/fake coordinate)
          cleanUserSpots.forEach(s => {
            const k = normalizeKey(s.name);
            const exists = list.some(p => normalizeKey(p.name) === k);
            const hasRealCoords = typeof s.latitude === 'number' && typeof s.longitude === 'number'
              && !isNaN(s.latitude) && !isNaN(s.longitude) && s.latitude !== 0 && s.longitude !== 0;
            if (!exists && hasRealCoords) {
              list.unshift({
                id: 999990 + s.stopNumber!,
                name: s.name,
                city: s.city,
                latitude: s.latitude as number,
                longitude: s.longitude as number,
                rating: 4.8,
                total_visits: 1,
                featured_dish: s.dishName,
                isCurrentUserSpot: true,
                stopNumber: s.stopNumber
              });
            }
          });

          if (cleanUserSpots.length > 0 && cleanUserSpots[0].latitude && cleanUserSpots[0].longitude) {
            setUserCenterCoords([cleanUserSpots[0].latitude, cleanUserSpots[0].longitude]);
          } else if (json.data?.currentUserPoint) {
            const cur = json.data.currentUserPoint;
            setUserCenterCoords([cur.latitude, cur.longitude]);
          }

          // Sort so currentUserSpots are first (ordered Stop 1, Stop 2)
          list.sort((a, b) => {
            if (a.isCurrentUserSpot && b.isCurrentUserSpot) {
              return (a.stopNumber || 1) - (b.stopNumber || 1);
            }
            return (b.isCurrentUserSpot ? 1 : 0) - (a.isCurrentUserSpot ? 1 : 0);
          });

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
  }, [sessionId, currentUserSpot, currentUserSpots]);

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

      // Default center: All-India zoomed out view showing all food spots across India
      const initialLat = 21.8;
      const initialLng = 78.9;
      const initialZoom = 4.8;

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

      points.forEach((point) => {
        const isCurrent = Boolean(point.isCurrentUserSpot);
        const pointLat = point.latitude;
        const pointLng = point.longitude;

        if (isCurrent) {
          // BLUE PIN: Current User's Visited Spot with clear Floating Name Label & Glowing Halo
          const stopTitle = point.stopNumber ? `Stop ${point.stopNumber}` : 'Aapka Spot';
          const pinBadgeText = point.stopNumber ? `${point.stopNumber}` : `${point.total_visits || 1}`;
          const cleanDisplayName = point.name.length > 22 ? point.name.slice(0, 20) + '...' : point.name;

          const blueIcon = L.divIcon({
            className: 'custom-user-blue-pin',
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
                <!-- High-visibility Floating Name Badge Label -->
                <div style="background: #1D4ED8; color: #FFFFFF; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(29,78,216,0.45); white-space: nowrap; margin-bottom: 3px; border: 1.5px solid #FFFFFF; letter-spacing: 0.2px; display: flex; align-items: center; gap: 4px; pointer-events: none;">
                  <span style="color: #93C5FD; font-size: 9px; text-transform: uppercase;">${stopTitle}</span>
                  <span style="color: #FFFFFF;">${cleanDisplayName}</span>
                </div>
                <!-- Pulsing outer halo to highlight user's spot -->
                <div style="position: absolute; top: 20px; width: 34px; height: 34px; border-radius: 50%; background-color: rgba(37,99,235,0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <!-- Teardrop Pin Marker with Visit / Stop Number -->
                <div style="position: relative; display: flex; align-items: center; justify-content: center; z-index: 10;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #3B82F6, #1D4ED8); border: 2.5px solid #FFFFFF; box-shadow: 0 6px 16px rgba(37,99,235,0.6); display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 11px; font-weight: 900; color: #FFFFFF; line-height: 1;">${pinBadgeText}</span>
                  </div>
                  <div style="position: absolute; bottom: -4px; width: 8px; height: 8px; background-color: #1D4ED8; transform: rotate(45deg);"></div>
                </div>
              </div>
            `,
            iconSize: [160, 58],
            iconAnchor: [80, 58]
          });

          const marker = L.marker([point.latitude, point.longitude], {
            icon: blueIcon,
            zIndexOffset: 1000
          });

          marker.bindPopup(`
            <div style="font-family: inherit; padding: 4px 6px; min-width: 150px; text-align: left;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 6px;">
                <span style="display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #1D4ED8; background: #DBEAFE; padding: 1px 6px; border-radius: 4px;">
                  Aapka Visited Spot ${point.stopNumber ? `(Stop ${point.stopNumber})` : ''}
                </span>
                <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 900; color: #1D4ED8; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 1px 6px; border-radius: 9999px;">
                  👥 ${point.total_visits} ${point.total_visits === 1 ? 'Visit' : 'Visits'}
                </span>
              </div>
              <div style="font-weight: 900; font-size: 13px; color: #0F172A; line-height: 1.2;">
                ${point.name}
              </div>
              <div style="font-size: 11px; color: #1E293B; margin-top: 4px; font-weight: 600;">
                🍽️ ${point.featured_dish || 'Specialty Dish'}
              </div>
              <div style="font-size: 10px; color: #64748B; margin-top: 2px;">
                📍 ${point.city} • <strong style="color: #1D4ED8;">${point.total_visits} ${point.total_visits === 1 ? 'foodie visited' : 'foodies visited'}</strong>
              </div>
              <button id="btn-popup-share-spot" style="margin-top: 8px; width: 100%; padding: 5px 8px; border-radius: 8px; background: linear-gradient(to right, #2563EB, #1D4ED8); color: #ffffff; font-size: 10px; font-weight: 800; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 6px rgba(37,99,235,0.4);">
                <span>📤 Share Spot On Social Media</span>
              </button>
            </div>
          `);

          marker.on('popupopen', () => {
            const btn = document.getElementById('btn-popup-share-spot');
            if (btn) {
              btn.onclick = (e) => {
                e.stopPropagation();
                if (onShareUserSpot) onShareUserSpot();
              };
            }
          });

          marker.on('click', () => {
            setActivePoint(point);
            if (onSelectPoint) onSelectPoint(point);
          });

          marker.addTo(markersLayer);
          userMarkerInstance = marker;
        } else {
          // RED PIN: Existing Visited Restaurants (Clean teardrop marker without bulky text label)
          const redIcon = L.divIcon({
            className: 'custom-existing-red-pin',
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
                <!-- Teardrop Pin Marker with Visit Count Inside -->
                <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, #EF4444, #DC2626); border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(220,38,38,0.5); display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 9px; font-weight: 900; color: #FFFFFF; line-height: 1;">${point.total_visits}</span>
                  </div>
                  <div style="position: absolute; bottom: -3.5px; width: 6px; height: 6px; background-color: #DC2626; transform: rotate(45deg);"></div>
                </div>
              </div>
            `,
            iconSize: [22, 28],
            iconAnchor: [11, 28]
          });

          const marker = L.marker([pointLat, pointLng], {
            icon: redIcon,
            zIndexOffset: 100
          });

          marker.bindPopup(`
            <div style="font-family: inherit; padding: 4px 6px; min-width: 150px; text-align: left;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 6px;">
                <span style="display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #DC2626; background: #FEE2E2; padding: 1px 6px; border-radius: 4px;">
                  Bhookasur Food Stop
                </span>
                <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 900; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 1px 6px; border-radius: 9999px;">
                  👥 ${point.total_visits} ${point.total_visits === 1 ? 'Visit' : 'Visits'}
                </span>
              </div>
              <div style="font-weight: 900; font-size: 13px; color: #0F172A; line-height: 1.2;">
                ${point.name}
              </div>
              <div style="font-size: 11px; color: #334155; margin-top: 4px; font-weight: 600;">
                🍽️ ${point.featured_dish || 'Famous Food'}
              </div>
              <div style="font-size: 10px; color: #64748B; margin-top: 2px;">
                📍 ${point.city} • <strong style="color: #DC2626;">${point.total_visits} ${point.total_visits === 1 ? 'foodie ne visit kiya' : 'foodies ne visit kiya'}</strong>
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

      // Initial View: Focus on user's visited food tour spots (blue) together with the existing
      // visited spots (red) around them, so both are always visible on the first view.
      const userSpots = points.filter(p => p.isCurrentUserSpot);
      const kmBetween = (aLat: number, aLng: number, bLat: number, bLng: number) => {
        const toRad = (d: number) => (d * Math.PI) / 180;
        const dLat = toRad(bLat - aLat);
        const dLng = toRad(bLng - aLng);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
        return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      };
      const nearbyExisting = userSpots.length > 0
        ? points.filter(p => !p.isCurrentUserSpot && userSpots.some(u => kmBetween(u.latitude, u.longitude, p.latitude, p.longitude) <= 10))
        : [];
      const focusSpots = [...userSpots, ...nearbyExisting];
      if (focusSpots.length >= 2) {
        const userBounds = L.latLngBounds(focusSpots.map(p => [p.latitude, p.longitude]));
        if (userBounds.isValid()) {
          map.fitBounds(userBounds, { padding: [50, 50], maxZoom: 15 });
        }
      } else if (focusSpots.length === 1) {
        map.setView([focusSpots[0].latitude, focusSpots[0].longitude], 13);
      } else if (points.length > 0) {
        const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
        }
      } else {
        map.setView([21.5, 78.9], 4.8);
      }

      // Save map instance
      mapInstanceRef.current = map;

      // Invalidate size smoothly without auto-opening popup (opens only on click)
      setTimeout(() => {
        if (!isCancelled && map) {
          map.invalidateSize();
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
  }, [points, currentUserSpot, currentUserSpots]);

  // Center on Current User Pin (or bounds of both user visited spots)
  const handleZoomToUser = async () => {
    if (!mapInstanceRef.current) return;
    const userSpots = points.filter(p => p.isCurrentUserSpot);
    if (userSpots.length > 1) {
      try {
        const L = (await import('leaflet')).default;
        const bounds = L.latLngBounds(userSpots.map(p => [p.latitude, p.longitude]));
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
          return;
        }
      } catch (err) {
        console.warn('Bounds zoom notice:', err);
      }
    }

    const current = userSpots[0] || points.find(p => p.isCurrentUserSpot);
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
          <span className="w-4 h-4 rounded-full bg-red-600 text-[9px] text-white flex items-center justify-center font-black border border-white shadow-xs inline-flex">
            #
          </span>
          <span className="text-slate-700">Visited Count (DB)</span>
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
