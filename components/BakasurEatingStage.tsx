'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Volume2, VolumeX, ChevronUp, Sparkles, ArrowRight, CheckCircle2, Utensils } from 'lucide-react';
import { Restaurant } from '@/lib/db';
import { getDishVisualAssets } from '@/lib/dishAssets';

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
  const TOTAL_FEEDS = 4;
  const [fedCount, setFedCount] = useState<number>(0);
  const [eatenDishIds, setEatenDishIds] = useState<string[]>([]);
  const [activeFlyingItem, setActiveFlyingItem] = useState<{ id: string; image: string; name: string } | null>(null);
  const [chompEffect, setChompEffect] = useState<boolean>(false);
  const [lastFedName, setLastFedName] = useState<string>('');
  
  const MAIN_VIDEO = '/images/all-frames/Baksur Eating Food.mp4';
  const [isEatingVideoPlaying, setIsEatingVideoPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Touch / Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
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
    setActiveFlyingItem(null);
    setChompEffect(false);
  }, [feastingStage]);

  // Selected dish visual asset (plate or flying cutout or user-uploaded image)
  const selectedDishAsset = useMemo(() => {
    const visual = getDishVisualAssets(dishName, dishImage);
    return visual.plateImage || visual.flyingImage || dishImage || '/images/eating/samosa_flying.png';
  }, [dishName, dishImage]);

  // 4 Food Options based on feastingStage:
  // Stage 1: 4 Servings of the USER'S ACTUAL SELECTED DISH
  // Stage 2: 4 DIFFERENT Iconic Street Foods (Samosa, Pav Bhaji, Biryani, Pani Puri, Dosa, Misal, etc.)
  const foodOptions: FoodOption[] = useMemo(() => {
    if (feastingStage === 2) {
      const defaultVariety = [
        { id: 'street_samosa', name: 'Crispy Samosa', image: '/images/eating/samosa_flying.png' },
        { id: 'street_pav_bhaji', name: 'Butter Pav Bhaji', image: '/images/eating/pav_bhaji_dish.jpg' },
        { id: 'street_biryani', name: 'Special Biryani', image: '/images/eating/biryani_dish.jpg' },
        { id: 'street_pani_puri', name: 'Teekhi Pani Puri', image: '/images/eating/pani_puri_dish.jpg' }
      ];

      const userDishLower = (dishName || '').toLowerCase();
      const backupOptions = [
        { id: 'street_dosa', name: 'Masala Dosa', image: '/images/eating/dosa_dish.jpg' },
        { id: 'street_misal', name: 'Katakirr Misal', image: '/images/eating/misal_dish.jpg' },
        { id: 'street_momos', name: 'Steamed Momos', image: '/images/eating/momos_dish.jpg' },
        { id: 'street_chole', name: 'Chole Bhature', image: '/images/eating/chole_bhature_dish.jpg' }
      ];

      let backupIdx = 0;
      return defaultVariety.map((item) => {
        const key = item.name.toLowerCase().split(' ')[1] || item.name.toLowerCase();
        if (userDishLower.includes(key)) {
          const replacement = backupOptions[backupIdx % backupOptions.length];
          backupIdx++;
          return replacement;
        }
        return item;
      });
    }

    return [
      {
        id: 'dish_serving_1',
        name: `${dishName || 'Selected Dish'} (Serving 1)`,
        image: selectedDishAsset
      },
      {
        id: 'dish_serving_2',
        name: `${dishName || 'Selected Dish'} (Serving 2)`,
        image: selectedDishAsset
      },
      {
        id: 'dish_serving_3',
        name: `${dishName || 'Selected Dish'} (Serving 3)`,
        image: selectedDishAsset
      },
      {
        id: 'dish_serving_4',
        name: `${dishName || 'Selected Dish'} (Serving 4)`,
        image: selectedDishAsset
      }
    ];
  }, [feastingStage, dishName, selectedDishAsset]);

  // Pause video on first frame (mouth open) on load
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !soundEnabled;
      if (!isEatingVideoPlaying) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }
    }
  }, [soundEnabled, isEatingVideoPlaying]);

  // Trigger feeding action when food is swiped up or clicked
  const handleFeedFood = (food: FoodOption) => {
    if (activeFlyingItem || isEatingVideoPlaying || fedCount >= TOTAL_FEEDS) return;

    setIsEatingVideoPlaying(true);
    setActiveFlyingItem({ id: food.id, image: food.image, name: food.name });
    setLastFedName(food.name);

    // 1. Food arrives at mouth after 400ms -> play eating video!
    setTimeout(() => {
      onPlayBiteRef.current?.();
      setChompEffect(true);
      setEatenDishIds((prev) => [...prev, food.id]);
      setFedCount((prev) => Math.min(TOTAL_FEEDS, prev + 1));
      setActiveFlyingItem(null);

      // Play eating animation in same video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }

      // Hide chomp banner after 1.2s
      setTimeout(() => setChompEffect(false), 1200);

      // Reset to mouth open & pause video after 2.6s (same frame!)
      setTimeout(() => {
        setIsEatingVideoPlaying(false);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.pause();
        }
      }, 2600);
    }, 400);
  };

  // Drag / Swipe handlers for mobile & desktop
  const handleStartDrag = (foodId: string, clientX: number, clientY: number) => {
    if (isEatingVideoPlaying || fedCount >= TOTAL_FEEDS) return;
    setDraggingId(foodId);
    touchStartPosRef.current = { x: clientX, y: clientY };
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMoveDrag = (clientX: number, clientY: number) => {
    if (!draggingId) return;
    const deltaX = clientX - touchStartPosRef.current.x;
    const deltaY = clientY - touchStartPosRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEndDrag = (food: FoodOption) => {
    if (!draggingId) return;

    // If dragged UP by more than 30px or clicked
    if (dragOffset.y < -30 || Math.abs(dragOffset.y) < 10) {
      handleFeedFood(food);
    }

    setDraggingId(null);
    setDragOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden bg-[#030d30] flex flex-col justify-between select-none">
      {/* 1. END-TO-END SINGLE CONSTANT FULL SCREEN VIDEO (Baksur Eating Food.mp4 ONLY - NEVER CHANGES FRAME) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#030d30]">
        <video
          ref={videoRef}
          src={MAIN_VIDEO}
          playsInline
          autoPlay={false}
          loop={false}
          muted={!soundEnabled}
          className="w-full h-full object-cover object-center relative z-0 transition-opacity duration-300"
        />

        {/* Gradient overlays top & bottom */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#020a26] via-[#020a26]/90 to-transparent z-10 pointer-events-none" />
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

        <div className="flex items-center gap-2">
          {/* Progress Pill: 0/4 to 4/4 */}
          <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 backdrop-blur-md shadow-md">
            <Utensils className="w-3.5 h-3.5" />
            <span>{fedCount} / {TOTAL_FEEDS} Fed</span>
          </div>

          {onToggleSound && (
            <button
              onClick={onToggleSound}
              type="button"
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 3. CENTER IMPACT / CHOMP FLASH OVERLAY */}
      <div className="relative flex-1 w-full min-h-0 pointer-events-none z-30 flex items-center justify-center">
        {chompEffect && (
          <div className="flex flex-col items-center justify-center animate-in zoom-in-50 duration-200">
            <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white font-black text-lg sm:text-2xl uppercase tracking-wider shadow-[0_10px_35px_rgba(226,55,10,0.8)] border-2 border-amber-300 animate-bounce flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-200 fill-amber-300" />
              <span>CHOMP! ({fedCount}/{TOTAL_FEEDS}) 💥</span>
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-amber-300 mt-1 drop-shadow-md uppercase tracking-wide">
              Bhookasur ate {lastFedName}! 😋
            </span>
          </div>
        )}

        {/* Flying food animation towards open mouth */}
        {activeFlyingItem && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-900/80 border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.8)] animate-fly-to-mouth flex items-center justify-center p-1">
              <img
                src={activeFlyingItem.image}
                alt="Flying Dish"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM INTERACTIVE SWIPE AREA & AUR KHILAO BUTTON */}
      <div className="relative z-30 px-4 pb-6 sm:pb-8 flex flex-col items-center justify-end w-full shrink-0 gap-3">
        {/* Animated Swipe Up Prompt (Active until 4 feeds complete) */}
        {!isEatingVideoPlaying && fedCount < TOTAL_FEEDS && (
          <div className="flex flex-col items-center gap-1 cursor-pointer select-none">
            <div className="flex flex-col items-center text-amber-400 animate-bounce">
              <ChevronUp className="w-6 h-6 -mb-2 stroke-[3]" />
              <ChevronUp className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="flex items-center gap-2 text-white font-black text-base sm:text-lg tracking-wide uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              <span className="text-xl">👆</span>
              <span>Swipe karke khilao ({fedCount}/{TOTAL_FEEDS})</span>
            </div>
          </div>
        )}

        {/* 4 Food Item Plates Row (Big, Borderless, Clean Floating Plates) */}
        <div className="flex items-center justify-center gap-2 xs:gap-3 sm:gap-5 w-full max-w-xl mx-auto pt-1 pb-1">
          {foodOptions.map((food) => {
            const isBeingDragged = draggingId === food.id;
            const isEaten = eatenDishIds.includes(food.id);

            const style = isBeingDragged
              ? {
                  transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.15)`,
                  zIndex: 50
                }
              : {};

            return (
              <div
                key={food.id}
                onMouseDown={(e) => handleStartDrag(food.id, e.clientX, e.clientY)}
                onMouseMove={(e) => handleMoveDrag(e.clientX, e.clientY)}
                onMouseUp={() => handleEndDrag(food)}
                onTouchStart={(e) => handleStartDrag(food.id, e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={() => handleEndDrag(food)}
                onClick={() => handleFeedFood(food)}
                style={style}
                className="group relative w-20 h-20 xs:w-22 xs:h-22 sm:w-26 sm:h-26 cursor-grab active:cursor-grabbing transition-transform duration-100 flex items-center justify-center shrink-0"
              >
                <img
                  src={food.image}
                  alt={food.name}
                  className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] transition-transform duration-150 group-hover:scale-110 ${
                    isEaten ? 'opacity-40 grayscale-[30%]' : 'opacity-100'
                  }`}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/eating/samosa_flying.png';
                  }}
                />

                {isEaten && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <CheckCircle2 className="w-8 h-8 text-green-400 fill-slate-900 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AFTER 4 FEEDS COMPLETED: SHOW "AUR KHILAO 🍽️" BUTTON */}
        {fedCount >= TOTAL_FEEDS && (
          <div className="w-full max-w-xs mt-2 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => onCompleteRef.current?.()}
              type="button"
              className="w-full py-4 px-6 rounded-2xl bg-[#D23002] hover:bg-[#eb420e] text-white font-black text-base sm:text-lg uppercase tracking-wider shadow-[0_10px_35px_rgba(210,48,2,0.8)] flex items-center justify-center gap-2.5 transition-all transform active:scale-95 cursor-pointer border border-white/30 animate-bounce"
            >
              <span>AUR KHILAO 🍽️</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        )}
      </div>

      {/* Inline Keyframes for Flying Animation */}
      <style jsx global>{`
        @keyframes flyToMouth {
          0% {
            transform: translateY(180px) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(40px) scale(1.15);
            opacity: 1;
          }
          100% {
            transform: translateY(-80px) scale(0.2);
            opacity: 0;
          }
        }
        .animate-fly-to-mouth {
          animation: flyToMouth 0.42s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};
