'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, ArrowLeft, Flame } from 'lucide-react';
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

const TOTAL_STAGE_SECONDS = 10; // auto-advance duration
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
  const [biteFlash, setBiteFlash] = useState<boolean>(false);
  const [cycleProgress, setCycleProgress] = useState<number>(0); // 0 to 1 in each bite cycle
  const [dishesDevouredCount, setDishesDevouredCount] = useState<number>(0);
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const cycleStartTimeRef = useRef<number>(performance.now());
  const hasBittenThisCycleRef = useRef<boolean>(false);
  const lastCycleIndexRef = useRef<number>(0);

  // 1. Prepare user's selected dish visual asset (Strictly matches the exact selected dish)
  const selectedDishItem = useMemo(() => {
    const safeDishName = dishName || 'Food';
    const visual = getDishVisualAssets(safeDishName, dishImage);
    const resolvedImage = visual.flyingImage || visual.plateImage || dishImage;

    return {
      name: safeDishName,
      image: resolvedImage || '/images/eating/bhakri_bhaji_dish_flying.png'
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

  // 5. Continuous high-fps animation loop for single-dish flight & mouth chewing synchronization
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
      // Phase 1 (0 to 60% of cycle): Dish flies in from left -> Mouth is wide open (Frame 000) anticipating!
      if (progress < 0.60) {
        setFrameIndex(0);
      }
      // Phase 2 (60% to 72% of cycle): Dish enters mouth -> Jaw snaps shut & crunches!
      else if (progress >= 0.60 && progress < 0.72) {
        if (!hasBittenThisCycleRef.current) {
          hasBittenThisCycleRef.current = true;
          if (onPlayBite) onPlayBite();
          setBiteFlash(true);
          setTimeout(() => setBiteFlash(false), 220);
          setDishesDevouredCount((prev) => prev + 1);
        }

        if (progress < 0.64) {
          setFrameIndex(2);
        } else if (progress < 0.68) {
          setFrameIndex(4);
        } else {
          setFrameIndex(6); // mouth fully closed on food
        }
      }
      // Phase 3 (72% to 92% of cycle): Active energetic chewing
      else if (progress >= 0.72 && progress < 0.92) {
        const chewProgress = (progress - 0.72) / 0.20;
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
  let dishX = -420;
  let dishScale = 1.0;
  let dishOpacity = 1.0;

  if (cycleProgress < 0.60) {
    // Phase 1: Gliding smoothly from far left into mouth
    const t = cycleProgress / 0.60;
    // Smooth ease-out curve
    const ease = 1 - Math.pow(1 - t, 2.2);
    dishX = -420 * (1 - ease);
    dishScale = 0.75 + ease * 0.35;
    dishOpacity = Math.min(1, t * 3.5);
  } else if (cycleProgress >= 0.60 && cycleProgress < 0.72) {
    // Phase 2: Entering mouth cavity, shrinking & vanishing
    const t = (cycleProgress - 0.60) / 0.12;
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
      className="relative w-full h-full min-h-full overflow-hidden bg-[#031058] flex flex-col justify-between select-none cursor-pointer"
    >
      {/* 1. TOP HEADER: Clean brand header matching mockup */}
      <div className="relative z-40 px-4 xs:px-6 sm:px-8 pt-4 xs:pt-6 sm:pt-8 pb-2 flex items-center justify-between text-white w-full shrink-0">
        <div className="flex items-center gap-2 xs:gap-3">
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

        <div className="flex items-center gap-2 xs:gap-3">
          {/* Devoured dishes badge */}
          <div className="flex items-center gap-1.5 px-2.5 xs:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] xs:text-xs font-black shadow-md">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
            <span>Devoured: {dishesDevouredCount}</span>
          </div>

          {onToggleSound && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSound();
              }}
              type="button"
              aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
              className="p-1.5 xs:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15"
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
      <div className="relative flex-1 w-full min-h-0 overflow-hidden">

        {/* TOP-LEFT HEADLINE BILLBOARD (Strictly left column to guarantee ZERO overlap with Bakasur) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setActiveSlide(activeSlide === 0 ? 1 : 0);
          }}
          className="absolute left-4 xs:left-6 sm:left-8 top-2 xs:top-3 sm:top-5 z-20 max-w-[55%] xs:max-w-[50%] sm:max-w-[52%] cursor-pointer select-none"
        >
          <div
            className={`transition-all duration-300 transform ${isSlideTransitioning
              ? 'opacity-0 -translate-y-2 scale-[0.98]'
              : 'opacity-100 translate-y-0 scale-100'
              }`}
          >
            {activeSlide === 0 ? (
              /* SLIDE 1: BAKASUR MODE: ON */
              <div className="font-black text-[26px] xs:text-[32px] sm:text-[44px] md:text-[54px] text-white leading-[0.93] tracking-tight uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                <div>BAKASUR</div>
                <div>MODE:</div>
                <div className="text-[#E2370A] drop-shadow-[0_4px_24px_rgba(226,55,10,0.6)]">ON</div>
              </div>
            ) : (
              /* SLIDE 2: Chef ki shift khatam. Bakasur ki bhookh nahi. */
              <div className="font-black text-[18px] xs:text-[22px] sm:text-[32px] md:text-[40px] text-white leading-[1.08] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
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

        {/* RIGHT SIDE: BAKASUR WITH SYNCHRONIZED CHEWING & MOUTH ANIMATION */}
        <div className="absolute -right-6 xs:-right-10 sm:-right-14 md:-right-20 lg:-right-24 bottom-0 h-[84%] xs:h-[88%] sm:h-[93%] md:h-[98%] max-h-[740px] aspect-[640/800] flex items-end justify-end pointer-events-none select-none z-10">
          <div className="relative w-full h-full flex items-end justify-end">

            {/* BITE CRUNCH IMPACT SPARK & CHOMP FLASH */}
            {biteFlash && (
              <div className="absolute top-[48.8%] left-[8.8%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-35">
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-amber-300/90 blur-xs animate-ping" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-sm sm:text-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] whitespace-nowrap">
                  CHOMP! 💥
                </div>
              </div>
            )}

            {/* SELECTED DISH FEEDING TRACK */}
            {/* Origin (0,0) is calibrated directly at Bakasur's mouth cavity opening (x=56px, y=390px in 640x800 frame) */}
            <div
              className="absolute pointer-events-none z-25"
              style={{
                top: '48.8%',
                left: '8.8%'
              }}
            >
              {/* THE USER'S SELECTED FOOD DISH (Coming one by one from left side) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
                style={{
                  left: `${dishX}px`,
                  transform: `translate(-50%, -50%) scale(${dishScale})`,
                  opacity: dishOpacity,
                  transition: 'none'
                }}
              >
                {/* Horizontal White Speed Lines behind food item coming from left */}
                <div className="flex flex-col gap-1 items-end justify-center mr-2 sm:mr-3 shrink-0">
                  <div className="h-[2px] sm:h-[2.5px] w-6 sm:w-10 bg-white/70 rounded-full" />
                  <div className="h-[2.5px] sm:h-[3px] w-10 sm:w-16 bg-white/95 rounded-full" />
                  <div className="h-[2px] sm:h-[2.5px] w-7 sm:w-12 bg-white/60 rounded-full" />
                </div>

                {/* User-Selected Dish Image (Circular dish with clean border) */}
                <div className="relative w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-900/70 p-0.5 border-2 border-amber-300 shadow-[0_4px_24px_rgba(0,0,0,0.85)] shrink-0 flex items-center justify-center">
                  <img
                    src={selectedDishItem.image}
                    alt={selectedDishItem.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      const fallback = getDishVisualAssets(selectedDishItem.name);
                      (e.currentTarget as HTMLImageElement).src = fallback.flyingImage || fallback.plateImage || '/images/eating/bhakri_bhaji_dish_flying.png';
                    }}
                  />
                </div>

                {/* Dish Name Tag underneath */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-black text-center whitespace-nowrap shadow-lg">
                  {selectedDishItem.name}
                </div>
              </div>
            </div>

            {/* BAKASUR CHARACTER (Synchronized mouth opening, closing & chewing) */}
            <img
              src={`/images/chewing/frame_${String(frameIndex).padStart(3, '0')}.webp`}
              alt="Bakasur Eating Action"
              className={`w-full h-full object-contain object-right-bottom pointer-events-none transition-transform duration-75 ${
                biteFlash ? 'scale-[1.03] brightness-110' : 'scale-100'
              }`}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
