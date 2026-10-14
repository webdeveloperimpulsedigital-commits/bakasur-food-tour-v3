'use client';

import React, { useRef, useState, useEffect } from 'react';

interface VideoTransitionOverlayProps {
  videoUrl: string;
  desktopVideoUrl?: string;
  buttonText?: string;
  onComplete: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const VideoTransitionOverlay: React.FC<VideoTransitionOverlayProps> = ({
  videoUrl,
  desktopVideoUrl,
  onComplete,
  soundEnabled
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(videoUrl);

  useEffect(() => {
    const updateSrc = () => {
      // Tablet and desktop screens have width >= 640px (including iPads at 768px+)
      const isTabletOrDesktop = typeof window !== 'undefined' && window.innerWidth >= 640;

      let targetSrc = videoUrl;
      if (isTabletOrDesktop) {
        if (desktopVideoUrl) {
          targetSrc = desktopVideoUrl;
        } else if (videoUrl.includes('Bhookasur-Food-Eating')) {
          targetSrc = '/images/final-frames/Bhookasur-Food-Eating-dekstop.mp4';
        }
      }
      setCurrentSrc(targetSrc);
    };

    updateSrc();
    window.addEventListener('resize', updateSrc);
    return () => window.removeEventListener('resize', updateSrc);
  }, [videoUrl, desktopVideoUrl]);

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
  }, [currentSrc, soundEnabled]);

  const handleAction = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    onComplete();
  };

  return (
    <div
      onClick={handleAction}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black select-none cursor-pointer animate-in fade-in duration-300"
    >
      {/* Full-width / Full-screen Video Player */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        <video
          key={currentSrc}
          ref={videoRef}
          src={currentSrc}
          playsInline
          autoPlay
          muted={!soundEnabled}
          onEnded={handleAction}
          onLoadedData={() => setIsVideoLoaded(true)}
          onCanPlay={() => setIsVideoLoaded(true)}
          className={`w-full h-full object-contain object-center relative z-10 transition-opacity duration-300 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  );
};
