'use client';

import React, { useEffect } from 'react';

interface Frame9GastriumAnimationProps {
  onAnimationComplete: () => void;
}

export const Frame9GastriumAnimation: React.FC<Frame9GastriumAnimationProps> = ({ onAnimationComplete }) => {
  const DURATION_MS = 8000; // Calibrated to 7.83s Drinking Gastrium video

  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, DURATION_MS);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div
      onClick={onAnimationComplete}
      className="w-full h-full flex items-center justify-start text-left px-5 sm:px-8 md:px-10 bg-white cursor-pointer select-none"
    >
      {/* ONLY Bold GASTRIUM IN headline exactly matching Design Mockup */}
      <h1 className="text-[44px] xs:text-[54px] sm:text-[64px] md:text-[76px] font-black tracking-tight leading-none uppercase select-none">
        <span className="text-[#071746]">GASTRIUM</span>{' '}
        <span className="text-[#E2370A]">IN</span>
      </h1>
    </div>
  );
};
