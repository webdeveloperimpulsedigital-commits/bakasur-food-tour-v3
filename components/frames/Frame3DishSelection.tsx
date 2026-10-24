'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Check, Search, Utensils, X, Sparkles, BookOpen } from 'lucide-react';
import type { Restaurant, Dish } from '@/lib/db';
import { getDishVisualAssets, formatCleanDishName, isDishVeg, isPureVegRestaurantName, isDishRelevantToSearch } from '@/lib/dishAssets';
import { selectTopRestaurantDishes } from '@/lib/dishRanking';
import { withBasePath } from '@/lib/basePath';

interface Frame3DishSelectionProps {
  restaurant: Restaurant;
  selectedDish: Dish | { name: string; id?: number; price?: number; image?: string; description?: string } | null;
  isSecondRound?: boolean;
  onSelectDish: (dish: Dish | { name: string; id?: number; price?: number; image?: string }) => void;
  onConfirmDish: (dishName?: string, dishImage?: string) => void;
  onBack?: () => void;
}

// Client-side menu cache to avoid redundant network round-trips
const clientMenuCache = new Map<string, Dish[]>();

export function clearClientMenuCache() {
  clientMenuCache.clear();
}

const DishThumbnail: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = 'w-full h-full' }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-full ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-100/60 rounded-full animate-pulse pointer-events-none">
          <Utensils className="w-3.5 h-3.5 text-orange-400/80" />
        </div>
      )}
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-contain filter drop-shadow-xs transition-opacity duration-200 pointer-events-none rounded-full ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-orange-50 rounded-full text-[#D4380D]">
          <Utensils className="w-3.5 h-3.5 stroke-[2.2]" />
        </div>
      )}
    </div>
  );
};

export const Frame3DishSelection: React.FC<Frame3DishSelectionProps> = ({
  restaurant,
  selectedDish,
  onSelectDish,
  onConfirmDish,
  onBack
}) => {
  const currentKey = `${restaurant.id}_${(restaurant.name || '').trim().toLowerCase()}`;
  const [rawDishes, setRawDishes] = useState<Dish[]>(() => {
    return clientMenuCache.get(currentKey) || [];
  });
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !clientMenuCache.has(currentKey);
  });
  const [loadingStatus, setLoadingStatus] = useState<string>('Fetching live menu...');
  const [loadError, setLoadError] = useState<string | null>(null);

  const activeRequestIdRef = useRef<number>(0);

  const loadDishes = useCallback(async () => {
    const currentReqId = ++activeRequestIdRef.current;
    const cacheKey = `${restaurant.id}_${(restaurant.name || '').trim().toLowerCase()}`;

    // If cached in memory, use it immediately (0ms)
    if (clientMenuCache.has(cacheKey)) {
      const cached = clientMenuCache.get(cacheKey)!;
      setRawDishes(cached);
      setIsLoading(false);
      setLoadError(cached.length === 0 ? 'Menu currently unavailable' : null);
      return;
    }

    setRawDishes([]);
    setMenuSearchQuery('');
    setIsLoading(true);
    setLoadError(null);
    setLoadingStatus('Connecting to verified live menu...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const statusTimer = setTimeout(() => {
      if (activeRequestIdRef.current === currentReqId) {
        setLoadingStatus(`Loading verified dishes for ${restaurant.name}...`);
      }
    }, 1200);

    try {
      const isStrictVeg = isPureVegRestaurantName(restaurant.name) || restaurant.is_veg === 1;
      const queryParams = new URLSearchParams({
        name: restaurant.name || '',
        area: restaurant.area || '',
        city: restaurant.city || '',
        is_veg: isStrictVeg ? '1' : (restaurant.is_veg ? '1' : '0')
      });
      if (restaurant.latitude) queryParams.set('lat', String(restaurant.latitude));
      if (restaurant.longitude) queryParams.set('lng', String(restaurant.longitude));

      const res = await fetch(withBasePath(`/api/restaurants/${restaurant.id}/dishes?${queryParams.toString()}`), {
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Menu service responded with ${res.status}`);
      }

      const json = await res.json();

      // Guard: strictly ignore stale responses from any previously selected restaurant
      if (activeRequestIdRef.current !== currentReqId) {
        return;
      }

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        clientMenuCache.set(cacheKey, json.data);
        setRawDishes(json.data);
        setLoadError(null);
      } else {
        // Strict compliance: never display hardcoded, generic, or fake menu items
        clientMenuCache.set(cacheKey, []);
        setRawDishes([]);
        setLoadError(json.message || 'Menu currently unavailable');
      }
    } catch (err: unknown) {
      if (activeRequestIdRef.current !== currentReqId) {
        return;
      }
      clientMenuCache.set(cacheKey, []);
      setRawDishes([]);
      setLoadError('Menu currently unavailable');
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(statusTimer);
      if (activeRequestIdRef.current === currentReqId) {
        setIsLoading(false);
      }
    }
  }, [restaurant.id, restaurant.name, restaurant.area, restaurant.city, restaurant.is_veg, restaurant.latitude, restaurant.longitude]);

  useEffect(() => {
    loadDishes();
    return () => {
      // Invalidate in-flight requests when unmounting or switching restaurants
      activeRequestIdRef.current++;
    };
  }, [loadDishes]);

  const isHeritageVeg = isPureVegRestaurantName(restaurant.name);

  // Precise restaurant cuisine categorization
  const isNonVegRestaurant = useMemo(() => {
    if (isHeritageVeg || restaurant.is_veg === 1) return false;
    const rName = restaurant.name.toLowerCase();
    if (
      rName.includes('non-veg') ||
      rName.includes('non veg') ||
      rName.includes('nonveg') ||
      rName.includes('mutton') ||
      rName.includes('chicken') ||
      rName.includes('meat') ||
      rName.includes('fish') ||
      rName.includes('seafood') ||
      rName.includes('prawn') ||
      rName.includes('crab') ||
      rName.includes('military') ||
      rName.includes('biryani') ||
      rName.includes('kebab') ||
      rName.includes('kabab') ||
      rName.includes('bar') ||
      rName.includes('pub') ||
      rName.includes('permit room')
    ) {
      return true;
    }
    // If the restaurant's actual verified menu contains non-veg items, it serves non-veg
    return rawDishes.some(d => d.is_veg === 0 || !isDishVeg(d.name));
  }, [restaurant.name, restaurant.is_veg, isHeritageVeg, rawDishes]);

  const isPureVegRestaurant = useMemo(() => {
    if (isNonVegRestaurant) return false;
    const rName = restaurant.name.toLowerCase();
    return isHeritageVeg ||
      restaurant.is_veg === 1 || 
      rName.includes('pure veg') || 
      (rName.includes('veg') && !rName.includes('non')) ||
      rName.includes('bhojanalay') ||
      rName.includes('shakahari') ||
      rName.includes('swayampak') ||
      rName.includes('bhavan') ||
      rName.includes('udupi') ||
      rName.includes('dosa') ||
      rName.includes('idli') ||
      rName.includes('mithai') ||
      rName.includes('sweets') ||
      rName.includes('jain') ||
      (rawDishes.length > 0 && rawDishes.every(d => d.is_veg === 1 || isDishVeg(d.name)));
  }, [restaurant.name, restaurant.is_veg, isNonVegRestaurant, isHeritageVeg, rawDishes]);

  // All authentic available dishes for this restaurant (strictly verified from actual menu, empty if unavailable)
  const allRestaurantDishes: Dish[] = useMemo(() => {
    if (rawDishes.length === 0) return [];
    if (isPureVegRestaurant) {
      // Guarantee zero non-veg items for pure veg restaurants
      return rawDishes.filter(d => isDishVeg(d.name) && d.is_veg !== 0);
    }
    return rawDishes;
  }, [rawDishes, isPureVegRestaurant]);

  // Extract top signature dishes using multi-signal weighted ranking:
  // 1. Restaurant specialties / bestsellers
  // 2. High order counts and popularity
  // 3. Ratings and review volume (Bayesian credibility)
  // 4. Genuine meal relevance (disqualifying accompaniments and beverages for food dining)
  const threeDishes: Dish[] = useMemo(() => {
    return selectTopRestaurantDishes(allRestaurantDishes, restaurant, 3);
  }, [allRestaurantDishes, restaurant]);

  // Contextual, authentic search placeholder matching this restaurant's real food
  const dynamicPlaceholder = useMemo(() => {
    const rName = restaurant.name.toLowerCase();
    if (rName.includes('wok') || rName.includes('chinese') || rName.includes('noodle') || rName.includes('asia')) {
      return `Search in ${restaurant.name} (e.g. Hakka Noodles, Fried Rice, Manchurian)...`;
    }
    if (isNonVegRestaurant) {
      return `Search in ${restaurant.name} (e.g. Biryani, Chicken, Kebab, Mutton)...`;
    }
    if (rName.includes('dosa') || rName.includes('idli') || rName.includes('south') || rName.includes('udupi')) {
      return `Search in ${restaurant.name} (e.g. Masala Dosa, Idli, Medu Vada)...`;
    }
    if (rName.includes('cafe') || rName.includes('coffee') || rName.includes('bakery')) {
      return `Search in ${restaurant.name} (e.g. Bun Maska, Cold Coffee, Sandwich)...`;
    }
    if (rName.includes('sweet') || rName.includes('mithai') || rName.includes('chaat') || rName.includes('bhel')) {
      return `Search in ${restaurant.name} (e.g. Gulab Jamun, Samosa, SPDP, Jalebi)...`;
    }
    if (rName.includes('misal') || rName.includes('katta')) {
      return `Search in ${restaurant.name} (e.g. Misal Pav, Usal, Vada Pav)...`;
    }
    return `Search dishes in ${restaurant.name} (e.g. Thali, Paneer, Dal)...`;
  }, [restaurant.name, isNonVegRestaurant]);

  // Common typo dictionary & phonetic normalizer
  const DISH_TYPO_MAP: Record<string, string> = {
    pulav: 'pulao',
    pulavv: 'pulao',
    pulao: 'pulao',
    pilaf: 'pulao',
    pilau: 'pulao',
    geera: 'jeera',
    zeera: 'jeera',
    lolipo: 'lollipop',
    lolipop: 'lollipop',
    lollypop: 'lollipop',
    lollipo: 'lollipop',
    chiken: 'chicken',
    chikken: 'chicken',
    chikn: 'chicken',
    mutton: 'mutton',
    muton: 'mutton',
    gosht: 'mutton',
    panner: 'paneer',
    panir: 'paneer',
    briyani: 'biryani',
    biriyani: 'biryani',
    biryany: 'biryani',
    tikka: 'tikka',
    tika: 'tikka',
    kabab: 'kebab',
    kebob: 'kebab',
    manchurian: 'manchurian',
    manchuran: 'manchurian',
    shezwan: 'schezwan',
    sezwan: 'schezwan',
    schezwan: 'schezwan',
    noodles: 'noodles',
    noodle: 'noodles',
    nudles: 'noodles',
    nodles: 'noodles',
    shawarma: 'shawarma',
    shwarma: 'shawarma',
    dosha: 'dosa',
    dosaa: 'dosa',
    idly: 'idli',
    vadapav: 'vada pav',
    wadapav: 'vada pav',
    pavbhaji: 'pav bhaji',
    paobhaji: 'pav bhaji',
    bhakarwadi: 'bhakarwadi',
    bhakrwadi: 'bhakarwadi',
    bakarwadi: 'bhakarwadi',
    ladoo: 'ladoo',
    laddu: 'ladoo',
    laddoo: 'ladoo',
    barfi: 'barfi',
    burfi: 'barfi',
    katli: 'barfi',
    cofy: 'coffee',
    coffe: 'coffee',
    cofee: 'coffee',
    chay: 'chai',
    chaai: 'chai',
    chaha: 'chai',
    tea: 'chai',
    piza: 'pizza',
    burgar: 'burger',
    burgur: 'burger',
    sandwhich: 'sandwich',
    sandwitch: 'sandwich'
  };

  // Dynamic Auto-Suggestions: strictly filter against selected restaurant's verified menu
  const matchingSuggestions = useMemo(() => {
    const rawQ = menuSearchQuery.trim();
    if (!rawQ) return [];

    const matches: Dish[] = [];
    const seenNames = new Set<string>();

    // 1. Strictly validate against the selected restaurant's authentic verified menu
    for (const dish of allRestaurantDishes) {
      const cleanName = formatCleanDishName(dish.name, restaurant.name);
      const lowerClean = cleanName.toLowerCase();
      if (seenNames.has(lowerClean)) continue;

      if (isDishRelevantToSearch(cleanName, rawQ)) {
        seenNames.add(lowerClean);
        matches.push({
          ...dish,
          name: cleanName
        });
      }
    }

    return matches;
  }, [allRestaurantDishes, menuSearchQuery, restaurant.name]);

  // Auto-select first recommended dish when restaurant changes
  const hasAutoSelectedRef = useRef<boolean>(false);
  useEffect(() => {
    hasAutoSelectedRef.current = false;
  }, [restaurant.id, restaurant.name]);

  useEffect(() => {
    if (threeDishes.length > 0 && (!selectedDish || !hasAutoSelectedRef.current)) {
      hasAutoSelectedRef.current = true;
      const first = threeDishes[0];
      const cleanDishName = formatCleanDishName(first.name, restaurant.name);
      const visual = getDishVisualAssets(cleanDishName, first.image, restaurant.name);
      onSelectDish({
        ...first,
        name: cleanDishName,
        image: visual.flyingImage || visual.plateImage
      });
    }
  }, [threeDishes, selectedDish, restaurant.name, onSelectDish]);

  const handleSelectDishItem = (dish: Dish) => {
    const cleanName = formatCleanDishName(dish.name, restaurant.name);
    const visual = getDishVisualAssets(cleanName, dish.image, restaurant.name);
    onSelectDish({
      ...dish,
      name: cleanName,
      image: visual.flyingImage || visual.plateImage
    });
  };

  const handleConfirm = () => {
    let finalName = '';
    let finalImg = '';

    if (selectedDish?.name) {
      finalName = formatCleanDishName(selectedDish.name, restaurant.name);
      const visual = getDishVisualAssets(finalName, selectedDish.image, restaurant.name);
      finalImg = visual.flyingImage || selectedDish.image || visual.plateImage;
    } else if (threeDishes.length > 0) {
      const first = threeDishes[0];
      finalName = formatCleanDishName(first.name, restaurant.name);
      const visual = getDishVisualAssets(finalName, first.image, restaurant.name);
      finalImg = visual.flyingImage || visual.plateImage;
    } else {
      finalName = 'Special Plate';
      const visual = getDishVisualAssets(finalName, undefined, restaurant.name);
      finalImg = visual.plateImage;
    }

    onConfirmDish(finalName, finalImg);
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col justify-start items-start text-left animate-in fade-in duration-300 p-3 sm:p-4 gap-2.5 bg-white overflow-y-auto scrollbar-thin relative pb-8">
      {/* 1. Headline */}
      <div className="text-left shrink-0">
        <h2 className="text-[19px] xs:text-[21px] sm:text-[26px] font-black text-[#0B1B48] leading-[1.15] tracking-tight">
          Favourite food stop mil gaya<br />Ab plate decide karo.
        </h2>
      </div>

      {isLoading ? (
        <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-200 animate-pulse my-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-[#D4380D]">
            <Utensils className="w-6 h-6 animate-bounce text-[#D4380D]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">{loadingStatus}</h3>
            <p className="text-[11px] text-slate-400">Loading verified dishes for {restaurant.name}</p>
          </div>
        </div>
      ) : allRestaurantDishes.length === 0 ? (
        <div className="w-full py-8 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/70 rounded-2xl border-2 border-slate-200/90 my-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-600">
            <Utensils className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-base font-black text-slate-800">
              Menu currently unavailable
            </h3>
            <p className="text-xs text-slate-500">
              The live menu for <span className="font-semibold text-slate-700">{restaurant.name}</span> could not be retrieved from delivery partners.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-2.5 w-full max-w-xs mt-1">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 px-4 rounded-xl bg-[#D4380D] hover:bg-[#b8300b] text-white text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                ← Choose Different Restaurant
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. Top Signature Quick-Pick Cards */}
          {threeDishes.length > 0 && (
            <div className="shrink-0 w-full">
              <div className={`grid gap-2 w-full ${
                threeDishes.length === 1
                  ? 'grid-cols-1 max-w-[180px] mx-auto'
                  : threeDishes.length === 2
                  ? 'grid-cols-2 max-w-[360px] mx-auto'
                  : 'grid-cols-3'
              }`}>
                {threeDishes.map((dish) => {
                  const cleanDishName = formatCleanDishName(dish.name, restaurant.name);
                  const isSelected = selectedDish?.name?.toLowerCase() === cleanDishName.toLowerCase() ||
                    selectedDish?.name?.toLowerCase() === dish.name.toLowerCase();
                  const visual = getDishVisualAssets(cleanDishName, dish.image, restaurant.name);

                  return (
                    <button
                      key={`quick-${dish.id}-${dish.name}`}
                      type="button"
                      onClick={() => handleSelectDishItem(dish)}
                      className={`w-full py-2 px-1.5 rounded-xl transition-all flex flex-col items-center justify-center text-center relative cursor-pointer border-2 min-h-[76px] sm:min-h-[82px] ${
                        isSelected
                          ? 'bg-orange-50 border-[#D4380D] text-[#D4380D] shadow-sm shadow-[#D4380D]/15 scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90 text-[#0B1B48]'
                      }`}
                    >
                      {/* Floating Checkmark for Selected State */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4380D] text-white flex items-center justify-center shadow-xs z-10">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Pure Food Image with Lightweight Placeholder */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 mb-0.5 flex items-center justify-center shrink-0">
                        <DishThumbnail
                          src={visual.flyingImage || visual.plateImage}
                          alt={cleanDishName}
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
            </div>
          )}

          {/* 3. MENU SEARCH BAR & REAL-TIME AUTO-SUGGESTIONS (No full menu scroll) */}
          <div className="w-full shrink-0 flex flex-col rounded-2xl border-2 border-slate-200/90 bg-white overflow-hidden shadow-sm mt-0.5">
            {/* Search Input Bar */}
            <div className="p-2 bg-slate-50/50">
              <div className="relative flex items-center w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 focus-within:border-[#D4380D] focus-within:ring-1 focus-within:ring-[#D4380D]/20 transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder={dynamicPlaceholder}
                  className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                {menuSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMenuSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {!menuSearchQuery.trim() ? null : (
              /* When typing: Display Live Dynamic Auto-Suggestions */
              <div className="border-t border-slate-100 bg-white animate-in fade-in duration-200">
                <div className="px-3 py-1.5 bg-orange-50/70 border-b border-orange-100/80 flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1.5 text-[#D4380D]">
                    <Sparkles className="w-3 h-3 text-[#D4380D]" />
                    Auto-Suggestions ({matchingSuggestions.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                    Authentic from {restaurant.name}
                  </span>
                </div>

                <div className="max-h-[220px] xs:max-h-[260px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin p-1 bg-white">
                  {matchingSuggestions.length === 0 ? (
                    <div className="p-4 text-center space-y-1.5 bg-white">
                      <p className="text-xs font-bold text-slate-700">
                        Menu not available for this dish at this restaurant.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {restaurant.name} does not serve &ldquo;{menuSearchQuery}&rdquo; on its authentic menu.
                      </p>
                    </div>
                  ) : (
                    matchingSuggestions.map((dish) => {
                      const cleanName = formatCleanDishName(dish.name, restaurant.name);
                      const isSelected =
                        selectedDish?.name?.toLowerCase() === cleanName.toLowerCase() ||
                        selectedDish?.name?.toLowerCase() === dish.name.toLowerCase();
                      const visual = getDishVisualAssets(cleanName, dish.image, restaurant.name);
                      const isVeg = dish.is_veg !== undefined ? dish.is_veg === 1 : isDishVeg(dish.name);

                      return (
                        <div
                          key={`suggest-${dish.id}-${dish.name}`}
                          onClick={() => handleSelectDishItem(dish)}
                          className={`w-full p-2 rounded-xl transition-all flex items-center justify-between gap-2.5 cursor-pointer text-left ${
                            isSelected
                              ? 'bg-orange-50/90 border border-orange-200'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          {/* Thumbnail with Lightweight Placeholder */}
                          <div className="w-10 h-10 rounded-full p-0.5 bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                            <DishThumbnail
                              src={visual.flyingImage || visual.plateImage}
                              alt={cleanName}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <div className="mt-0.5 shrink-0">
                              {isVeg ? (
                                <span
                                  className="inline-flex items-center justify-center w-3.5 h-3.5 border border-emerald-600 rounded-xs p-0.5"
                                  title="Pure Veg"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center justify-center w-3.5 h-3.5 border border-red-600 rounded-xs p-0.5"
                                  title="Non-Veg"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-xs font-black truncate ${
                                    isSelected ? 'text-[#D4380D]' : 'text-slate-900'
                                  }`}
                                >
                                  {cleanName}
                                </span>
                                {dish.is_recommended === 1 && (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                                    ★ Top Pick
                                  </span>
                                )}
                                {(dish as any).has_original_photo ? (
                                  <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded shrink-0" title="Authentic restaurant photo from Swiggy">
                                    📷 Original
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded shrink-0" title="Representative AI dish visual">
                                    ✨ AI Visual
                                  </span>
                                )}
                              </div>
                              {dish.description && (
                                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                  {dish.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Select Button */}
                          <div className="flex items-center shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectDishItem(dish);
                              }}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer shrink-0 ${
                                isSelected
                                  ? 'bg-[#D4380D] text-white shadow-xs'
                                  : 'bg-orange-50 hover:bg-orange-100 text-[#D4380D] border border-orange-200'
                              }`}
                            >
                              {isSelected ? (
                                <span className="flex items-center gap-0.5">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  CHOSEN
                                </span>
                              ) : (
                                'SELECT'
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Primary CTA Button */}
          <div className="shrink-0 w-full pt-0.5">
            <button
              onClick={handleConfirm}
              type="button"
              className="w-full py-3 sm:py-3.5 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
            >
              YEH WALA PAKKA
            </button>
          </div>
        </>
      )}
    </div>
  );
};
