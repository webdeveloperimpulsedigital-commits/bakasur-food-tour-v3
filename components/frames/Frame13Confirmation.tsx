'use client';

import React from 'react';
import { Restaurant, Dish } from '@/lib/db';

interface Frame13ConfirmationProps {
  participationId?: string;
  mobile?: string;
  restaurant?: Restaurant | null;
  dish?: Dish | { name: string; id?: number; price?: number } | null;
  onBackToMap: () => void;
  onRestart?: () => void;
}

export const Frame13Confirmation: React.FC<Frame13ConfirmationProps> = ({
  participationId,
  mobile,
  restaurant,
  dish,
  onBackToMap,
  onRestart
}) => {
  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-white animate-in fade-in duration-300 select-none">
      {/* ============================================================== */}
      {/* 1. TOP HALF (Mobile) / LEFT HALF (Desktop): Blue Character Art */}
      {/* ============================================================== */}
      <div className="w-full md:w-1/2 h-[52%] sm:h-[54%] md:h-full bg-[#071952] flex items-center justify-center relative overflow-hidden shrink-0 p-2 sm:p-3 md:p-6">
        {/* Subtle radial glow background behind character */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.25)_0%,_transparent_70%)] pointer-events-none" />

        {/* Cropped Character Illustration matching user mockup */}
        <img
          src="/images/food_tour/bakasur_phone_pass.png"
          alt="Bakasur Ka Food Tour"
          className="w-full h-full object-contain pointer-events-none select-none max-h-full drop-shadow-2xl"
        />
      </div>

      {/* ============================================================== */}
      {/* 2. BOTTOM HALF (Mobile) / RIGHT HALF (Desktop): Content Card   */}
      {/* ============================================================== */}
      <div className="w-full md:w-1/2 flex-1 md:h-full flex flex-col justify-between items-center text-center px-4 py-3 sm:px-6 sm:py-5 md:px-10 md:py-8 bg-white overflow-y-auto gap-2 sm:gap-3">
        {/* Spacer on Desktop for center balance */}
        <div className="hidden md:block w-full h-2" />

        {/* Copy Section */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 my-auto">
          {/* Main Headline */}
          <h1 className="text-[22px] xs:text-[25px] sm:text-[28px] md:text-3xl lg:text-4xl font-black tracking-tight leading-[1.15] text-[#0B1B48]">
            <span>Naam list mein.</span><br />
            <span>Ab nazar </span>
            <span className="text-[#D4380D]">phone par.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] md:text-base font-semibold text-[#0B1B48]/85 max-w-xs sm:max-w-md leading-snug mt-0.5">
            Agar select hue, Live Food Tour ka bulaava isi registered number par aayega.
          </p>

          {/* Registered Details Pill */}
          {mobile && (
            <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[#0B1B48] font-bold text-[11px] sm:text-xs border border-slate-200 shadow-2xs">
              <span>📱 +91 {mobile}</span>
              {participationId && (
                <span className="text-[#D4380D] font-mono font-black">[{participationId}]</span>
              )}
            </div>
          )}
        </div>

        {/* Action Button & Footer Container */}
        <div className="w-full flex flex-col items-center gap-2 sm:gap-3 shrink-0 pt-1">
          {/* Primary CTA: BACK TO FOOD TOUR MAP */}
          <button
            onClick={onBackToMap}
            type="button"
            className="w-full max-w-sm sm:max-w-md py-3 sm:py-3.5 md:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
          >
            <span>BACK TO FOOD TOUR MAP</span>
          </button>

          {/* Footer Subtext: POWERED BY GASTRIUM */}
          <div className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase">
            POWERED BY GASTRIUM
          </div>
        </div>
      </div>
    </div>
  );
};
