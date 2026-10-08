'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Check, Search, Sparkles, X, Utensils } from 'lucide-react';
import { Restaurant, Dish } from '@/lib/db';
import { getDishVisualAssets, formatCleanDishName } from '@/lib/dishAssets';
import { generateLiveMenuForRestaurant } from '@/lib/liveMenu';

interface Frame3DishSelectionProps {
  restaurant: Restaurant;
  selectedDish: Dish | { name: string; id?: number; price?: number; image?: string; description?: string } | null;
  onSelectDish: (dish: Dish | { name: string; id?: number; price?: number; image?: string }) => void;
  onConfirmDish: (dishName?: string, dishImage?: string) => void;
  onManualEntry?: () => void;
  onBack?: () => void;
}

function getInitialDishes(restaurant: Restaurant): Dish[] {
  try {
    const live = generateLiveMenuForRestaurant(restaurant);
    if (live && live.length >= 3) {
      return live.slice(0, 4);
    }
  } catch (err) {
    console.warn('Initial dishes generation notice:', err);
  }
  const cleanName = restaurant.name.split(',')[0].trim();
  return [
    {
      id: restaurant.id * 100 + 1,
      restaurant_id: restaurant.id,
      name: `${cleanName} Special`,
      description: 'Signature specialty plate',
      price: 180,
      image: '/images/eating/pav_bhaji.jpg',
      rating: 5.0,
      popularity: 100,
      is_recommended: 1,
      status: 'active'
    },
    {
      id: restaurant.id * 100 + 2,
      restaurant_id: restaurant.id,
      name: 'Special Butter Biryani / Masala',
      description: 'Aromatic layered spices and rich buttery preparation',
      price: 160,
      image: '/images/eating/biryani.jpg',
      rating: 4.9,
      popularity: 98,
      is_recommended: 1,
      status: 'active'
    },
    {
      id: restaurant.id * 100 + 3,
      restaurant_id: restaurant.id,
      name: 'Crispy Snack & Chutney Platter',
      description: 'Hot crispy delight served with signature chutneys',
      price: 120,
      image: '/images/eating/samosa_flying.png',
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
  onConfirmDish
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
      setIsSearching(false);
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

  // Extract top best reviewed & recommended dishes
  const threeDishes: Dish[] = useMemo(() => {
    if (rawDishes.length === 0) {
      return getInitialDishes(restaurant);
    }

    // Sort by is_recommended first, then rating and popularity descending
    const sorted = [...rawDishes].sort((a, b) => {
      if ((b.is_recommended || 0) !== (a.is_recommended || 0)) {
        return (b.is_recommended || 0) - (a.is_recommended || 0);
      }
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(ratingDiff) > 0.05) return ratingDiff;
      return (b.popularity || 0) - (a.popularity || 0);
    });

    const topDishes = sorted.slice(0, 3);
    if (topDishes.length < 3) {
      const fallback = getInitialDishes(restaurant);
      for (const item of fallback) {
        if (topDishes.length >= 3) break;
        if (!topDishes.some(t => t.name.toLowerCase() === item.name.toLowerCase())) {
          topDishes.push(item);
        }
      }
    }
    return topDishes;
  }, [rawDishes, restaurant]);

  // Auto-select first dish by default if none selected
  useEffect(() => {
    if (threeDishes.length > 0 && !selectedDish && !customDishInput.trim()) {
      const first = threeDishes[0];
      const visual = getDishVisualAssets(first.name, first.image);
      onSelectDish({
        ...first,
        name: formatCleanDishName(first.name, restaurant.name),
        image: visual.plateImage
      });
    }
  }, [threeDishes, selectedDish, customDishInput, restaurant.name, onSelectDish]);

  const handleSelectPill = (dish: Dish) => {
    setCustomDishInput('');
    setSuggestions([]);
    setShowDropdown(false);
    const cleanName = formatCleanDishName(dish.name, restaurant.name);
    const visual = getDishVisualAssets(cleanName, dish.image);
    onSelectDish({
      ...dish,
      name: cleanName,
      image: visual.plateImage
    });
  };

  const handleSelectCustomTyped = (nameToSelect: string, explicitImg?: string) => {
    const trimmed = nameToSelect.trim();
    if (!trimmed) return;
    const visual = getDishVisualAssets(trimmed, explicitImg);
    onSelectDish({
      id: 9999,
      name: trimmed,
      price: 150,
      image: visual.plateImage,
      description: 'Selected favourite dish'
    });
    setCustomDishInput(trimmed);
    setShowDropdown(false);
  };

  const handleClearCustomInput = () => {
    setCustomDishInput('');
    setSuggestions([]);
    setShowDropdown(false);
    if (threeDishes.length > 0) {
      const first = threeDishes[0];
      const cleanName = formatCleanDishName(first.name, restaurant.name);
      const visual = getDishVisualAssets(cleanName, first.image);
      onSelectDish({
        ...first,
        name: cleanName,
        image: visual.plateImage
      });
    }
  };

  // Determine current active dish name and visual image
  const currentDishName = selectedDish?.name || customDishInput.trim() || threeDishes[0]?.name || 'Special Plate';
  const currentDishVisual = getDishVisualAssets(currentDishName, selectedDish?.image);

  const handleConfirm = () => {
    const finalName = currentDishName;
    const finalImg = selectedDish?.image || currentDishVisual.plateImage;
    onConfirmDish(finalName, finalImg);
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col justify-start items-start text-left animate-in fade-in duration-300 p-3.5 sm:p-5 gap-3 bg-white overflow-y-auto scrollbar-thin relative pb-10 sm:pb-14">
      {/* 1. Headline & Subtitle */}
      <div className="space-y-0.5 text-left shrink-0">
        <h2 className="text-[20px] xs:text-[22px] sm:text-[28px] font-black text-[#0B1B48] leading-[1.12] tracking-tight">
          Restaurant mil gaya.<br />Ab plate decide karo! 🍽️
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-[#0B1B48]/80 leading-tight">
          {restaurant.name} ki famous dishes me se chuno ya apni manpasand dish search karo.
        </p>
      </div>

      {/* 2. Top 3 Signature Dish Cards */}
      <div className="shrink-0 w-full space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-[#0B1B48]">
          <span>🌟 Popular at {restaurant.name.split(',')[0]}</span>
          <span className="text-[10px] text-slate-500 font-normal">Tap to select</span>
        </div>

        {isLoading && rawDishes.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full animate-pulse">
            <div className="h-16 w-full bg-slate-200 rounded-xl" />
            <div className="h-16 w-full bg-slate-200 rounded-xl" />
            <div className="h-16 w-full bg-slate-200 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            {threeDishes.map((dish) => {
              const cleanDishName = formatCleanDishName(dish.name, restaurant.name);
              const isSelected = selectedDish?.name?.toLowerCase() === cleanDishName.toLowerCase() ||
                selectedDish?.name?.toLowerCase() === dish.name.toLowerCase();
              const visual = getDishVisualAssets(cleanDishName, dish.image);

              return (
                <button
                  key={`${dish.id}-${dish.name}`}
                  type="button"
                  onClick={() => handleSelectPill(dish)}
                  className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 cursor-pointer text-left shadow-xs border-2 ${
                    isSelected
                      ? 'bg-orange-50/90 border-[#D4380D] shadow-md shadow-[#D4380D]/15'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={visual.plateImage}
                      alt={cleanDishName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-300 shadow-2xs shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/eating/pav_bhaji.jpg';
                      }}
                    />
                    <div className="min-w-0">
                      <p className={`font-black text-xs leading-tight line-clamp-2 ${isSelected ? 'text-[#D4380D]' : 'text-[#0B1B48]'}`}>
                        {cleanDishName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        ₹{dish.price || 150}
                      </p>
                    </div>
                  </div>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-[#D4380D] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 shrink-0">
                      Choose
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Custom Dish Search Bar with Live Suggestions Dropdown */}
      <div ref={dropdownRef} className="relative w-full space-y-1 shrink-0 mt-1">
        <label className="text-xs font-bold text-[#0B1B48] flex items-center justify-between">
          <span>🔍 Aapki favourite kuch aur hai?</span>
          <span className="text-[10px] text-slate-400 font-normal">Search or type dish name</span>
        </label>

        <div className="relative flex items-center w-full px-3 py-2 rounded-xl bg-white border-2 border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/20 shadow-xs transition-all">
          <Utensils className="w-4 h-4 text-[#0047BA] shrink-0 mr-2" />
          <input
            type="text"
            value={customDishInput}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            onChange={(e) => {
              setCustomDishInput(e.target.value);
              setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (suggestions.length > 0) {
                  handleSelectCustomTyped(suggestions[0].name, suggestions[0].image);
                } else if (customDishInput.trim()) {
                  handleSelectCustomTyped(customDishInput.trim());
                }
              }
            }}
            placeholder="Search dish (e.g. Biryani, Butter Chicken, Dosa, Lollipop)"
            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-[#94A3B8] focus:outline-none"
          />

          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin shrink-0" />
            ) : customDishInput ? (
              <button
                type="button"
                onClick={handleClearCustomInput}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Search className="w-4 h-4 text-[#0047BA] stroke-[2.5]" />
            )}
          </div>
        </div>

        {/* Live Search Suggestions Dropdown */}
        {showDropdown && (
          <div className="absolute top-[105%] inset-x-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[220px] sm:max-h-[260px] overflow-y-auto p-1.5 scrollbar-thin">
            {/* Quick 1-Click Select for Typed Query */}
            {customDishInput.trim().length >= 2 && (
              <button
                type="button"
                onClick={() => handleSelectCustomTyped(customDishInput.trim())}
                className="w-full text-left p-2 rounded-lg bg-orange-50/80 hover:bg-orange-100/90 border border-orange-200 transition-all flex items-center justify-between gap-2 cursor-pointer mb-1 shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[#D4380D] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-xs text-[#0B1B48] truncate">
                      Select &ldquo;{customDishInput.trim()}&rdquo;
                    </p>
                    <p className="text-[10px] text-[#D4380D] font-semibold truncate">
                      Click to choose this dish
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#D4380D] bg-white px-2 py-0.5 rounded border border-orange-200 shrink-0">
                  Choose
                </span>
              </button>
            )}

            {/* Matching Dishes List */}
            {suggestions.map((dish) => {
              const visual = getDishVisualAssets(dish.name, dish.image);
              const cleanName = formatCleanDishName(dish.name, restaurant.name);
              const isSelected = selectedDish?.name === cleanName;

              return (
                <button
                  key={`${dish.id}-${dish.name}`}
                  type="button"
                  onClick={() => handleSelectCustomTyped(cleanName, visual.plateImage)}
                  className={`w-full px-2.5 py-2 text-left rounded-lg transition-colors flex items-center justify-between gap-2.5 cursor-pointer border-b border-slate-100 last:border-b-0 ${
                    isSelected ? 'bg-orange-50 text-[#D4380D]' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={visual.plateImage}
                      alt={dish.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/eating/pav_bhaji.jpg';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{cleanName}</div>
                      {dish.description && (
                        <div className="text-[10px] text-slate-500 truncate">{dish.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      ₹{dish.price || 150}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#D4380D] stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Active Selected Dish Banner */}
      <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 text-orange-950 shadow-xs shrink-0 animate-in fade-in duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={currentDishVisual.plateImage}
            alt={currentDishName}
            className="w-11 h-11 rounded-full object-cover border-2 border-orange-300 shadow-xs shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/eating/pav_bhaji.jpg';
            }}
          />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
              SELECTED DISH FOR BHOOKASUR
            </span>
            <p className="text-xs sm:text-sm font-black text-[#0B1B48] truncate">
              {currentDishName}
            </p>
          </div>
        </div>
        <span className="text-[10px] sm:text-[11px] font-black text-white bg-[#D4380D] px-2.5 py-1 rounded-lg shadow-xs shrink-0">
          READY ✓
        </span>
      </div>

      {/* 5. Primary CTA Button */}
      <div className="shrink-0 w-full pt-1">
        <button
          onClick={handleConfirm}
          type="button"
          className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-xs sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          YEH WALI KHILAO: {currentDishName} ➡️
        </button>
      </div>
    </div>
  );
};
