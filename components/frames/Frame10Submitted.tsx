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
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 gap-5 sm:gap-6 md:gap-7">
      {/* 2. Main Headline - Exactly matching User Mockup 2 */}
      <div className="space-y-1">
        <h1 className="text-[26px] xs:text-[30px] sm:text-[34px] md:text-[40px] font-black tracking-tight leading-[1.15]">
          <span className="text-[#0B1B48]">Khilane wale bahut mile.</span><br />
          <span className="text-[#D4380D]">Sambhalne wale tum nikle.</span><br />
          <span className="text-[#0B1B48]">Shukriya Dost.</span>
        </h1>
      </div>

      {/* 3. Subtext matching User Mockup 2 with dynamic Restaurant Name */}
      <div>
        <p className="text-sm sm:text-base font-semibold text-[#0B1B48]/90 leading-relaxed max-w-md">
          Ab <span className="font-black text-[#0B1B48]">[{restaurantName}]</span> sirf tumhara favourite nahi. Bakasur Ka Food Tour Map ka naya stop hai.
        </p>
      </div>

      {/* 4. Primary CTA: MAP PAR DEKHO - Exactly matching User Mockup 2 */}
      <div className="shrink-0 w-full pt-1 sm:pt-2">
        <button
          onClick={onViewMap}
          type="button"
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-base sm:text-lg md:text-xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          MAP PAR DEKHO
        </button>
      </div>
    </div>
  );
};
