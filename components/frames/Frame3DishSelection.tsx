'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Check, Pencil } from 'lucide-react';
import { Restaurant, Dish } from '@/lib/db';
import { getDishVisualAssets } from '@/lib/dishAssets';

interface Frame3DishSelectionProps {
  restaurant: Restaurant;
  selectedDish: Dish | { name: string; id?: number; price?: number; image?: string; description?: string } | null;
  onSelectDish: (dish: Dish | { name: string; id?: number; price?: number; image?: string }) => void;
  onConfirmDish: () => void;
  onManualEntry?: () => void;
  onBack?: () => void;
}

// Fallback 3 iconic dishes for restaurants
function getFallbackThreeDishes(restaurant: Restaurant): Dish[] {
  const name = (restaurant.name || '').toLowerCase();
  if (name.includes('gurukripa')) {
    return [
      {
        id: 101,
        restaurant_id: restaurant.id,
        name: 'Samosa',
        description: 'Iconic crispy samosa with signature tamarind chutney',
        price: 45,
        image: '/images/eating/samosa_flying.png',
        rating: 5.0,
        popularity: 100,
        is_recommended: 1,
        status: 'active'
      },
      {
        id: 102,
        restaurant_id: restaurant.id,
        name: 'Chole Bhature',
        description: 'Fluffy golden bhaturas served with spicy Amritsari chole',
        price: 180,
        image: '/images/eating/chole_bhature.jpg',
        rating: 4.9,
        popularity: 98,
        is_recommended: 1,
        status: 'active'
      },
      {
        id: 103,
        restaurant_id: restaurant.id,
        name: 'Dahi Samosa',
        description: 'Crushed crisp samosa layered with sweetened curd & sev',
        price: 90,
        image: '/images/eating/samosa_flying.png',
        rating: 4.8,
        popularity: 97,
        is_recommended: 1,
        status: 'active'
      }
    ];
  }

  const cleanName = restaurant.name.split(',')[0].trim();
  return [
    {
      id: restaurant.id * 100 + 1,
      restaurant_id: restaurant.id,
      name: `${cleanName} Special`,
      description: 'Signature specialty plate',
      price: 160,
      image: '/images/eating/pav_bhaji.jpg',
      rating: 5.0,
      popularity: 100,
      is_recommended: 1,
      status: 'active'
    },
    {
      id: restaurant.id * 100 + 2,
      restaurant_id: restaurant.id,
      name: 'Butter Dosa / Pav',
      description: 'Crisp golden delight with fresh chutneys',
      price: 140,
      image: '/images/eating/dosa.jpg',
      rating: 4.9,
      popularity: 98,
      is_recommended: 1,
      status: 'active'
    },
    {
      id: restaurant.id * 100 + 3,
      restaurant_id: restaurant.id,
      name: 'Special Chaat Feast',
      description: 'Tangy and crunchy crowd favorite',
      price: 120,
      image: '/images/eating/spdp.jpg',
      rating: 4.8,
      popularity: 95,
      is_recommended: 1,
      status: 'active'
    }
  ];
}

export const Frame3DishSelection: React.FC<Frame3DishSelectionProps> = ({
  restaurant,
  selectedDish,
  onSelectDish,
  onConfirmDish,
  onManualEntry,
  onBack
}) => {
  const [rawDishes, setRawDishes] = useState<Dish[]>([]);
  const [customDishInput, setCustomDishInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [suggestions, setSuggestions] = useState<Dish[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch Live Menu from API for selected restaurant
  useEffect(() => {
    let isCancelled = false;
    async function loadDishes() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          name: restaurant.name || '',
          area: restaurant.area || '',
          city: restaurant.city || ''
        });
        const res = await fetch(`/api/restaurants/${restaurant.id}/dishes?${queryParams.toString()}`);
        const json = await res.json();
        if (!isCancelled && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setRawDishes(json.data);
        }
      } catch (err) {
        console.error('Failed to load dishes:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }
    loadDishes();
    return () => {
      isCancelled = true;
    };
  }, [restaurant]);

  // Live Ajax autocomplete debounced query
  useEffect(() => {
    const q = customDishInput.trim();
    if (!q) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams({
          q: q,
          name: restaurant.name || '',
          area: restaurant.area || '',
          city: restaurant.city || ''
        });
        const res = await fetch(`/api/restaurants/${restaurant.id}/dishes?${queryParams.toString()}`, {
          signal: controller.signal
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSuggestions(json.data);
          setShowDropdown(true);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [customDishInput, restaurant]);

  // Click outside listener to dismiss suggestions dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract strictly top 3 best reviewed & seller dishes
  const threeDishes: Dish[] = useMemo(() => {
    if (rawDishes.length === 0) {
      return getFallbackThreeDishes(restaurant);
    }

    // Sort by rating and popularity descending
    const sorted = [...rawDishes].sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(ratingDiff) > 0.05) return ratingDiff;
      return (b.popularity || 0) - (a.popularity || 0);
    });

    const topThree = sorted.slice(0, 3);
    if (topThree.length < 3) {
      const fallback = getFallbackThreeDishes(restaurant);
      for (const item of fallback) {
        if (topThree.length >= 3) break;
        if (!topThree.some(t => t.name.toLowerCase() === item.name.toLowerCase())) {
          topThree.push(item);
        }
      }
    }
    return topThree.slice(0, 3);
  }, [rawDishes, restaurant]);

  // Auto-select first dish by default
  useEffect(() => {
    if (threeDishes.length > 0 && !customDishInput.trim()) {
      const alreadyMatches = selectedDish && threeDishes.some(d => d.name === selectedDish.name);
      if (!alreadyMatches) {
        onSelectDish(threeDishes[0]);
      }
    }
  }, [threeDishes]);

  const handleSelectPill = (dish: Dish) => {
    setCustomDishInput('');
    setSuggestions([]);
    setShowDropdown(false);
    onSelectDish(dish);
  };

  const handleCustomInputChange = (val: string) => {
    setCustomDishInput(val);
    if (val.trim()) {
      const visual = getDishVisualAssets(val.trim());
      onSelectDish({
        name: val.trim(),
        id: 9999,
        price: 150,
        image: visual.plateImage
      });
    } else if (threeDishes.length > 0) {
      onSelectDish(threeDishes[0]);
    }
  };

  const handleSelectSuggestion = (dish: Dish) => {
    setCustomDishInput(dish.name);
    const visual = getDishVisualAssets(dish.name, dish.image);
    onSelectDish({
      ...dish,
      image: visual.plateImage
    });
    setShowDropdown(false);
  };

  const handleClearCustomInput = () => {
    setCustomDishInput('');
    setSuggestions([]);
    setShowDropdown(false);
    if (threeDishes.length > 0) {
      onSelectDish(threeDishes[0]);
    }
  };

  const isCustomActive = Boolean(customDishInput.trim());

  return (
    <div className="w-full h-full flex flex-col justify-start sm:justify-between items-start text-left animate-in fade-in duration-300 pt-2 pb-2 sm:py-4 px-4 sm:px-6 md:px-8 gap-2 sm:gap-2.5 bg-white overflow-y-auto scrollbar-thin">
      {/* 1. Headline & Subtitle (Matching Design Mockup) */}
      <div className="space-y-0.5 text-left shrink-0">
        <h2 className="text-[20px] xs:text-[22px] sm:text-[26px] md:text-[30px] font-black text-[#0B1B48] leading-[1.1] tracking-tight">
          Restaurant mil gaya.<br />Ab plate decide karo.
        </h2>
        <p className="text-[11px] sm:text-xs font-semibold text-[#0B1B48] leading-tight">
          Yeh jagah in dishes ke liye famous hai.
        </p>
      </div>

      {/* 2. Exactly THREE Stacked Menu Options (Matching Design Mockup) */}
      <div className="shrink-0 flex flex-col gap-1.5 sm:gap-2 w-full">
        {isLoading && rawDishes.length === 0 ? (
          <div className="flex flex-col gap-1.5 w-full animate-pulse">
            <div className="h-9 w-full bg-slate-200 rounded-xl" />
            <div className="h-9 w-full bg-slate-200 rounded-xl" />
            <div className="h-9 w-full bg-slate-200 rounded-xl" />
          </div>
        ) : (
          threeDishes.map((dish) => {
            const isSelected = !isCustomActive && selectedDish?.name === dish.name;
            return (
              <button
                key={dish.id || dish.name}
                type="button"
                onClick={() => handleSelectPill(dish)}
                className={`w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer shadow-xs ${isSelected
                    ? 'bg-[#D4380D] text-white shadow-md shadow-[#D4380D]/30 border border-[#D4380D]'
                    : 'bg-[#F0F4F8] hover:bg-slate-200 border border-slate-200/80 text-[#0B1B48]'
                  }`}
              >
                <span className="truncate text-left">{dish.name}</span>
                {isSelected && (
                  <Check className="w-4 h-4 stroke-[3] text-white shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* 4. Custom Dish Input with Live Ajax Suggestions Dropdown */}
      <div ref={dropdownRef} className="relative w-full space-y-1 shrink-0">
        <label className="text-[11px] sm:text-xs md:text-sm font-bold text-[#0B1B48] block text-left">
          Aapki favourite kuch aur hai?
        </label>

        <div className="relative flex items-center w-full px-3 py-2 sm:py-2.5 rounded-xl bg-white border-2 border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/20 shadow-xs transition-all">
          <input
            type="text"
            value={customDishInput}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            placeholder="Apni favourite dish likho"
            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-[#94A3B8] focus:outline-none"
          />

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {customDishInput ? (
              <button
                type="button"
                onClick={handleClearCustomInput}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Clear"
              >
                ✕
              </button>
            ) : null}
            <Pencil className="w-4 h-4 text-[#0047BA] shrink-0 stroke-[2.5]" />
          </div>
        </div>

        {/* Live Ajax Dropdown Suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] border-2 border-[#1D4ED8]/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-[#0047BA]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Menu Suggestions ({suggestions.length})
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Tap to select</span>
            </div>

            <div className="max-h-48 sm:max-h-56 overflow-y-auto divide-y divide-slate-100">
              {suggestions.slice(0, 10).map((dish) => {
                const visual = getDishVisualAssets(dish.name, dish.image);
                return (
                  <button
                    key={dish.id || dish.name}
                    type="button"
                    onClick={() => handleSelectSuggestion(dish)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50/80 active:bg-blue-100/80 transition-colors flex items-center justify-between gap-2.5 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={visual.plateImage}
                        alt={dish.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200/90 shadow-2xs shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/eating/momos_dish.jpg';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-[#0B1B48] group-hover:text-[#0047BA] truncate">
                          {dish.name}
                        </div>
                        {dish.description && (
                          <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                            {dish.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-black text-[11px] border border-emerald-200">
                        ₹{dish.price}
                      </span>
                      <span className="text-xs text-slate-400 group-hover:text-[#0047BA] font-bold">
                        →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Primary CTA: YEH WALI KHILAO (Matching Image 3) */}
      <div className="shrink-0 w-full pt-1">
        <button
          onClick={onConfirmDish}
          disabled={!selectedDish && !customDishInput.trim()}
          type="button"
          className="w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
        >
          YEH WALI KHILAO
        </button>
      </div>
    </div>
  );
};
