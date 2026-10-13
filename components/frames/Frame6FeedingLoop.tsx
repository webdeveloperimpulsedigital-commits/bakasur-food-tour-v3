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
  onWatchVideo?: () => void;
}

export const Frame6FeedingLoop: React.FC<Frame6FeedingLoopProps> = ({
  onCompleteLoop,
  onBack,
  onWatchVideo
}) => {
  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-[#07153B] overflow-hidden relative">
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

      {/* Video Section: Left on Desktop (lg:w-1/2 lg:h-full), Top on Mobile/Tablet */}
      <div className="relative w-full lg:w-1/2 h-[62%] xs:h-[64%] sm:h-[60%] lg:h-full bg-[#081B4B] flex items-center justify-center overflow-hidden shrink-0">
        <video
          src="/images/final-frames/5.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute bottom-0 inset-x-0 h-10 lg:hidden bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
      </div>

      {/* Content Section: Right on Desktop (lg:w-1/2 lg:h-full), Bottom on Mobile/Tablet */}
      <div className="w-full lg:w-1/2 flex-1 lg:h-full min-h-0 bg-white px-4 py-4 xs:px-5 xs:py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-12 flex flex-col justify-between items-center text-center shadow-[0_-12px_35px_rgba(0,0,0,0.18)] lg:shadow-none z-10 shrink-0">
        <div className="hidden lg:block w-full h-4" />
        <div className="w-full max-w-md mx-auto my-auto flex flex-col justify-center items-center">
          <h1 className="text-[24px] xs:text-[26px] sm:text-[30px] md:text-[34px] font-black text-[#0B1B48] tracking-tight leading-[1.18] text-center">
            Itne mein Food Tour nahi,<br />
            sirf <span className="text-[#D4380D]">food trailer</span> banta hai.
          </h1>
        </div>

        {/* Primary CTA Button & Secondary CTA Button */}
        <div className="w-full max-w-md mx-auto pt-2 pb-1 md:pb-4 flex flex-col gap-2.5 sm:gap-3">
          <button
            onClick={onCompleteLoop}
            type="button"
            className="w-full py-3.5 xs:py-4 sm:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] active:bg-[#a12908] text-white font-black text-lg xs:text-xl sm:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all cursor-pointer border-0"
          >
            EK AUR FOOD JOINT JODO
          </button>

          {onWatchVideo && (
            <button
              onClick={onWatchVideo}
              type="button"
              className="w-full py-3 sm:py-3.5 px-5 rounded-xl sm:rounded-2xl bg-[#0B1B48] hover:bg-[#071333] active:bg-[#040c22] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
            >
              <span>DEKHO BHOOKASUR NE AUR KYA KHAYA</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
