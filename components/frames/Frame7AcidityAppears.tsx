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
      className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-3 sm:py-5 md:py-8 px-4 sm:px-8 md:px-10 gap-1.5 sm:gap-3 bg-white cursor-pointer select-none overflow-y-auto scrollbar-none"
    >
      {/* Frame Copy Header with Responsive Typography */}
      <div className="space-y-1.5 sm:space-y-2.5">
        <h2 className="text-[22px] xs:text-[26px] sm:text-[36px] md:text-[46px] font-black tracking-tight text-[#0B1B48] leading-[1.1]">
          Plot twist: Pet ne<br />
          <span className="text-[#D4380D]">emergency brake</span> laga di.
        </h2>
        <p className="text-xs xs:text-sm sm:text-lg font-bold text-[#0B1B48]/90 leading-tight">
          Khatti dakaarein aur acidity.<br />
          Lagta hai &lsquo;bas ek aur&rsquo; zyada ho gaya.
        </p>
      </div>
    </div>
  );
};
