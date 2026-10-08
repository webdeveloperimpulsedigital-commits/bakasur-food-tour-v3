'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Restaurant, Dish } from '@/lib/db';

interface Frame6FeedingLoopProps {
  restaurant?: Restaurant | { id?: number; name?: string; city?: string };
  dish?: Dish | { name: string; id?: number; price?: number };
  onCompleteLoop: () => void;
  onPlayBite?: () => void;
  onRoundChange?: (round: 1 | 2 | 3) => void;
  onBack?: () => void;
}

export const Frame6FeedingLoop: React.FC<Frame6FeedingLoopProps> = ({
  onCompleteLoop,
  onBack
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#07153B] overflow-hidden relative">
      {onBack && (
        <button
          onClick={onBack}
          type="button"
          className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-black text-xs backdrop-blur-md border border-white/20 shadow-lg transition-all transform active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Back</span>
        </button>
      )}

      {/* Top Section: Increased video height for prominent video display */}
      <div className="relative w-full h-[62%] xs:h-[64%] sm:h-[65%] md:h-[66%] bg-[#081B4B] flex items-center justify-center overflow-hidden shrink-0">
        <video
          src="/images/final-frames/5.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Section: Compact padding with larger impact typography */}
      <div className="w-full flex-1 min-h-0 bg-white px-4 py-3.5 xs:px-5 xs:py-4 sm:px-8 sm:py-5 flex flex-col justify-between items-center text-center shadow-[0_-12px_35px_rgba(0,0,0,0.18)] z-10 shrink-0">
        <div className="w-full max-w-md mx-auto my-auto flex flex-col justify-center items-center">
          <h1 className="text-[25px] xs:text-[28px] sm:text-[34px] md:text-[38px] font-black text-[#0B1B48] tracking-tight leading-[1.16] text-center">
            Itne mein Food Tour nahi,<br />
            sirf <span className="text-[#D4380D]">food trailer</span> banta hai.
          </h1>
        </div>

        {/* Primary CTA Button */}
        <div className="w-full max-w-md mx-auto pt-2 pb-1">
          <button
            onClick={onCompleteLoop}
            type="button"
            className="w-full py-3.5 xs:py-4 sm:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] active:bg-[#a12908] text-white font-black text-lg xs:text-xl sm:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all cursor-pointer border-0"
          >
            EK AUR FOOD JOINT JODO
          </button>
        </div>
      </div>
    </div>
  );
};
