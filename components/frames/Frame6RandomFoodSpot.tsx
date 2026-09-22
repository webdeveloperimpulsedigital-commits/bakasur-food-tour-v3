'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowLeft, Utensils, Sparkles } from 'lucide-react';
import { FoodTourSpot } from '@/lib/foodTourSpots';

interface Frame6RandomFoodSpotProps {
  spot: FoodTourSpot;
  round: number; // 1 (Dosa) or 2 (Pav Bhaji)
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
  // Step 1: Bakasur eating at spot (full 10-12s video)
  // Step 2: Finished / Empty plate (4.5s) -> then auto-advances to next spot / frame
  const EATING_DURATION = 11.5; // seconds for eating video (full Dosa/Pav Bhaji clip)
  const EMPTY_DURATION = 4.5;   // seconds for empty plate celebration before auto-advancing

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [eatingSecondsRemaining, setEatingSecondsRemaining] = useState<number>(EATING_DURATION);
  const [emptySecondsRemaining, setEmptySecondsRemaining] = useState<number>(EMPTY_DURATION);

  // When spot or round changes, ALWAYS reset to Step 1 (Eating video)
  useEffect(() => {
    setCurrentStep(1);
    setEatingSecondsRemaining(EATING_DURATION);
    setEmptySecondsRemaining(EMPTY_DURATION);
  }, [spot.id, round]);

  // Step 1: Timer to advance from Step 1 (Eating) to Step 2 (Empty Plate)
  useEffect(() => {
    if (currentStep === 1) {
      setEatingSecondsRemaining(EATING_DURATION);

      const interval = setInterval(() => {
        setEatingSecondsRemaining((prev) => {
          const next = parseFloat((prev - 0.1).toFixed(1));
          return next > 0 ? next : 0;
        });
      }, 100);

      const timer = setTimeout(() => {
        setCurrentStep(2);
      }, EATING_DURATION * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [currentStep, spot.id, round]);

  // Step 2: Auto-advance to next spot (or Frame 7) after EMPTY_DURATION
  useEffect(() => {
    if (currentStep === 2) {
      setEmptySecondsRemaining(EMPTY_DURATION);

      const interval = setInterval(() => {
        setEmptySecondsRemaining((prev) => {
          const next = parseFloat((prev - 0.1).toFixed(1));
          return next > 0 ? next : 0;
        });
      }, 100);

      const timer = setTimeout(() => {
        onFeedMore();
      }, EMPTY_DURATION * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [currentStep, onFeedMore]);

  // Screen click handler: advances step immediately
  const handleStageClick = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      onFeedMore();
    }
  };

  const activeMedia = currentStep === 1 ? spot.eatingMedia : spot.emptyMedia;
  const isVideo = activeMedia.endsWith('.mp4') || activeMedia.endsWith('.webm');
  const activeCopy = currentStep === 1 ? spot.eatingCopy : spot.emptyCopy;

  return (
    <div
      onClick={handleStageClick}
      className="w-full h-full flex flex-col md:flex-row bg-white overflow-hidden relative select-none cursor-pointer"
    >
      {/* LEFT (Desktop) / TOP (Mobile): Visual Media Showcase */}
      <div className="w-full md:w-1/2 h-[64%] xs:h-[66%] sm:h-[68%] md:h-full relative overflow-hidden bg-[#182858] shrink-0 flex items-center justify-center">
        {/* Media (Eating video or Empty plate video - clean without top overlay buttons) */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <video
              key={`${spot.id}-${currentStep}`}
              src={activeMedia}
              playsInline
              autoPlay
              loop={false}
              muted={!soundEnabled}
              onEnded={() => {
                // When video naturally reaches end, transition to next phase
                if (currentStep === 1) {
                  setCurrentStep(2);
                } else {
                  onFeedMore();
                }
              }}
              className="w-full h-full object-cover object-[center_25%]"
            />
          ) : (
            <img
              key={`${spot.id}-${currentStep}`}
              src={activeMedia}
              alt={`${spot.dishName} at ${spot.spotName}`}
              className="w-full h-full object-cover object-[center_25%] transition-opacity duration-300"
            />
          )}

          {/* Clean media without any text overlays on top of video */}
        </div>
      </div>

      {/* RIGHT (Desktop) / BOTTOM (Mobile): Clean Punchy Copy & Action Section */}
      <div className="w-full md:w-1/2 flex-1 md:h-full flex flex-col justify-center items-start text-left bg-white py-5 sm:py-7 md:py-9 px-5 sm:px-8 md:px-10 z-20 gap-3.5 sm:gap-5 overflow-y-auto scrollbar-thin">
        {/* Comedic Headline matching reference mockup */}
        <div className="space-y-1 sm:space-y-2 min-h-[70px] sm:min-h-[85px] flex flex-col justify-center">
          <h1 className="text-[30px] xs:text-[34px] sm:text-[40px] md:text-[46px] font-black text-[#0B1B48] tracking-tight leading-[1.12]">
            {activeCopy.line1}
            <br />
            {activeCopy.line2Prefix}
            <span className="text-[#D4380D]">{activeCopy.highlight}</span>
            {activeCopy.line2Suffix || ''}
          </h1>
        </div>

        {/* Step 2: Clean "AUR KHILAO" Button */}
        <div className="w-full pt-1 sm:pt-2">
          {currentStep === 2 && (
            <div className="w-full space-y-2 animate-in fade-in duration-200">
              {/* Action Button: Click to advance immediately */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedMore();
                }}
                type="button"
                className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
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
