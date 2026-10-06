'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Volume2, VolumeX, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const TOTAL_FEEDS = feastingStage === 2 ? 2 : 3;
  const [fedCount, setFedCount] = useState<number>(0);
  const [eatenDishIds, setEatenDishIds] = useState<string[]>([]);
  const [activeFlyingItem, setActiveFlyingItem] = useState<{ id: string; image: string; name: string } | null>(null);
  const [chompEffect, setChompEffect] = useState<boolean>(false);
  const [bitePopupText, setBitePopupText] = useState<string>('');
  
  const POPUP_MESSAGES = [
    'Aur Khilao! Yummy! 🤤',
    'Maza Aa Gaya! Aur Bhej! 🔥',
    'Aur Khilao! Super Yum! 😋',
    'Ek Aur Bite, Fast! 🚀',
    'Aha! Gazab Taste Hai! 💥'
  ];
  const MAIN_VIDEO = '/images/all-frames/Baksur Eating Food.mp4';
  const [isEatingVideoPlaying, setIsEatingVideoPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    setActiveFlyingItem(null);
    setDraggingFood(null);
    setChompEffect(false);
  }, [feastingStage]);

  // Selected dish visual asset (plate or user-uploaded image)
  const selectedDishAsset = useMemo(() => {
    const visual = getDishVisualAssets(dishName, dishImage);
    return visual.plateImage || visual.flyingImage || dishImage || '/images/eating/samosa_dish.jpg';
  }, [dishName, dishImage]);

  // Food Options based on feastingStage:
  // Stage 1: 3 Servings of the USER'S ACTUAL SELECTED DISH
  // Stage 2: 2 DIFFERENT Iconic Street Foods (Randomized dynamically every time!)
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

      // Shuffle pool and pick 2 distinct items
      const userKey = (dishName || '').toLowerCase();
      const filtered = fullPool.filter(item => !userKey.includes(item.name.toLowerCase().split(' ')[1] || 'xyz'));
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 2);
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
    if (activeFlyingItem || isEatingVideoPlaying || fedCount >= TOTAL_FEEDS || eatenDishIds.includes(food.id)) return;

    // Get 100% transparent PNG food morsel/cutout for smooth realistic mouth feeding
    const flyingPNG = getDishExactFlyingImage(food.name, food.image);

    setIsEatingVideoPlaying(true);
    setActiveFlyingItem({ id: food.id, image: flyingPNG, name: food.name });

    // Pick fun reaction message
    const msg = POPUP_MESSAGES[fedCount % POPUP_MESSAGES.length];
    setBitePopupText(msg);

    // 1. Food arrives at mouth after 400ms -> play eating video & show popup reaction!
    setTimeout(() => {
      onPlayBiteRef.current?.();
      setChompEffect(true);
      setEatenDishIds((prev) => [...prev, food.id]);
      const newFedCount = fedCount + 1;
      setFedCount(newFedCount);
      setActiveFlyingItem(null);

      // Play eating animation in same video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => { });
      }

      // Hide reaction popup banner after 1.5s
      setTimeout(() => setChompEffect(false), 1500);

      // Trigger onComplete to transition when all feeds are completed!
      if (newFedCount >= TOTAL_FEEDS) {
        setTimeout(() => {
          onCompleteRef.current?.();
        }, 1200);
      }

      // Reset to mouth open & pause video after 2.6s
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
  const handleStartDrag = (food: FoodOption, clientX: number, clientY: number) => {
    if (isEatingVideoPlaying || fedCount >= TOTAL_FEEDS || eatenDishIds.includes(food.id)) return;

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
    // If dragged UP by more than 30px or dragged into upper 65% of screen
    if (deltaY < -30 || dragCurrentPos.y < (typeof window !== 'undefined' ? window.innerHeight * 0.65 : 400)) {
      handleFeedFood(draggingFood.food);
    }

    setDraggingFood(null);
  };

  return (
    <div
      onMouseMove={(e) => draggingFood && handleMoveDrag(e.clientX, e.clientY)}
      onMouseUp={handleEndDrag}
      onTouchMove={(e) => draggingFood && handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEndDrag}
      className="relative w-full h-full min-h-full overflow-hidden bg-[#030d30] flex flex-col justify-between select-none"
    >
      {/* 1. END-TO-END SINGLE CONSTANT FULL SCREEN VIDEO (Baksur Eating Food.mp4 ONLY) */}
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



      {/* Center flex container for flying food animation */}
      <div className="relative flex-1 w-full min-h-0 pointer-events-none z-30 flex flex-col items-center justify-center">

        {/* Flying food animation towards open mouth (Clean Transparent PNG Glide into Mouth) */}
        {activeFlyingItem && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="w-28 h-28 sm:w-36 sm:h-36 animate-fly-to-mouth flex items-center justify-center">
              <img
                src={activeFlyingItem.image}
                alt="Flying PNG Food Morsel"
                className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
              />
            </div>
          </div>
        )}
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
          className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
        >
          <img
            src={draggingFood.flyingPNG}
            alt="Dragging Food Morsel PNG"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* 4. BOTTOM INTERACTIVE SWIPE AREA & FOOD PLATES ROW */}
      <div className="relative z-30 px-4 pb-6 sm:pb-8 flex flex-col items-center justify-end w-full shrink-0 gap-3">
        {/* Animated Swipe Up Prompt */}
        {!isEatingVideoPlaying && fedCount < TOTAL_FEEDS && !chompEffect && (
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

        {/* Bite Reaction Text (Clean text-only displayed in dark lower gradient above food plates) */}
        {chompEffect && (
          <div className="animate-in zoom-in-95 fade-in duration-150 flex flex-col items-center text-center select-none py-1">
            <div className="flex items-center gap-2 text-amber-300 font-black text-base sm:text-xl uppercase tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] animate-bounce">
              <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
              <span>{bitePopupText || 'Aur Khilao! Yummy! 🤤'}</span>
            </div>
          </div>
        )}

        {/* 3 Food Item Ceramic Plates Row (Fixed in Bottom Row - Never Drags as a Box) */}
        <div className="flex items-center justify-center gap-2.5 xs:gap-3 sm:gap-6 w-full max-w-2xl mx-auto pt-1 pb-1">
          {foodOptions.map((food) => {
            const isEaten = eatenDishIds.includes(food.id);


            return (
              <div
                key={food.id}
                onMouseDown={(e) => handleStartDrag(food, e.clientX, e.clientY)}
                onTouchStart={(e) => handleStartDrag(food, e.touches[0].clientX, e.touches[0].clientY)}
                onClick={() => handleFeedFood(food)}
                className="group relative w-22 h-22 xs:w-26 xs:h-26 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-[0_14px_35px_rgba(0,0,0,0.9)] border-[2.5px] border-white/50 bg-slate-900/60 cursor-grab active:cursor-grabbing transition-all duration-150 flex items-center justify-center shrink-0 p-0.5 active:scale-95"
              >
                <img
                  src={food.image}
                  alt={food.name}
                  className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] transition-transform duration-150 group-hover:scale-110 ${isEaten ? 'opacity-40 grayscale-[30%]' : 'opacity-100'
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

      {/* Inline Keyframes for Smooth Transparent PNG Flying Animation into Mouth */}
      <style jsx global>{`
        @keyframes flyToMouth {
          0% {
            transform: translateY(260px) scale(0.9) rotate(0deg);
            opacity: 1;
          }
          45% {
            transform: translateY(135px) scale(1.25) rotate(-5deg);
            opacity: 1;
          }
          85% {
            transform: translateY(85px) scale(0.35) rotate(2deg);
            opacity: 0.9;
          }
          100% {
            transform: translateY(70px) scale(0.05) rotate(0deg);
            opacity: 0;
          }
        }
        .animate-fly-to-mouth {
          animation: flyToMouth 0.48s cubic-bezier(0.18, 0.89, 0.32, 1.15) forwards;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};
