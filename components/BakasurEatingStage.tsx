'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { Restaurant } from '@/lib/db';

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

// 3400ms per food consumption cycle (slower, smooth flight from left + bite + relaxed rhythmic chewing)
const BITE_CYCLE_MS = 3400;

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
  const [isSlideTransitioning, setIsSlideTransitioning] = useState<boolean>(false);
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [biteFlash, setBiteFlash] = useState<boolean>(false);
  const [cycleProgress, setCycleProgress] = useState<number>(0); // 0 to 1 in each bite cycle

  const cycleStartTimeRef = useRef<number>(performance.now());
  const hasBittenThisCycleRef = useRef<boolean>(false);
  const lastCycleIndexRef = useRef<number>(0);

  // 1. Prepare user's selected dish visual asset (Strictly the exact selected dish image)
  const selectedDishItem = useMemo(() => {
    const safeDishName = dishName || 'Food';
    let finalImage = '';

    // Prioritize the exact dishImage selected by the user
    if (dishImage && !dishImage.includes('bakasur') && (dishImage.startsWith('/') || dishImage.startsWith('http') || dishImage.startsWith('data:'))) {
      finalImage = dishImage;
    } else {
      const primaryVisual = getDishVisualAssets(safeDishName, dishImage);
      finalImage = primaryVisual.flyingImage || primaryVisual.plateImage;
    }

    return {
      name: safeDishName,
      image: finalImage || '/images/eating/thali_dish.jpg'
    };
  }, [dishName, dishImage]);

  // 2. Preload head-only chewing frames for ultra-smooth mouth animation
  useEffect(() => {
    for (let i = 0; i < 25; i++) {
      const img = new Image();
      img.src = `/images/chewing_head/frame_${String(i).padStart(3, '0')}.webp`;
    }
  }, []);

  // 3. Slide rotation timer: toggles between Slide 1 and Slide 2 every 3.5 seconds
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setIsSlideTransitioning(true);
      setTimeout(() => {
        setActiveSlide((prev) => (prev === 0 ? 1 : 0));
        setIsSlideTransitioning(false);
      }, 250);
    }, 3500);

    return () => clearInterval(slideTimer);
  }, []);

  // 4. Overall stage 10s countdown to auto-advance to Frame 6
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // 5. Continuous animation loop for single-dish flight & mouth chewing synchronization (slower 3400ms cycle)
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

      // Synchronized Mouth Animation:
      // Phase 1 (0 to 55% of cycle): Dish glides in smoothly from left -> Mouth is wide open (Frame 000) anticipating!
      if (progress < 0.55) {
        setFrameIndex(0);
      }
      // Phase 2 (55% to 68% of cycle): Dish enters mouth cavity -> Jaw snaps shut & crunches!
      else if (progress >= 0.55 && progress < 0.68) {
        if (!hasBittenThisCycleRef.current) {
          hasBittenThisCycleRef.current = true;
          if (onPlayBite) onPlayBite();
          setBiteFlash(true);
          setTimeout(() => setBiteFlash(false), 240);
        }

        if (progress < 0.59) {
          setFrameIndex(2);
        } else if (progress < 0.63) {
          setFrameIndex(4);
        } else {
          setFrameIndex(6); // mouth fully closed on food
        }
      }
      // Phase 3 (68% to 92% of cycle): Active relaxed rhythmic chewing
      else if (progress >= 0.68 && progress < 0.92) {
        const chewProgress = (progress - 0.68) / 0.24;
        const chewCycle = (chewProgress * 2.5) % 1;
        const chewFrame = 8 + Math.floor(chewCycle * 13);
        setFrameIndex(chewFrame);
      }
      // Phase 4 (92% to 100% of cycle): Swallows and opens mouth wide again for the next dish
      else {
        if (progress < 0.97) {
          setFrameIndex(22); // swallowing
        } else {
          setFrameIndex(0); // opens wide anticipating next dish!
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onPlayBite]);

  // Dish position & scale as it flies in ONE BY ONE from the left side into mouth:
  // Coordinates are relative to Bakasur's mouth: (0, 0) is the mouth cavity opening
  let dishX = -580;
  let dishScale = 1.0;
  let dishOpacity = 1.0;

  if (cycleProgress < 0.55) {
    // Phase 1: Gliding smoothly from far left into mouth
    const t = cycleProgress / 0.55;
    // Smooth ease-out curve
    const ease = 1 - Math.pow(1 - t, 2.2);
    dishX = -560 * (1 - ease);
    dishScale = 0.8 + ease * 0.3;
    dishOpacity = Math.min(1, t * 3.5);
  } else if (cycleProgress >= 0.55 && cycleProgress < 0.68) {
    // Phase 2: Entering mouth cavity, shrinking & vanishing
    const t = (cycleProgress - 0.55) / 0.13;
    dishX = t * 25; // enters 25px deep into mouth
    dishScale = Math.max(0.01, 1.1 - t * 1.05);
    dishOpacity = Math.max(0, 1.0 - t * 1.25);
  } else {
    // Phase 3 & 4: Food consumed inside mouth, jaw chewing
    dishX = 25;
    dishScale = 0.01;
    dishOpacity = 0;
  }

  return (
    <div
      onClick={() => {
        if (onComplete) onComplete();
      }}
      className="relative w-full h-full min-h-full overflow-hidden bg-[#182858] flex flex-col justify-between select-none cursor-pointer"
    >
      {/* 1. TOP HEADER: Clean brand header matching exact mockup */}
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

        <div className="flex items-center gap-3">
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

        {/* TOP-LEFT HEADLINE BILLBOARD (Strictly left column to guarantee ZERO overlap with Bakasur) */}
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

        {/* RIGHT SIDE: BAKASUR HEAD ONLY (Wider presence, shifted to right edge, clean head only without body) */}
        <div className="absolute -right-2 sm:-right-4 md:-right-6 bottom-0 h-[74%] sm:h-[82%] md:h-[88%] max-h-[520px] sm:max-h-[600px] md:max-h-[680px] aspect-[640/615] flex items-end justify-end pointer-events-none select-none z-10">
          <div className="relative w-full h-full flex items-end justify-end">

            {/* BITE CRUNCH IMPACT SPARK (Subtle flash without distracting text) */}
            {biteFlash && (
              <div className="absolute top-[74.8%] left-[10%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-35">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-300/80 blur-xs animate-ping" />
              </div>
            )}

            {/* SELECTED DISH FEEDING TRACK */}
            {/* Origin (0,0) is calibrated directly at Bakasur's mouth cavity opening (x=64px, y=460px in 640x615 frame) */}
            <div
              className="absolute pointer-events-none z-25"
              style={{
                top: '74.8%',
                left: '10%'
              }}
            >
              {/* THE USER'S EXACT SELECTED FOOD DISH (Coming one by one from left side) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
                style={{
                  left: `${dishX}px`,
                  transform: `translate(-50%, -50%) scale(${dishScale})`,
                  opacity: dishOpacity,
                  transition: 'none'
                }}
              >
                {/* Subtle Horizontal Speed Lines behind food item */}
                <div className="flex flex-col gap-1 items-end justify-center mr-2 sm:mr-2.5 shrink-0 opacity-80">
                  <div className="h-[2px] w-6 sm:w-8 bg-white/70 rounded-full" />
                  <div className="h-[2px] w-10 sm:w-14 bg-white/90 rounded-full" />
                  <div className="h-[2px] w-7 sm:w-10 bg-white/60 rounded-full" />
                </div>

                {/* User-Selected Dish Image (Circular dish with clean border, no dish name tag) */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-slate-900/60 p-0.5 border-2 border-amber-300/80 shadow-[0_4px_20px_rgba(0,0,0,0.8)] shrink-0 flex items-center justify-center">
                  <img
                    src={selectedDishItem.image}
                    alt={selectedDishItem.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/eating/thali_dish.jpg';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* BAKASUR FACE (Head-only chewing animation, body cropped) */}
            <img
              src={`/images/chewing_head/frame_${String(frameIndex).padStart(3, '0')}.webp`}
              alt="Bakasur Chewing Action"
              className={`w-full h-full object-contain object-bottom pointer-events-none transition-transform duration-75 ${
                biteFlash ? 'scale-[1.02] brightness-105' : 'scale-100'
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
