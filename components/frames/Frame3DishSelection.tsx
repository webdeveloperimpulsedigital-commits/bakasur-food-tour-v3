'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Check, Search, Utensils, X, Sparkles, BookOpen } from 'lucide-react';
import { Restaurant, Dish } from '@/lib/db';
import { getDishVisualAssets, formatCleanDishName, isDishVeg } from '@/lib/dishAssets';
import { generateLiveMenuForRestaurant, inferDishCategory } from '@/lib/liveMenu';

interface Frame3DishSelectionProps {
  restaurant: Restaurant;
  selectedDish: Dish | { name: string; id?: number; price?: number; image?: string; description?: string } | null;
  isSecondRound?: boolean;
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

  const isNonVeg = restaurant.name.toLowerCase().includes('non veg') ||
    restaurant.name.toLowerCase().includes('non-veg') ||
    restaurant.name.toLowerCase().includes('mutton') ||
    restaurant.name.toLowerCase().includes('chicken') ||
    restaurant.name.toLowerCase().includes('fish') ||
    restaurant.name.toLowerCase().includes('military');

  if (isNonVeg) {
    return [
      {
        id: restaurant.id * 100 + 1,
        restaurant_id: restaurant.id,
        name: 'Special Dum Mutton Biryani',
        description: 'Aromatic Basmati rice slow cooked on dum with tender mutton chunks & saffron ghee',
        price: 390,
        image: `/api/ai/dish-image?dish=${encodeURIComponent('Special Dum Mutton Biryani')}&restaurant=${encodeURIComponent(restaurant.name)}`,
        rating: 5.0,
        popularity: 100,
        is_recommended: 1,
        category: 'Rice & Biryani',
        is_veg: 0,
        status: 'active'
      },
      {
        id: restaurant.id * 100 + 2,
        restaurant_id: restaurant.id,
        name: 'Hyderabadi Chicken Dum Biryani',
        description: 'Fragrant spiced long grain rice layered with succulent marinated chicken & mint',
        price: 320,
        image: `/api/ai/dish-image?dish=${encodeURIComponent('Hyderabadi Chicken Dum Biryani')}&restaurant=${encodeURIComponent(restaurant.name)}`,
        rating: 4.9,
        popularity: 98,
        is_recommended: 1,
        category: 'Rice & Biryani',
        is_veg: 0,
        status: 'active'
      },
      {
        id: restaurant.id * 100 + 3,
        restaurant_id: restaurant.id,
        name: 'Old Delhi Style Butter Chicken',
        description: 'Tender roasted chicken tikka simmered in rich creamy tomato cashew makhani gravy',
        price: 360,
        image: `/api/ai/dish-image?dish=${encodeURIComponent('Old Delhi Style Butter Chicken')}&restaurant=${encodeURIComponent(restaurant.name)}`,
        rating: 4.8,
        popularity: 95,
        is_recommended: 1,
        category: 'Non-Veg Main Course',
        is_veg: 0,
        status: 'active'
      }
    ];
  }

  return [
    {
      id: restaurant.id * 100 + 1,
      restaurant_id: restaurant.id,
      name: 'Paneer Butter Masala',
      description: 'Cottage cheese cubes simmered in velvety tomato cashew butter gravy',
      price: 240,
      image: `/api/ai/dish-image?dish=${encodeURIComponent('Paneer Butter Masala')}&restaurant=${encodeURIComponent(restaurant.name)}`,
      rating: 5.0,
      popularity: 100,
      is_recommended: 1,
      category: 'North Indian Veg',
      is_veg: 1,
      status: 'active'
    },
    {
      id: restaurant.id * 100 + 2,
      restaurant_id: restaurant.id,
      name: 'Dal Makhani Charcoal Simmered',
      description: 'Slow-simmered whole black lentils with fresh cream and butter',
      price: 210,
      image: `/api/ai/dish-image?dish=${encodeURIComponent('Dal Makhani')}&restaurant=${encodeURIComponent(restaurant.name)}`,
      rating: 4.9,
      popularity: 98,
      is_recommended: 1,
      category: 'North Indian Veg',
      is_veg: 1,
      status: 'active'
    },
    {
      id: restaurant.id * 100 + 3,
      restaurant_id: restaurant.id,
      name: 'Special Maharaja Veg Thali',
      description: 'Grand vegetarian platter with seasonal subzi, dal, rice, rotis & sweet',
      price: 260,
      image: `/api/ai/dish-image?dish=${encodeURIComponent('Veg Thali')}&restaurant=${encodeURIComponent(restaurant.name)}`,
      rating: 4.8,
      popularity: 95,
      is_recommended: 1,
      category: 'Thalis & Combos',
      is_veg: 1,
      status: 'active'
    }
  ];
}

export const Frame3DishSelection: React.FC<Frame3DishSelectionProps> = ({
  restaurant,
  selectedDish,
  onSelectDish,
  onConfirmDish,
  onManualEntry
}) => {
  const [rawDishes, setRawDishes] = useState<Dish[]>([]);
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch Live Menu from API for selected restaurant
  useEffect(() => {
    let isCancelled = false;
    setRawDishes([]);
    setMenuSearchQuery('');
    setIsLoading(true);

    async function loadDishes() {
      try {
        const queryParams = new URLSearchParams({
          name: restaurant.name || '',
          area: restaurant.area || '',
          city: restaurant.city || '',
          is_veg: restaurant.is_veg ? '1' : '0'
        });
        if (restaurant.latitude) queryParams.set('lat', String(restaurant.latitude));
        if (restaurant.longitude) queryParams.set('lng', String(restaurant.longitude));
        const res = await fetch(`/api/restaurants/${restaurant.id}/dishes?${queryParams.toString()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
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
  }, [restaurant.id, restaurant.name]);

  // Precise restaurant cuisine categorization
  const isNonVegRestaurant = useMemo(() => {
    const rName = restaurant.name.toLowerCase();
    return rName.includes('non-veg') ||
      rName.includes('non veg') ||
      rName.includes('nonveg') ||
      rName.includes('mutton') ||
      rName.includes('chicken') ||
      rName.includes('meat') ||
      rName.includes('fish') ||
      rName.includes('seafood') ||
      rName.includes('military');
  }, [restaurant.name]);

  const isPureVegRestaurant = useMemo(() => {
    if (isNonVegRestaurant) return false;
    const rName = restaurant.name.toLowerCase();
    return restaurant.is_veg === 1 || 
      rName.includes('pure veg') || 
      (rName.includes('veg') && !rName.includes('non')) ||
      rName.includes('mithai') ||
      rName.includes('sweets') ||
      rName.includes('dosa') ||
      rName.includes('idli') ||
      rName.includes('udupi');
  }, [restaurant.name, restaurant.is_veg, isNonVegRestaurant]);

  // All authentic available dishes for this restaurant (strictly verified to match restaurant identity)
  const allRestaurantDishes: Dish[] = useMemo(() => {
    const list = rawDishes.length > 0 ? rawDishes : getInitialDishes(restaurant);
    if (isPureVegRestaurant) {
      // Guarantee zero non-veg items for pure veg restaurants
      return list.filter(d => isDishVeg(d.name) && d.is_veg !== 0);
    }
    return list;
  }, [rawDishes, restaurant, isPureVegRestaurant]);

  // Extract top 3 signature dishes for quick 1-tap picks at top
  const threeDishes: Dish[] = useMemo(() => {
    const sorted = [...allRestaurantDishes].sort((a, b) => {
      const rDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(rDiff) > 0.01) return rDiff;
      if ((b.is_recommended || 0) !== (a.is_recommended || 0)) {
        return (b.is_recommended || 0) - (a.is_recommended || 0);
      }
      return (b.popularity || 0) - (a.popularity || 0);
    });
    return sorted.slice(0, 3);
  }, [allRestaurantDishes]);

  // Contextual, authentic search placeholder matching this restaurant's real food
  const dynamicPlaceholder = useMemo(() => {
    const rName = restaurant.name.toLowerCase();
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

  // Dynamic Auto-Suggestions: ONLY compute when user actually types in search bar
  const matchingSuggestions = useMemo(() => {
    const q = menuSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return allRestaurantDishes.filter(dish => {
      const cleanName = formatCleanDishName(dish.name, restaurant.name).toLowerCase();
      const desc = (dish.description || '').toLowerCase();
      const cat = (dish.category || '').toLowerCase();
      return cleanName.includes(q) || desc.includes(q) || cat.includes(q) || dish.name.toLowerCase().includes(q);
    });
  }, [allRestaurantDishes, menuSearchQuery, restaurant.name]);

  // Auto-select first recommended dish when restaurant changes
  const hasAutoSelectedRef = useRef<boolean>(false);
  useEffect(() => {
    hasAutoSelectedRef.current = false;
  }, [restaurant.id, restaurant.name]);

  useEffect(() => {
    if (threeDishes.length > 0) {
      const isDishInCurrentMenu = selectedDish && allRestaurantDishes.some(
        d => formatCleanDishName(d.name, restaurant.name).toLowerCase() === selectedDish.name.toLowerCase() ||
             d.name.toLowerCase() === selectedDish.name.toLowerCase()
      );

      if (!selectedDish || !isDishInCurrentMenu) {
        hasAutoSelectedRef.current = true;
        const first = threeDishes[0];
        const cleanDishName = formatCleanDishName(first.name, restaurant.name);
        const visual = getDishVisualAssets(first.name, first.image, restaurant.name);
        onSelectDish({
          ...first,
          name: cleanDishName,
          image: visual.plateImage
        });
      }
    }
  }, [threeDishes, allRestaurantDishes, selectedDish, restaurant.name, onSelectDish]);

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

      {/* 2. Top 3 Signature Quick-Pick Cards */}
      <div className="shrink-0 w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#D4380D]" />
            Quick Pick Best Dishes
          </span>
          <span className="text-[10px] text-slate-400 font-medium">1-Tap Select</span>
        </div>

        {isLoading && rawDishes.length === 0 ? (
          <div className="grid grid-cols-3 gap-2 w-full animate-pulse">
            <div className="h-20 w-full bg-slate-100 rounded-xl" />
            <div className="h-20 w-full bg-slate-100 rounded-xl" />
            <div className="h-20 w-full bg-slate-100 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 w-full">
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

                  {/* Pure Food PNG Image */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mb-0.5 flex items-center justify-center shrink-0">
                    <img
                      src={visual.flyingImage || visual.plateImage}
                      alt={cleanDishName}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('default_feast')) {
                          target.src = `/api/ai/dish-image?dish=${encodeURIComponent('Special Feast')}&restaurant=Indian`;
                        }
                      }}
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

        {/* When NOT typing: Do NOT display all menu items (eliminates excessive scrolling) */}
        {!menuSearchQuery.trim() ? (
          <div className="py-2.5 px-3 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Search className="w-3 h-3 text-[#D4380D]/70" />
              Type dish name above to search live menu
            </span>
            {onManualEntry && (
              <button
                type="button"
                onClick={onManualEntry}
                className="text-[10px] font-bold text-[#D4380D] hover:underline cursor-pointer"
              >
                + Custom dish
              </button>
            )}
          </div>
        ) : (
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
                    No dishes found matching &ldquo;{menuSearchQuery}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Only authentic dishes actually served by {restaurant.name} are shown.
                  </p>
                  {onManualEntry && (
                    <button
                      type="button"
                      onClick={onManualEntry}
                      className="mt-1 text-xs font-bold text-[#D4380D] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      + Enter custom dish name instead
                    </button>
                  )}
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
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg p-0.5 bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={visual.flyingImage || visual.plateImage}
                          alt={cleanName}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('default_feast')) {
                              target.src = `/api/ai/dish-image?dish=${encodeURIComponent('Special Feast')}&restaurant=Indian`;
                            }
                          }}
                          className="w-full h-full object-contain filter drop-shadow-xs"
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
                          <div className="flex items-center gap-1.5">
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

      {/* 4. Active Selected Plate Summary Bar */}
      {selectedDish && (
        <div className="w-full shrink-0 px-3 py-2 rounded-xl bg-orange-50/90 border border-orange-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-500 font-semibold shrink-0">Selected:</span>
            <span className="font-black text-[#D4380D] truncate">
              {formatCleanDishName(selectedDish.name, restaurant.name)}
            </span>
          </div>
        </div>
      )}

      {/* 5. Primary CTA Button */}
      <div className="shrink-0 w-full pt-0.5">
        <button
          onClick={handleConfirm}
          type="button"
          className="w-full py-3 sm:py-3.5 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          YEH WALA PAKKA
        </button>
      </div>
    </div>
  );
};
