'use client';

import React, { useState, useEffect } from 'react';
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
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  useEffect(() => {
    // Initial 1.2s delay: full-screen video with zoom, then video zooms out & content card slides up
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

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

      {/* Top Section: Video starts full height (h-full) and zoomed-in, then smoothly shrinks to h-[58%] and zooms out */}
      <div
        className={`relative w-full bg-[#0B1838] flex items-center justify-center overflow-hidden shrink-0 transition-all duration-1000 ease-in-out ${
          isRevealed
            ? 'h-[55%] xs:h-[58%] sm:h-[60%]'
            : 'h-full'
        }`}
      >
        <video
          src="/images/all-frames/Showing Empty Plate.mp4"
          autoPlay
          loop
          muted
          playsInline
          className={`w-full h-full object-cover object-center transition-transform duration-1200 ease-in-out ${
            isRevealed ? 'scale-100' : 'scale-115'
          }`}
        />
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Section: Content card slides up smoothly from bottom */}
      <div
        className={`w-full flex-1 bg-white p-5 xs:p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-[0_-12px_35px_rgba(0,0,0,0.18)] rounded-none z-10 shrink-0 transition-all duration-1000 ease-in-out transform ${
          isRevealed
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-lg mx-auto my-auto flex flex-col justify-center items-center space-y-3 sm:space-y-4">
          <h1 className="text-[24px] xs:text-[28px] sm:text-[36px] md:text-[42px] font-black text-[#0B1B48] tracking-tight leading-[1.18] text-center">
            Itne mein <span className="text-[#0B1B48]">Food Tour</span> nahi,<br />
            sirf <span className="text-[#D4380D]">food trailer</span> banta hai.
          </h1>
        </div>

        {/* Primary CTA Button */}
        <div className="w-full max-w-lg mx-auto pt-2 pb-1">
          <button
            onClick={onCompleteLoop}
            type="button"
            className="w-full py-4 xs:py-4.5 sm:py-5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] active:bg-[#a12908] text-white font-black text-xl xs:text-2xl sm:text-3xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all cursor-pointer border-0"
          >
            AUR KHILAO
          </button>
        </div>
      </div>
    </div>
  );
};
