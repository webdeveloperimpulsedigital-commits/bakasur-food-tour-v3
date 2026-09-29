'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
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

const TOTAL_STAGE_SECONDS = 45; // auto-advance duration (generous wait time, tap anytime to proceed)
// 3600ms per food consumption cycle (generous, leisurely eating pace & clear visual presentation)
const BITE_CYCLE_MS = 3600;

export const BakasurEatingStage: React.FC<BakasurEatingStageProps> = ({
  dishName = 'Food',
  dishImage,
  soundEnabled = true,
  onToggleSound,
  onBack,
  onComplete,
  onPlayBite
}) => {
  // Active slide index: 0..4 rotating through 5 engaging Zomato-style messages
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isSlideTransitioning, setIsSlideTransitioning] = useState<boolean>(false);
  const [biteFlash, setBiteFlash] = useState<boolean>(false);
  const [cycleProgress, setCycleProgress] = useState<number>(0); // 0 to 1 in each bite cycle
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const onPlayBiteRef = useRef(onPlayBite);
  useEffect(() => {
    onPlayBiteRef.current = onPlayBite;
  }, [onPlayBite]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // 3. Slide rotation timer: rotates through all 5 messages every 4 seconds
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setIsSlideTransitioning(true);
      setTimeout(() => {
        setActiveSlide((prev) => (prev + 1) % 5);
        setIsSlideTransitioning(false);
      }, 250);
    }, 4000);

    return () => clearInterval(slideTimer);
  }, []);

  // 4. Stage countdown to auto-advance to Frame 6 (Generous wait time, tap anytime to skip):
  useEffect(() => {
    const durationSeconds = isMobile ? 45 : TOTAL_STAGE_SECONDS;
    const timer = setTimeout(() => {
      onCompleteRef.current?.();
    }, durationSeconds * 1000);

    return () => clearTimeout(timer);
  }, [isMobile]);

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
      // Phase 1 (0 to 58% of cycle): Dish flies smoothly from left -> Mouth is wide open (Frame 000) anticipating!
      if (progress < 0.58) {
        setFrameIndex(0);
      }
      // Phase 2 (58% to 70% of cycle): Dish enters mouth -> Jaw snaps shut & crunches!
      else if (progress >= 0.58 && progress < 0.70) {
        if (!hasBittenThisCycleRef.current) {
          hasBittenThisCycleRef.current = true;
          onPlayBiteRef.current?.();
          setBiteFlash(true);
          setTimeout(() => setBiteFlash(false), 240);
        }

        if (progress < 0.62) {
          setFrameIndex(2);
        } else if (progress < 0.66) {
          setFrameIndex(4);
        } else {
          setFrameIndex(6); // mouth fully closed on food
        }
      }
      // Phase 3 (70% to 92% of cycle): Slower, natural, satisfying rhythmic chewing
      else if (progress >= 0.70 && progress < 0.92) {
        const chewProgress = (progress - 0.70) / 0.22;
        const chewCycle = (chewProgress * 1.5) % 1;
        const chewFrame = 8 + Math.floor(chewCycle * 13);
        setFrameIndex(chewFrame);
      }
      // Phase 4 (92% to 100% of cycle): Swallows and opens mouth wide again for the next dish
      else {
        if (progress < 0.96) {
          setFrameIndex(22); // swallowing
        } else {
          setFrameIndex(0); // opens wide anticipating next dish!
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Dish position & scale as it flies in ONE BY ONE from the left side into mouth:
  // On mobile: calibrated so dish comes smoothly from the left side across the screen
  // On desktop: keep original -420px offset
  const dishStartX = isMobile ? -260 : -420;
  let dishX = dishStartX;
  let dishScale = 1.0;
  let dishOpacity = 1.0;

  if (cycleProgress < 0.58) {
    // Phase 1: Gliding smoothly from left into mouth
    const t = cycleProgress / 0.58;
    // Smooth ease-out curve
    const ease = 1 - Math.pow(1 - t, 2.2);
    dishX = dishStartX * (1 - ease);
    dishScale = isMobile ? (0.7 + ease * 0.3) : (0.75 + ease * 0.35);
    dishOpacity = Math.min(1, t * 3.5);
  } else if (cycleProgress >= 0.58 && cycleProgress < 0.70) {
    // Phase 2: Entering mouth cavity, shrinking & vanishing
    const t = (cycleProgress - 0.58) / 0.12;
    dishX = t * 25; // enters 25px deep into mouth
    dishScale = Math.max(0.01, (isMobile ? 1.0 : 1.1) - t * 1.05);
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
            BHOOKASUR KA FOOD TOUR
          </span>
        </div>
      </div>

      {/* 2. MAIN CANVAS ARENA */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden">

        {/* TOP-LEFT HEADLINE BILLBOARD (Zomato-style engaging loading messages) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsSlideTransitioning(true);
            setTimeout(() => {
              setActiveSlide((prev) => (prev + 1) % 5);
              setIsSlideTransitioning(false);
            }, 180);
          }}
          className="absolute left-4 xs:left-6 sm:left-8 top-3 xs:top-4 sm:top-5 z-20 max-w-[78%] xs:max-w-[70%] sm:max-w-[60%] cursor-pointer select-none"
        >
          <div
            className={`transition-all duration-300 transform ${isSlideTransitioning
              ? 'opacity-0 -translate-y-2 scale-[0.98]'
              : 'opacity-100 translate-y-0 scale-100'
              }`}
          >
            {activeSlide === 0 && (
              /* MESSAGE 1: BHOOKASUR MODE: ON */
              <div className="font-black text-[32px] xs:text-[40px] sm:text-[52px] md:text-[64px] text-white leading-[1.12] tracking-tight uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                <div>BHOOKASUR</div>
                <div>MODE:</div>
                <div className="text-[#E2370A] drop-shadow-[0_4px_24px_rgba(226,55,10,0.6)]">ON</div>
              </div>
            )}

            {activeSlide === 1 && (
              /* MESSAGE 2: Sharing ka plan tha. Ab nahi hai. */
              <div className="font-black text-[24px] xs:text-[30px] sm:text-[38px] md:text-[46px] text-white leading-[1.2] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                <div>“Sharing ka</div>
                <div>plan tha.</div>
                <div>
                  <span className="text-[#E2370A] drop-shadow-[0_4px_24px_rgba(226,55,10,0.6)]">Ab nahi</span> hai.”
                </div>
              </div>
            )}

            {activeSlide === 2 && (
              /* MESSAGE 3: Chef ki shift khatam. Bhookasur ki bhookh nahi. */
              <div className="font-black text-[24px] xs:text-[30px] sm:text-[38px] md:text-[46px] text-white leading-[1.2] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                <div>“Chef ki shift</div>
                <div>khatam.</div>
                <div>Bhookasur ki</div>
                <div>
                  <span className="text-[#E2370A] drop-shadow-[0_4px_24px_rgba(226,55,10,0.6)]">bhookh</span> nahi.”
                </div>
              </div>
            )}

            {activeSlide === 3 && (
              /* MESSAGE 4: Arre bhai Bakasur, iska bill kaun bharega? */
              <div className="font-black text-[34px] xs:text-[40px] sm:text-[48px] md:text-[58px] text-white leading-[1.32] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                <div>“Arre bhai</div>
                <div>Bakasur, iska</div>
                <div>
                  <span className="text-[#E2370A] drop-shadow-[0_4px_24px_rgba(226,55,10,0.6)]">bill kaun</span>
                </div>
                <div>bharega?”</div>
              </div>
            )}

            {activeSlide === 4 && (
              /* MESSAGE 5: Khaali plates ka Eiffel Tower ban raha hai. */
              <div className="font-black text-[34px] xs:text-[40px] sm:text-[48px] md:text-[58px] text-white leading-[1.32] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                <div>“Khaali plates</div>
                <div>ka <span className="text-[#E2370A] drop-shadow-[0_4px_24px_rgba(226,55,10,0.6)]">Eiffel</span></div>
                <div><span className="text-[#E2370A] drop-shadow-[0_4px_24px_rgba(226,55,10,0.6)]">Tower</span> ban</div>
                <div>raha hai.”</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: BAKASUR WITH SYNCHRONIZED CHEWING & MOUTH ANIMATION */}
        {/* On mobile: face is moderately sized (h-[58%] xs:h-[62%]) and placed on right side (-right-10 xs:-right-14). Desktop: original scale and placement */}
        <div className="absolute -right-10 xs:-right-14 sm:-right-14 md:-right-20 lg:-right-24 bottom-0 h-[58%] xs:h-[62%] sm:h-[72%] md:h-[98%] max-h-[740px] aspect-[640/800] flex items-end justify-end pointer-events-none select-none z-10">
          <div className="relative w-full h-full flex items-end justify-end">

            {/* BITE CRUNCH IMPACT SPARK & CHOMP FLASH */}
            {biteFlash && (
              <div
                className="absolute pointer-events-none z-35 -translate-x-1/2 -translate-y-1/2"
                style={{
                  top: isMobile ? '66.5%' : '61.5%',
                  left: isMobile ? '10%' : '10.6%'
                }}
              >
                <div className="w-12 h-12 sm:w-18 sm:h-18 rounded-full bg-amber-300/90 blur-xs animate-ping" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-xs sm:text-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] whitespace-nowrap">
                  CHOMP! 💥
                </div>
              </div>
            )}

            {/* SELECTED DISH FEEDING TRACK */}
            {/* Origin (0,0) is calibrated directly at Bakasur's mouth cavity opening (Mobile: 66.5%, Desktop: 61.5%) */}
            <div
              className="absolute pointer-events-none z-25"
              style={{
                top: isMobile ? '66.5%' : '61.5%',
                left: isMobile ? '10%' : '10.6%'
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
                <div className="flex flex-col gap-1 items-end justify-center mr-1.5 sm:mr-3 shrink-0">
                  <div className="h-[2px] sm:h-[2.5px] w-5 sm:w-10 bg-white/70 rounded-full" />
                  <div className="h-[2.5px] sm:h-[3px] w-8 sm:w-16 bg-white/95 rounded-full" />
                  <div className="h-[2px] sm:h-[2.5px] w-6 sm:w-12 bg-white/60 rounded-full" />
                </div>

                {/* User-Selected Dish Image (Circular dish with clean border) */}
                <div className="relative w-15 h-15 xs:w-18 xs:h-18 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-900/70 p-0.5 border-2 border-amber-300 shadow-[0_4px_24px_rgba(0,0,0,0.85)] shrink-0 flex items-center justify-center">
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
