'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, PlusCircle } from 'lucide-react';
import { Restaurant } from '@/lib/db';
import { FrameFooter } from './FrameFooter';

interface Frame4ManualDishProps {
  restaurant: Restaurant;
  onCustomDishSubmit: (dishName: string) => void;
  onBackToOptions: () => void;
}

const POPULAR_SUGGESTIONS = [
  'Mutton Dum Biryani',
  'Butter Chicken & Garlic Naan',
  'Kolhapuri Spicy Misal Pav',
  'Crispy Butter Masala Dosa',
  'Amul Butter Pav Bhaji',
  'Sita Ram Chole Bhature',
  'Creamy Dal Makhani',
  'Sajuk Tupatli Puran Poli'
];

export const Frame4ManualDish: React.FC<Frame4ManualDishProps> = ({
  restaurant,
  onCustomDishSubmit,
  onBackToOptions
}) => {
  const [customDish, setCustomDish] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDish.trim()) return;
    onCustomDishSubmit(customDish.trim());
  };

  return (
    <div className="w-full h-full flex flex-col justify-between min-h-0 animate-in fade-in duration-300 gap-2 text-left">
      {/* Top Section: Slanted Badge & Back Button */}
      <div className="shrink-0 flex items-center justify-between gap-2">
        <div className="inline-block transform -skew-x-12 bg-[#0E2055] px-3.5 py-1 rounded-sm shadow-sm">
          <span className="inline-block transform skew-x-12 text-white font-black text-xs uppercase tracking-wider italic">
            BAKASUR KA FOOD TOUR
          </span>
        </div>
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
          Khud likh do. Bakasur sun raha hai:
        </p>
      </div>

      {/* Manual Dish Input Field */}
      <form onSubmit={handleSubmit} className="shrink-0 flex flex-col gap-1.5">
        <label className="block text-xs font-black text-[#0B1B48] uppercase tracking-wider">
          Apni favourite dish likho:
        </label>
        <div className="relative">
          <input
            type="text"
            value={customDish}
            onChange={(e) => setCustomDish(e.target.value)}
            placeholder="Jaise: Mutton Biryani, Extra Butter Pav Bhaji..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4380D] shadow-sm"
          />
        </div>
      </form>

      {/* Quick Suggestions Chips */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
          Ya yahan se direct select karo:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => setCustomDish(sug)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-800 font-semibold transition-all cursor-pointer text-left flex items-center gap-1"
            >
              <PlusCircle className="w-3 h-3 text-[#D4380D] shrink-0" />
              <span>{sug}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary CTA: Isse khilao */}
      <div className="shrink-0 pt-1">
        <button
          onClick={() => onCustomDishSubmit(customDish.trim() || 'Special Delicacy')}
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
