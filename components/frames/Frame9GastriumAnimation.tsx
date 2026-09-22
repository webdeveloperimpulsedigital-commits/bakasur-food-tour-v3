'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Frame9GastriumAnimationProps {
  onAnimationComplete: () => void;
}

export const Frame9GastriumAnimation: React.FC<Frame9GastriumAnimationProps> = ({ onAnimationComplete }) => {
  const [progress, setProgress] = useState(0);
  const DURATION_MS = 4000;
  const INTERVAL_MS = 50;

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed >= DURATION_MS) {
        clearInterval(interval);
        onAnimationComplete();
      }
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [onAnimationComplete]);

  return (
    <div
      onClick={onAnimationComplete}
      className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 gap-6 sm:gap-8 cursor-pointer select-none"
    >
      {/* 2. Main Title: GASTRIUM IN - Exactly matching User Mockup 1 */}
      <div className="w-full flex flex-col items-start justify-center pt-2 sm:pt-4">
        <h1 className="text-[44px] xs:text-[52px] sm:text-[60px] md:text-[72px] font-black tracking-tight leading-none uppercase select-none">
          <span className="text-[#0B1B48]">GASTRIUM</span>{' '}
          <span className="text-[#D4380D]">IN</span>
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-500 mt-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Rahat ka dose shuru ho raha hai...</span>
        </p>
      </div>

      {/* 3. Progress Bar & Tap Hint */}
      <div className="w-full space-y-2 pt-2">
        <div className="w-full bg-slate-100 rounded-full h-2 sm:h-2.5 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#0B1B48] via-[#D4380D] to-[#D4380D] rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>Taking effect...</span>
          <span className="flex items-center gap-1 text-[#D4380D] hover:underline">
            Tap anywhere to skip <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
