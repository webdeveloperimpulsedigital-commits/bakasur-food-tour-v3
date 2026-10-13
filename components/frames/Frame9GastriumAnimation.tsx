'use client';

import React, { useState, useEffect } from 'react';

interface Frame9GastriumAnimationProps {
  onAnimationComplete: () => void;
}

export const Frame9GastriumAnimation: React.FC<Frame9GastriumAnimationProps> = ({ onAnimationComplete }) => {
  const [showTagline, setShowTagline] = useState<boolean>(false);

  useEffect(() => {
    // 1. Listen for exact video time update (at ~4.0s when blue stomach appears)
    const handleStomachRevealed = () => {
      setShowTagline(true);
    };

    window.addEventListener('gastrium-stomach-revealed', handleStomachRevealed);

    // 2. Fallback timer if event doesn't fire (4.2s based on video keyframe 102 @ 24fps)
    const fallbackTimer = setTimeout(() => {
      setShowTagline(true);
    }, 4200);

    return () => {
      window.removeEventListener('gastrium-stomach-revealed', handleStomachRevealed);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // When tagline appears, ensure it stays for 7.5 to 8 seconds so user can read comfortably
  useEffect(() => {
    if (!showTagline) return;

    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 7500);

    return () => clearTimeout(timer);
  }, [showTagline, onAnimationComplete]);

  return (
    <div
      onClick={onAnimationComplete}
      className="w-full h-full flex items-center justify-center text-center px-4 sm:px-8 md:px-10 bg-white cursor-pointer select-none"
    >
      {!showTagline ? (
        <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-300 px-2">
          <h1 className="text-[38px] xs:text-[46px] sm:text-[54px] md:text-[58px] lg:text-[64px] font-black tracking-tight leading-none uppercase select-none">
            <span className="text-[#071746]">GASTRIUM</span>{' '}
            <span className="text-[#E2370A]">IN</span>
          </h1>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-600 max-w-md mx-auto px-2">
          <h1 className="text-[28px] xs:text-[34px] sm:text-[40px] md:text-[44px] lg:text-[48px] font-black italic tracking-tight text-[#071746] leading-[1.12] select-none text-center">
            Acidity ko bolo<br />
            <span className="text-[#0047BA]">goodnight</span>
          </h1>
        </div>
      )}
    </div>
  );
};
