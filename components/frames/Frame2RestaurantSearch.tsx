'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Check, Sparkles, Navigation, Compass } from 'lucide-react';
import { Restaurant } from '@/lib/db';
import { parseRestaurantQuery } from '@/lib/locationParser';

interface Frame2RestaurantSearchProps {
  selectedCity: string;
  selectedRestaurant: Restaurant | null;
  userCoords?: { lat: number; lng: number } | null;
  isSecondRound?: boolean;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onNext: () => void;
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
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(userCoords || null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(!userCoords);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
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

  // 1. IP Location Detection & Live Nearby Restaurants Fetch
  useEffect(() => {
    let isCancelled = false;

    async function initLocationAndNearby() {
      let activeCoords = coords;

      // If coordinates not passed yet, fetch via IP location immediately
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
          }
        } catch (err) {
          console.warn('IP location fetch error:', err);
        } finally {
          if (!isCancelled) setIsDetectingLocation(false);
        }
      } else if (!locationLabel) {
        setLocationLabel(selectedCity || 'Your Location');
      }

      const effectiveLat = activeCoords?.lat || 18.5204;
      const effectiveLng = activeCoords?.lng || 73.8407;

      // Fetch LIVE nearby restaurants around detected IP coordinates (Zero local static fallback)
      setIsLoadingNearby(true);
      try {
        const res = await fetch(`/api/restaurants/search?city=${encodeURIComponent(selectedCity || 'Pune')}&lat=${effectiveLat}&lng=${effectiveLng}`);
        const data = await res.json();
        if (!isCancelled && data.success && Array.isArray(data.data)) {
          const limitedSpots = data.data.slice(0, 5);
          setNearbyRestaurants(limitedSpots);
          // If search query is currently empty, populate search results with strictly the 4-5 closest nearby spots
          setSearchResults((prev) => (!searchQuery.trim() ? limitedSpots : prev));
        }
      } catch (err) {
        console.warn('Nearby restaurants fetch notice:', err);
      } finally {
        if (!isCancelled) setIsLoadingNearby(false);
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

  // Sync searchQuery if selectedRestaurant is explicitly updated
  useEffect(() => {
    if (selectedRestaurant) {
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
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSearchResults(json.data.slice(0, 15));
        } else {
          // Provide instant custom restaurant for user's query with accurate locality & city
          const parsed = parseRestaurantQuery(q, selectedCity, coords);
          const customSpot: Restaurant = {
            id: 890000 + Math.floor(Math.random() * 1000),
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
            total_visits: 120,
            status: 'active'
          };
          setSearchResults([customSpot]);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          const parsed = parseRestaurantQuery(q, selectedCity, coords);
          const customSpot: Restaurant = {
            id: 890000 + Math.floor(Math.random() * 1000),
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
            total_visits: 120,
            status: 'active'
          };
          setSearchResults([customSpot]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 150);

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
    onSelectRestaurant(spot);
    setSearchQuery(
      spot.area && !spot.name.toLowerCase().includes(spot.area.toLowerCase())
        ? `${spot.name}, ${spot.area}`
        : spot.name
    );
    setShowDropdown(false);
  };

  const ensureRestaurantSelected = () => {
    const query = searchQuery.trim();
    let confirmed = selectedRestaurant;
    if (!confirmed && query) {
      confirmed = {
        id: Math.floor(Math.random() * 80000) + 10000,
        name: query,
        description: 'Selected restaurant',
        address: `${query}, ${selectedCity || 'Pune'}`,
        area: selectedCity || 'Pune',
        city: selectedCity || 'Pune',
        latitude: coords?.lat || 18.5204,
        longitude: coords?.lng || 73.8407,
        rating: 4.8,
        image: '/images/eating/pav_bhaji.jpg',
        is_campaign_active: 1,
        total_visits: 100,
        status: 'active'
      };
      onSelectRestaurant(confirmed);
    } else if (confirmed && query && confirmed.name !== query && !query.startsWith(confirmed.name)) {
      confirmed = {
        ...confirmed,
        name: query
      };
      onSelectRestaurant(confirmed);
    }
    return confirmed;
  };

  const handleConfirm = () => {
    ensureRestaurantSelected();
    onNext();
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col justify-start items-start text-left animate-in fade-in duration-300 py-3 sm:py-5 px-3.5 sm:px-8 gap-2.5 sm:gap-3 bg-white overflow-y-auto scrollbar-thin relative pb-10 sm:pb-14">
      {/* 1. Main Headline & Subtitle */}
      <div className="space-y-0.5 sm:space-y-1 text-left shrink-0 w-full">
        <h2 className="text-[20px] xs:text-[23px] sm:text-[30px] md:text-[36px] font-black text-[#0B1B48] leading-[1.1] tracking-tight">
          {isSecondRound ? (
            <>
              Trailer toh ho gaya,<br />
              ab <span className="text-[#D4380D]">picture</span> dikhao! 🎬
            </>
          ) : (
            <>
              Apna favourite<br />restaurant batao.
            </>
          )}
        </h2>
        <p className="text-[11px] xs:text-xs sm:text-sm font-semibold text-[#0B1B48]/80 leading-tight">
          {isSecondRound
            ? 'Ek aur shaandaar restaurant chuno jahan asli daawat shuru ho!'
            : 'Jahan jaakar Bhookasur kahe: isi ke liye toh prakat hua tha.'}
        </p>

        {/* IP Location Detected Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0047BA] text-[10px] sm:text-xs font-bold mt-1.5 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Navigation className="w-3 h-3 text-[#0047BA]" />
          <span>
            {isDetectingLocation
              ? 'Detecting current location via IP...'
              : `Aapki Live Location: ${locationLabel || selectedCity} (Auto-detected)`}
          </span>
        </div>
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
                      id: Math.floor(Math.random() * 80000) + 10000,
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

      {/* 2.5 DB FIRST VISITOR POPUP (Only shown if 0 prior visits exist) */}
      {firstVisitorInfo?.isFirstVisitor && (
        <div className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-xs animate-in fade-in duration-200 shrink-0">
          <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 text-xs shadow-xs">
            🎉
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-amber-900 leading-tight">
              Aap is place ke pehle visitor hain!
            </p>
          </div>
        </div>
      )}

      {/* 3. DEDICATED LIVE NEARBY RESTAURANTS LIST (Top 4 to 5 in Current Location Area) */}
      <div className="w-full flex-1 flex flex-col min-h-0 mt-0.5">
        <div className="flex items-center justify-between pb-1.5 shrink-0">
          <span className="text-[11px] sm:text-xs font-black text-[#0B1B48] flex items-center gap-1.5 uppercase tracking-wide">
            <Compass className="w-3.5 h-3.5 text-[#1D4ED8]" />
            Nearby In Your Area ({Math.min(5, nearbyRestaurants.length)} Closest Spots)
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Tap to choose
          </span>
        </div>

        {/* Scrollable list of 4-5 nearby places */}
        <div className="w-full flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin max-h-[190px] sm:max-h-[240px]">
          {isLoadingNearby ? (
            // Skeleton loaders while fetching live places from IP
            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 animate-pulse flex items-center justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-3/5" />
                    <div className="h-2.5 bg-slate-200 rounded w-2/5" />
                  </div>
                  <div className="h-6 w-14 bg-slate-200 rounded-lg shrink-0 ml-2" />
                </div>
              ))}
            </div>
          ) : nearbyRestaurants.slice(0, 5).length > 0 ? (
            nearbyRestaurants.slice(0, 5).map((spot, idx) => {
              const isSelected = selectedRestaurant?.id === spot.id || (selectedRestaurant && selectedRestaurant.name.toLowerCase() === spot.name.toLowerCase());

              return (
                <button
                  key={`nearby-${spot.id}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSpot(spot)}
                  className={`w-full text-left p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-blue-50 text-[#1D4ED8] border-blue-100'
                    }`}>
                      {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <MapPin className="w-4 h-4 fill-[#1D4ED8]" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-black text-xs sm:text-sm truncate ${isSelected ? 'text-emerald-950' : 'text-[#0B1B48]'}`}>
                        {spot.name}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                        <span className="text-[#1D4ED8] font-semibold">{spot.area || spot.city}</span>
                        {spot.distanceKm ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                              {spot.distanceKm} km away
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      ⭐ {spot.rating || 4.8}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-[#1D4ED8] group-hover:text-white'
                    }`}>
                      {isSelected ? 'CHOSEN' : 'CHOOSE'}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              Search box mein kisi bhi restaurant ya cafe ka naam type karein.
            </div>
          )}
        </div>
      </div>

      {/* 4. PRIMARY CTA BUTTON: YEH WALA PAKKA & (In Round 2) DEKHO BHOOKASUR NE KYA KYA KHAYA */}
      <div className="w-full shrink-0 mt-auto pt-2 flex flex-col gap-2">
        <button
          onClick={handleConfirm}
          disabled={!selectedRestaurant && !searchQuery.trim()}
          type="button"
          className="w-full py-3 sm:py-3.5 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
        >
          YEH WALA PAKKA
        </button>

        {isSecondRound && onWatchVideo && (
          <button
            onClick={onWatchVideo}
            type="button"
            className="w-full py-2.5 sm:py-3 px-5 rounded-xl bg-[#0B1B48] hover:bg-[#071333] active:bg-[#040c22] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
          >
            <span>DEKHO BHOOKASUR NE KYA KYA KHAYA 🎬</span>
          </button>
        )}
      </div>
    </div>
  );
};
