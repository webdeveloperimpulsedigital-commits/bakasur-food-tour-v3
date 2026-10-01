'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowRight, SkipForward } from 'lucide-react';

interface VideoTransitionOverlayProps {
  videoUrl: string;
  buttonText: string;
  onComplete: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const VideoTransitionOverlay: React.FC<VideoTransitionOverlayProps> = ({
  videoUrl,
  buttonText,
  onComplete,
  soundEnabled,
  onToggleSound
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsVideoLoaded(false);
    setIsNavigating(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = !soundEnabled;
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [videoUrl, soundEnabled]);

  const handleAction = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-black select-none animate-in fade-in duration-300">
      {/* Full-width / Full-screen Video Player */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          autoPlay
          muted={!soundEnabled}
          onLoadedData={() => setIsVideoLoaded(true)}
          onCanPlay={() => setIsVideoLoaded(true)}
          className={`w-full h-full object-contain object-center relative z-10 transition-opacity duration-300 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Gradient overlays top & bottom */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 pointer-events-none" />

        {/* Top Controls Bar */}
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between">
          <button
            onClick={onToggleSound}
            type="button"
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <button
            onClick={handleAction}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all cursor-pointer"
          >
            <span>Skip</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom CTA Action Button */}
        <div className="absolute bottom-6 sm:bottom-10 inset-x-4 sm:inset-x-8 z-30 max-w-md mx-auto">
          <button
            onClick={handleAction}
            type="button"
            className="w-full py-4 px-6 rounded-2xl bg-[#D23002] hover:bg-[#eb420e] text-white font-black text-base sm:text-lg tracking-wide uppercase shadow-2xl shadow-[#D23002]/60 flex items-center justify-center gap-3 transition-all transform cursor-pointer border border-white/30 opacity-100 translate-y-0 scale-100 animate-bounce active:scale-95"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
