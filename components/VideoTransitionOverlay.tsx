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
  const [tapCount, setTapCount] = useState(0);
  const [tapPopups, setTapPopups] = useState<Array<{ id: number; x: number; y: number; text: string; color: string }>>([]);

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

  const handleAction = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isNavigating) return;
    setIsNavigating(true);
    onComplete();
  };

  const handleOverlayTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const x = e.clientX;
    const y = e.clientY;

    const newTap = tapCount + 1;
    setTapCount(newTap);

    const labels = [`CHOMP! 💥`, `FEAST MODE! 🔥`, `COMBO! 😋`, `BHOOKASUR! 🎉`, `AUR KHILAO! 🍽️`];
    const colors = ['#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6'];
    const text = labels[newTap % labels.length];
    const color = colors[newTap % colors.length];

    const popupId = Date.now() + Math.random();
    setTapPopups((prev) => [...prev.slice(-8), { id: popupId, x, y, text, color }]);

    setTimeout(() => {
      setTapPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 900);
  };

  return (
    <div
      onClick={handleOverlayTap}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-black select-none animate-in fade-in duration-300 cursor-pointer"
    >
      {/* FLOATING TAP POPUPS ON VIDEO */}
      {tapPopups.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-[300] font-black text-base sm:text-2xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] animate-out fade-out zoom-out duration-700 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${p.x}px`,
            top: `${p.y - 30}px`,
            color: p.color
          }}
        >
          {p.text}
        </div>
      ))}

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
          className={`w-full h-full object-cover relative z-10 transition-opacity duration-300 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Gradient overlays top & bottom */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 pointer-events-none" />

        {/* Top Controls Bar */}
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSound();
            }}
            type="button"
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {tapCount > 0 && (
            <div className="px-3 py-1 rounded-full bg-amber-500/80 backdrop-blur-md text-white font-black text-xs animate-bounce">
              🔥 {tapCount} FEAST TAPS!
            </div>
          )}

          <button
            onClick={(e) => handleAction(e)}
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
            onClick={(e) => handleAction(e)}
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
