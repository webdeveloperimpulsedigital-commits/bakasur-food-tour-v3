'use client';

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { FrameFooter } from './FrameFooter';

interface Frame7AcidityAppearsProps {
  onAutoAdvance: () => void;
}

export const Frame7AcidityAppears: React.FC<Frame7AcidityAppearsProps> = ({ onAutoAdvance }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(3.5);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = parseFloat((prev - 0.1).toFixed(1));
        return next > 0 ? next : 0;
      });
    }, 100);

    const timeout = setTimeout(() => {
      onAutoAdvance();
    }, 3500);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [onAutoAdvance]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-4 sm:py-6 md:py-8 px-5 sm:px-8 md:px-10 gap-4 sm:gap-6 bg-white">
      {/* Frame Copy Header (Matching Screenshot 2) */}
      <div className="space-y-2">
        <h2 className="text-[26px] xs:text-[28px] sm:text-[34px] md:text-[38px] font-black tracking-tight text-[#0B1B48] leading-[1.12]">
          Plot twist: Pet ne<br />
          <span className="text-[#D4380D]">emergency brake</span> laga di.
        </h2>
        <p className="text-xs sm:text-sm md:text-base font-semibold text-[#0B1B48] leading-snug">
          Khatti dakaarein aur acidity.<br />
          Lagta hai &lsquo;bas ek aur&rsquo; zyada ho gaya.
        </p>
      </div>

      {/* Comic Reaction Auto-advance indicator */}
      <div className="w-full pt-2 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-[#D4380D]">
          <span className="w-2 h-2 rounded-full bg-[#D4380D] animate-ping" />
          <span>Bakasur acidity reaction... ({secondsRemaining.toFixed(1)}s)</span>
        </div>
        <button
          onClick={onAutoAdvance}
          type="button"
          className="text-xs font-black text-[#D4380D] hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>Aage badho</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
};

