'use client';

import React from 'react';

interface Frame8HelpBakasurProps {
  onHelpBakasur: () => void;
}

export const Frame8HelpBakasur: React.FC<Frame8HelpBakasurProps> = ({ onHelpBakasur }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between items-start text-left animate-in fade-in duration-300 py-3.5 xs:py-4 sm:py-6 px-4 xs:px-5 sm:px-8 gap-2 bg-white overflow-hidden">
      {/* Headline with enlarged impact font */}
      <div className="w-full my-auto space-y-1">
        <h1 className="text-[25px] xs:text-[29px] sm:text-[38px] md:text-[46px] font-black text-[#0B1B48] tracking-tight leading-[1.15]">
          Ab Bhookasur ko khaana nahi,<br />
          tumhari <span className="text-[#D4380D]">help</span> chahiye.
        </h1>
      </div>

      {/* Primary CTA: HELP BHOOKASUR */}
      <div className="shrink-0 w-full pt-1 pb-1">
        <button
          onClick={onHelpBakasur}
          type="button"
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] active:bg-[#a12908] text-white font-black text-lg xs:text-xl sm:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          HELP BHOOKASUR
        </button>
      </div>
    </div>
  );
};
