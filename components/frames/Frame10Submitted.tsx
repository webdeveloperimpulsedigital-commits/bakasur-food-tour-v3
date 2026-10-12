'use client';

import React from 'react';
import { Restaurant, Dish } from '@/lib/db';

interface Frame10SubmittedProps {
  restaurant?: Partial<Restaurant> | { name: string; city?: string };
  dish?: Dish | { name: string; id?: number; price?: number; image?: string };
  onViewMap: () => void;
}

export const Frame10Submitted: React.FC<Frame10SubmittedProps> = ({
  onViewMap
}) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-4 sm:py-6 md:py-8 px-5 sm:px-8 md:px-10 gap-3.5 sm:gap-5 overflow-y-auto scrollbar-none">
      {/* 2. Main Headline */}
      <div className="space-y-0.5 sm:space-y-1">
        <h1 className="text-[25px] xs:text-[29px] sm:text-[38px] md:text-[44px] lg:text-[48px] font-black tracking-tight leading-[1.14]">
          <span className="text-[#0B1B48]">Khilane wale bahut mile.</span><br />
          <span className="text-[#D4380D]">Sambhalne wale tum nikle.</span><br />
          <span className="text-[#0B1B48]">Shukriya Dost.</span>
        </h1>
      </div>

      {/* 3. Subtext with increased font size (without restaurant name) */}
      <div>
        <p className="text-[17px] xs:text-[20px] sm:text-[22px] md:text-[24px] font-bold text-[#0B1B48]/90 leading-snug max-w-lg">
          Aapka favourite food stop map par add hua hai.
        </p>
      </div>

      {/* 4. Action CTA: MAP PAR DEKHO */}
      <div className="shrink-0 w-full pt-1.5 sm:pt-3">
        <button
          onClick={onViewMap}
          type="button"
          className="w-full py-4 sm:py-4.5 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-xl sm:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          MAP PAR DEKHO
        </button>
      </div>
    </div>
  );
};

