'use client';

import React, { useRef, useState, useEffect } from 'react';

interface VideoTransitionOverlayProps {
  videoUrl: string;
  buttonText?: string;
  onComplete: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const VideoTransitionOverlay: React.FC<VideoTransitionOverlayProps> = ({
  videoUrl,
  onComplete,
  soundEnabled
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
    <div
      onClick={handleAction}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black select-none cursor-pointer animate-in fade-in duration-300"
    >
      {/* Full-width / Full-screen Video Player */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          autoPlay
          muted
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
