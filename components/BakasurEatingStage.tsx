'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Volume2, VolumeX, ChevronUp, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { Restaurant } from '@/lib/db';
import { getDishVisualAssets, getDishExactFlyingImage } from '@/lib/dishAssets';

export { getDishVisualAssets };

export function getFlyingDishAsset(dishName?: string, dishImage?: string): { image: string; isCircleCrop: boolean } {
  const visual = getDishVisualAssets(dishName, dishImage);
  return { image: visual.flyingImage || visual.plateImage || dishImage || '/images/eating/samosa_flying.png', isCircleCrop: false };
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
  onWatchVideo?: () => void;
  onPlayBite?: () => void;
}

interface FoodOption {
  id: string;
  name: string;
  image: string;
}

export const BakasurEatingStage: React.FC<BakasurEatingStageProps> = ({
  dishName = 'Food',
  dishImage,
  feastingStage = 1,
  soundEnabled = true,
  onToggleSound,
  onBack,
  onComplete,
  onPlayBite
}) => {
  const isSideAngle = feastingStage === 2;
  const TOTAL_FEEDS = 3;
  const [fedCount, setFedCount] = useState<number>(0);
  const [eatenDishIds, setEatenDishIds] = useState<string[]>([]);
  const [activeFlyingItems, setActiveFlyingItems] = useState<
    {
      id: string;
      image: string;
      name: string;
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      rotation: number;
    }[]
  >([]);
  const [chompEffect, setChompEffect] = useState<boolean>(false);
  const [bitePopupText, setBitePopupText] = useState<string>('');
  
  const POPUP_MESSAGES = [
    'Aur Khilao! Yummy! 🤤',
    'Maza Aa Gaya! Aur Bhej! 🔥',
    'Aur Khilao! Super Yum! 😋',
    'Ek Aur Bite, Fast! 🚀',
    'Aha! Gazab Taste Hai! 💥'
  ];

  // Stage 1 uses front-facing video (front-eat-video.mp4), Stage 2 uses side-angle (side-view-final.mp4)
  const MAIN_VIDEO = isSideAngle
    ? '/images/final-frames/side-view-final.mp4'
    : '/images/final-frames/front-eat-video.mp4';

  const [isEatingVideoPlaying, setIsEatingVideoPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Touch/Mouse Drag state for transparent PNG morsel following finger
  const [draggingFood, setDraggingFood] = useState<{ id: string; food: FoodOption; flyingPNG: string } | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const onPlayBiteRef = useRef(onPlayBite);
  useEffect(() => {
    onPlayBiteRef.current = onPlayBite;
  }, [onPlayBite]);

  // Reset feeding progress state when feastingStage changes
  useEffect(() => {
    setFedCount(0);
    setEatenDishIds([]);
    setActiveFlyingItems([]);
    setDraggingFood(null);
    setChompEffect(false);
  }, [feastingStage]);

  // Selected dish visual asset (plate or user-uploaded image)
  const selectedDishAsset = useMemo(() => {
    const visual = getDishVisualAssets(dishName, dishImage);
    return visual.plateImage || visual.flyingImage || dishImage || '/images/eating/samosa_dish.jpg';
  }, [dishName, dishImage]);

  // Food Options: 3 Servings of the USER'S SELECTED DISH
  const foodOptions: FoodOption[] = useMemo(() => {
    return Array.from({ length: 3 }, (_, idx) => ({
      id: `dish_serving_${idx + 1}`,
      name: dishName || 'Selected Dish',
      image: selectedDishAsset
    }));
  }, [dishName, selectedDishAsset]);

  // Always keep background video muted so mobile browsers (iOS Safari) never block autoplay/playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      if (!isEatingVideoPlaying) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }
    }
  }, [isEatingVideoPlaying]);

  // Smooth Arcade-Style Feeding
  const handleFeedFood = (
    food: FoodOption,
    clientX?: number,
    plateIndex?: number,
    plateEl?: HTMLElement | null,
    clientY?: number
  ) => {
    if (eatenDishIds.includes(food.id) || fedCount >= TOTAL_FEEDS) return;

    // Mark food as eaten instantly
    setEatenDishIds((prev) => [...prev, food.id]);
    const newFedCount = fedCount + 1;
    setFedCount(newFedCount);

    // Get 100% transparent PNG food morsel/cutout for smooth realistic mouth feeding
    const flyingPNG = getDishExactFlyingImage(food.name, food.image);

    // Ensure video is muted for immediate, unblocked play
    if (videoRef.current) {
      videoRef.current.muted = true;
    }

    if (isSideAngle) {
      // In Side-Angle mode: Morsels fly from Right side plate arc directly into mouth on the Left!
      // In side-view-final.mp4 (1080x1920), with object-cover object-left:
      // Exact mouth cavity in 1080x1920: X = 382px (35.37% of 1080), Y = 834px (43.44% of 1920)
      let targetMouthX = -58;
      let targetMouthY = -66;
      let plateStartX = 140;
      let plateStartY = 0;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const W = rect.width;
        const H = rect.height;
        const centerX = W / 2;
        const centerY = H / 2;

        const videoAspect = 1080 / 1920; // 0.5625
        let videoW: number;
        let videoH: number;
        let videoLeft = 0; // pinned to left with object-left
        let videoTop = 0;

        if (W / H > videoAspect) {
          // Container is wider than 9:16 (video width fits, vertically centered)
          videoW = W;
          videoH = W / videoAspect;
          videoTop = (H - videoH) / 2;
        } else {
          // Container is taller than 9:16 (standard vertical phone screen)
          videoH = H;
          videoW = H * videoAspect;
          videoTop = 0;
        }

        const mouthPixelX = videoLeft + videoW * (382 / 1080);
        const mouthPixelY = videoTop + videoH * (834 / 1920);

        targetMouthX = Math.round(mouthPixelX - centerX);
        targetMouthY = Math.round(mouthPixelY - centerY);

        if (plateEl) {
          const pRect = plateEl.getBoundingClientRect();
          const pCenterX = pRect.left + pRect.width / 2 - rect.left;
          const pCenterY = pRect.top + pRect.height / 2 - rect.top;
          plateStartX = Math.round(pCenterX - centerX);
          plateStartY = Math.round(pCenterY - centerY);
        } else if (typeof clientX === 'number' && typeof clientY === 'number' && clientX > 0 && clientY > 0) {
          plateStartX = Math.round(clientX - rect.left - centerX);
          plateStartY = Math.round(clientY - rect.top - centerY);
        } else {
          const pIdx = typeof plateIndex === 'number' ? plateIndex : 1;
          plateStartX = Math.round(W * 0.38);
          plateStartY = Math.round((pIdx - 1) * 85);
        }
      }

      const pIdx = typeof plateIndex === 'number' ? plateIndex : 1;
      const itemId = `${food.id}_bite_${Date.now()}_${Math.random()}`;
      const rotation = pIdx === 0 ? 12 : pIdx === 2 ? -12 : 0;

      setActiveFlyingItems((prev) => [
        ...prev,
        {
          id: itemId,
          image: flyingPNG,
          name: food.name,
          startX: plateStartX,
          startY: plateStartY,
          targetX: targetMouthX,
          targetY: targetMouthY,
          rotation
        }
      ]);

      setTimeout(() => {
        setActiveFlyingItems((prev) => prev.filter((item) => item.id !== itemId));
      }, 520);
    } else {
      // Stage 1: Bottom to Top flying arc
      let baseOffsetX = 0;
      if (typeof clientX === 'number' && clientX > 0 && typeof window !== 'undefined' && window.innerWidth > 0) {
        baseOffsetX = clientX - window.innerWidth / 2;
      } else if (typeof plateIndex === 'number') {
        const count = foodOptions.length;
        baseOffsetX = (plateIndex - (count - 1) / 2) * 110;
      }

      const BURST_COUNT = 2;
      for (let i = 0; i < BURST_COUNT; i++) {
        setTimeout(() => {
          const itemId = `${food.id}_burst_${Date.now()}_${i}_${Math.random()}`;
          const offsetX = baseOffsetX + (i === 0 ? 0 : (Math.random() > 0.5 ? 12 : -12));
          const rotation = (baseOffsetX < 0 ? -1 : 1) * (i * 8 + 6);

          setActiveFlyingItems((prev) => [
            ...prev,
            {
              id: itemId,
              image: flyingPNG,
              name: food.name,
              startX: offsetX,
              startY: 240,
              targetX: 0,
              targetY: 45,
              rotation
            }
          ]);

          setTimeout(() => {
            setActiveFlyingItems((prev) => prev.filter((item) => item.id !== itemId));
          }, 520);
        }, i * 90);
      }
    }

    // USER REQUIREMENT: "when dish go in bhookasur mouth then he can start eating"
    // Trigger chewing animation, bite crunch sound, and reaction banner ONLY when morsel enters mouth (~380ms)
    const EAT_DELAY = isSideAngle ? 380 : 320;

    setTimeout(() => {
      // A. Play bite / crunch sound effect exactly when food enters mouth
      onPlayBiteRef.current?.();

      // B. Pick fun reaction message & trigger chomp effect
      const msg = POPUP_MESSAGES[fedCount % POPUP_MESSAGES.length];
      setBitePopupText(msg);
      setChompEffect(true);

      // C. Start chewing animation video NOW
      setIsEatingVideoPlaying(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((err) => {
          console.warn('Video play prevented:', err);
        });
      }

      // D. Device haptic bump if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
    }, EAT_DELAY);

    // Hide reaction popup banner after chewing
    setTimeout(() => setChompEffect(false), EAT_DELAY + 1400);

    // If all required feeds completed, complete stage cleanly after chewing
    if (newFedCount >= TOTAL_FEEDS) {
      setTimeout(() => {
        onCompleteRef.current?.();
      }, EAT_DELAY + 1750);
    } else {
      // Reset video to open mouth ready state after chewing this bite
      setTimeout(() => {
        setIsEatingVideoPlaying(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }, EAT_DELAY + 1750);
    }
  };

  // Drag / Swipe handlers for mobile & desktop
  const handleStartDrag = (food: FoodOption, clientX: number, clientY: number) => {
    if (fedCount >= TOTAL_FEEDS || eatenDishIds.includes(food.id)) return;

    const flyingPNG = getDishExactFlyingImage(food.name, food.image);
    setDraggingFood({ id: food.id, food, flyingPNG });
    touchStartPosRef.current = { x: clientX, y: clientY };
    setDragCurrentPos({ x: clientX, y: clientY });
  };

  const handleMoveDrag = (clientX: number, clientY: number) => {
    if (!draggingFood) return;
    setDragCurrentPos({ x: clientX, y: clientY });
  };

  const handleEndDrag = () => {
    if (!draggingFood) return;

    const deltaY = dragCurrentPos.y - touchStartPosRef.current.y;
    const deltaX = dragCurrentPos.x - touchStartPosRef.current.x;

    if (isSideAngle) {
      // In Side-Angle mode: Dragging LEFT towards mouth triggers feeding
      if (deltaX < -30 || dragCurrentPos.x < (typeof window !== 'undefined' ? window.innerWidth * 0.6 : 300)) {
        const pIdx = foodOptions.findIndex((f) => f.id === draggingFood.food.id);
        handleFeedFood(
          draggingFood.food,
          touchStartPosRef.current.x,
          pIdx >= 0 ? pIdx : 1,
          null,
          touchStartPosRef.current.y
        );
      }
    } else {
      // In Stage 1 mode: Dragging UP towards mouth triggers feeding
      if (deltaY < -30 || dragCurrentPos.y < (typeof window !== 'undefined' ? window.innerHeight * 0.65 : 400)) {
        handleFeedFood(draggingFood.food, touchStartPosRef.current.x);
      }
    }

    setDraggingFood(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => handleMoveDrag(e.clientX, e.clientY)}
      onMouseUp={handleEndDrag}
      onTouchMove={(e) => handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEndDrag}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#031058] select-none"
    >
      {/* 1. BACKGROUND VIDEO LAYER */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <video
          key={MAIN_VIDEO}
          ref={videoRef}
          src={MAIN_VIDEO}
          playsInline
          autoPlay={false}
          loop={false}
          muted
          preload="auto"
          onLoadedMetadata={() => {
            if (videoRef.current && !isEatingVideoPlaying) {
              videoRef.current.muted = true;
              videoRef.current.currentTime = 0;
              videoRef.current.pause();
            }
          }}
          className={`w-full h-full object-cover ${
            isSideAngle ? 'object-left' : 'object-center'
          } relative z-0 transition-opacity duration-300`}
        />

        {/* Clean top and bottom gradient overlays - no blue side tint */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/75 via-black/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-black/75 via-black/25 to-transparent z-10 pointer-events-none" />
      </div>

      {/* 2. TOP HEADER CONTROLS */}
      <div className="relative z-30 px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between text-white w-full shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              type="button"
              className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all cursor-pointer flex items-center justify-center border border-white/20"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
          <span className="font-black text-xs sm:text-sm uppercase tracking-widest text-white drop-shadow-md">
            BHOOKASUR KA FOOD TOUR
          </span>
        </div>

        <div className="flex items-center gap-2" />
      </div>

      {/* Center flex container for rapid flying food morsels */}
      <div className="relative flex-1 w-full min-h-0 pointer-events-none z-30 flex flex-col items-center justify-center">
        {activeFlyingItems.map((item) => (
          <div key={item.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div
              style={
                {
                  '--start-x': `${item.startX}px`,
                  '--start-y': `${item.startY}px`,
                  '--target-x': `${item.targetX}px`,
                  '--target-y': `${item.targetY}px`,
                  '--start-rot': `${item.rotation}deg`
                } as React.CSSProperties
              }
              className={`${
                isSideAngle
                  ? 'w-16 h-16 xs:w-20 xs:h-20 animate-smooth-fly-side'
                  : 'w-20 h-20 sm:w-28 sm:h-28 animate-smooth-fly'
              } flex items-center justify-center`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.95)]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Active Touch/Mouse Dragged Transparent PNG Food Piece Following Finger */}
      {draggingFood && (
        <div
          style={{
            position: 'fixed',
            left: `${dragCurrentPos.x}px`,
            top: `${dragCurrentPos.y}px`,
            transform: 'translate(-50%, -50%) scale(1.25)',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
          className="w-22 h-22 sm:w-26 sm:h-26 flex items-center justify-center filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
        >
          <img
            src={draggingFood.flyingPNG}
            alt="Dragging Food Morsel PNG"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* 4. INTERACTIVE SWIPE AREA & FOOD PLATES */}
      {isSideAngle ? (
        /* SIDE-ANGLE MODE: Food Plates on the RIGHT side, Bhookasur on the LEFT */
        <>
          {/* Right side floating vertical stack of 3 food plates - centered vertically on screen */}
          <div className="absolute right-3 xs:right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4 xs:gap-5 select-none">
            {foodOptions.map((food, index) => {
              const isEaten = eatenDishIds.includes(food.id);

              return (
                <div
                  key={food.id}
                  onMouseDown={(e) => handleStartDrag(food, e.clientX, e.clientY)}
                  onTouchStart={(e) => handleStartDrag(food, e.touches[0].clientX, e.touches[0].clientY)}
                  onClick={(e) => handleFeedFood(food, e.clientX, index, e.currentTarget, e.clientY)}
                  className={`group relative w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.8)] border-2 transition-all duration-200 flex items-center justify-center shrink-0 p-1 cursor-pointer active:scale-95 ${
                    isEaten
                      ? 'border-white/30 bg-black/50 opacity-40 grayscale-[40%]'
                      : 'border-amber-400 bg-black/40 hover:border-amber-300 hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                  }`}
                >
                  <img
                    src={food.image}
                    alt={food.name}
                    className="w-full h-full object-contain pointer-events-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.95)]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/eating/samosa_dish.jpg';
                    }}
                  />

                  {isEaten && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-[1px] rounded-full">
                      <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 fill-slate-950 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prompt at bottom pointing left towards Bhookasur's mouth */}
          <div className="relative z-30 px-4 pb-5 sm:pb-7 flex flex-col items-center justify-end w-full shrink-0 gap-2">
            {fedCount < TOTAL_FEEDS && (
              <div className="flex items-center gap-2 cursor-pointer select-none bg-black/60 backdrop-blur-xs px-4 py-2 rounded-full border border-white/20">
                <ChevronLeft className="w-5 h-5 text-amber-400 stroke-[3] animate-pulse" />
                <span className="text-white font-black text-xs xs:text-sm sm:text-base tracking-wide uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  Bhookasur ko khilao ({fedCount}/{TOTAL_FEEDS})
                </span>
              </div>
            )}

            {chompEffect && (
              <div className="animate-in zoom-in-95 fade-in duration-150 flex flex-col items-center text-center select-none py-1">
                <div className="flex items-center gap-2 text-amber-300 font-black text-base sm:text-xl uppercase tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] animate-bounce">
                  <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
                  <span>{bitePopupText || 'Aur Khilao! Yummy! 🤤'}</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* NORMAL STAGE 1 MODE: Food Plates in bottom row */
        <div className="relative z-30 px-4 pb-6 sm:pb-8 flex flex-col items-center justify-end w-full shrink-0 gap-3">
          {/* Animated Swipe / Click Prompt */}
          {fedCount < TOTAL_FEEDS && (
            <div className="flex flex-col items-center gap-1 cursor-pointer select-none">
              <div className="flex flex-col items-center text-amber-400 animate-bounce">
                <ChevronUp className="w-6 h-6 -mb-2 stroke-[3]" />
                <ChevronUp className="w-6 h-6 stroke-[3]" />
              </div>

              <div className="flex items-center gap-2 text-white font-black text-base sm:text-lg tracking-wide uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                <span className="text-xl">👆</span>
                <span>Swipe ya Click karke khilao ({fedCount}/{TOTAL_FEEDS})</span>
              </div>
            </div>
          )}

          {chompEffect && (
            <div className="animate-in zoom-in-95 fade-in duration-150 flex flex-col items-center text-center select-none py-1">
              <div className="flex items-center gap-2 text-amber-300 font-black text-base sm:text-xl uppercase tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] animate-bounce">
                <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
                <span>{bitePopupText || 'Aur Khilao! Yummy! 🤤'}</span>
              </div>
            </div>
          )}

          {/* 3 Food Item Ceramic Plates Row */}
          <div className="flex items-center justify-center gap-2.5 xs:gap-3 sm:gap-6 w-full max-w-2xl mx-auto pt-1 pb-1">
            {foodOptions.map((food, index) => {
              const isEaten = eatenDishIds.includes(food.id);

              return (
                <div
                  key={food.id}
                  onMouseDown={(e) => handleStartDrag(food, e.clientX, e.clientY)}
                  onTouchStart={(e) => handleStartDrag(food, e.touches[0].clientX, e.touches[0].clientY)}
                  onClick={(e) => handleFeedFood(food, e.clientX, index)}
                  className="group relative w-22 h-22 xs:w-26 xs:h-26 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-[0_14px_35px_rgba(0,0,0,0.9)] border-[2.5px] border-white/50 bg-slate-900/60 cursor-grab active:cursor-grabbing transition-all duration-150 flex items-center justify-center shrink-0 p-0.5 active:scale-95"
                >
                  <img
                    src={food.image}
                    alt={food.name}
                    className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] transition-transform duration-150 group-hover:scale-110 ${
                      isEaten ? 'opacity-40 grayscale-[30%]' : 'opacity-100'
                    }`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/eating/samosa_dish.jpg';
                    }}
                  />

                  {isEaten && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[1px]">
                      <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 fill-slate-950 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inline Keyframes for Smooth Realistic Food Flight into Mouth */}
      <style jsx global>{`
        @keyframes smoothFlyToMouth {
          0% {
            transform: translate(var(--start-x, 0px), 240px) scale(0.9) rotate(var(--start-rot, 0deg));
            opacity: 1;
          }
          45% {
            transform: translate(calc(var(--start-x, 0px) * 0.5), 110px) scale(1.2) rotate(calc(var(--start-rot, 0deg) * 0.5));
            opacity: 1;
          }
          80% {
            transform: translate(0px, 60px) scale(0.3) rotate(0deg);
            opacity: 0.85;
          }
          100% {
            transform: translate(0px, 45px) scale(0.02) rotate(0deg);
            opacity: 0;
          }
        }
        .animate-smooth-fly {
          animation: smoothFlyToMouth 0.52s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
        }

        @keyframes smoothFlyToMouthSide {
          0% {
            transform: translate(var(--start-x, 140px), var(--start-y, 0px)) scale(1) rotate(var(--start-rot, 0deg));
            opacity: 1;
          }
          30% {
            /* Smooth upward arc across screen space towards Bhookasur */
            transform: translate(
              calc(var(--start-x, 140px) * 0.45 + var(--target-x, -58px) * 0.55),
              calc(var(--start-y, 0px) * 0.35 + var(--target-y, -66px) * 0.65 - 35px)
            ) scale(1.15) rotate(-14deg);
            opacity: 1;
          }
          70% {
            /* Reaches directly in front of Bhookasur's wide open mouth lips */
            transform: translate(
              calc(var(--target-x, -58px) + 20px),
              calc(var(--target-y, -66px) - 2px)
            ) scale(0.7) rotate(-22deg);
            opacity: 0.98;
          }
          100% {
            /* Plunges deep into the center of the dark mouth cavity and vanishes */
            transform: translate(
              var(--target-x, -58px),
              var(--target-y, -66px)
            ) scale(0.04) rotate(-35deg);
            opacity: 0;
          }
        }
        .animate-smooth-fly-side {
          animation: smoothFlyToMouthSide 0.46s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};
