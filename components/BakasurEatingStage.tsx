'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, ArrowLeft, Flame } from 'lucide-react';
import { Restaurant, Dish } from '@/lib/db';

import { DishVisualAssets, getDishVisualAssets, getDishExactPlateImage, getDishExactFlyingImage } from '@/lib/dishAssets';
export { getDishVisualAssets, getDishExactPlateImage, getDishExactFlyingImage };
export type { DishVisualAssets };

export function getFlyingDishAsset(dishName?: string, dishImage?: string): { image: string; isCircleCrop: boolean } {
  const visual = getDishVisualAssets(dishName, dishImage);
  return { image: visual.flyingImage, isCircleCrop: false };
}

interface BakasurEatingStageProps {
  dishName?: string;
  dishImage?: string;
  restaurantName?: string;
  restaurant?: Restaurant | null;
  feastingStage?: 1 | 2 | 3;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onBack?: () => void;
  onFeedMore?: () => void;
  onComplete?: () => void;
  onPlayBite?: () => void;
}

// Calibrated bite cycle for food conveyor into Bakasur's mouth
const BITE_CYCLE_MS = 1200; // ms per food item consumed
const TOTAL_STAGE_SECONDS = 10; // auto-advance duration

export const BakasurEatingStage: React.FC<BakasurEatingStageProps> = ({
  dishName = 'Food',
  dishImage,
  soundEnabled = true,
  onToggleSound,
  onBack,
  onComplete,
  onPlayBite
}) => {
  // Active slide index: 0 = "BAKASUR MODE: ON", 1 = "Chef ki shift khatam. Bakasur ki bhookh nahi."
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const [biteFlash, setBiteFlash] = useState<boolean>(false);
  const [cycleProgress, setCycleProgress] = useState<number>(0); // 0 to 1 in each bite cycle
  const [dishesDevouredCount, setDishesDevouredCount] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const cycleStartTimeRef = useRef<number>(performance.now());
  const hasBittenThisCycleRef = useRef<boolean>(false);
  const lastCycleIndexRef = useRef<number>(0);

  // 1. Prepare user's selected dish visual asset
  const selectedDishItem = useMemo(() => {
    const safeDishName = dishName || 'Food';
    const primaryVisual = getDishVisualAssets(safeDishName, dishImage);
    return {
      name: safeDishName,
      image: primaryVisual.flyingImage || '/images/eating/butter_chicken_dish_flying.png'
    };
  }, [dishName, dishImage]);

  // 2. Slide rotation timer: toggles between Slide 1 and Slide 2 every 4 seconds
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 4000);

    return () => clearInterval(slideTimer);
  }, []);

  // 3. Stage 10s countdown to auto-advance to Frame 6
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= TOTAL_STAGE_SECONDS - 1) {
          clearInterval(countdownInterval);
          if (onComplete) onComplete();
          return TOTAL_STAGE_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [onComplete]);

  // 4. Continuous high-fps animation loop for flying food items & bite synchronization
  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      const elapsedTotal = Math.max(0, now - cycleStartTimeRef.current);
      const currentCycleIndex = Math.floor(elapsedTotal / BITE_CYCLE_MS);
      const elapsedInCycle = elapsedTotal % BITE_CYCLE_MS;
      const progress = elapsedInCycle / BITE_CYCLE_MS;
      setCycleProgress(progress);

      if (currentCycleIndex !== lastCycleIndexRef.current) {
        lastCycleIndexRef.current = currentCycleIndex;
        hasBittenThisCycleRef.current = false;
      }

      // Snap crunch bite near end of cycle when food enters mouth cavity (progress >= 0.88)
      if (progress >= 0.88 && !hasBittenThisCycleRef.current) {
        hasBittenThisCycleRef.current = true;
        if (onPlayBite) onPlayBite();
        setBiteFlash(true);
        setTimeout(() => setBiteFlash(false), 220);
        setDishesDevouredCount((prev) => prev + 1);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onPlayBite]);

  // Stream items conveyor calculation:
  // In the 484 x 801 coordinate space:
  // Bakasur mouth opening is at: X = 63.0%, Y = 61.2%
  // Step spacing between flying items = 21.0% of width
  const STEP_PERCENT = 21.0;
  const MOUTH_X_PERCENT = 63.0;

  const itemsToRender = [0, 1, 2, 3].map((slotIndex) => {
    // Current horizontal percent across container:
    // When slotIndex = 0 and cycleProgress approaches 1.0, it arrives at mouth (63%)
    const xPercent = MOUTH_X_PERCENT - (1.0 - cycleProgress) * STEP_PERCENT - slotIndex * STEP_PERCENT;

    let scale = 1.0;
    let opacity = 1.0;

    // As food enters the mouth cavity (from 55% to 63%), scale down and fade into mouth
    if (xPercent >= 55.0) {
      const enterRatio = Math.min(1.0, (xPercent - 55.0) / (MOUTH_X_PERCENT - 55.0));
      scale = Math.max(0.05, 1.0 - enterRatio * 0.9);
      opacity = Math.max(0.0, 1.0 - enterRatio * 0.95);
    } else if (xPercent < 0) {
      // Fade in from left edge
      opacity = Math.max(0.0, (xPercent + 15) / 15);
    }

    return {
      slotIndex,
      xPercent,
      scale,
      opacity
    };
  });

  return (
    <div
      onClick={() => {
        if (onComplete) onComplete();
      }}
      className="relative w-full h-full min-h-full overflow-hidden bg-[#031058] flex items-center justify-center select-none cursor-pointer"
    >
      {/* RESPONSIVE POSTER FRAME (Preserves exact 484 x 801 authentic design proportions) */}
      <div className="relative h-full max-h-full aspect-[484/801] max-w-full flex items-center justify-center overflow-hidden select-none">
        
        {/* SLIDE 1: BAKASUR MODE: ON (Clean artwork with no stray artifacts) */}
        <img
          src="/images/eating/slide1_clean_streamready.png"
          alt="Bakasur Mode: ON"
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-all duration-700 ease-in-out ${
            activeSlide === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-98 pointer-events-none'
          } ${biteFlash ? 'brightness-110' : ''}`}
        />

        {/* SLIDE 2: Chef ki shift khatam. Bakasur ki bhookh nahi. (Clean artwork) */}
        <img
          src="/images/eating/slide2_clean_streamready.png"
          alt="Chef ki shift khatam. Bakasur ki bhookh nahi."
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-all duration-700 ease-in-out ${
            activeSlide === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-98 pointer-events-none'
          } ${biteFlash ? 'brightness-110' : ''}`}
        />

        {/* DYNAMIC FOOD CONVEYOR STREAM */}
        {/* Positioned directly at Bakasur's mouth level (Y = 61.2%) */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {itemsToRender.map(({ slotIndex, xPercent, scale, opacity }) => (
            <div
              key={`food-stream-item-${slotIndex}`}
              className="absolute -translate-y-1/2 flex items-center shrink-0 pointer-events-none"
              style={{
                left: `${xPercent}%`,
                top: '61.2%',
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity,
                transition: 'none'
              }}
            >
              {/* White horizontal speed lines behind flying dish */}
              <div className="flex flex-col gap-0.5 sm:gap-1 items-end justify-center mr-1 sm:mr-1.5 shrink-0 opacity-80">
                <div className="h-[2px] w-3 xs:w-4 sm:w-5 bg-white/70 rounded-full" />
                <div className="h-[2.5px] w-5 xs:w-7 sm:w-9 bg-white/90 rounded-full" />
                <div className="h-[2px] w-4 xs:w-5 sm:w-6 bg-white/60 rounded-full" />
              </div>

              {/* User Selected Dish Flying into Mouth */}
              <img
                src={selectedDishItem.image}
                alt={selectedDishItem.name}
                className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/eating/samosa_hero_clean.png';
                }}
              />
            </div>
          ))}

          {/* CRUNCH BITE IMPACT FLASH AT MOUTH CAVITY */}
          {biteFlash && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
              style={{
                left: `${MOUTH_X_PERCENT}%`,
                top: '61.2%'
              }}
            >
              <div className="w-12 h-12 xs:w-16 xs:h-16 rounded-full bg-amber-300/85 blur-[2px] animate-ping" />
              <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-white shadow-[0_0_16px_#fbbf24]" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
