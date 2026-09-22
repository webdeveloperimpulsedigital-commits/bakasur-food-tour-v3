'use client';

import React from 'react';
import { Restaurant, Dish } from '@/lib/db';

interface Frame10SubmittedProps {
  restaurant?: Partial<Restaurant> | { name: string; city?: string };
  dish?: Dish | { name: string; id?: number; price?: number };
  onViewMap: () => void;
}

export const Frame10Submitted: React.FC<Frame10SubmittedProps> = ({
  restaurant,
  dish,
  onViewMap
}) => {
  const restaurantName = restaurant?.name || 'Tumhara Favourite Spot';

  return (
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-3.5 sm:py-5 md:py-8 px-5 sm:px-8 md:px-10 gap-2.5 sm:gap-4 overflow-y-auto scrollbar-thin">
      {/* 2. Main Headline - Exactly matching User Mockup 2 */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-[30px] xs:text-[34px] sm:text-[40px] md:text-[46px] font-black tracking-tight leading-[1.12]">
          <span className="text-[#0B1B48]">Khilane wale bahut mile.</span><br />
          <span className="text-[#D4380D]">Sambhalne wale tum nikle.</span><br />
          <span className="text-[#0B1B48]">Shukriya Dost.</span>
        </h1>
      </div>

      {/* 3. Subtext matching User Mockup 2 with dynamic Restaurant Name */}
      <div>
        <p className="text-sm sm:text-base md:text-lg font-bold text-[#0B1B48]/90 leading-relaxed max-w-lg">
          Ab <span className="font-black text-[#0B1B48]">[{restaurantName}]</span> sirf tumhara favourite nahi. Bakasur Ka Food Tour Map ka naya stop hai.
        </p>
      </div>

      {/* 4. Primary CTA: MAP PAR DEKHO - Exactly matching User Mockup 2 */}
      <div className="shrink-0 w-full pt-1 sm:pt-2">
        <button
          onClick={onViewMap}
          type="button"
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          MAP PAR DEKHO
        </button>
      </div>
    </div>
  );
};
