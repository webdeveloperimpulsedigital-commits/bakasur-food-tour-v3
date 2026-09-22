'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowLeft, Utensils } from 'lucide-react';
import { FoodTourSpot } from '@/lib/foodTourSpots';

interface Frame6RandomFoodSpotProps {
  spot: FoodTourSpot;
  round: number; // 1 or 2
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onBack?: () => void;
  onFeedMore: () => void;
}

export const Frame6RandomFoodSpot: React.FC<Frame6RandomFoodSpotProps> = ({
  spot,
  round,
  soundEnabled = true,
  onToggleSound,
  onBack,
  onFeedMore
}) => {
  // Step 1: Bakasur eating at spot -> Step 2: Finished / Empty plate + "AUR KHILAO"
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3.5);

  // Auto-advance from Step 1 (Eating) to Step 2 (Empty Plate) after 3.5 seconds
  useEffect(() => {
    if (currentStep === 1) {
      setSecondsRemaining(3.5);

      const interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          const next = parseFloat((prev - 0.1).toFixed(1));
          return next > 0 ? next : 0;
        });
      }, 100);

      const timer = setTimeout(() => {
        setCurrentStep(2);
      }, 3500);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [currentStep, spot.id]);

  // If user clicks on screen during Step 1, advance immediately to Step 2
  const handleStageClick = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const activeMedia = currentStep === 1 ? spot.eatingMedia : spot.emptyMedia;
  const isVideo = activeMedia.endsWith('.mp4') || activeMedia.endsWith('.webm');
  const activeCopy = currentStep === 1 ? spot.eatingCopy : spot.emptyCopy;

  return (
    <div
      onClick={handleStageClick}
      className="w-full h-full flex flex-col md:flex-row bg-white overflow-hidden relative select-none"
    >
      {/* LEFT (Desktop) / TOP (Mobile): Visual Media Showcase */}
      <div className="w-full md:w-1/2 h-[50%] sm:h-[52%] md:h-full relative overflow-hidden bg-[#182858] shrink-0 flex items-center justify-center">
        {/* Top Header matching reference mockup */}
        <div className="absolute top-0 inset-x-0 z-40 px-4 py-3 sm:py-3.5 flex items-center justify-between text-white pointer-events-auto bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                type="button"
                className="p-1 -ml-1 rounded-full hover:bg-white/20 transition-all cursor-pointer flex items-center justify-center"
                aria-label="Wapas"
              >
                <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
              </button>
            )}
            <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white drop-shadow-sm">
              BAKASUR KA FOOD TOUR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              Food Tour Spot
            </span>
            {onToggleSound && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSound();
                }}
                type="button"
                aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
                className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 transition-all cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-yellow-300" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-white/70" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Media (Static Video or High-Res Image) */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <video
              key={`${spot.id}-${currentStep}`}
              src={activeMedia}
              playsInline
              autoPlay
              loop
              muted={!soundEnabled}
              className="w-full h-full object-cover object-[center_20%]"
            />
          ) : (
            <img
              key={`${spot.id}-${currentStep}`}
              src={activeMedia}
              alt={`${spot.dishName} at ${spot.spotName}`}
              className="w-full h-full object-cover object-[center_20%] transition-opacity duration-300"
            />
          )}

          {/* Subtle dish location tag in bottom left of image */}
          <div className="absolute bottom-2 left-3 z-30 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold flex items-center gap-1.5 border border-white/15">
            <Utensils className="w-3 h-3 text-orange-400" />
            <span>{spot.spotName}</span>
          </div>
        </div>
      </div>

      {/* RIGHT (Desktop) / BOTTOM (Mobile): Clean Punchy Copy & "AUR KHILAO" Action */}
      <div className="w-full md:w-1/2 flex-1 md:h-full flex flex-col justify-center items-start text-left bg-white p-4 sm:p-6 md:p-8 lg:p-10 z-20 gap-4 sm:gap-6">
        {/* Comedic Headline matching reference mockup */}
        <div className="space-y-1 sm:space-y-2 min-h-[70px] sm:min-h-[85px] flex flex-col justify-center">
          <h1 className="text-[26px] xs:text-[30px] sm:text-[34px] md:text-[38px] font-black text-[#0B1B48] tracking-tight leading-[1.15]">
            {activeCopy.line1}
            <br />
            {activeCopy.line2Prefix}
            <span className="text-[#D4380D]">{activeCopy.highlight}</span>
            {activeCopy.line2Suffix || ''}
          </h1>
        </div>

        {/* Step 1: Subtle progress / tap indicator | Step 2: Bold "AUR KHILAO" Button */}
        <div className="w-full pt-1 sm:pt-2">
          {currentStep === 1 ? (
            <div className="w-full space-y-2">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-[#D4380D] transition-all duration-100 ease-linear rounded-full"
                  style={{ width: `${((3.5 - secondsRemaining) / 3.5) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <div className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4380D] animate-ping" />
                  <span>Devouring in progress...</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStep(2);
                  }}
                  className="text-slate-400 hover:text-slate-700 underline text-[11px] cursor-pointer"
                >
                  Skip &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-2 animate-in fade-in duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedMore();
                }}
                type="button"
                className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-base sm:text-lg md:text-xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
              >
                AUR KHILAO
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
