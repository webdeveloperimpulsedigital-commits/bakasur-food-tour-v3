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
    return visual.plateImage || visual.flyingImage || dishImage || '/images/eating/samosa_dish.jpg';
  }, [dishName, dishImage]);

  // 4 Food Options based on feastingStage:
  // Stage 1: 4 Servings of the USER'S ACTUAL SELECTED DISH
  // Stage 2: 4 DIFFERENT Iconic Street Foods (Randomized dynamically every time!)
  const foodOptions: FoodOption[] = useMemo(() => {
    if (feastingStage === 2) {
      const fullPool = [
        { id: 'street_samosa', name: 'Crispy Samosa', image: '/images/eating/samosa_dish.jpg' },
        { id: 'street_dosa', name: 'Masala Dosa', image: '/images/eating/dosa_dish.jpg' },
        { id: 'street_fried_rice', name: 'Triple Schezwan Rice', image: '/images/eating/fried_rice_dish.jpg' },
        { id: 'street_biryani', name: 'Special Biryani', image: '/images/eating/biryani_dish.jpg' },
        { id: 'street_pav_bhaji', name: 'Butter Pav Bhaji', image: '/images/eating/pav_bhaji_dish.jpg' },
        { id: 'street_pani_puri', name: 'Teekhi Pani Puri', image: '/images/eating/pani_puri_dish.jpg' },
        { id: 'street_momos', name: 'Steamed Momos', image: '/images/eating/momos_dish.jpg' },
        { id: 'street_misal', name: 'Katakirr Misal', image: '/images/eating/misal_dish.jpg' },
        { id: 'street_chole', name: 'Chole Bhature', image: '/images/eating/chole_bhature_dish.jpg' },
        { id: 'street_vada_pav', name: 'Special Vada Pav', image: '/images/eating/vada_pav_dish.jpg' },
        { id: 'street_paneer', name: 'Paneer Butter Masala', image: '/images/eating/paneer_dish.jpg' },
        { id: 'street_thali', name: 'Maharaja Thali', image: '/images/eating/gavran_mutton_thali.jpg' }
      ];

      // Shuffle pool and pick 4 distinct items
      const userKey = (dishName || '').toLowerCase();
      const filtered = fullPool.filter(item => !userKey.includes(item.name.toLowerCase().split(' ')[1] || 'xyz'));
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 4);
    }

    return [
      {
        id: 'dish_serving_1',
        name: dishName || 'Selected Dish',
        image: selectedDishAsset
      },
      {
        id: 'dish_serving_2',
        name: dishName || 'Selected Dish',
        image: selectedDishAsset
      },
      {
        id: 'dish_serving_3',
        name: dishName || 'Selected Dish',
        image: selectedDishAsset
      },
      {
        id: 'dish_serving_4',
        name: dishName || 'Selected Dish',
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

      {/* 3. CENTER IMPACT / FLYING ANIMATION OVERLAY */}
      <div className="relative flex-1 w-full min-h-0 pointer-events-none z-30 flex items-center justify-center">
        {/* Flying food animation towards open mouth (Clean, Borderless, Smooth Glide into Mouth) */}
        {activeFlyingItem && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="w-24 h-24 sm:w-28 sm:h-28 animate-fly-to-mouth flex items-center justify-center">
              <img
                src={activeFlyingItem.image}
                alt="Flying Dish"
                className="w-full h-full object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)]"
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

        {/* 4 Food Item Plates Row (Much Bigger Photorealistic Floating Ceramic Plates) */}
        <div className="flex items-center justify-center gap-2.5 xs:gap-3 sm:gap-6 w-full max-w-2xl mx-auto pt-1 pb-1">
          {foodOptions.map((food) => {
            const isBeingDragged = draggingId === food.id;
            const isEaten = eatenDishIds.includes(food.id);

            const style = isBeingDragged
              ? {
                  transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.18)`,
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
                className="group relative w-22 h-22 xs:w-26 xs:h-26 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-[0_14px_35px_rgba(0,0,0,0.9)] border-[2.5px] border-white/50 bg-slate-900/60 cursor-grab active:cursor-grabbing transition-transform duration-100 flex items-center justify-center shrink-0 p-0.5"
              >
                <img
                  src={food.image}
                  alt={food.name}
                  className={`w-full h-full object-cover rounded-full pointer-events-none transition-transform duration-150 group-hover:scale-110 ${
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

      {/* Inline Keyframes for Smooth Flying Animation */}
      <style jsx global>{`
        @keyframes flyToMouth {
          0% {
            transform: translateY(200px) scale(1) rotate(0deg);
            opacity: 1;
          }
          45% {
            transform: translateY(45px) scale(1.1) rotate(-4deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-5px) scale(0.12) rotate(0deg);
            opacity: 0;
          }
        }
        .animate-fly-to-mouth {
          animation: flyToMouth 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};
