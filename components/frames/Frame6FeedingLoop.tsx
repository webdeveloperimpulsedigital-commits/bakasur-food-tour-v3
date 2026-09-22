'use client';

import React, { useEffect } from 'react';
import { Restaurant, Dish } from '@/lib/db';

interface Frame6FeedingLoopProps {
  restaurant?: Restaurant | { id?: number; name?: string; city?: string };
  dish?: Dish | { name: string; id?: number; price?: number };
  onCompleteLoop: () => void;
  onPlayBite?: () => void;
  onRoundChange?: (round: 1 | 2 | 3) => void;
}

export const Frame6FeedingLoop: React.FC<Frame6FeedingLoopProps> = ({
  onCompleteLoop
}) => {
  // Auto-advance to next frame (Frame 7 - Acidity Appears) after 10 seconds if user doesn't click "AUR KHILAO"
  useEffect(() => {
    const timeout = setTimeout(() => {
      onCompleteLoop();
    }, 10000);

    return () => clearTimeout(timeout);
  }, [onCompleteLoop]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8 gap-5 sm:gap-6 md:gap-8">
      {/* 2. Headline matching Image 1: Itne mein Food Tour nahi, sirf food trailer banta hai */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-[30px] xs:text-[34px] sm:text-[40px] md:text-[46px] font-black text-[#0B1B48] tracking-tight leading-[1.12]">
          Itne mein Food Tour nahi,<br />
          sirf <span className="text-[#D4380D]">food trailer</span> banta hai.
        </h1>
      </div>

      {/* 3. Primary CTA: AUR KHILAO */}
      <div className="shrink-0 w-full pt-1 sm:pt-2">
        <button
          onClick={onCompleteLoop}
          type="button"
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          AUR KHILAO
        </button>
      </div>
    </div>
  );
};
