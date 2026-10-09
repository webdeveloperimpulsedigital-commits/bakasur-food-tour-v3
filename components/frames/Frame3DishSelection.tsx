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
      return live;
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
      description: 'Signature culinary specialty plate',
      price: 180,
      image: `/api/ai/dish-image?dish=${encodeURIComponent(cleanName + ' Special')}&restaurant=${encodeURIComponent(restaurant.name)}`,
      rating: 5.0,
      popularity: 100,
      is_recommended: 1,
      status: 'active'
    },
    {
      id: restaurant.id * 100 + 2,
      restaurant_id: restaurant.id,
      name: 'Special Platter',
      description: 'Authentic chef special preparation',
      price: 160,
      image: `/api/ai/dish-image?dish=${encodeURIComponent('Special Platter')}&restaurant=${encodeURIComponent(restaurant.name)}`,
      rating: 4.9,
      popularity: 98,
      is_recommended: 1,
      status: 'active'
    },
    {
      id: restaurant.id * 100 + 3,
      restaurant_id: restaurant.id,
      name: 'Crispy Snack Platter',
      description: 'Hot crispy delight served with signature chutneys',
      price: 120,
      image: `/api/ai/dish-image?dish=${encodeURIComponent('Crispy Snack Platter')}&restaurant=${encodeURIComponent(restaurant.name)}`,
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
          city: restaurant.city || '',
          is_veg: restaurant.is_veg ? '1' : '0'
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

  // Live in-restaurant dish search (Swiggy / Zomato style)
  useEffect(() => {
    const q = customDishInput.trim();
    if (!q) {
      setSuggestions([]);
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
          city: restaurant.city || '',
          is_veg: restaurant.is_veg ? '1' : '0'
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
    const list = rawDishes.length > 0 ? rawDishes : getInitialDishes(restaurant);

    // Sort strictly by best reviews: highest rating first, then popularity
    const sorted = [...list].sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(ratingDiff) > 0.01) return ratingDiff;
      if ((b.is_recommended || 0) !== (a.is_recommended || 0)) {
        return (b.is_recommended || 0) - (a.is_recommended || 0);
      }
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
    return topDishes.slice(0, 3);
  }, [rawDishes, restaurant]);

  // Dynamic restaurant-tailored placeholder
  const dynamicPlaceholder = useMemo(() => {
    const sampleDishes = threeDishes
      .map(d => formatCleanDishName(d.name, restaurant.name))
      .slice(0, 2)
      .join(', ');
    if (sampleDishes) {
      return `Search in ${restaurant.name} (e.g. ${sampleDishes})...`;
    }
    return `Search dishes in ${restaurant.name}...`;
  }, [threeDishes, restaurant.name]);

  // Auto-select first dish by default if none selected
  useEffect(() => {
    if (threeDishes.length > 0 && !selectedDish) {
      const first = threeDishes[0];
      const cleanDishName = formatCleanDishName(first.name, restaurant.name);
      const visual = getDishVisualAssets(first.name, first.image, restaurant.name);
      onSelectDish({
        ...first,
        name: cleanDishName,
        image: visual.plateImage
      });
    }
  }, [threeDishes, selectedDish, restaurant.name, onSelectDish]);

  const handleSelectPill = (dish: Dish) => {
    setCustomDishInput('');
    setShowDropdown(false);
    const cleanName = formatCleanDishName(dish.name, restaurant.name);
    const visual = getDishVisualAssets(cleanName, dish.image, restaurant.name);
    onSelectDish({
      ...dish,
      name: cleanName,
      image: visual.plateImage
    });
  };

  const handleCustomInputChange = (val: string) => {
    setCustomDishInput(val);
  };

  const handleSelectSuggestion = (dish: Dish) => {
    const cleanName = formatCleanDishName(dish.name, restaurant.name);
    setCustomDishInput('');
    const visual = getDishVisualAssets(cleanName, dish.image, restaurant.name);
    onSelectDish({
      ...dish,
      name: cleanName,
      image: visual.flyingImage || visual.plateImage
    });
    setShowDropdown(false);
  };

  const handleClearCustomInput = () => {
    setCustomDishInput('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Determine current active dish name and visual image
  const currentDishName = selectedDish?.name || customDishInput.trim() || threeDishes[0]?.name || 'Special Plate';
  const currentDishVisual = getDishVisualAssets(currentDishName, selectedDish?.image, restaurant.name);

  const handleConfirm = () => {
    const finalName = currentDishName;
    const finalImg = currentDishVisual.flyingImage || selectedDish?.image || currentDishVisual.plateImage;
    onConfirmDish(finalName, finalImg);
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col justify-start items-start text-left animate-in fade-in duration-300 p-3.5 sm:p-5 gap-3 bg-white overflow-y-auto scrollbar-thin relative pb-10 sm:pb-14">
      {/* 1. Headline & Subtitle */}
      <div className="space-y-1 text-left shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <Sparkles className="w-3 h-3 text-amber-600" /> AI GENERATED MENU
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            PURE FOOD PNG • ZERO BG
          </span>
        </div>
        <h2 className="text-[20px] xs:text-[22px] sm:text-[28px] font-black text-[#0B1B48] leading-[1.12] tracking-tight">
          Restaurant mil gaya.<br />Ab plate decide karo! 🍽️
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-[#0B1B48]/80 leading-tight">
          {restaurant.name} ki famous dishes me se chuno ya apni manpasand dish search karo.
        </p>
      </div>

      {/* 2. Top 3 Signature Dish Cards with Pure Food PNGs */}
      <div className="shrink-0 w-full">
        {isLoading && rawDishes.length === 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full animate-pulse">
            <div className="h-20 w-full bg-slate-200 rounded-xl" />
            <div className="h-20 w-full bg-slate-200 rounded-xl" />
            <div className="h-20 w-full bg-slate-200 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
            {threeDishes.map((dish) => {
              const cleanDishName = formatCleanDishName(dish.name, restaurant.name);
              const isSelected = selectedDish?.name?.toLowerCase() === cleanDishName.toLowerCase() ||
                selectedDish?.name?.toLowerCase() === dish.name.toLowerCase();

              return (
                <button
                  key={`${dish.id}-${dish.name}`}
                  type="button"
                  onClick={() => handleSelectPill(dish)}
                  className={`w-full py-2 px-1.5 sm:py-2.5 sm:px-2 rounded-xl transition-all flex flex-col items-center justify-center text-center relative cursor-pointer shadow-xs border-2 min-h-[74px] sm:min-h-[82px] ${
                    isSelected
                      ? 'bg-orange-50 border-[#D4380D] text-[#D4380D] shadow-md shadow-[#D4380D]/15 scale-[1.02]'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90 text-[#0B1B48]'
                  }`}
                >
                  {/* Floating Checkmark for Selected State */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#D4380D] text-white flex items-center justify-center shadow-xs z-10">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Pure Food PNG Image (Zero background) */}
                  <div className="w-9 h-9 sm:w-11 sm:h-11 mb-1 flex items-center justify-center shrink-0">
                    <img
                      src={dish.image || getDishVisualAssets(cleanDishName).flyingImage}
                      alt={cleanDishName}
                      className="w-full h-full object-contain filter drop-shadow-sm pointer-events-none"
                    />
                  </div>

                  <span className={`font-black text-[11px] sm:text-xs leading-tight line-clamp-2 ${
                    isSelected ? 'text-[#D4380D]' : 'text-[#0B1B48]'
                  }`}>
                    {cleanDishName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. In-Restaurant Menu Search Bar with Live Suggestions Dropdown (Swiggy / Zomato style) */}
      <div ref={dropdownRef} className="relative w-full space-y-1 shrink-0 mt-1">
        <label className="text-xs font-bold text-[#0B1B48] flex items-center justify-between">
          <span>🔍 {restaurant.name} Menu Search</span>
          <span className="text-[10px] text-slate-400 font-normal">Swiggy &amp; Zomato Catalog</span>
        </label>

        <div className="relative flex items-center w-full px-3 py-2 rounded-xl bg-white border-2 border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/20 shadow-xs transition-all">
          <Utensils className="w-4 h-4 text-[#0047BA] shrink-0 mr-2" />
          <input
            type="text"
            value={customDishInput}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              handleCustomInputChange(e.target.value);
              setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (suggestions.length > 0) {
                  handleSelectSuggestion(suggestions[0]);
                } else if (rawDishes.length > 0) {
                  handleSelectSuggestion(rawDishes[0]);
                }
              }
            }}
            placeholder={dynamicPlaceholder}
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
          <div className="absolute top-[105%] inset-x-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[240px] sm:max-h-[280px] overflow-y-auto p-1.5 scrollbar-thin">
            {/* Header info */}
            <div className="px-2.5 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
              <span>{customDishInput.trim() ? `Search Results in ${restaurant.name}` : `${restaurant.name} Menu`}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">100% Authentic Food</span>
            </div>

            {/* If user searched and no results were found in this restaurant */}
            {customDishInput.trim().length > 0 && suggestions.length === 0 && !isSearching && (
              <div className="p-3 text-center space-y-1.5">
                <p className="text-xs font-bold text-slate-700">
                  No dishes matching &ldquo;{customDishInput.trim()}&rdquo; on {restaurant.name}&rsquo;s menu.
                </p>
                <p className="text-[11px] text-slate-500">
                  Select from {restaurant.name}&rsquo;s available signature dishes:
                </p>
                <div className="pt-1 space-y-1">
                  {(rawDishes.length > 0 ? rawDishes.slice(0, 5) : threeDishes).map((dish) => {
                    const visual = getDishVisualAssets(dish.name, dish.image, restaurant.name);
                    const cleanName = formatCleanDishName(dish.name, restaurant.name);
                    return (
                      <button
                        key={`fallback-${dish.id}-${dish.name}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(dish)}
                        className="w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50 text-slate-800 border border-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={dish.image || visual.flyingImage}
                            alt={cleanName}
                            className="w-7 h-7 rounded-full object-contain p-0.5 bg-slate-50 border border-slate-200 shrink-0"
                          />
                          <span className="text-xs font-bold truncate">{cleanName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#D4380D] bg-orange-50 px-2 py-0.5 rounded border border-orange-200 shrink-0">
                          Choose
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of matching or catalog dishes strictly from this restaurant */}
            {(customDishInput.trim().length > 0 ? suggestions : (rawDishes.length > 0 ? rawDishes : threeDishes)).map((dish) => {
              const visual = getDishVisualAssets(dish.name, dish.image, restaurant.name);
              const cleanName = formatCleanDishName(dish.name, restaurant.name);
              const isSelected = selectedDish?.name === cleanName;

              return (
                <button
                  key={`${dish.id}-${dish.name}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(dish)}
                  className={`w-full px-2.5 py-2 text-left rounded-lg transition-colors flex items-center justify-between gap-2.5 cursor-pointer border-b border-slate-100 last:border-b-0 ${
                    isSelected ? 'bg-orange-50 text-[#D4380D]' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={dish.image || visual.flyingImage || visual.plateImage}
                      alt={dish.name}
                      className="w-8 h-8 rounded-full object-contain p-0.5 bg-slate-50 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{cleanName}</div>
                      {dish.description && (
                        <div className="text-[10px] text-slate-500 truncate">{dish.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#D4380D] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-[#D4380D] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                        Choose
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Primary CTA Button */}
      <div className="shrink-0 w-full pt-1">
        <button
          onClick={handleConfirm}
          type="button"
          className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          YEH WALA PAKKA
        </button>
      </div>
    </div>
  );
};
