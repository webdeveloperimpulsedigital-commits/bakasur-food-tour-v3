'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Frame1WelcomeProps {
  onStart: () => void;
  cityName?: string;
}

export const Frame1Welcome: React.FC<Frame1WelcomeProps> = ({ onStart }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center animate-in fade-in duration-300 py-3 sm:py-5 md:py-8 px-5 sm:px-8 md:px-10 gap-2 sm:gap-3 bg-white overflow-y-auto scrollbar-thin">
      {/* 2. Main Headline & Subtitle (Prominent and bold, matching Reference) */}
      <div className="space-y-1.5 sm:space-y-2.5 flex flex-col items-center text-center max-w-lg">
        <h1 className="text-[30px] xs:text-[34px] sm:text-[40px] md:text-[48px] font-black text-[#0B1B48] tracking-tight leading-[1.08] text-center">
          Aapke sheher mein<br />Bakasur ka agla stop?
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-[#0B1B48] font-bold leading-snug max-w-sm sm:max-w-md text-center">
          Woh jagah batao jahan aapke andar ka Bakasur jaag uthe.
        </p>
      </div>

      {/* 3. CTA Button: BAKASUR KO KHILAO -> */}
      <div className="shrink-0 w-full max-w-sm sm:max-w-md pt-1 sm:pt-2">
        <button
          onClick={onStart}
          type="button"
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer border-0"
        >
          <span>BAKASUR KO KHILAO</span>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};


