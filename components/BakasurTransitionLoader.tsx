'use client';

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface BakasurTransitionLoaderProps {
  isOpen: boolean;
  targetFrame?: number;
  customMessage?: string;
  onFinish?: () => void;
  durationMs?: number; // 3.5 seconds duration
}

export const BakasurTransitionLoader: React.FC<BakasurTransitionLoaderProps> = ({
  isOpen,
  onFinish,
  durationMs = 3500
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isOpen, durationMs, onFinish]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-white select-none animate-in fade-in duration-200">
      {/* ONLY Spinner Loader Icon on White Background */}
      <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 text-[#D4380D] animate-spin stroke-[2.5]" />
    </div>
  );
};
