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
    <div className="w-full h-full flex flex-col justify-between min-h-0 animate-in fade-in duration-300 gap-2 text-left">
      {/* Top Section: Slanted Badge */}
      <div className="shrink-0 flex items-center justify-between gap-2">
        <div className="inline-block transform -skew-x-12 bg-[#0E2055] px-3.5 py-1 rounded-sm shadow-sm">
          <span className="inline-block transform skew-x-12 text-white font-black text-xs uppercase tracking-wider italic">
            BAKASUR KA FOOD TOUR
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-[#D4380D] font-black text-[10px] uppercase border border-red-200 animate-pulse">
          <Flame className="w-3 h-3 fill-[#D4380D]" />
          <span>Plot Twist</span>
        </span>
      </div>

      {/* Frame Copy Header */}
      <div className="shrink-0">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1B48] brand-font leading-[1.15]">
          Plot twist: Pet ne bhi apna review daal diya.
        </h2>
        <p className="text-xs sm:text-sm text-[#D4380D] font-bold mt-1 leading-snug">
          Khatti dakaarein aur acidity. Lagta hai &lsquo;bas ek aur&rsquo; zyada ho gaya.
        </p>
      </div>

      {/* Bakasur Dialogue Bubble */}
      <div className="my-auto flex flex-col gap-2">
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 sm:p-4 text-left shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0 select-none animate-spin">
              😵‍💫
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D4380D] block mb-0.5">
                Bakasur Tummy Distress:
              </span>
              <p className="text-xs sm:text-sm font-black text-[#0B1B48] leading-snug">
                &ldquo;Khaana mast tha. Main hi flow mein thoda zyada kha gaya.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Comic Reaction Playing Indicator */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Comic reaction playing... ({secondsRemaining.toFixed(1)}s)</span>
          </div>
          <button
            onClick={onAutoAdvance}
            type="button"
            className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Aage badho &rarr;
          </button>
        </div>
      </div>

      {/* Footer */}
      <FrameFooter />
    </div>
  );
};
