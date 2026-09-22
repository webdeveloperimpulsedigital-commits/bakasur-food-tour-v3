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
      className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-6 sm:py-8 md:py-10 px-5 sm:px-8 md:px-10 gap-3.5 sm:gap-5 bg-white cursor-pointer select-none overflow-y-auto scrollbar-thin"
    >
      {/* Frame Copy Header with Larger, Bolder Typography */}
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-[30px] xs:text-[34px] sm:text-[40px] md:text-[44px] font-black tracking-tight text-[#0B1B48] leading-[1.10]">
          Plot twist: Pet ne<br />
          <span className="text-[#D4380D]">emergency brake</span> laga di.
        </h2>
        <p className="text-sm xs:text-base sm:text-lg font-bold text-[#0B1B48] leading-snug">
          Khatti dakaarein aur acidity.<br />
          Lagta hai &lsquo;bas ek aur&rsquo; zyada ho gaya.
        </p>
      </div>
    </div>
  );
};
