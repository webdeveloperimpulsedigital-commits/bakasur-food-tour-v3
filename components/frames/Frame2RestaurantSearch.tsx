'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, MapPin, X, Check } from 'lucide-react';
import { Restaurant } from '@/lib/db';

interface Frame2RestaurantSearchProps {
  selectedCity: string;
  selectedRestaurant: Restaurant | null;
  userCoords?: { lat: number; lng: number } | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onNext: () => void;
  onBack: () => void;
}

// Fallback spots for top cities if search is empty
const CITY_FALLBACK_SPOTS: Record<string, Restaurant[]> = {
  mumbai: [
    {
      id: 10,
      name: 'Gurukripa, Sion',
      description: 'Legendary for Samosa, Chole Bhature & Dahi Samosa',
      address: 'Road No. 24, Near Sion Station, Mumbai',
      area: 'Sion',
      city: 'Mumbai',
      latitude: 19.039,
      longitude: 72.8619,
      rating: 4.9,
      image: '/images/eating/samosa_flying.png',
      is_campaign_active: 1,
      total_visits: 2100,
      status: 'active'
    },
    {
      id: 3,
      name: 'Gajanan Vadapav, Thane',
      description: 'Famous for special yellow chutney & crisp kothimbir vadi',
      address: 'Chhatrapati Shivaji Path, Thane West',
      area: 'Thane',
      city: 'Mumbai',
      latitude: 19.1972,
      longitude: 72.9722,
      rating: 5.0,
      image: '/images/eating/pav_bhaji.jpg',
      is_campaign_active: 1,
      total_visits: 1850,
      status: 'active'
    },
    {
      id: 11,
      name: 'Mamledar Misal, Thane',
      description: 'Thane iconic fiery cut rassa misal pav',
      address: 'Zilla Parishad, Thane West',
      area: 'Thane',
      city: 'Mumbai',
      latitude: 19.186,
      longitude: 72.975,
      rating: 4.9,
      image: '/images/eating/misal.jpg',
      is_campaign_active: 1,
      total_visits: 1650,
      status: 'active'
    }
  ],
  pune: [
    {
      id: 1,
      name: 'Vaishali Restaurant, FC Road',
      description: 'Iconic college hangout famous for SPDP, Filter Coffee & Dosa',
      address: 'FC Road, Deccan Gymkhana, Pune',
      area: 'FC Road',
      city: 'Pune',
      latitude: 18.5196,
      longitude: 73.841,
      rating: 4.8,
      image: '/images/eating/dosa.jpg',
      is_campaign_active: 1,
      total_visits: 1240,
      status: 'active'
    },
    {
      id: 2,
      name: 'Cafe Goodluck, Deccan',
      description: '1935 heritage cafe legendary for Bun Maska, Chai & Keema Pav',
      address: 'Fergusson College Road, Deccan Gymkhana, Pune',
      area: 'Deccan Gymkhana',
      city: 'Pune',
      latitude: 18.5173,
      longitude: 73.8415,
      rating: 4.7,
      image: '/images/eating/keema_pav.jpg',
      is_campaign_active: 1,
      total_visits: 980,
      status: 'active'
    },
    {
      id: 12,
      name: 'Katakirr Misal, Karve Road',
      description: 'Pune’s most fiery tarri misal with unlimited rassa',
      address: 'Near Cummins College, Karve Road, Pune',
      area: 'Karve Nagar',
      city: 'Pune',
      latitude: 18.4891,
      longitude: 73.8184,
      rating: 4.9,
      image: '/images/eating/misal.jpg',
      is_campaign_active: 1,
      total_visits: 1120,
      status: 'active'
    }
  ]
};

function getCityFallbacks(cityName: string): Restaurant[] {
  const lower = (cityName || '').toLowerCase();
  if (lower.includes('mumbai') || lower.includes('bombay') || lower.includes('thane') || lower.includes('sion')) {
    return CITY_FALLBACK_SPOTS.mumbai;
  }
  return CITY_FALLBACK_SPOTS.pune;
}

export const Frame2RestaurantSearch: React.FC<Frame2RestaurantSearchProps> = ({
  selectedCity,
  selectedRestaurant,
  onSelectRestaurant,
  onNext
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return selectedRestaurant ? selectedRestaurant.name : '';
  });
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Popular spots fallback list for the selected city
  const popularSpots = useMemo(() => {
    return getCityFallbacks(selectedCity || 'Pune');
  }, [selectedCity]);

  // Show dropdown with popular spots when user focuses on search box
  const handleFocus = () => {
    setShowDropdown(true);
    if (!searchQuery.trim()) {
      setSearchResults(popularSpots);
    }
  };

  // Sync searchQuery if selectedRestaurant is explicitly updated
  useEffect(() => {
    if (selectedRestaurant) {
      setSearchQuery(
        selectedRestaurant.name +
          (selectedRestaurant.area && !selectedRestaurant.name.includes(selectedRestaurant.area)
            ? `, ${selectedRestaurant.area}`
            : '')
      );
    } else {
      setSearchQuery('');
    }
  }, [selectedRestaurant]);

  // Search autocomplete query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(popularSpots);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/restaurants/search?q=${encodeURIComponent(searchQuery.trim())}&city=${encodeURIComponent(selectedCity || 'Pune')}`
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSearchResults(json.data.slice(0, 6));
        } else {
          const q = searchQuery.toLowerCase();
          const filtered = popularSpots.filter(
            (s: Restaurant) => s.name.toLowerCase().includes(q) || (s.area && s.area.toLowerCase().includes(q))
          );
          setSearchResults(filtered.length > 0 ? filtered : popularSpots);
        }
      } catch {
        const q = searchQuery.toLowerCase();
        const filtered = popularSpots.filter(
          (s: Restaurant) => s.name.toLowerCase().includes(q) || (s.area && s.area.toLowerCase().includes(q))
        );
        setSearchResults(filtered.length > 0 ? filtered : popularSpots);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, popularSpots]);

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
      spot.name + (spot.area && !spot.name.includes(spot.area) ? `, ${spot.area}` : '')
    );
    setShowDropdown(false);
  };

  const handleConfirm = () => {
    const query = searchQuery.trim();
    if (!selectedRestaurant && query) {
      onSelectRestaurant({
        id: Math.floor(Math.random() * 80000) + 10000,
        name: query,
        description: 'Selected restaurant',
        address: `${query}, ${selectedCity || 'Pune'}`,
        area: selectedCity || 'Pune',
        city: selectedCity || 'Pune',
        latitude: 18.5204,
        longitude: 73.8407,
        rating: 4.8,
        image: '/images/eating/pav_bhaji.jpg',
        is_campaign_active: 1,
        total_visits: 100,
        status: 'active'
      });
    } else if (selectedRestaurant && query && selectedRestaurant.name !== query && !query.startsWith(selectedRestaurant.name)) {
      onSelectRestaurant({
        ...selectedRestaurant,
        name: query
      });
    }
    onNext();
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-start text-left animate-in fade-in duration-300 py-3 sm:py-6 px-4 sm:px-8 gap-2 sm:gap-4 bg-white overflow-y-auto scrollbar-none">
      {/* 1. Main Headline & Subtitle */}
      <div className="space-y-0.5 sm:space-y-1 text-left shrink-0">
        <h2 className="text-[20px] xs:text-[24px] sm:text-[32px] md:text-[40px] font-black text-[#0B1B48] leading-[1.08] tracking-tight">
          Apna favourite<br />restaurant batao.
        </h2>
        <p className="text-[11px] xs:text-xs sm:text-sm md:text-base font-semibold text-[#0B1B48] leading-tight">
          Jahan jaakar Bhookasur kahe: isi ke liye toh prakat hua tha.
        </p>
      </div>

      {/* 2. SEARCH BAR (Google Maps Search) */}
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
            placeholder="Restaurant ka naam search karo"
            className="w-full bg-transparent text-xs sm:text-base font-semibold text-slate-900 placeholder-[#64748B] focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowDropdown(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#0047BA] shrink-0 stroke-[2.5]" />
        </div>
        <div className="text-[10px] sm:text-xs text-[#64748B] font-medium mt-1 ml-1 text-left">
          Search powered by Google Maps
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-[105%] inset-x-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[180px] overflow-y-auto p-1 scrollbar-thin">
            {searchResults.map((spot) => {
              const isSelected = selectedRestaurant?.id === spot.id || (selectedRestaurant && selectedRestaurant.name === spot.name);
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => handleSelectSpot(spot)}
                  className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between gap-2 border-b border-slate-100 last:border-b-0 cursor-pointer ${
                    isSelected ? 'bg-blue-50 text-[#0B1B48]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#0047BA] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-black text-xs text-[#0B1B48] truncate">
                        {spot.name}{spot.area && !spot.name.includes(spot.area) ? `, ${spot.area}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{spot.description || spot.address}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0047BA] stroke-[3] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. PRIMARY CTA BUTTON: YEH WALA PAKKA */}
      <div className="w-full shrink-0">
        <button
          onClick={handleConfirm}
          disabled={!selectedRestaurant && !searchQuery.trim()}
          type="button"
          className="w-full py-3 sm:py-3.5 px-5 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
        >
          YEH WALA PAKKA
        </button>
      </div>
    </div>
  );
};
