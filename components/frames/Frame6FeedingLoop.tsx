'use client';

import React, { useState, useEffect } from 'react';
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
  const [secondsRemaining, setSecondsRemaining] = useState(10.0);

  // Auto-advance to next frame (Frame 7 - Acidity Appears) after 10 seconds if user doesn't click "AUR KHILAO"
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = parseFloat((prev - 0.1).toFixed(1));
        return next > 0 ? next : 0;
      });
    }, 100);

    const timeout = setTimeout(() => {
      onCompleteLoop();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onCompleteLoop]);

  const progressPercent = Math.min(100, Math.max(0, ((10 - secondsRemaining) / 10) * 100));

  return (
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8 gap-5 sm:gap-6 md:gap-8">
      {/* 2. Headline matching Image 1: Itne mein Food Tour nahi, sirf food trailer banta hai */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-[26px] xs:text-[30px] sm:text-[34px] md:text-[40px] font-black text-[#0B1B48] tracking-tight leading-[1.15]">
          Itne mein Food Tour nahi,<br />
          sirf <span className="text-[#D4380D]">food trailer</span> banta hai.
        </h1>
      </div>

      {/* 3. Primary CTA: AUR KHILAO */}
      <div className="shrink-0 w-full pt-1 sm:pt-2 space-y-3">
        <button
          onClick={onCompleteLoop}
          type="button"
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-base sm:text-lg md:text-xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          AUR KHILAO
        </button>

        {/* 10s Auto-Advance Progress & Timer Indicator */}
        <div className="w-full space-y-1.5 px-1">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-[#D4380D] transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-semibold">
            <div className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4380D] animate-ping" />
              <span>Next up in {Math.ceil(secondsRemaining)}s</span>
            </div>
            <span className="text-slate-400 font-medium">Tap button to skip</span>
          </div>
        </div>
      </div>
    </div>
  );
};
