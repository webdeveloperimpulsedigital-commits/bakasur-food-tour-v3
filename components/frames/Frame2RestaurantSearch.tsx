'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Check, Sparkles, Navigation, Compass } from 'lucide-react';
import type { Restaurant } from '@/lib/db';
import { isPureVegRestaurantName } from '@/lib/dishAssets';
<<<<<<< HEAD
=======
import { parseRestaurantQuery, getDeterministicPlaceId } from '@/lib/locationParser';
>>>>>>> cee22f710f7c95f4dc6db8e1cf3ff482005084b3

interface Frame2RestaurantSearchProps {
  selectedCity: string;
  selectedRestaurant: Restaurant | null;
  userCoords?: { lat: number; lng: number } | null;
  isSecondRound?: boolean;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onNext: (restaurant?: Restaurant) => void;
  onBack: () => void;
  onWatchVideo?: () => void;
}

export const Frame2RestaurantSearch: React.FC<Frame2RestaurantSearchProps> = ({
  selectedCity,
  selectedRestaurant,
  userCoords,
  isSecondRound = false,
  onSelectRestaurant,
  onNext,
  onWatchVideo
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return selectedRestaurant ? selectedRestaurant.name : '';
  });
  const [chosenSpot, setChosenSpot] = useState<Restaurant | null>(selectedRestaurant);
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(userCoords || null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(!userCoords);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchMessage, setSearchMessage] = useState<string>('');
  const [spellingSuggestion, setSpellingSuggestion] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [firstVisitorInfo, setFirstVisitorInfo] = useState<{
    checked: boolean;
    isFirstVisitor: boolean;
    visitCount: number;
    restaurantName: string;
  } | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync coords if prop updates
  useEffect(() => {
    if (userCoords && (!coords || userCoords.lat !== coords.lat || userCoords.lng !== coords.lng)) {
      setCoords(userCoords);
    }
  }, [userCoords]);

  // Direct geolocation detection on Frame 2 if coords not passed yet
  useEffect(() => {
    if (!coords && !userCoords && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => {},
            { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
          );
        },
        { timeout: 5000, enableHighAccuracy: true, maximumAge: 30000 }
      );
    }
  }, [coords, userCoords]);

  // 1. IP Location Detection & Live Nearby Restaurants Fetch
  useEffect(() => {
    let isCancelled = false;

    async function initLocationAndNearby() {
      let activeCoords = coords;

      const fetchNearby = async (latToUse: number, lngToUse: number) => {
        setIsLoadingNearby(true);
        try {
          const res = await fetch(`/api/restaurants/search?city=${encodeURIComponent(selectedCity || 'Pune')}&lat=${latToUse}&lng=${lngToUse}`);
          const data = await res.json();
          if (!isCancelled && data.success && Array.isArray(data.data)) {
            const limitedSpots = data.data.slice(0, 5);
            setNearbyRestaurants(limitedSpots);
            setSearchResults((prev) => (!searchQuery.trim() ? limitedSpots : prev));
          }
        } catch (err) {
          console.warn('Nearby restaurants fetch notice:', err);
        } finally {
          if (!isCancelled) setIsLoadingNearby(false);
        }
      };

      // 1. Fire nearby restaurants fetch immediately using available or default coordinates
      const initialLat = activeCoords?.lat || 18.5204;
      const initialLng = activeCoords?.lng || 73.8407;
      fetchNearby(initialLat, initialLng);

      // 2. Concurrently resolve IP location if active coordinates are not yet set
      if (!activeCoords) {
        setIsDetectingLocation(true);
        try {
          const locRes = await fetch('/api/location');
          const locData = await locRes.json();
          if (!isCancelled && locData.success) {
            const detected = locData.userCoords || { lat: 18.5204, lng: 73.8407 };
            activeCoords = detected;
            setCoords(detected);
            const label = locData.locationDisplay || (locData.detectedCity?.name ? `${locData.detectedCity.name}` : selectedCity);
            setLocationLabel(label);
            // Refresh nearby if detected coordinates significantly differ from initial
            if (Math.abs(detected.lat - initialLat) > 0.1 || Math.abs(detected.lng - initialLng) > 0.1) {
              fetchNearby(detected.lat, detected.lng);
            }
          }
        } catch (err) {
          console.warn('IP location fetch error:', err);
        } finally {
          if (!isCancelled) setIsDetectingLocation(false);
        }
      } else if (!locationLabel) {
        setLocationLabel(selectedCity || 'Your Location');
      }
    }

    initLocationAndNearby();

    return () => {
      isCancelled = true;
    };
  }, [coords?.lat, coords?.lng, selectedCity]);

  // Show dropdown with strictly 4-5 live nearby spots when user focuses on search box
  const handleFocus = () => {
    setShowDropdown(true);
    if (!searchQuery.trim() && nearbyRestaurants.length > 0) {
      setSearchResults(nearbyRestaurants.slice(0, 5));
    }
  };

  // Reset selectedIndex on new search results
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  // Sync searchQuery & chosenSpot if selectedRestaurant is explicitly updated
  useEffect(() => {
    if (selectedRestaurant) {
      setChosenSpot(selectedRestaurant);
      setSearchQuery(
        selectedRestaurant.name +
        (selectedRestaurant.area && !selectedRestaurant.name.includes(selectedRestaurant.area)
          ? `, ${selectedRestaurant.area}`
          : '')
      );
    }
  }, [selectedRestaurant]);

  // Check in DB if user is the first visitor for the searched/selected restaurant
  useEffect(() => {
    const candidateName = selectedRestaurant?.name || searchQuery.trim();
    if (!candidateName || candidateName.length < 3) {
      setFirstVisitorInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const idParam = selectedRestaurant?.id ? `&id=${selectedRestaurant.id}` : '';
        const res = await fetch(`/api/restaurants/check-visits?name=${encodeURIComponent(candidateName)}${idParam}`);
        const data = await res.json();
        if (data.success) {
          setFirstVisitorInfo({
            checked: true,
            isFirstVisitor: Boolean(data.isFirstVisitor),
            visitCount: Number(data.visitCount || 0),
            restaurantName: candidateName
          });
        }
      } catch (err) {
        console.warn('Error checking restaurant visits:', err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [selectedRestaurant, searchQuery]);

  // Live Search autocomplete query with fast AbortController & live distance
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(nearbyRestaurants.slice(0, 5));
      setSpellingSuggestion(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const latParam = coords?.lat ? `&lat=${coords.lat}` : '';
        const lngParam = coords?.lng ? `&lng=${coords.lng}` : '';
        const res = await fetch(
          `/api/restaurants/search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(selectedCity || 'Pune')}${latParam}${lngParam}`,
          { signal: controller.signal }
        );
        const json = await res.json();
        const verifiedList = json.success && Array.isArray(json.data) ? json.data.slice(0, 15) : [];
        setSearchResults(verifiedList);
        setSpellingSuggestion(json.spellingSuggestion || null);
        setSearchMessage(verifiedList.length === 0 ? String(json.message || '') : '');
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          setSearchResults([]);
          setSpellingSuggestion(null);
          setSearchMessage('');
        }
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedCity, nearbyRestaurants, coords]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSpot = (spot: Restaurant) => {
    setChosenSpot(spot);
    onSelectRestaurant(spot);
    setSearchQuery(
      spot.area && !spot.name.toLowerCase().includes(spot.area.toLowerCase())
        ? `${spot.name}, ${spot.area}`
        : spot.name
    );
    setShowDropdown(false);

    // Live menu background prefetch so Frame 3 opens instantaneously
    try {
      const isStrictVeg = isPureVegRestaurantName(spot.name) || spot.is_veg === 1;
      const params = new URLSearchParams({
        name: spot.name || '',
        area: spot.area || '',
        city: spot.city || '',
        is_veg: isStrictVeg ? '1' : (spot.is_veg ? '1' : '0')
      });
      if (spot.latitude) params.set('lat', String(spot.latitude));
      if (spot.longitude) params.set('lng', String(spot.longitude));
      fetch(`/api/restaurants/${spot.id}/dishes?${params.toString()}`).catch(() => {});
    } catch {
      // background prefetch failure can be safely ignored
    }
  };

  // Find a verified restaurant in the current results that matches the typed text with typo & phonetic tolerance
  const normalizeSearchKey = (s: string) => {
    return s
      .toLowerCase()
      .replace(/ph/g, 'f')
      .replace(/w/g, 'v')
      .replace(/dinning/g, 'dining')
      .replace(/restaurant|hotel|cafe|dhaba/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const findVerifiedMatch = (text: string): Restaurant | undefined => {
    const q = text.trim();
    if (!q || searchResults.length === 0) return undefined;
    const qLower = q.toLowerCase();
    const qNorm = normalizeSearchKey(q);

    // 1. Direct exact or substring match
    const exact = searchResults.find(r => {
      const rLower = r.name.toLowerCase();
      return (
        rLower === qLower ||
        rLower.includes(qLower) ||
        qLower.includes(rLower) ||
        (r.area && `${rLower}, ${r.area.toLowerCase()}` === qLower)
      );
    });
    if (exact) return exact;

    // 2. Normalized phonetic / spelling match
    if (qNorm.length >= 3) {
      const phoneticMatch = searchResults.find(r => {
        const rNorm = normalizeSearchKey(r.name);
        return rNorm === qNorm || rNorm.includes(qNorm) || qNorm.includes(rNorm);
      });
      if (phoneticMatch) return phoneticMatch;
    }

    // 3. Fallback to top verified fuzzy result if user typed 3+ chars
    if (searchResults.length > 0 && q.length >= 3) {
      return searchResults[0];
    }

    return undefined;
  };

  const getDeterministicPlaceId = (name: string, city: string = '', area: string = ''): number => {
    const str = `${name.toLowerCase().trim()}_${city.toLowerCase().trim()}_${area.toLowerCase().trim()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return 900000 + (Math.abs(hash) % 90000);
  };

  const createCustomRestaurant = (name: string): Restaurant => {
    const locArea = locationLabel || selectedCity || 'Local';
    const cleanTitle = name
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    const isVeg = isPureVegRestaurantName(cleanTitle) ? 1 : 0;
    const city = selectedCity || 'Local';
    const id = getDeterministicPlaceId(cleanTitle, city, locArea);
    return {
      id,
      name: cleanTitle,
      address: `${locArea}`,
      area: locArea,
      city: selectedCity || 'Local',
      latitude: coords?.lat || 18.5204,
      longitude: coords?.lng || 73.8567,
      rating: 4.8,
      image: '/images/default-restaurant.jpg',
      description: `Authentic food spot in ${locArea}`,
      is_campaign_active: 1,
      total_visits: 1200,
      status: 'active',
      is_veg: isVeg,
      is_verified: 1,
      verification_source: 'google',
      cuisine_tags: isVeg ? ['Pure Veg', 'Street Food'] : ['Authentic Dining', 'Street Food']
    } as Restaurant;
  };

  const ensureRestaurantSelected = () => {
    const query = searchQuery.trim();
    if (!query) {
      return chosenSpot || selectedRestaurant;
    }

    const qLower = query.toLowerCase();

    // 1. If user already picked a spot and the query is for that spot
    if (chosenSpot) {
      const cNameLower = chosenSpot.name.toLowerCase();
      if (
        cNameLower === qLower ||
        qLower.startsWith(cNameLower) ||
        cNameLower.startsWith(qLower) ||
        (chosenSpot.area && `${cNameLower}, ${chosenSpot.area.toLowerCase()}` === qLower)
      ) {
        return chosenSpot;
      }
    }

    // 2. Check if query matches any item in live searchResults
    const searchMatch = findVerifiedMatch(query);
    if (searchMatch) {
      setChosenSpot(searchMatch);
      onSelectRestaurant(searchMatch);
      return searchMatch;
    }

    // 3. Fallback to top result from live search if available
    if (searchResults.length > 0) {
      const top = searchResults[0];
      setChosenSpot(top);
      onSelectRestaurant(top);
      return top;
    }

    // 4. Zero-failure fallback: Allow ANY custom restaurant or street food joint the user searched
    if (query.length >= 2) {
      const custom = createCustomRestaurant(query);
      setChosenSpot(custom);
      onSelectRestaurant(custom);
      return custom;
    }

    return null;
  };

  const handleConfirm = () => {
    const confirmed = ensureRestaurantSelected();
    if (!confirmed) {
      // Keep the user on this step and show the verified options instead
      setShowDropdown(true);
      return;
    }
    onNext(confirmed);
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col justify-start items-start text-left animate-in fade-in duration-300 py-3 sm:py-5 px-3.5 sm:px-8 gap-2.5 sm:gap-3 bg-white overflow-y-auto scrollbar-thin relative pb-10 sm:pb-14">
      {/* 1. Main Headline & Subtitle */}
      <div className="space-y-0.5 sm:space-y-1 text-left shrink-0 w-full">
        <h2 className="text-[20px] xs:text-[23px] sm:text-[30px] md:text-[36px] font-black text-[#0B1B48] leading-[1.1] tracking-tight">
          {isSecondRound ? (
            <>
              Foodie ho.<br />
              Sirf ek favourite food stop thodi hoga.
            </>
          ) : (
            <>
              Apna favourite<br />food stop batavo.
            </>
          )}
        </h2>
        {!isSecondRound && (
          <p className="text-[11px] xs:text-xs sm:text-sm md:text-base font-semibold text-[#0B1B48] leading-tight">
            Jahan jaakar Bhookasur kahe: isi ke liye toh prakat hua tha.
          </p>
        )}
      </div>

      {/* 2. SEARCH BAR (Live Real-Time Autocomplete Search) */}
      <div className="w-full relative shrink-0" ref={containerRef}>
        <div className="flex items-center w-full px-3.5 py-2.5 sm:py-3 rounded-xl bg-white border-2 border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/20 shadow-xs transition-all">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#0047BA] fill-[#0047BA] shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={handleFocus}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setShowDropdown(true);
                setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setShowDropdown(true);
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && searchResults[selectedIndex]) {
                  handleSelectSpot(searchResults[selectedIndex]);
                } else if (searchResults.length > 0) {
                  handleSelectSpot(searchResults[0]);
                } else if (searchQuery.trim()) {
                  ensureRestaurantSelected();
                }
              } else if (e.key === 'Escape') {
                setShowDropdown(false);
              }
            }}
            placeholder="Search any restaurant, cafe or dhaba..."
            className="w-full bg-transparent text-xs sm:text-base font-semibold text-slate-900 placeholder-[#64748B] focus:outline-none"
          />
          {isSearching ? (
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin shrink-0 mr-1.5" />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowDropdown(true);
                setFirstVisitorInfo(null);
                setSelectedIndex(-1);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#0047BA] shrink-0 stroke-[2.5]" />
        </div>

        <div className="text-[10px] sm:text-xs text-[#64748B] font-medium mt-1 ml-1 text-left flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Place & Dining Search
          </span>
          {searchQuery && <span className="text-[#0047BA] font-semibold">Press Enter to select</span>}
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {showDropdown && (
          <div className="absolute top-[105%] inset-x-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[260px] sm:max-h-[300px] overflow-y-auto p-1.5 scrollbar-thin">
            {/* Quick 1-Click Instant Selection for Typed Query */}
            {searchQuery.trim().length >= 2 && (() => {
              const parsed = parseRestaurantQuery(searchQuery, selectedCity, coords);
              return (
                <button
                  type="button"
                  onClick={() => {
                    const customSpot: Restaurant = {
                      id: getDeterministicPlaceId(parsed.cleanName, parsed.city, parsed.area),
                      name: parsed.cleanName,
                      description: `Popular dining spot in ${parsed.area}, ${parsed.city}`,
                      address: parsed.address,
                      area: parsed.area,
                      city: parsed.city,
                      latitude: parsed.latitude,
                      longitude: parsed.longitude,
                      rating: 4.8,
                      image: '/images/eating/pav_bhaji.jpg',
                      is_campaign_active: 1,
                      total_visits: 100,
                      status: 'active'
                    };
                    handleSelectSpot(customSpot);
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-between gap-2 cursor-pointer mb-1.5 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-xs sm:text-sm text-[#0B1B48] truncate">
                        Select &ldquo;{parsed.cleanName}&rdquo;
                      </p>
                      <p className="text-[11px] text-[#1D4ED8] font-bold truncate">
                        📍 {parsed.area}, {parsed.city}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#1D4ED8] bg-white px-2.5 py-1 rounded-md border border-blue-200 shrink-0">
                    Choose
                  </span>
                </button>
              );
            })()}

            {/* List of matching search results */}
            {searchResults.length > 0 ? (
              searchResults.map((spot, idx) => {
                const isSelected = selectedRestaurant?.id === spot.id || (selectedRestaurant && selectedRestaurant.name.toLowerCase() === spot.name.toLowerCase());
                const isHighlighted = idx === selectedIndex;

                return (
                  <button
                    key={`${spot.id}-${spot.name}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSpot(spot)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-2 sm:p-2.5 rounded-lg transition-all flex items-center justify-between gap-2.5 border-b border-slate-100 last:border-b-0 cursor-pointer ${
                      isHighlighted
                        ? 'bg-blue-100/70 border-blue-200 text-[#0B1B48]'
                        : isSelected
                          ? 'bg-blue-50 text-[#0B1B48]'
                          : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0 border border-blue-100">
                        <MapPin className="w-3.5 h-3.5 fill-[#1D4ED8]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-[#0B1B48] truncate">
                          {spot.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                          <span className="text-[#1D4ED8] font-semibold">{spot.area || spot.city}</span>
                          {spot.city && spot.area !== spot.city && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{spot.city}</span>
                            </>
                          )}
                          {spot.distanceKm ? (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-emerald-700 font-bold">{spot.distanceKm} km away</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        ⭐ {spot.rating || 4.8}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#0047BA] stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-500">
                {isSearching ? 'Searching live restaurants...' : 'Type name or select from nearby list'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2.2 SELECTED RESTAURANT CONFIRMATION BADGE */}
      {selectedRestaurant && (
        <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-xs animate-in fade-in duration-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-emerald-950 truncate">
                {selectedRestaurant.name}
              </p>
              <p className="text-[10px] sm:text-xs text-emerald-700 font-medium truncate">
                📍 {selectedRestaurant.area && selectedRestaurant.city && selectedRestaurant.area !== selectedRestaurant.city ? `${selectedRestaurant.area}, ${selectedRestaurant.city}` : selectedRestaurant.area || selectedRestaurant.city || 'Verified Spot'} • ⭐ {selectedRestaurant.rating || 4.8}
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 sm:py-1 rounded-lg border border-emerald-200 shrink-0">
            CHOSEN ✓
          </span>
        </div>
      )}

      {/* 3. PRIMARY CTA BUTTON: YEH WALA PAKKA */}
      <div className="w-full shrink-0 mt-auto pt-2 flex flex-col gap-2">
        <button
          onClick={handleConfirm}
          disabled={!selectedRestaurant && !searchQuery.trim()}
          type="button"
          className="w-full py-3 sm:py-3.5 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
        >
          YEH WALA PAKKA
        </button>
      </div>
    </div>
  );
};
