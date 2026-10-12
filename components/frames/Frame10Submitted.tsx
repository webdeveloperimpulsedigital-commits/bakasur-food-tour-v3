'use client';

import React from 'react';
import { Restaurant, Dish } from '@/lib/db';

interface Frame10SubmittedProps {
  restaurant?: Partial<Restaurant> | { name: string; city?: string };
  dish?: Dish | { name: string; id?: number; price?: number; image?: string };
  onViewMap: () => void;
}

export const Frame10Submitted: React.FC<Frame10SubmittedProps> = ({
  restaurant,
  onViewMap
}) => {
  const restaurantName = restaurant?.name || 'Tumhara Favourite Spot';

  return (
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-3 sm:py-5 md:py-8 px-5 sm:px-8 md:px-10 gap-3 sm:gap-5 overflow-y-auto scrollbar-none">
      {/* 2. Main Headline */}
      <div className="space-y-0.5 sm:space-y-1">
        <h1 className="text-[21px] xs:text-[24px] sm:text-[34px] md:text-[40px] lg:text-[44px] font-black tracking-tight leading-[1.12]">
          <span className="text-[#0B1B48]">Khilane wale bahut mile.</span><br />
          <span className="text-[#D4380D]">Sambhalne wale tum nikle.</span><br />
          <span className="text-[#0B1B48]">Shukriya Dost.</span>
        </h1>
      </div>

      {/* 3. Subtext matching User Mockup with dynamic Restaurant Name */}
      <div>
        <p className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-[#0B1B48]/90 leading-snug max-w-lg">
          {restaurant?.name && restaurant.name !== 'Local Restaurant' && restaurant.name !== 'Tumhara Favourite Spot' ? (
            <>Ab <span className="font-black text-[#0B1B48]">[{restaurantName}]</span> - aapka favourite food stop map par add hua hai.</>
          ) : (
            <>Aapka favourite food stop map par add hua hai.</>
          )}
        </p>
      </div>

      {/* 4. Action CTA: MAP PAR DEKHO */}
      <div className="shrink-0 w-full pt-1 sm:pt-2">
        <button
          onClick={onViewMap}
          type="button"
          className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          MAP PAR DEKHO
        </button>
      </div>
    </div>
  );
};

