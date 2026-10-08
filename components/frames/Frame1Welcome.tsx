'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Frame1WelcomeProps {
  onStart: () => void;
  cityName?: string;
}

export const Frame1Welcome: React.FC<Frame1WelcomeProps> = ({ onStart }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center animate-in fade-in duration-300 py-3 sm:py-5 md:py-8 px-4 sm:px-8 md:px-10 gap-2 sm:gap-4 bg-white overflow-y-auto scrollbar-none">
      {/* 2. Main Headline & Subtitle */}
      <div className="space-y-1.5 sm:space-y-3 flex flex-col items-center text-center max-w-lg">
        <h1 className="text-[26px] xs:text-[30px] sm:text-[38px] md:text-[48px] font-black text-[#0B1B48] tracking-tight leading-[1.1] text-center">
          Aapke sheher mein<br />Bhookasur ka agla stop?
        </h1>
        <p className="text-sm xs:text-base sm:text-lg md:text-xl text-[#0B1B48]/90 font-bold leading-snug max-w-xs sm:max-w-md text-center">
          Woh jagah batao jahan aapke andar ka Bhookasur jaag uthe.
        </p>
      </div>

      {/* 3. CTA Button: BHOOKASUR KO KHILAO -> */}
      <div className="shrink-0 w-full max-w-xs sm:max-w-md pt-1.5 sm:pt-3">
        <button
          onClick={onStart}
          type="button"
          className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-lg xs:text-xl sm:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer border-0"
        >
          <span>BHOOKASUR KO KHILAO</span>
          <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};


