'use client';

import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { FrameFooter } from './FrameFooter';

interface Frame8HelpBakasurProps {
  onHelpBakasur: () => void;
}

export const Frame8HelpBakasur: React.FC<Frame8HelpBakasurProps> = ({ onHelpBakasur }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-start text-left animate-in fade-in duration-300 py-3.5 sm:py-5 md:py-8 px-5 sm:px-8 md:px-10 gap-3 sm:gap-5 bg-white overflow-y-auto scrollbar-thin">
      {/* 2. Headline matching Image 2 mockup */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-[32px] xs:text-[36px] sm:text-[44px] md:text-[50px] font-black text-[#0B1B48] tracking-tight leading-[1.08]">
          Ab Bakasur ko khaana nahi,<br />
          tumhari <span className="text-[#D4380D]">help</span> chahiye.
        </h1>
      </div>

      {/* 3. Primary CTA: HELP BAKASUR */}
      <div className="shrink-0 w-full pt-1 sm:pt-2">
        <button
          onClick={onHelpBakasur}
          type="button"
          className="w-full py-3.5 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-lg xs:text-xl sm:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          HELP BAKASUR
        </button>
      </div>
    </div>
  );
};
