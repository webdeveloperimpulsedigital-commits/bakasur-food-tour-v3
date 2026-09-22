'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Frame1WelcomeProps {
  onStart: () => void;
  cityName?: string;
}

export const Frame1Welcome: React.FC<Frame1WelcomeProps> = ({ onStart }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center animate-in fade-in duration-300 py-3 sm:py-6 px-4 sm:px-8 md:px-10 gap-2.5 sm:gap-4 md:gap-5 bg-white">
      {/* 1. Skewed Top Badge: BAKASUR KA FOOD TOUR */}
      {/* <div className="inline-block transform -skew-x-6 bg-[#0B1B48] px-5 sm:px-6 py-1.5 sm:py-2 shadow-sm shrink-0">
        <span className="inline-block font-black italic tracking-wider text-white text-xs sm:text-sm md:text-base uppercase">
          BAKASUR KA FOOD TOUR
        </span>
      </div> */}

      {/* 2. Main Headline & Subtitle (Prominent and bold, matching Reference) */}
      <div className="space-y-1.5 sm:space-y-2 flex flex-col items-center text-center max-w-md">
        <h1 className="text-[30px] xs:text-[34px] sm:text-[38px] md:text-[44px] font-black text-[#0B1B48] tracking-tight leading-[1.08] text-center">
          Aapke sheher mein<br />Bakasur ka agla stop?
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-[#0B1B48] font-semibold leading-snug max-w-xs sm:max-w-sm text-center">
          Woh jagah batao jahan aapke andar ka Bakasur jaag uthe.
        </p>
      </div>

      {/* 3. CTA Button: BAKASUR KO KHILAO -> */}
      <div className="shrink-0 w-full max-w-sm sm:max-w-md pt-1 sm:pt-2">
        <button
          onClick={onStart}
          type="button"
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-base sm:text-lg uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer border-0"
        >
          <span>BAKASUR KO KHILAO</span>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};


