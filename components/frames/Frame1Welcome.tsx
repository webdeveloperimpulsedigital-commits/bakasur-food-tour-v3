'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Frame1WelcomeProps {
  onStart: () => void;
  cityName?: string;
}

export const Frame1Welcome: React.FC<Frame1WelcomeProps> = ({ onStart }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between md:justify-center items-start text-left animate-in fade-in duration-300 py-6 sm:py-8 md:py-10 px-5 sm:px-7 md:px-10 lg:px-12 gap-5 sm:gap-6 md:gap-8 bg-[#f4f6fa]">
      {/* Headline & Subtitle matching reference */}
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-[32px] xs:text-[36px] sm:text-[40px] md:text-[46px] lg:text-[50px] font-black text-[#0B1B48] tracking-tight leading-[1.08]">
          Aapke sheher mein<br />Bakasur ka agla stop?
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-slate-700 font-medium leading-snug max-w-lg mt-2">
          Woh jagah batao jahan aapke andar ka Bakasur jaag uthe.
        </p>
      </div>

      {/* CTA Button & Powered by Footer */}
      <div className="shrink-0 w-full pt-1 sm:pt-2 flex flex-col items-center gap-3">
        <button
          onClick={onStart}
          type="button"
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-base sm:text-lg md:text-xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer border-0"
        >
          <span>BAKASUR KO KHILAO</span>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>

        <div className="text-center">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 select-none">
            POWERED BY GASTRIUM
          </span>
        </div>
      </div>
    </div>
  );
};
