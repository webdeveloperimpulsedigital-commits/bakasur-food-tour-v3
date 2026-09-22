'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, ArrowLeft, Flame, Sparkles, Utensils } from 'lucide-react';
import { Restaurant, Dish } from '@/lib/db';

import { DishVisualAssets, getDishVisualAssets, getDishExactPlateImage, getDishExactFlyingImage } from '@/lib/dishAssets';
export { getDishVisualAssets, getDishExactPlateImage, getDishExactFlyingImage };
export type { DishVisualAssets };

export function getFlyingDishAsset(dishName?: string, dishImage?: string): { image: string; isCircleCrop: boolean } {
  const visual = getDishVisualAssets(dishName, dishImage);
  return { image: visual.flyingImage, isCircleCrop: !visual.flyingImage.includes('_flying.png') };
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

// Engaging comedic foodie thoughts
const ENGAGING_MESSAGES = [
  { line1: 'BAKASUR', line2: 'MODE:', highlight: 'ON', line4: '' },
  { line1: 'Sharing ka', line2: 'plan tha.', highlight: 'Ab nahi hai.', line4: '' },
  { line1: 'Chef ki shift', line2: 'khatam.', line3: 'Bakasur ki', highlight: 'bhookh', line4: 'nahi.' },
  { line1: 'Arre bhai Bakasur,', line2: '', highlight: 'iska bill', line4: 'kaun bharega?' },
  { line1: 'Khaali plates ka', line2: '', highlight: 'Eiffel Tower', line4: 'ban raha hai.' }
];

const CHEW_EXPRESSIONS = [
  '“NOM NOM NOM! 🤤”',
  '“ZABARDAST! 🔥”',
  '“AUR LAO! ⚡”',
  '“CRUNCH CRUNCH! 💥”',
  '“PET MEIN JAGAH HI JAGAH HAI! 😋”'
];

const DEFAULT_MENU_ITEMS: Array<{ id: number; name: string; image: string }> = [
  { id: 101, name: 'Crispy Dosa', image: '/images/eating/dosa_dish_flying.png' },
  { id: 102, name: 'Dum Biryani', image: '/images/eating/biryani_dish_flying.png' },
  { id: 103, name: 'Chole Bhature', image: '/images/eating/chole_bhature_dish_flying.png' },
  { id: 104, name: 'Steamed Momos', image: '/images/eating/momos_dish_flying.png' },
  { id: 105, name: 'Paneer Tikka', image: '/images/eating/paneer_dish_flying.png' },
  { id: 106, name: 'Butter Chicken', image: '/images/eating/butter_chicken_dish_flying.png' },
  { id: 107, name: 'Pav Bhaji', image: '/images/eating/pav_bhaji_dish_flying.png' },
  { id: 108, name: 'Crispy Samosa', image: '/images/eating/samosa_flying.png' },
  { id: 109, name: 'Spicy Misal Pav', image: '/images/eating/misal_dish_flying.png' }
];

export function getSafeDish(
  items: Array<{ id: number; name: string; image: string }> | undefined,
  rawIndex: number
): { id: number; name: string; image: string } {
  if (!items || items.length === 0) {
    return DEFAULT_MENU_ITEMS[0];
  }
  const len = items.length;
  const validIdx = isNaN(rawIndex) ? 0 : Math.floor(rawIndex);
  const safeIdx = ((validIdx % len) + len) % len;
  return items[safeIdx] || DEFAULT_MENU_ITEMS[0];
}

const TOTAL_FRAMES = 126;
const CYCLE_MS = 3200; // Complete cycle per menu item (calibrated for smooth, relaxed eating)

export const BakasurEatingStage: React.FC<BakasurEatingStageProps> = ({
  dishName = 'Specialty Food',
  dishImage,
  restaurantName,
  restaurant,
  feastingStage = 1,
  soundEnabled = true,
  onToggleSound,
  onBack,
  onFeedMore,
  onComplete,
  onPlayBite
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [biteFlash, setBiteFlash] = useState(false);
  const [activeDishIndex, setActiveDishIndex] = useState(0);
  const [dishesDevouredCount, setDishesDevouredCount] = useState(0);
  const [cycleProgress, setCycleProgress] = useState(0); // 0 to 1 in cycle
  const [chewTextIdx, setChewTextIdx] = useState(0);
  const [isChewingState, setIsChewingState] = useState(false);

  const cycleStartTimeRef = useRef<number>(performance.now());
  const hasBittenThisCycleRef = useRef<boolean>(false);
  const lastActiveDishIdxRef = useRef<number>(0);

  // 1. Prepare user's selected dish visual asset
  const selectedDishItem = useMemo(() => {
    const safeDishName = dishName || 'Specialty Food';
    const primaryVisual = getDishVisualAssets(safeDishName, dishImage);
    return {
      id: 1,
      name: safeDishName,
      image: primaryVisual.flyingImage || '/images/eating/dosa_dish_flying.png'
    };
  }, [dishName, dishImage]);

  // 2. Preload chewing frames
  useEffect(() => {
    for (let i = 0; i < 25; i++) {
      const img = new Image();
      img.src = `/images/chewing/frame_${String(i).padStart(3, '0')}.webp`;
    }
    const timer = setTimeout(() => {
      for (let i = 25; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = `/images/chewing/frame_${String(i).padStart(3, '0')}.webp`;
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // 3. High precision animation loop:
  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      const elapsedTotal = Math.max(0, now - cycleStartTimeRef.current);
      const currentCycleIndex = Math.max(0, Math.floor(elapsedTotal / CYCLE_MS));
      const elapsed = elapsedTotal % CYCLE_MS;
      setCycleProgress(elapsed / CYCLE_MS);

      if (currentCycleIndex !== lastActiveDishIdxRef.current) {
        lastActiveDishIdxRef.current = currentCycleIndex;
        setActiveDishIndex(currentCycleIndex);
        hasBittenThisCycleRef.current = false;
      }

      // Phase 1: Dish approaching mouth -> Bakasur holds mouth WIDE OPEN (frame 0)
      if (elapsed < 1400) {
        setFrameIndex(0);
        setIsChewingState(false);
      }
      // Phase 2: Dish enters mouth -> Bite impact & mouth snaps shut
      else if (elapsed >= 1400 && elapsed < 1700) {
        setIsChewingState(false);
        if (elapsed >= 1520 && !hasBittenThisCycleRef.current) {
          hasBittenThisCycleRef.current = true;
          if (onPlayBite) onPlayBite();
          setBiteFlash(true);
          setTimeout(() => setBiteFlash(false), 240);
          setDishesDevouredCount((prev) => prev + 1);
          setChewTextIdx((prev) => (prev + 1) % CHEW_EXPRESSIONS.length);
        }

        if (elapsed < 1520) {
          setFrameIndex(0); // mouth still open as dish crosses lips
        } else if (elapsed < 1610) {
          setFrameIndex(3); // mouth begins closing on food
        } else {
          setFrameIndex(6); // mouth shuts tight
        }
      }
      // Phase 3: CHEWING ACTION -> Jaw actively chews food
      else if (elapsed >= 1700 && elapsed < 2850) {
        setIsChewingState(true);
        const chewProgress = (elapsed - 1700) / 1150;
        const chewCycle = (chewProgress * 2.5) % 1;
        const chewFrame = 8 + Math.floor(chewCycle * 14);
        setFrameIndex(chewFrame);
      }
      // Phase 4: Swallowing & opening mouth for next dish
      else {
        setIsChewingState(false);
        if (elapsed < 2980) {
          setFrameIndex(20);
        } else if (elapsed < 3100) {
          setFrameIndex(23);
        } else {
          setFrameIndex(0);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onPlayBite]);

  // Cycle foodie billboard thoughts every 3300ms so multiple thoughts display across 10s
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % ENGAGING_MESSAGES.length);
        setIsTransitioning(false);
      }, 300);
    }, 3300);

    return () => clearInterval(interval);
  }, []);

  const msg = ENGAGING_MESSAGES[currentMessageIndex];

  // Auto-transition to next frame (Frame 6 - Food Trailer) after 10 seconds of eating animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Handle user tap on screen: advance immediately to next frame
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onComplete) onComplete();
  };

  // Calculate current animation parameters for the leading dish
  const elapsedInCycle = cycleProgress * CYCLE_MS;

  // Leading dish position & scale as it approaches and enters mouth:
  // Coordinates are relative to Bakasur's mouth: (0, 0) is the mouth opening cavity
  let leaderX = 0;
  let leaderScale = 1.0;
  let leaderOpacity = 1.0;

  if (elapsedInCycle < 1400) {
    // Approaching: glides smoothly from -280px into mouth (0px)
    const t = elapsedInCycle / 1400;
    // Cubic ease-out
    const ease = 1 - Math.pow(1 - t, 2.2);
    leaderX = -280 * (1 - ease);
    leaderScale = 0.85 + ease * 0.15;
    leaderOpacity = 1;
  } else if (elapsedInCycle >= 1400 && elapsedInCycle < 1700) {
    // Entering mouth: passes through lips into cavity, shrinking & fading out
    const t = (elapsedInCycle - 1400) / 300;
    leaderX = t * 20; // enters 20px deep into mouth cavity
    leaderScale = Math.max(0.01, 1.0 - t * 0.95);
    leaderOpacity = Math.max(0, 1.0 - t * 1.1);
  } else {
    // Chewing / swallow: completely consumed inside mouth
    leaderX = 20;
    leaderScale = 0.01;
    leaderOpacity = 0;
  }

  return (
    <div
      onClick={handleActionClick}
      className="relative w-full h-full min-h-full overflow-hidden bg-[#04115b] flex flex-col justify-between select-none cursor-pointer"
    >
      {/* 1. TOP BAR: Back Arrow, Brand Title & Sound Toggle */}
      <div className="relative z-40 px-4 sm:px-7 py-3 sm:py-4 flex items-center justify-between text-white w-full">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              type="button"
              className="p-1.5 -ml-1 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Wapas"
            >
              <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
          )}
          <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white drop-shadow-md">
            BAKASUR KA FOOD TOUR
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Devoured dishes badge */}
          <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black shadow-md">
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
              className="p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20 transition-all cursor-pointer"
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

      {/* 2. MAIN ARENA */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-between">
        {/* TOP-LEFT: BILLBOARD HEADLINE */}
        <div className="absolute left-4 sm:left-7 top-2 sm:top-4 z-30 max-w-[85%] sm:max-w-[70%] pointer-events-none">
          <div
            className={`transition-all duration-300 transform ${
              isTransitioning
                ? 'opacity-0 -translate-y-2 scale-95'
                : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            <div className="text-[32px] xs:text-[38px] sm:text-[46px] md:text-[54px] font-black text-white leading-[1.02] tracking-tight uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
              {msg.line1 && <div>{msg.line1}</div>}
              {msg.line2 && <div>{msg.line2}</div>}
              {msg.line3 && <div>{msg.line3}</div>}
              {msg.highlight && (
                <span className="text-[#FF4D00] inline-block drop-shadow-[0_4px_22px_rgba(255,77,0,0.8)]">
                  {msg.highlight}
                </span>
              )}{' '}
              {msg.line4 && <span className="text-white">{msg.line4}</span>}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: BAKASUR WITH ONE-BY-ONE SEQUENTIAL FOOD CONVEYOR */}
        <div className="absolute right-0 bottom-0 h-[58%] sm:h-[65%] md:h-[72%] max-h-[440px] sm:max-h-[500px] md:max-h-[580px] aspect-[1080/1350] flex items-end justify-end pointer-events-none select-none z-20 mr-1 sm:mr-4 md:mr-8">
          <div className="relative w-full h-full flex items-end justify-end">
            
            {/* CHEWING BUBBLE / DIALOGUE WHEN CHEWING */}
            {isChewingState && (
              <div className="absolute top-[32%] left-[12%] -translate-x-1/2 -translate-y-1/2 z-35 animate-bounce pointer-events-none">
                <div className="px-3 py-1.5 rounded-2xl bg-amber-400 text-[#04115b] font-black text-xs sm:text-sm md:text-base uppercase tracking-wider shadow-xl border-2 border-white flex items-center gap-1.5 whitespace-nowrap">
                  <span>{CHEW_EXPRESSIONS[chewTextIdx]}</span>
                </div>
              </div>
            )}

            {/* BITE CRUNCH IMPACT SPARK & CHOMP FLASH */}
            {biteFlash && (
              <div className="absolute top-[58%] left-[11%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-35">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-300/90 blur-xs animate-ping" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-base sm:text-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] whitespace-nowrap">
                  CHOMP! 💥
                </div>
              </div>
            )}

            {/* SELECTED DISH FEEDING TRACK */}
            {/* Origin (0,0) is calibrated directly at Bakasur's mouth opening (top: 58%, left: 11%) */}
            <div
              className="absolute pointer-events-none z-25"
              style={{
                top: '58%',
                left: '11%'
              }}
            >
              {/* THE USER'S SELECTED FOOD DISH (Moving towards and entering open mouth) */}
              <div
                key={`dish-${activeDishIndex}`}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center"
                style={{
                  left: `${leaderX}px`,
                  transform: `translate(-50%, -50%) scale(${leaderScale})`,
                  opacity: leaderOpacity,
                  transition: 'none'
                }}
              >
                {/* Dish Cutout + Clean Air Trails */}
                <div className="relative flex items-center shrink-0">
                  {/* Subtle clean white air streaks (no yellow lines) */}
                  <div className="flex flex-col gap-1 mr-2 opacity-80 shrink-0">
                    <div className="w-5 sm:w-8 h-[2px] bg-white/70 rounded-full shadow-xs" />
                    <div className="w-8 sm:w-12 h-[2.5px] bg-white/90 rounded-full shadow-xs" />
                    <div className="w-4 sm:w-7 h-[2px] bg-white/60 rounded-full shadow-xs" />
                  </div>

                  {/* Circular Dish Image - perfectly centered vertically at mouth opening */}
                  <div className="relative w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full overflow-hidden bg-slate-900/60 p-1 border-2 border-amber-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.8)] shrink-0 flex items-center justify-center">
                    <img
                      src={selectedDishItem.image}
                      alt={selectedDishItem.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/eating/samosa_flying.png';
                      }}
                    />
                  </div>

                  {/* Dish Name Tag - positioned underneath without shifting the plate vertical center */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-black text-center whitespace-nowrap shadow-lg">
                    {selectedDishItem.name}
                  </div>
                </div>
              </div>
            </div>

            {/* BAKASUR CHARACTER (Synchronized mouth opening, closing & chewing) */}
            <img
              src={`/images/chewing/frame_${String(frameIndex).padStart(3, '0')}.webp`}
              alt="Bakasur Eating Action"
              className={`w-full h-full object-contain object-bottom pointer-events-none transition-transform duration-75 ${
                biteFlash ? 'scale-[1.03] brightness-110' : 'scale-100'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Subtle bottom indicator spacer */}
      <div className="relative z-40 p-2 sm:p-3 w-full" />
    </div>
  );
};
