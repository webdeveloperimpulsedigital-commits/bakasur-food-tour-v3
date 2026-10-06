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

        {onToggleSound && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSound();
            }}
            type="button"
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Top Section: Fire Video Container (Starts full-height & zoomed-in, then shrinks to h-[58%] and zooms out) */}
      <div
        className={`relative w-full bg-[#182858] flex items-center justify-center overflow-hidden shrink-0 transition-all duration-1000 ease-in-out ${
          isRevealed
            ? 'h-[55%] xs:h-[58%] sm:h-[60%]'
            : 'h-full'
        }`}
      >
        <video
          src="/images/all-frames/Fire on stomach v2.mp4"
          autoPlay
          loop
          muted={!soundEnabled}
          playsInline
          className={`w-full h-full object-cover object-center transition-transform duration-1200 ease-in-out ${
            isRevealed ? 'scale-100' : 'scale-115'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-red-600/40 via-orange-600/20 to-transparent pointer-events-none z-20 animate-flame-volcano" />
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-20" />
      </div>

      {/* Bottom Section: White Content Card (Slides up smoothly from bottom) */}
      <div
        onClick={onAutoAdvance}
        className={`w-full flex-1 bg-white p-5 xs:p-6 sm:p-8 flex flex-col justify-center items-start text-left shadow-[0_-12px_35px_rgba(0,0,0,0.18)] rounded-none z-10 shrink-0 cursor-pointer transition-all duration-1000 ease-in-out transform ${
          isRevealed
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="space-y-2 sm:space-y-3.5 max-w-2xl my-auto">
          <h2 className="text-[26px] xs:text-[30px] sm:text-[40px] md:text-[50px] font-black tracking-tight text-[#0B1B48] leading-[1.15]">
            Plot twist: Pet ne<br />
            <span className="text-[#D4380D]">emergency brake</span> laga di.
          </h2>
          <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0B1B48]/90 leading-snug mt-2">
            Khatti dakaarein aur acidity.
          </p>
        </div>
      </div>
    </div>
  );
};
