'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';

interface Frame7AcidityAppearsProps {
  onAutoAdvance: () => void;
  onBack?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Frame7AcidityAppears: React.FC<Frame7AcidityAppearsProps> = ({
  onAutoAdvance,
  onBack,
  soundEnabled = true,
  onToggleSound
}) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Initial 1.2s delay for full-screen video zoom reveal, then auto advance after 6s
  useEffect(() => {
    const revealTimer = setTimeout(() => {
      setIsRevealed(true);
    }, 1200);

    const autoAdvanceTimer = setTimeout(() => {
      onAutoAdvance();
    }, 6000);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(autoAdvanceTimer);
    };
  }, [onAutoAdvance]);

  return (
    <div className="w-full h-full flex flex-col bg-[#07153B] overflow-hidden relative">
      {/* Top Header Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {onBack ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-black text-xs backdrop-blur-md border border-white/20 shadow-lg transition-all transform active:scale-95 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Back</span>
          </button>
        ) : <div />}
      </div>

      {/* Top Section: Fire Video Container (Increased height for prominent character display) */}
      <div
        className={`relative w-full bg-[#182858] flex items-center justify-center overflow-hidden shrink-0 transition-all duration-1000 ease-in-out ${
          isRevealed
            ? 'h-[64%] xs:h-[66%] sm:h-[68%]'
            : 'h-full'
        }`}
      >
        <video
          src="/images/final-frames/Acidity-and-Dakare.mp4"
          autoPlay
          loop
          muted
          playsInline
          className={`w-full h-full object-cover object-top transition-transform duration-1200 ease-in-out ${
            isRevealed ? 'scale-100' : 'scale-115'
          }`}
        />
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-20" />
      </div>

      {/* Bottom Section: White Content Card with Enlarged Typography */}
      <div
        onClick={onAutoAdvance}
        className={`w-full flex-1 bg-white px-4 py-4 xs:px-5 xs:py-5 sm:p-8 flex flex-col justify-center items-start text-left shadow-[0_-12px_35px_rgba(0,0,0,0.18)] rounded-none z-10 shrink-0 cursor-pointer transition-all duration-1000 ease-in-out transform ${
          isRevealed
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="space-y-1.5 xs:space-y-2.5 sm:space-y-3.5 max-w-2xl my-auto">
          <h2 className="text-[28px] xs:text-[32px] sm:text-[42px] md:text-[52px] font-black tracking-tight text-[#0B1B48] leading-[1.12]">
            Plot twist: Pet ne<br />
            <span className="text-[#D4380D]">emergency brake</span> laga di.
          </h2>
          <p className="text-xl xs:text-2xl sm:text-3xl md:text-3xl font-extrabold text-[#0B1B48]/90 leading-snug">
            Khatti dakaarein aur acidity.
          </p>
        </div>
      </div>
    </div>
  );
};
