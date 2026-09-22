'use client';

import React, { useEffect } from 'react';

interface Frame7AcidityAppearsProps {
  onAutoAdvance: () => void;
}

export const Frame7AcidityAppears: React.FC<Frame7AcidityAppearsProps> = ({ onAutoAdvance }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onAutoAdvance();
    }, 3500);

    return () => clearTimeout(timeout);
  }, [onAutoAdvance]);

  return (
    <div
      onClick={onAutoAdvance}
      className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-3.5 sm:py-5 md:py-8 px-5 sm:px-8 md:px-10 gap-2.5 sm:gap-4 bg-white cursor-pointer select-none overflow-y-auto scrollbar-thin"
    >
      {/* Frame Copy Header with Larger, Bolder Typography */}
      <div className="space-y-2.5 sm:space-y-3.5">
        <h2 className="text-[32px] xs:text-[38px] sm:text-[46px] md:text-[52px] font-black tracking-tight text-[#0B1B48] leading-[1.08]">
          Plot twist: Pet ne<br />
          <span className="text-[#D4380D]">emergency brake</span> laga di.
        </h2>
        <p className="text-base xs:text-lg sm:text-xl font-bold text-[#0B1B48]/90 leading-snug">
          Khatti dakaarein aur acidity.<br />
          Lagta hai &lsquo;bas ek aur&rsquo; zyada ho gaya.
        </p>
      </div>
    </div>
  );
};
