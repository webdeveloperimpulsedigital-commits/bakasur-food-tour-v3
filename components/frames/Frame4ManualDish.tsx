'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, PlusCircle, Search } from 'lucide-react';
import { Restaurant, Dish } from '@/lib/db';
import { getDishVisualAssets } from '@/lib/dishAssets';
import { FrameFooter } from './FrameFooter';

interface Frame4ManualDishProps {
  restaurant: Restaurant;
  onCustomDishSubmit: (dishName: string, dishImage?: string) => void;
  onBackToOptions: () => void;
}

const POPULAR_SUGGESTIONS = [
  'Steamed Veg Momos',
  'Crispy Fried Cheese Momos',
  'Mutton Dum Biryani',
  'Butter Chicken & Garlic Naan',
  'Kolhapuri Spicy Misal Pav',
  'Crispy Butter Masala Dosa',
  'Amul Butter Pav Bhaji',
  'Sita Ram Chole Bhature'
];

export const Frame4ManualDish: React.FC<Frame4ManualDishProps> = ({
  restaurant,
  onCustomDishSubmit,
  onBackToOptions
}) => {
  const [customDish, setCustomDish] = useState('');
  const [suggestions, setSuggestions] = useState<Dish[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);

  // Live Ajax search from API when user types
  useEffect(() => {
    const q = customDish.trim();
    if (q.length < 2) {
      setSuggestions([]);
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
          setSuggestions(json.data.slice(0, 6));
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.warn('Dish search error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [customDish, restaurant]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = customDish.trim();
    if (!name) return;
    const visual = getDishVisualAssets(name, selectedImage);
    onCustomDishSubmit(name, visual.plateImage);
  };

  const handleSelectSuggestion = (dish: Dish) => {
    setCustomDish(dish.name);
    const visual = getDishVisualAssets(dish.name, dish.image);
    setSelectedImage(visual.plateImage);
    onCustomDishSubmit(dish.name, visual.plateImage);
  };

  const handleSelectChip = (sug: string) => {
    setCustomDish(sug);
    const visual = getDishVisualAssets(sug);
    setSelectedImage(visual.plateImage);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between min-h-0 animate-in fade-in duration-300 gap-2 text-left">
      {/* Top Section: Back Button */}
      <div className="shrink-0 flex items-center justify-start gap-2">
        <button
          onClick={onBackToOptions}
          type="button"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Wapas 3 Options Par</span>
        </button>
      </div>

      {/* Frame Copy Header */}
      <div className="shrink-0">
        <span className="text-[10px] font-black text-[#D4380D] uppercase tracking-wider block">
          📍 {restaurant.name}
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1B48] brand-font leading-[1.15] mt-0.5">
          Favourite wali list mein nahi?
        </h2>
        <p className="text-xs sm:text-sm text-[#2A3B66] font-medium mt-0.5 leading-snug">
          Khud likh do ya live search karo. Bakasur sun raha hai:
        </p>
      </div>

      {/* Manual Dish Input Field with Live Search Indicator */}
      <form onSubmit={handleSubmit} className="shrink-0 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-black text-[#0B1B48] uppercase tracking-wider">
            Apni favourite dish likho:
          </label>
          {isSearching && (
            <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              Searching API...
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={customDish}
            onChange={(e) => {
              setCustomDish(e.target.value);
              setSelectedImage(undefined);
            }}
            placeholder="Jaise: Steamed Veg Momos, Mutton Biryani..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4380D] shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </form>

      {/* Live API Results Dropdown / Quick Suggestions */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
        {suggestions.length > 0 ? (
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block mb-1.5">
              Live Menu Results ({suggestions.length}):
            </span>
            <div className="space-y-1.5">
              {suggestions.map((dish) => {
                const visual = getDishVisualAssets(dish.name, dish.image);
                return (
                  <button
                    key={dish.id || dish.name}
                    type="button"
                    onClick={() => handleSelectSuggestion(dish)}
                    className="w-full p-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/80 transition-all cursor-pointer flex items-center justify-between gap-2.5 text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={visual.plateImage}
                        alt={dish.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/eating/momos_dish.jpg';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1B48] group-hover:text-[#1E40AF] truncate">
                          {dish.name}
                        </div>
                        {dish.description && (
                          <div className="text-[10px] text-slate-500 truncate">
                            {dish.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[11px]">
                      ₹{dish.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
              Ya yahan se direct select karo:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSelectChip(sug)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left flex items-center gap-1 ${
                    customDish.toLowerCase() === sug.toLowerCase()
                      ? 'bg-[#D4380D] text-white border-[#D4380D] shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  }`}
                >
                  <PlusCircle className={`w-3 h-3 shrink-0 ${customDish.toLowerCase() === sug.toLowerCase() ? 'text-white' : 'text-[#D4380D]'}`} />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary CTA: Isse khilao */}
      <div className="shrink-0 pt-1">
        <button
          onClick={() => handleSubmit()}
          disabled={!customDish.trim()}
          type="button"
          className="w-full py-3.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer brand-font disabled:opacity-50"
        >
          <span>ISSE KHILAO</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Footer */}
      <FrameFooter />
    </div>
  );
};
