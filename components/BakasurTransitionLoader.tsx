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

export const BakasurTransitionLoader: React.FC<BakasurTransitionLoaderProps> = () => {
  return null;
};