'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';
import { getOrCreateUserId, getUserSessionsHistory, getStoredUserMobile } from '@/lib/tracker';
import { withBasePath } from '@/lib/basePath';

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
        const params = new URLSearchParams();
        if (sessionId) params.set('session_id', sessionId);
        const uid = getOrCreateUserId();
        if (uid) params.set('user_id', uid);
        const history = getUserSessionsHistory();
        if (history.length > 0) params.set('session_ids', history.join(','));
        const mob = getStoredUserMobile();
        if (mob) params.set('mobile', mob);

        const url = withBasePath(`/api/campaign/map?${params.toString()}`);
        const res = await fetch(url);
        const json = await res.json();

        // Coordinate sanitizer: guarantees real land coordinates (especially for Thane / Mumbai / Pune)
        const getValidCoords = (spot: { latitude?: number; longitude?: number; city?: string; name?: string; address?: string }): [number, number] => {
          let lat = typeof spot.latitude === 'number' ? spot.latitude : Number(spot.latitude);
          let lng = typeof spot.longitude === 'number' ? spot.longitude : Number(spot.longitude);

          // Valid Indian land coordinates roughly: Lat 8 to 36, Lng 68 to 97
          // Coastline of Mumbai/Thane is ~72.80° E. Any coordinate with Lng < 72.80 between Lat 18.8 and 19.5 is in the Arabian Sea!
          const isInvalidOrInSea =
            !lat || !lng || isNaN(lat) || isNaN(lng) ||
            lat < 8 || lat > 37 || lng < 68 || lng > 98 ||
            (lat >= 18.8 && lat <= 19.5 && lng < 72.80);

          if (isInvalidOrInSea) {
            const locStr = `${spot.city || ''} ${spot.name || ''} ${spot.address || ''}`.toLowerCase();
            if (
              locStr.includes('thane') ||
              locStr.includes('naupada') ||
              locStr.includes('viviana') ||
              locStr.includes('pakhadi') ||
              locStr.includes('majiwada') ||
              locStr.includes('vartak') ||
              locStr.includes('ghodbunder') ||
              locStr.includes('kalwa') ||
              locStr.includes('mumbra') ||
              locStr.includes('kalyan') ||
              locStr.includes('dombivli')
            ) {
              return [19.2183, 72.9781]; // Accurate Thane City Center
            }
            if (
              locStr.includes('navi mumbai') ||
              locStr.includes('vashi') ||
              locStr.includes('nerul') ||
              locStr.includes('belapur') ||
              locStr.includes('airoli') ||
              locStr.includes('kharghar')
            ) {
              return [19.0330, 73.0297]; // Navi Mumbai
            }
            if (
              locStr.includes('mumbai') ||
              locStr.includes('bandra') ||
              locStr.includes('dadar') ||
              locStr.includes('andheri') ||
              locStr.includes('juhu') ||
              locStr.includes('kurla')
            ) {
              return [19.0760, 72.8777]; // Mumbai
            }
            if (locStr.includes('bengaluru') || locStr.includes('bangalore')) {
              return [12.9716, 77.5946];
            }
            if (locStr.includes('delhi')) {
              return [28.6139, 77.2090];
            }
            const cLower = (spot.city || '').toLowerCase().trim();
            if (cLower === 'thane') return [19.2183, 72.9781];
            if (cLower === 'mumbai') return [19.0760, 72.8777];
            return [18.5204, 73.8567]; // default Pune
          }
          return [lat, lng];
        };

        if (!isCancelled && json.success && json.data) {
          let list: TourMapPoint[] = (json.data.points || []).filter(
            (p: any) => typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude)
          );

          // Sanitize coordinates for all database points
          list.forEach((p) => {
            const [pLat, pLng] = getValidCoords(p);
            p.latitude = pLat;
            p.longitude = pLng;
          });

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

          // Deduplicate rawUserSpots while preserving unique stop numbers
          const cleanUserSpots: CurrentUserSpotInfo[] = [];
          const seenStopKeys = new Set<string>();
          rawUserSpots.forEach((s) => {
            const [validLat, validLng] = getValidCoords(s);
            const k = `${normalizeKey(s.name)}_${s.stopNumber || 0}`;
            if (!seenStopKeys.has(k)) {
              seenStopKeys.add(k);
              cleanUserSpots.push({
                ...s,
                latitude: validLat,
                longitude: validLng,
                stopNumber: s.stopNumber || (cleanUserSpots.length + 1)
              });
            }
          });
          cleanUserSpots.sort((a, b) => (a.stopNumber || 1) - (b.stopNumber || 1));

          // STRICT 1-TO-1 PIN MAPPING:
          // Reset all points first to regular historical spots
          list.forEach(p => {
            p.isCurrentUserSpot = false;
            p.stopNumber = undefined;
          });

          // Visited places must always show their own exact name and proper city name.
          // NEVER match against or overwrite with DB restaurant names or cities!
          cleanUserSpots.forEach(s => {
            if (s.latitude && s.longitude) {
              // Suppress any existing historical red marker that overlaps (within 300m)
              list = list.filter(p => {
                const dist = Math.hypot(p.latitude - s.latitude!, p.longitude - s.longitude!);
                return dist > 0.003;
              });

              const newPointId = 999990 + (s.stopNumber || 1);
              list.unshift({
                id: newPointId,
                name: s.name,
                city: s.city || 'Thane',
                latitude: s.latitude,
                longitude: s.longitude,
                rating: 4.8,
                total_visits: 1,
                featured_dish: s.dishName || 'Specialty Dish',
                isCurrentUserSpot: true,
                stopNumber: s.stopNumber || 1
              });
            }
          });

          // Final deduplication guarantee: Ensure NO stopNumber ever appears more than once
          const verifiedStopNums = new Set<number>();
          list.forEach(p => {
            if (p.isCurrentUserSpot && p.stopNumber) {
              if (verifiedStopNums.has(p.stopNumber)) {
                p.isCurrentUserSpot = false;
                p.stopNumber = undefined;
              } else {
                verifiedStopNums.add(p.stopNumber);
              }
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

      // BLUE PIN for Current User, RED PIN for Other Visited Spots
      const markersLayer = L.layerGroup().addTo(map);

      let userMarkerInstance: any = null;
      const userSpots = points.filter(p => p.isCurrentUserSpot);

      // Track rendered coordinates to prevent complete visual stacking of close markers
      const renderedCoords: Array<{ lat: number; lng: number }> = [];

      points.forEach((point) => {
        const isCurrent = Boolean(point.isCurrentUserSpot);
        const pointLat = point.latitude;
        const pointLng = point.longitude;

        if (isCurrent) {
          // Track blue marker coords
          renderedCoords.push({ lat: pointLat, lng: pointLng });

          // BLUE PIN: Current User's Visited Spot with clear Floating Name Label & Glowing Halo
          const cleanDisplayName = point.name.length > 22 ? point.name.slice(0, 20) + '...' : point.name;

          // Note: Clean teardrop pin [34, 42] with crisp white center dot (no numbers).
          // The floating label badge and pulsing ring have pointer-events: none so they never intercept clicks.
          const blueIcon = L.divIcon({
            className: 'custom-user-blue-pin',
            html: `
              <div style="position: relative; width: 34px; height: 42px; pointer-events: none; user-select: none;">
                <!-- Floating Blue Name Badge: pointer-events strictly none so neighboring pins can be clicked freely -->
                <div style="position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); background: #1D4ED8; color: #FFFFFF; font-size: 10px; font-weight: 900; padding: 2.5px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(29,78,216,0.45); white-space: nowrap; border: 1.5px solid #FFFFFF; letter-spacing: 0.2px; display: flex; align-items: center; gap: 4px; pointer-events: none; z-index: 20;">
                  <span style="color: #93C5FD; font-size: 9px; text-transform: uppercase;">Aapka Spot</span>
                  <span style="color: #FFFFFF;">${cleanDisplayName}</span>
                </div>
                <!-- Pulsing blue halo ring (pointer-events none) -->
                <div style="position: absolute; top: 0; left: 0; width: 34px; height: 34px; border-radius: 50%; background-color: rgba(29,78,216,0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>
                <!-- Teardrop Pin Marker: Solid Royal Blue (#1D4ED8) with clean white center disc (No numbers) -->
                <div style="position: relative; width: 34px; height: 42px; pointer-events: auto; cursor: pointer;">
                  <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 10px rgba(29,78,216,0.5)); display: block;">
                    <path d="M17 42C17 42 32 26 32 15C32 6.71573 25.2843 0 17 0C8.71573 0 2 6.71573 2 15C2 26 17 42 17 42Z" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2.2"/>
                    <circle cx="17" cy="15" r="5.5" fill="#FFFFFF"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [34, 42],
            iconAnchor: [17, 42],
            popupAnchor: [0, -48]
          });

          const marker = L.marker([point.latitude, point.longitude], {
            icon: blueIcon,
            zIndexOffset: 300,
            riseOnHover: true,
            riseOffset: 5000
          });

          marker.bindPopup(`
            <div style="font-family: inherit; padding: 4px 6px; min-width: 150px; text-align: left;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 6px;">
                <span style="display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #1D4ED8; background: #DBEAFE; padding: 1px 6px; border-radius: 4px;">
                  Aapka Visited Spot
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
            marker.setZIndexOffset(6000);

            // If zoomed out, smoothly fly into location so all nearby food spots disperse cleanly
            if (map.getZoom() < 11) {
              map.flyTo([point.latitude, point.longitude], 12, { duration: 0.8 });
              map.once('moveend', () => {
                marker.openPopup();
              });
            } else {
              marker.openPopup();
            }
          });

          marker.on('popupclose', () => {
            marker.setZIndexOffset(300);
          });

          marker.addTo(markersLayer);
          userMarkerInstance = marker;
        } else {
          // RED PIN: Other Visited Spots from database
          // Skip red marker only if it is the EXACT same restaurant or exact same coordinates as the user's blue spot
          const isSameUserRestaurant = userSpots.some(u =>
            u.name.trim().toLowerCase() === point.name.trim().toLowerCase() ||
            (Math.abs(u.latitude - pointLat) < 0.0003 && Math.abs(u.longitude - pointLng) < 0.0003)
          );
          if (isSameUserRestaurant) return;

          // Prevent exact pixel overlapping with existing pins by applying a subtle micro-offset
          let displayLat = pointLat;
          let displayLng = pointLng;
          const hasNearCollision = renderedCoords.some(c =>
            Math.abs(c.lat - displayLat) < 0.0004 && Math.abs(c.lng - displayLng) < 0.0004
          );
          if (hasNearCollision) {
            displayLat += 0.00035;
            displayLng += 0.00035;
          }
          renderedCoords.push({ lat: displayLat, lng: displayLng });

          const redIcon = L.divIcon({
            className: 'custom-existing-red-pin',
            html: `
              <div style="position: relative; width: 24px; height: 30px; pointer-events: auto; cursor: pointer; user-select: none;">
                <!-- Teardrop Pin Marker: Solid Crimson Red (#DC2626) with clean white center disc (No numbers) -->
                <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(220,38,38,0.45)); display: block;">
                  <path d="M12 30C12 30 23 18.5 23 11C23 4.92487 18.0751 0 12 0C5.92487 0 1 4.92487 1 11C1 18.5 12 30 12 30Z" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.8"/>
                  <circle cx="12" cy="11" r="4.2" fill="#FFFFFF"/>
                </svg>
              </div>
            `,
            iconSize: [24, 30],
            iconAnchor: [12, 30],
            popupAnchor: [0, -34]
          });

          const marker = L.marker([displayLat, displayLng], {
            icon: redIcon,
            zIndexOffset: 150,
            riseOnHover: true,
            riseOffset: 5000
          });

          marker.bindPopup(`
            <div style="font-family: inherit; padding: 4px 6px; min-width: 150px; text-align: left;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 6px;">
                <span style="display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #DC2626; background: #FEE2E2; padding: 1px 6px; border-radius: 4px;">
                  Visited Food Spot
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
                📍 ${point.city} • <strong style="color: #DC2626;">${point.total_visits} ${point.total_visits === 1 ? 'foodie visited' : 'foodies visited'}</strong>
              </div>
            </div>
          `);

          marker.on('click', () => {
            setActivePoint(point);
            if (onSelectPoint) onSelectPoint(point);
            marker.setZIndexOffset(6000);

            // If zoomed out, smoothly fly into location so all nearby food spots disperse cleanly
            if (map.getZoom() < 11) {
              map.flyTo([displayLat, displayLng], 12, { duration: 0.8 });
              map.once('moveend', () => {
                marker.openPopup();
              });
            } else {
              marker.openPopup();
            }
          });

          marker.on('popupclose', () => {
            marker.setZIndexOffset(150);
          });

          marker.addTo(markersLayer);
        }
      });

      // View: Focus initial camera on user's visited spots, or region of visited tour spots
      if (userSpots.length > 1) {
        const userBounds = L.latLngBounds(userSpots.map(p => [p.latitude, p.longitude]));
        if (userBounds.isValid()) {
          map.fitBounds(userBounds, { padding: [60, 60], maxZoom: 12 });
        }
      } else if (userSpots.length === 1) {
        map.setView([userSpots[0].latitude, userSpots[0].longitude], 12);
      } else if (points.length >= 2) {
        const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
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
      <div className="absolute bottom-2.5 left-2.5 z-30 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-[10px] font-bold flex items-center gap-3.5 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-[#1D4ED8] border-2 border-white shadow-xs inline-block" />
          <span className="text-[#0B1B48] font-black">Aapka Spot (Blue)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] border-2 border-white shadow-xs inline-block" />
          <span className="text-slate-700 font-bold">Other Spots (Red)</span>
        </div>
      </div>

      {/* Cute Bakasur Mascot Peek (Bottom-Right) */}
      <div className="absolute bottom-1 right-2 z-30 pointer-events-none opacity-90 hidden xs:block">
        <img
          src={withBasePath('/images/food_tour/shukriya_map_photo.png')}
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
