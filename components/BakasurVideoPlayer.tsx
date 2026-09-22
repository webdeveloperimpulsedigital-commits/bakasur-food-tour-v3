'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Volume2, VolumeX, Sparkles, Flame, Play, Pause, Clapperboard, Video, ArrowLeft } from 'lucide-react';
import { BakasurEatingStage } from './BakasurEatingStage';

export interface SpiceOption {
  id: string;
  name: string;
  level: string;
  icon: string;
  description?: string;
}

interface BakasurVideoPlayerProps {
  videoUrl: string;
  stageName: string;
  frameNumber?: number;
  feastingStage?: 1 | 2 | 3;
  dishName?: string;
  dishImage?: string;
  restaurantName?: string;
  spice?: SpiceOption;
  soundEnabled?: boolean;
  loop?: boolean;
  onToggleSound?: () => void;
  onVideoEnded?: () => void;
  onSelectDish?: (dish: { name: string; image?: string; price?: number }) => void;
  onBack?: () => void;
  stepIndicator?: string;
  posterImage?: string;
}

export interface DishMomentInfo {
  category: string;
  biteEmoji: string;
  biteLabel: string;
  munchSound: string;
  actionText: string;
  image: string;
  eatingScene: string;
}

// Preset popular food quick-picks for testing/dynamic preview
export const POPULAR_FOOD_PRESETS = [
  { name: 'Crispy Butter Masala Dosa', icon: '🥞', image: '/images/eating/dosa.jpg' },
  { name: 'Shahi Chicken Dum Biryani', icon: '🍗', image: '/images/eating/biryani.jpg' },
  { name: 'Aslam Special Butter Chicken', icon: '🍗', image: '/images/eating/butter_chicken.jpg' },
  { name: 'Sita Ram Chole Bhature', icon: '🫓', image: '/images/eating/chole_bhature.jpg' },
  { name: 'Famous Creamy Dal Makhani', icon: '🍲', image: '/images/eating/dal_makhani.jpg' },
  { name: 'Extra Butter Pav Bhaji', icon: '🍛', image: '/images/eating/pav_bhaji.jpg' },
  { name: 'Spicy Katakirr Tarri Misal', icon: '🌶️', image: '/images/eating/misal.jpg' },
  { name: 'Mutton Keema Ghotala & Pav', icon: '🍳', image: '/images/eating/keema_pav.jpg' },
  { name: 'Sajuk Tupatli Puran Poli', icon: '🧈', image: '/images/eating/puran_poli.jpg' },
  { name: 'SPDP Chaat Crunch', icon: '🥣', image: '/images/eating/spdp.jpg' }
];

export function getDishMomentDetails(dishName?: string, dishImage?: string): DishMomentInfo {
  const n = (dishName || '').toLowerCase().trim();
  const hasLocalImg = Boolean(dishImage && dishImage.startsWith('/images/eating/'));

  // 1. Vada Pav / Batata Vada
  if (n.includes('vada pav') || n.includes('vadapav') || n.includes('batata vada') || n.includes('vada pao')) {
    return {
      category: 'vada_pav',
      biteEmoji: '🍔',
      biteLabel: 'Mumbai Vada Pav Feast',
      munchSound: 'CHOMP-CHOMP! Lasun Chutney Blast 💥',
      actionText: 'Bakasur is devouring Mumbai Vada Pav...',
      image: hasLocalImg ? dishImage! : '/images/eating/vada_pav_dish.jpg',
      eatingScene: '/images/eating/vada_pav_dish.jpg'
    };
  }

  // 2. Puran Poli
  if (n.includes('puran poli') || n.includes('puran') || n.includes('poli')) {
    return {
      category: 'puran_poli',
      biteEmoji: '🧈',
      biteLabel: 'Ghee Puran Poli Feast',
      munchSound: 'SLURRP! Ghee Blast 🧈',
      actionText: 'Bakasur is devouring Ghee Puran Poli...',
      image: hasLocalImg ? dishImage! : '/images/eating/puran_poli.jpg',
      eatingScene: '/images/eating/puran_poli.jpg'
    };
  }

  // 3. Dosa / Uttapam / South Indian
  if (n.includes('dosa') || n.includes('uttapam') || n.includes('mysore masala') || n.includes('rava dosa') || n.includes('set dosa') || n.includes('ghee roast') || n.includes('benne') || n.includes('idli')) {
    return {
      category: 'dosa',
      biteEmoji: '🥞',
      biteLabel: 'Crispy Butter Dosa Feast',
      munchSound: 'CRUNCH-CRUNCH! 🤤',
      actionText: 'Bakasur is chomping Crispy Dosa...',
      image: hasLocalImg ? dishImage! : '/images/eating/dosa.jpg',
      eatingScene: '/images/eating/dosa.jpg'
    };
  }

  // 4. Pav Bhaji / Masala Pav
  if (n.includes('pav bhaji') || n.includes('bhaji') || n.includes('pavbhaji') || n.includes('masala pav')) {
    return {
      category: 'pav_bhaji',
      biteEmoji: '🍛',
      biteLabel: 'Butter Pav Bhaji Feast',
      munchSound: 'CHOMP-CHOMP! Extra Butter 🧈',
      actionText: 'Bakasur is devouring Pav Bhaji...',
      image: hasLocalImg ? dishImage! : '/images/eating/pav_bhaji.jpg',
      eatingScene: '/images/eating/pav_bhaji.jpg'
    };
  }

  // 5. Pani Puri / Golgappa
  if (
    n.includes('pani puri') ||
    n.includes('panipuri') ||
    n.includes('golgappa') ||
    n.includes('gol gappe') ||
    n.includes('puchka') ||
    n.includes('gupchup')
  ) {
    return {
      category: 'pani_puri',
      biteEmoji: '🥣',
      biteLabel: 'Teekha Pani Puri Feast',
      munchSound: 'TEEKHA PANI CRUNCH! 💥',
      actionText: 'Bakasur is gulping Teekha Pani Puri...',
      image: hasLocalImg ? dishImage! : '/images/eating/pani_puri_dish.jpg',
      eatingScene: '/images/eating/pani_puri_dish.jpg'
    };
  }

  // 6. SPDP / Chaat / Dahi Puri / Bhel
  if (n.includes('spdp') || n.includes('dahi puri') || n.includes('sev puri') || n.includes('bhel') || n.includes('chaat') || n.includes('dahi') || n.includes('sev') || n.includes('tikki')) {
    return {
      category: 'spdp',
      biteEmoji: '🥣',
      biteLabel: 'SPDP Chaat Blast',
      munchSound: 'CHATPATAA CRUNCH! 🥣',
      actionText: 'Bakasur is crunching Sev Potato Dahi Puri...',
      image: hasLocalImg ? dishImage! : '/images/eating/spdp.jpg',
      eatingScene: '/images/eating/spdp.jpg'
    };
  }

  // 7. Misal / Katakirr / Spicy Curry
  if (n.includes('misal') || n.includes('katakirr') || n.includes('bedekar') || n.includes('tarri') || n.includes('rassa') || n.includes('kolhapuri')) {
    return {
      category: 'misal',
      biteEmoji: '🌶️',
      biteLabel: 'Fiery Tarri Misal Feast',
      munchSound: 'HOT TARRI SPICE! 🔥',
      actionText: 'Bakasur is slurping spicy Tarri Misal...',
      image: hasLocalImg ? dishImage! : '/images/eating/misal.jpg',
      eatingScene: '/images/eating/misal.jpg'
    };
  }

  // 8. Biryani
  if (n.includes('biryani') || n.includes('pulao') || n.includes('dum') || n.includes('rice')) {
    return {
      category: 'biryani',
      biteEmoji: '🍗',
      biteLabel: 'Shahi Dum Biryani Feast',
      munchSound: 'MUNCH-MUNCH! Saffron Aroma 🍗',
      actionText: 'Bakasur is devouring Dum Biryani...',
      image: hasLocalImg ? dishImage! : '/images/eating/biryani.jpg',
      eatingScene: '/images/eating/biryani.jpg'
    };
  }

  // 9. Kebab / Galouti Kebab
  if (n.includes('kebab') || n.includes('galouti') || n.includes('seekh') || n.includes('shami')) {
    return {
      category: 'kebab',
      biteEmoji: '🍢',
      biteLabel: 'Melt-in-Mouth Galouti Kebab Feast',
      munchSound: 'SUCCULENT MELT! 🤤',
      actionText: 'Bakasur is relishing Galouti Kebabs...',
      image: hasLocalImg ? dishImage! : '/images/eating/kebab_dish.jpg',
      eatingScene: '/images/eating/kebab_dish.jpg'
    };
  }

  // 10. Thali / Maharaja Thali
  if (n.includes('thali') || n.includes('maharaja') || n.includes('meals') || n.includes('bhojan')) {
    return {
      category: 'thali',
      biteEmoji: '👑',
      biteLabel: 'Royal Maharaja Thali Feast',
      munchSound: 'SHAHI BHOJAN! 🤤',
      actionText: 'Bakasur is devouring Royal Maharaja Thali...',
      image: hasLocalImg ? dishImage! : '/images/eating/thali_dish.jpg',
      eatingScene: '/images/eating/thali_dish.jpg'
    };
  }

  // 11. Butter Chicken / Chicken Handi / Non-veg
  if (n.includes('butter chicken') || n.includes('chicken') || n.includes('mutton') || n.includes('handi') || n.includes('korma') || n.includes('curry')) {
    return {
      category: 'butter_chicken',
      biteEmoji: '🍗',
      biteLabel: 'Butter Chicken & Gravy Feast',
      munchSound: 'LICKING FINGERS! 🤤',
      actionText: 'Bakasur is enjoying rich creamy gravy...',
      image: hasLocalImg ? dishImage! : '/images/eating/butter_chicken.jpg',
      eatingScene: '/images/eating/butter_chicken.jpg'
    };
  }

  // 12. Chole Bhature
  if (n.includes('chole') || n.includes('bhature') || n.includes('kulche') || n.includes('bhatura')) {
    return {
      category: 'chole_bhature',
      biteEmoji: '🫓',
      biteLabel: 'Fluffy Chole Bhature Feast',
      munchSound: 'CHOMP-CHOMP! Pure Punjabi Swag 🫓',
      actionText: 'Bakasur is tearing hot fluffy Bhature...',
      image: hasLocalImg ? dishImage! : '/images/eating/chole_bhature.jpg',
      eatingScene: '/images/eating/chole_bhature.jpg'
    };
  }

  // 13. Dal Makhani
  if (n.includes('dal') || n.includes('makhani') || n.includes('tadka') || n.includes('khichdi')) {
    return {
      category: 'dal_makhani',
      biteEmoji: '🍲',
      biteLabel: 'Creamy Dal Makhani Feast',
      munchSound: 'SLURRP! Creamy Butter 🧈',
      actionText: 'Bakasur is devouring creamy Dal Makhani...',
      image: hasLocalImg ? dishImage! : '/images/eating/dal_makhani.jpg',
      eatingScene: '/images/eating/dal_makhani.jpg'
    };
  }

  // 14. Keema Pav / Bun Maska / Burgers
  if (n.includes('keema') || n.includes('bun') || n.includes('burger') || n.includes('sandwich') || n.includes('maska') || n.includes('cutlet') || n.includes('roll')) {
    return {
      category: 'keema_pav',
      biteEmoji: '🍳',
      biteLabel: 'Spicy Keema Pav Feast',
      munchSound: 'CHOMP-CHOMP! Bun Maska Kick 🍳',
      actionText: 'Bakasur is gulping Keema Pav...',
      image: hasLocalImg ? dishImage! : '/images/eating/keema_pav.jpg',
      eatingScene: '/images/eating/keema_pav.jpg'
    };
  }

  // If custom valid image was passed
  if (dishImage && !dishImage.includes('bakasur') && (dishImage.startsWith('http') || dishImage.startsWith('/'))) {
    return {
      category: 'custom',
      biteEmoji: '🍽️',
      biteLabel: `${dishName || 'Specialty'} Feast`,
      munchSound: 'CHOMP-CHOMP! 🤤',
      actionText: `Bakasur is devouring ${dishName || 'food'}...`,
      image: dishImage,
      eatingScene: dishImage
    };
  }

  // Default fallback
  return {
    category: 'generic',
    biteEmoji: '🍽️',
    biteLabel: 'Bakasur Royal Feast',
    munchSound: 'CHOMP-CHOMP! 🤤',
    actionText: `Bakasur is devouring ${dishName || 'food'}...`,
    image: '/images/eating/pav_bhaji.jpg',
    eatingScene: '/images/eating/pav_bhaji.jpg'
  };
}

export function getDishImage(dishName?: string, dishImage?: string): string {
  return getDishMomentDetails(dishName, dishImage).image;
}

export const BakasurVideoPlayer: React.FC<BakasurVideoPlayerProps> = ({
  videoUrl,
  stageName,
  frameNumber = 1,
  feastingStage = 1,
  dishName,
  dishImage,
  restaurantName,
  spice,
  soundEnabled = true,
  loop = true,
  onToggleSound,
  onVideoEnded,
  onBack,
  stepIndicator,
  posterImage = "/images/bakasur_pass.jpg"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(!soundEnabled);

  const isEating = (frameNumber === 5 && stageName !== 'trailer') || stageName === 'eating';
  const isHeartburn = frameNumber === 7 || frameNumber === 8 || stageName === 'heartburn' || feastingStage === 3;
  const isPass = frameNumber === 13 || stageName === 'pass';
  const isReliefDone = frameNumber === 10 || stageName === 'relief_done';

  const cleanDishTitle = dishName ? dishName.replace(/^Ready in |^Bakasur in |^Feeding /i, '') : 'Signature Food';

  // Sync mute state
  useEffect(() => {
    setIsMuted(!soundEnabled);
    if (videoRef.current) {
      videoRef.current.muted = !soundEnabled;
    }
  }, [soundEnabled]);

  // Video resolution across 13 frames:
  // - Frame 1 (Welcome): /uploads/videos/video-frame-1.mp4
  // - Frame 2 (Restaurant Search): /uploads/videos/bakasur-frame-one.mp4
  // - Frame 3 & 4 (Dish Selection / Manual Dish): /uploads/videos/video-frame-1.mp4
  // - Frame 5 (Eating Begins): /uploads/videos/1.mp4
  // - Frame 6 (Feeding Loop): 1.mp4 -> 2.mp4 -> 3.mp4
  // - Frame 7 & 8 (Acidity Overload): /uploads/videos/3.mp4
  // - Frame 9 (Gastrium Relief): /uploads/videos/video-frame-2.mp4
  // - Frame 10 (Submitted): Relieved
  // - Frame 11 & 12 (Map & Registration): /uploads/videos/video-frame-1.mp4
  // - Frame 13 (Pass): Bakasur Pass
  const activeVideoSrc = useMemo(() => {
    if (frameNumber === 1) return '/uploads/videos/video-frame-1.mp4';
    if (frameNumber === 2) return '/uploads/videos/bakasur-frame-one.mp4';
    if (frameNumber === 3 || frameNumber === 4) return '/uploads/videos/video-frame-1.mp4';
    if (frameNumber === 5) return '/uploads/videos/1.mp4';
    if (frameNumber === 6) {
      if (feastingStage === 1) return '/uploads/videos/1.mp4';
      if (feastingStage === 2) return '/uploads/videos/2.mp4';
      return '/uploads/videos/3.mp4';
    }
    if (frameNumber === 7 || frameNumber === 8 || isHeartburn) return '/uploads/videos/3.mp4';
    if (frameNumber === 9) return '/uploads/videos/video-frame-2.mp4';
    if (frameNumber === 11 || frameNumber === 12) return '/uploads/videos/video-frame-1.mp4';

    return videoUrl || '/uploads/videos/video-frame-1.mp4';
  }, [frameNumber, feastingStage, isHeartburn, videoUrl]);

  // Autoplay video smoothly on source change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;
    const playVideo = async () => {
      try {
        video.currentTime = 0;
        video.muted = !soundEnabled;
        const p = video.play();
        if (p !== undefined) {
          await p;
        }
        if (isMounted) setIsPlaying(true);
      } catch {
        try {
          if (!isMounted || !video) return;
          video.muted = true;
          const retry = video.play();
          if (retry !== undefined) {
            await retry;
          }
          if (isMounted) setIsPlaying(true);
        } catch {
          if (isMounted) setIsPlaying(false);
        }
      }
    };

    playVideo();
    return () => {
      isMounted = false;
    };
  }, [activeVideoSrc, soundEnabled]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden bg-[#04115b] flex items-center justify-center select-none">
      {/* Top Header Bar matching Reference UI */}
      {frameNumber === 2 || stepIndicator ? (
        <div className="absolute top-0 inset-x-0 z-40 px-4 py-3.5 flex items-center justify-between text-white pointer-events-auto">
          <button
            onClick={onBack}
            type="button"
            className="p-1 -ml-1 rounded-full hover:bg-white/20 transition-all cursor-pointer flex items-center justify-center"
            aria-label="Wapas"
          >
            <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
          <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white drop-shadow-sm">
            BAKASUR KA FOOD TOUR
          </span>
          <div className="flex items-center gap-2">
            <span className="font-black text-xs sm:text-sm text-white/95">
              {stepIndicator || '1/3'}
            </span>
            {onToggleSound && (
              <button
                onClick={onToggleSound}
                type="button"
                aria-label={soundEnabled ? "Mute Sound" : "Enable Sound"}
                className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 transition-all cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3 h-3 text-yellow-300" />
                ) : (
                  <VolumeX className="w-3 h-3 text-white/70" />
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Top Left: POWERED BY GASTRIUM (Hidden on Frame 1, displayed at bottom) */}
          {frameNumber !== 1 && (
            <div className="absolute top-3.5 left-4 z-40 pointer-events-none">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/95 drop-shadow-md">
                POWERED BY GASTRIUM
              </span>
            </div>
          )}

          {/* Top Right: Audio Toggle Button (Hidden on Frame 1 Welcome Screen) */}
          {onToggleSound && frameNumber !== 1 && (
            <button
              onClick={onToggleSound}
              type="button"
              aria-label={soundEnabled ? "Mute Sound" : "Enable Sound"}
              className="absolute top-3 right-3 sm:top-3.5 sm:right-4 z-40 p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md shadow-lg transition-all cursor-pointer flex items-center justify-center group"
              title={soundEnabled ? "Mute Sound" : "Enable Sound"}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 group-hover:scale-110 transition-transform" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 group-hover:scale-110 transition-transform" />
              )}
            </button>
          )}
        </>
      )}

      {/* Main Stage Media Render */}
      {frameNumber === 10 ? (
        /* Frame 10: Exact Shukriya Dost Map Par Dekho Character from User Mockup */
        <div className="relative w-full h-full flex items-end justify-center overflow-hidden bg-[#04115b]">
          <img
            src="/images/food_tour/shukriya_map_photo.png"
            alt="Bakasur Map Recommendation Approved"
            className="w-full h-full object-contain object-bottom p-1 sm:p-2 md:p-3 select-none pointer-events-none"
          />
        </div>
      ) : frameNumber === 9 ? (
        /* Frame 9: Exact Gastrium In Character / Bottle Frame (supports video when provided) */
        <div className="relative w-full h-full flex items-end justify-center overflow-hidden bg-[#04115b]">
          {videoUrl && videoUrl.includes('gastrium') ? (
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              autoPlay
              muted={isMuted}
              onEnded={() => {
                setIsPlaying(false);
                if (onVideoEnded) onVideoEnded();
              }}
              className="w-full h-full max-w-full max-h-full object-contain object-bottom relative z-10"
            />
          ) : (
            <img
              src="/images/food_tour/gastrium_in_photo.png"
              alt="Gastrium In"
              className="w-full h-full object-contain object-bottom p-1 sm:p-2 md:p-3 select-none pointer-events-none"
            />
          )}
        </div>
      ) : isReliefDone ? (
        /* Relief Complete Visual */
        <div className="w-full h-full relative bg-[#04115b] flex items-center justify-center">
          <img
            src="/images/bakasur_relieved.jpg"
            alt="Bakasur Relieved"
            className="w-full h-full object-contain object-bottom"
          />
        </div>
      ) : isPass ? (
        /* Tour Pass Visual */
        <div className="w-full h-full relative bg-[#04115b] flex items-center justify-center">
          <img
            src="/images/bakasur_pass.jpg"
            alt="Bakasur Official Pass"
            className="w-full h-full object-contain object-top"
          />
        </div>
      ) : frameNumber === 1 ? (
        /* Frame 1: Exact Selfie Stick Bakasur from Reference Image */
        <div className="relative w-full h-full flex items-end justify-center overflow-hidden bg-[#04115b]">
          <img
            src="/images/bakasur_selfie.jpg"
            alt="Bakasur Ka Food Tour"
            className="w-full h-full object-cover object-bottom"
          />
        </div>
      ) : frameNumber === 2 ? (
        /* Frame 2: Exact Plate-holding Character from User Reference Image with Full Left & Right Clearance */
        <div className="relative w-full h-full flex items-end justify-center overflow-hidden bg-[#04115b]">
          <img
            src="/images/bakasur_plate_character.png"
            alt="Bakasur Ready To Eat"
            className="w-full h-full object-contain object-bottom p-1 sm:p-2 md:p-3 select-none pointer-events-none"
          />
        </div>
      ) : frameNumber === 3 ? (
        /* Frame 3: Exact Bakasur Pointing Character from User Reference Image */
        <div className="relative w-full h-full flex items-end justify-center overflow-hidden bg-[#04115b]">
          <img
            src="/images/bakasur_pointing.png"
            alt="Bakasur Pointing to Dishes"
            className="w-full h-full object-contain object-bottom p-1 sm:p-2 md:p-3 select-none pointer-events-none"
          />
        </div>
      ) : frameNumber === 6 ? (
        /* Frame 6: Exact Empty Plate Character from User Reference Image */
        <div className="relative w-full h-full flex items-end justify-center overflow-hidden bg-[#04115b]">
          <img
            src="/images/bakasur_empty_plate.png"
            alt="Bakasur Empty Plate Food Trailer"
            className="w-full h-full object-contain object-bottom p-1 sm:p-2 md:p-3 select-none pointer-events-none"
          />
        </div>
      ) : frameNumber === 8 ? (
        /* Frame 8: Exact Bakasur Hand Stop / Distressed Character from User Mockup */
        <div className="relative w-full h-full flex items-end justify-center overflow-hidden bg-[#04115b]">
          <img
            src="/images/food_tour/bakasur_help_photo.png"
            alt="Bakasur Needs Help"
            className="w-full h-full object-contain object-bottom p-1 sm:p-2 md:p-3 select-none pointer-events-none"
          />
        </div>
      ) : isEating ? (
        /* Frames 5 & 6: Dynamic Bakasur Eating Stage with Chomping mouth, Looping Flying Food & Zomato Loading Screen Messages */
        <BakasurEatingStage
          dishName={cleanDishTitle}
          dishImage={dishImage}
          restaurantName={restaurantName}
          feastingStage={feastingStage}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
          onBack={onBack}
        />
      ) : (
        /* Character Video Frames */
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#04115b]">
          <video
            ref={videoRef}
            src={activeVideoSrc}
            playsInline
            autoPlay
            loop={isEating ? false : loop}
            muted={isMuted}
            onEnded={() => {
              setIsPlaying(false);
              if (onVideoEnded) onVideoEnded();
            }}
            className="w-full h-full max-w-full max-h-full object-contain object-bottom relative z-10"
          />

          {/* Catchy Hungry Cue Overlay directly on Video Frame */}
          {isEating && feastingStage < 3 && (
            <div className="absolute bottom-6 sm:bottom-10 inset-x-3 sm:inset-x-6 flex justify-center items-center pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative bg-black/90 backdrop-blur-md border-2 border-yellow-400 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(250,204,21,0.55)] flex items-center gap-3 sm:gap-4 max-w-sm sm:max-w-md w-full animate-bounce">
                <div className="text-3xl sm:text-4xl shrink-0 select-none animate-pulse">
                  {feastingStage === 1 ? '🤤' : '🤪'}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-yellow-400 text-slate-950 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      STILL HUNGRY!
                    </span>
                    <span className="text-yellow-300 text-[11px] sm:text-xs font-black">
                      Needs More Food! 🍽️
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-white mt-1 leading-snug">
                    {feastingStage === 1
                      ? '“Abhi toh pet khali hai! Aur lao jaldi!” 😋'
                      : '“Monster bhookh abhi baki hai! Aur khilao!” 🍖'}
                  </p>
                  <p className="text-[10px] font-bold text-amber-300/90 mt-0.5">
                    👉 Tap &ldquo;AUR KHILAO&rdquo; to feed Bakasur!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Acidity Overload Burning Aura (Stage 3 Heartburn) */}
          {isHeartburn && (
            <div className="absolute inset-0 bg-gradient-to-t from-red-600/40 via-orange-600/20 to-transparent pointer-events-none z-20 animate-flame-volcano" />
          )}
        </div>
      )}
    </div>
  );
};
