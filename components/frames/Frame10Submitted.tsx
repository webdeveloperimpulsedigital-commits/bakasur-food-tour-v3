'use client';

import React, { useState } from 'react';
import { Camera, MapPin } from 'lucide-react';
import { Restaurant, Dish } from '@/lib/db';
import { BakasurShareCardModal } from '../BakasurShareCardModal';

interface Frame10SubmittedProps {
  restaurant?: Partial<Restaurant> | { name: string; city?: string };
  dish?: Dish | { name: string; id?: number; price?: number; image?: string };
  onViewMap: () => void;
}

export const Frame10Submitted: React.FC<Frame10SubmittedProps> = ({
  restaurant,
  dish,
  onViewMap
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const restaurantName = restaurant?.name || 'Tumhara Favourite Spot';
  const cityName = restaurant?.city || 'Pune';
  const dishName = dish?.name || 'Signature Food';

  return (
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-3 sm:py-5 md:py-8 px-4 sm:px-8 md:px-10 gap-3 sm:gap-4 overflow-y-auto scrollbar-none">
      {/* 2. Main Headline */}
      <div className="space-y-0.5 sm:space-y-1">
        <h1 className="text-[20px] xs:text-[23px] sm:text-[34px] md:text-[42px] font-black tracking-tight leading-[1.1]">
          <span className="text-[#0B1B48]">Khilane wale bahut mile.</span><br />
          <span className="text-[#D4380D]">Sambhalne wale tum nikle.</span><br />
          <span className="text-[#0B1B48]">Shukriya Dost.</span>
        </h1>
      </div>

      {/* 3. Subtext matching User Mockup 2 with dynamic Restaurant Name */}
      <div>
        <p className="text-xs sm:text-base md:text-lg font-bold text-[#0B1B48]/90 leading-tight max-w-lg">
          Ab <span className="font-black text-[#0B1B48]">[{restaurantName}]</span> sirf tumhara favourite nahi. Bhookasur Ka Food Tour Map ka naya stop hai.
        </p>
      </div>

      {/* 4. Action CTAs: MAP PAR DEKHO & SHARE INSTAGRAM CARD */}
      <div className="shrink-0 w-full pt-1 flex flex-col gap-2.5">
        <button
          onClick={onViewMap}
          type="button"
          className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-base sm:text-xl md:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
        >
          <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>MAP PAR DEKHO</span>
        </button>

        <button
          onClick={() => setIsShareModalOpen(true)}
          type="button"
          className="w-full py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-[#071952] hover:bg-[#0a2370] text-amber-300 font-black text-xs sm:text-sm md:text-base uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40"
        >
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <span>SHARE INSTAGRAM / WHATSAPP CARD 📸</span>
        </button>
      </div>

      {/* Share Modal */}
      <BakasurShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        restaurantName={restaurantName}
        cityName={cityName}
        dishName={dishName}
        dishImage={(dish as { image?: string })?.image}
      />
    </div>
  );
};
