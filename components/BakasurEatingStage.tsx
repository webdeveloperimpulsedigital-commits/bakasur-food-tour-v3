'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';
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

// Calibrated cycle for streaming food items into mouth
const BITE_CYCLE_MS = 1350; // ms per food item consumed
const SPACING_PX = 100; // distance between consecutive flying items in the flight path

export const BakasurEatingStage: React.FC<BakasurEatingStageProps> = ({
  dishName = 'Samosa',
  dishImage,
  soundEnabled = true,
  onToggleSound,
  onBack,
  onComplete,
  onPlayBite
}) => {
  // Active slide index: 0 = "BAKASUR MODE: ON", 1 = "Chef ki shift khatam. Bakasur ki bhookh nahi."
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const [isSlideTransitioning, setIsSlideTransitioning] = useState<boolean>(false);
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [biteFlash, setBiteFlash] = useState<boolean>(false);
  const [cycleProgress, setCycleProgress] = useState<number>(0); // 0 to 1 in each bite cycle
  const [dishesDevouredCount, setDishesDevouredCount] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);

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

  // 2. Preload chewing frames for ultra-smooth mouth animation
  useEffect(() => {
    for (let i = 0; i < 25; i++) {
      const img = new Image();
      img.src = `/images/chewing/frame_${String(i).padStart(3, '0')}.webp`;
    }
  }, []);

  // 3. Slide rotation timer: toggles between Slide 1 and Slide 2 every 4 seconds
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setIsSlideTransitioning(true);
      setTimeout(() => {
        setActiveSlide((prev) => (prev === 0 ? 1 : 0));
        setIsSlideTransitioning(false);
      }, 250);
    }, 4000);

    return () => clearInterval(slideTimer);
  }, []);

  // 4. Overall stage 10s countdown to auto-advance to Frame 6
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [onComplete]);

  // 5. Continuous high-fps animation loop for flying samosas & mouth synchronization
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

      // Mouth phases synchronized with food approach:
      // Phase 1 (0 to 65% of cycle): Food approaching -> Mouth is wide open (Frame 000) anticipating!
      if (progress < 0.65) {
        setFrameIndex(0);
      }
      // Phase 2 (65% to 82% of cycle): Leading samosa enters mouth -> Jaw snaps shut & crunches!
      else if (progress >= 0.65 && progress < 0.82) {
        if (!hasBittenThisCycleRef.current) {
          hasBittenThisCycleRef.current = true;
          if (onPlayBite) onPlayBite();
          setBiteFlash(true);
          setTimeout(() => setBiteFlash(false), 200);
          setDishesDevouredCount((prev) => prev + 1);
        }

        if (progress < 0.72) {
          setFrameIndex(2);
        } else if (progress < 0.78) {
          setFrameIndex(4);
        } else {
          setFrameIndex(6); // mouth fully closed on food
        }
      }
      // Phase 3 (82% to 94% of cycle): Quick energetic chewing
      else if (progress >= 0.82 && progress < 0.94) {
        const chewProgress = (progress - 0.82) / 0.12;
        const chewFrame = 8 + Math.floor(chewProgress * 10);
        setFrameIndex(chewFrame);
      }
      // Phase 4 (94% to 100% of cycle): Swallows and opens mouth wide again for next samosa
      else {
        setFrameIndex(progress > 0.97 ? 0 : 22);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onPlayBite]);

  // Calculate 3-samosa stream offsets:
  // Each samosa i has offset x = - (i * SPACING_PX) + (cycleProgress * SPACING_PX)
  // When i = 0 reaches 0px, it enters mouth. As progress -> 1, samosa 0 shrinks & disappears into mouth.
  const samosasToRender = [0, 1, 2, 3].map((slotIndex) => {
    // Current horizontal offset relative to mouth center (0px is mouth center)
    const baseOffset = -slotIndex * SPACING_PX + cycleProgress * SPACING_PX;

    // Calculate scale and opacity for leading samosa (when baseOffset > -20px entering mouth)
    let scale = 1.0;
    let opacity = 1.0;

    if (baseOffset > -25) {
      const enterRatio = Math.min(1, Math.max(0, (baseOffset + 25) / 25));
      scale = Math.max(0.02, 1.0 - enterRatio * 0.95);
      opacity = Math.max(0, 1.0 - enterRatio * 1.1);
    } else if (baseOffset < -320) {
      // Fade in as it enters from far left
      opacity = Math.max(0, 1 - (-320 - baseOffset) / 50);
    }

    return {
      slotIndex,
      x: baseOffset,
      scale,
      opacity
    };
  });

  return (
    <div
      onClick={() => {
        if (onComplete) onComplete();
      }}
      className="relative w-full h-full min-h-full overflow-hidden bg-[#182858] flex flex-col justify-between select-none cursor-pointer"
    >

      {/* 1. TOP HEADER: Clean brand header matching mockup */}
      <div className="relative z-40 px-6 sm:px-8 pt-7 sm:pt-9 flex items-center justify-between text-white w-full">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              type="button"
              className="p-1 -ml-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
          <span className="font-extrabold text-[12px] sm:text-[14px] uppercase tracking-[0.16em] text-white drop-shadow-sm font-sans">
            BAKASUR KA FOOD TOUR
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleSound && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSound();
              }}
              type="button"
              aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-yellow-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-white/70" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN CANVAS ARENA */}
      <div className="relative flex-1 w-full h-full overflow-hidden">

        {/* TOP-LEFT HEADLINE BILLBOARD (Strictly left column to guarantee ZERO overlap with Bakasur's horn) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setActiveSlide(activeSlide === 0 ? 1 : 0);
          }}
          className="absolute left-5 sm:left-8 top-3 sm:top-5 z-20 max-w-[48%] xs:max-w-[50%] sm:max-w-[52%] cursor-pointer select-none"
        >
          <div
            className={`transition-all duration-300 transform ${isSlideTransitioning
                ? 'opacity-0 -translate-y-2 scale-[0.98]'
                : 'opacity-100 translate-y-0 scale-100'
              }`}
          >
            {activeSlide === 0 ? (
              /* SLIDE 1: BAKASUR MODE: ON */
              <div className="font-black text-[28px] xs:text-[34px] sm:text-[44px] md:text-[54px] text-white leading-[0.93] tracking-tight uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                <div>BAKASUR</div>
                <div>MODE:</div>
                <div className="text-[#E2370A] drop-shadow-[0_4px_24px_rgba(226,55,10,0.6)]">ON</div>
              </div>
            ) : (
              /* SLIDE 2: Chef ki shift khatam. Bakasur ki bhookh nahi. */
              <div className="font-black text-[20px] xs:text-[24px] sm:text-[32px] md:text-[40px] text-white leading-[1.08] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                <div>Chef ki shift</div>
                <div>khatam.</div>
                <div>Bakasur ki</div>
                <div>
                  <span className="text-[#E2370A] drop-shadow-[0_4px_24px_rgba(226,55,10,0.6)]">bhookh</span> nahi.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: BAKASUR HEAD-ONLY CHARACTER (Exact Reference Mockup Cutout, NO BODY/CHEST) */}
        {/* Anchored to right edge, upper-middle vertical alignment leaving bottom ~22% empty dark blue space */}
        <div className="absolute right-0 top-[14%] sm:top-[12%] md:top-[10%] h-[60%] sm:h-[64%] md:h-[68%] aspect-[295/530] pointer-events-none select-none z-10">
          <div className="relative w-full h-full">

            {/* FLYING FOOD HORIZONTAL STREAM (Streams User-Selected Dish) */}
            {/* Calibrated directly at Bakasur's mouth cavity: top: 72.2%, left: 35.6% of the 295x530 head */}
            <div
              className="absolute pointer-events-none z-25"
              style={{
                top: '72.2%',
                left: '35.6%'
              }}
            >
              {samosasToRender.map(({ slotIndex, x, scale, opacity }) => (
                <div
                  key={`food-stream-${slotIndex}`}
                  className="absolute top-1/2 -translate-y-1/2 flex items-center shrink-0 pointer-events-none"
                  style={{
                    left: `${x}px`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    opacity,
                    transition: 'none'
                  }}
                >
                  {/* Clean Horizontal White Speed Lines behind food item (Matching Mockup) */}
                  <div className="flex flex-col gap-1 items-end justify-center mr-1.5 sm:mr-2 shrink-0">
                    <div className="h-[2px] sm:h-[2.5px] w-4 sm:w-6 bg-white/70 rounded-full" />
                    <div className="h-[2.5px] sm:h-[3px] w-7 sm:w-11 bg-white/90 rounded-full" />
                    <div className="h-[2px] sm:h-[2.5px] w-5 sm:w-8 bg-white/60 rounded-full" />
                  </div>

                  {/* User-Selected Dish Cutout Flying into Mouth */}
                  <img
                    src={selectedDishItem.image}
                    alt={selectedDishItem.name}
                    className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain rounded-full select-none pointer-events-none drop-shadow-md shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/eating/butter_chicken_dish_flying.png';
                    }}
                  />
                </div>
              ))}

              {/* BITE CRUNCH IMPACT FLASH */}
              {biteFlash && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-300/80 blur-xs animate-ping" />
                </div>
              )}
            </div>

            {/* BAKASUR HEAD-ONLY IMAGE (Matching Mockup with Horn, Earring, Open Mouth & Clean Neck Cutoff) */}
            <img
              src="/images/eating/bakasur_head_only_transparent.png"
              alt="Bakasur"
              className={`w-full h-full object-contain pointer-events-none transition-transform duration-100 ${biteFlash ? 'scale-[1.03] brightness-110' : 'scale-100'
                }`}
            />
          </div>
        </div>

      </div>

      {/* Subtle bottom padding */}
      <div className="relative z-40 p-3 sm:p-4 w-full pointer-events-none" />

    </div>
  );
};

