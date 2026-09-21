'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Frame1WelcomeProps {
  onStart: () => void;
  cityName?: string;
}

export const Frame1Welcome: React.FC<Frame1WelcomeProps> = ({ onStart }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-3 sm:py-6 md:py-8 px-3 sm:px-6 md:px-10 gap-4 sm:gap-6 md:gap-8">
      {/* 1. Slanted Badge Left-Aligned (Matching Reference Image) */}
      <div className="shrink-0">
        <div className="inline-block transform -skew-x-12 bg-[#0E2055] px-4 py-1.5 rounded-sm shadow-sm">
          <span className="inline-block transform skew-x-12 text-white font-black text-xs sm:text-sm md:text-base uppercase tracking-wider italic">
            BAKASUR KA FOOD TOUR
          </span>
        </div>
      </div>

      {/* 2. Headline & Subtitle Left-Aligned */}
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-[30px] sm:text-[38px] md:text-[46px] lg:text-[50px] font-black text-[#0B1B48] tracking-tight leading-[1.08]">
          Aapke sheher mein<br />Bakasur ka agla stop?
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-slate-700 font-semibold leading-snug max-w-lg">
          Woh jagah batao jahan aapke andar ka Bakasur jaag uthe.
        </p>
      </div>

      {/* 3. CTA Button */}
      <div className="shrink-0 w-full pt-2">
        <button
          onClick={onStart}
          type="button"
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-base sm:text-lg md:text-xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer border-0"
        >
          <span>BAKASUR KO KHILAO</span>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
