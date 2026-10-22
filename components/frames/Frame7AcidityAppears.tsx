'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';

interface Frame7AcidityAppearsProps {
  onAutoAdvance?: () => void;
  onHelpBakasur?: () => void;
  onBack?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  initialStep?: 1 | 2;
  onStepChange?: (step: 1 | 2) => void;
}

export const Frame7AcidityAppears: React.FC<Frame7AcidityAppearsProps> = ({
  onAutoAdvance,
  onHelpBakasur,
  onBack,
  soundEnabled = true,
  onToggleSound,
  initialStep = 1,
  onStepChange
}) => {
  const [contentStep, setContentStep] = useState<1 | 2>(initialStep);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Sync initialStep if passed from parent
  useEffect(() => {
    if (initialStep) {
      setContentStep(initialStep);
    }
  }, [initialStep]);

  // Initial 1.2s delay for full-screen video zoom reveal
  useEffect(() => {
    const revealTimer = setTimeout(() => {
      setIsRevealed(true);
    }, 1200);

    return () => {
      clearTimeout(revealTimer);
    };
  }, []);

  // Smoothly transition from Step 1 to Step 2: stays for a full 5.5 to 6 seconds after reveal
  useEffect(() => {
    if (!isRevealed || contentStep !== 1) return;

    const autoAdvanceTimer = setTimeout(() => {
      setContentStep(2);
      onStepChange?.(2);
    }, 5500);

    return () => {
      clearTimeout(autoAdvanceTimer);
    };
  }, [isRevealed, contentStep, onStepChange]);

  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contentStep === 2) {
      setContentStep(1);
      onStepChange?.(1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleHelpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHelpBakasur) {
      onHelpBakasur();
    } else if (onAutoAdvance) {
      onAutoAdvance();
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-[#07153B] overflow-hidden relative">
      {/* Top Header Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {onBack ? (
          <button
            onClick={handleBackClick}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-black text-xs backdrop-blur-md border border-white/20 shadow-lg transition-all transform active:scale-95 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Back</span>
          </button>
        ) : <div />}
      </div>

      {/* Video Container: Left on Desktop (lg:w-1/2 lg:h-full), Top on Mobile/Tablet */}
      {/* This video continues playing seamlessly across both content phases without interrupting or reloading */}
      <div
        className={`relative w-full lg:w-1/2 bg-[#182858] flex items-center justify-center overflow-hidden shrink-0 transition-all duration-1000 ease-in-out lg:transition-none lg:h-full ${
          isRevealed
            ? 'h-[64%] xs:h-[66%] sm:h-[60%]'
            : 'h-full'
        }`}
      >
        <video
          src="/images/final-frames/Acidity-and-Dakare.mp4"
          autoPlay
          loop
          muted
          playsInline
          className={`w-full h-full object-cover object-top transition-transform duration-1200 ease-in-out lg:scale-100 lg:transition-none ${
            isRevealed ? 'scale-100' : 'scale-115'
          }`}
        />
        <div className="absolute bottom-0 inset-x-0 h-12 lg:hidden bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-20" />
      </div>

      {/* Content Card: Right on Desktop (lg:w-1/2 lg:h-full), Bottom on Mobile/Tablet */}
      <div
        className={`w-full lg:w-1/2 flex-1 lg:h-full bg-white px-4 py-4 xs:px-5 xs:py-5 sm:p-8 lg:p-12 flex flex-col justify-center items-center text-center shadow-[0_-12px_35px_rgba(0,0,0,0.18)] lg:shadow-none rounded-none z-10 shrink-0 lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto lg:transition-none transition-all duration-1000 ease-in-out transform relative overflow-hidden ${
          isRevealed
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Subtle soothing dynamic ambient glow behind content */}
        <div
          className={`absolute w-80 h-40 xs:w-96 xs:h-48 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out ${
            contentStep === 2
              ? 'bg-gradient-to-r from-red-600/15 via-orange-500/20 to-red-600/15 scale-110 opacity-100 animate-pulse'
              : 'bg-gradient-to-r from-amber-500/10 via-orange-500/12 to-red-500/10 scale-95 opacity-80'
          }`}
        />

        {/* ========================================================= */}
        {/* PHASE 1: "Plot twist: Pet ne emergency brake laga di..." */}
        {/* Stays for 5.5 to 6 seconds before transitioning */}
        {/* ========================================================= */}
        <div
          onClick={() => {
            setContentStep(2);
            onStepChange?.(2);
          }}
          className={`absolute inset-0 flex flex-col items-center justify-center p-4 xs:p-6 sm:p-8 cursor-pointer select-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            contentStep === 1
              ? 'opacity-100 scale-100 translate-y-0 blur-0 pointer-events-auto'
              : 'opacity-0 scale-95 -translate-y-10 blur-[3px] pointer-events-none'
          }`}
        >
          <div className="space-y-3 xs:space-y-3.5 sm:space-y-4 max-w-md mx-auto flex flex-col items-center justify-center text-center px-2">
            <p className="text-[15px] xs:text-[17px] sm:text-[20px] md:text-[22px] lg:text-[24px] font-black text-[#0B1B48] leading-snug tracking-tight text-center transition-transform duration-500">
              Plot twist: Pet ne emergency brake laga di.
            </p>
            <h2 className="text-[27px] xs:text-[32px] sm:text-[38px] md:text-[42px] lg:text-[46px] font-black tracking-tight leading-[1.12] text-center drop-shadow-xs">
              <span className="text-[#D4380D] inline-block hover:scale-105 transition-transform duration-300">Acidity</span>{' '}
              <span className="text-black">aur</span><br />
              <span className="text-[#D4380D] inline-block hover:scale-105 transition-transform duration-300">khatti dakaarein.</span>
            </h2>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PHASE 2: "Ab Bhookasur ko khaana nahi..." + [HELP BHOOKASUR] */}
        {/* Smooth spring slide-up and glow entrance */}
        {/* ========================================================= */}
        <div
          className={`absolute inset-0 flex flex-col justify-between items-center text-center p-4 xs:p-6 sm:p-8 transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 ${
            contentStep === 2
              ? 'opacity-100 scale-100 translate-y-0 blur-0 pointer-events-auto'
              : 'opacity-0 scale-95 translate-y-10 blur-[3px] pointer-events-none'
          }`}
        >
          {/* Headline centered with high contrast */}
          <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center text-center">
            <h1 className="text-[22px] xs:text-[25px] sm:text-[29px] md:text-[32px] lg:text-[36px] font-black text-[#0B1B48] tracking-tight leading-[1.22] text-center">
              Ab Bhookasur ko khaana nahi,<br />
              tumhari <span className="text-[#D4380D]">help</span> chahiye.
            </h1>
          </div>

          {/* Primary CTA: HELP BHOOKASUR with glowing bounce & shine */}
          <div className="shrink-0 w-full max-w-sm sm:max-w-md mx-auto pt-2 pb-1">
            <button
              onClick={handleHelpClick}
              type="button"
              className="relative w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] active:bg-[#a12908] text-white font-black text-lg xs:text-xl sm:text-2xl uppercase tracking-wider shadow-xl shadow-[#D4380D]/40 hover:shadow-2xl hover:shadow-[#D4380D]/60 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0 overflow-hidden group"
            >
              <span className="relative z-10">HELP BHOOKASUR</span>
              {/* Subtle light sweep animation on button */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
