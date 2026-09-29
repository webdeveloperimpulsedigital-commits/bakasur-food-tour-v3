'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Frame1WelcomeProps {
  onStart: () => void;
  cityName?: string;
}

export const Frame1Welcome: React.FC<Frame1WelcomeProps> = ({ onStart }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center animate-in fade-in duration-300 py-3 sm:py-5 md:py-8 px-4 sm:px-8 md:px-10 gap-1.5 sm:gap-3 bg-white overflow-y-auto scrollbar-none">
      {/* 2. Main Headline & Subtitle */}
      <div className="space-y-1 sm:space-y-2 flex flex-col items-center text-center max-w-lg">
        <h1 className="text-[22px] xs:text-[26px] sm:text-[34px] md:text-[44px] font-black text-[#0B1B48] tracking-tight leading-[1.08] text-center">
          Aapke sheher mein<br />Bhookasur ka agla stop?
        </h1>
        <p className="text-xs xs:text-sm sm:text-base md:text-lg text-[#0B1B48] font-bold leading-snug max-w-xs sm:max-w-md text-center">
          Woh jagah batao jahan aapke andar ka Bhookasur jaag uthe.
        </p>
      </div>

      {/* 3. CTA Button: BHOOKASUR KO KHILAO -> */}
      <div className="shrink-0 w-full max-w-xs sm:max-w-md pt-1 sm:pt-2">
        <button
          onClick={onStart}
          type="button"
          className="w-full py-3 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-base sm:text-xl md:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer border-0"
        >
          <span>BHOOKASUR KO KHILAO</span>
          <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};


