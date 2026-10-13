'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Instagram, MessageCircle, Ticket } from 'lucide-react';

interface BakasurShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName?: string;
  cityName?: string;
  dishName?: string;
  dishImage?: string;
  participationId?: string;
  userName?: string;
}

export const BakasurShareCardModal: React.FC<BakasurShareCardModalProps> = ({
  isOpen,
  onClose,
  participationId = 'BKT-' + Math.floor(100000 + Math.random() * 900000)
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElementRef = useRef<HTMLImageElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const heroImageSrc = '/images/final-frames/food-tour-img.jpg';

  const generateCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card Dimensions: 1080 x 1560 (Photo on top, white space below with text & CTA)
    canvas.width = 1080;
    canvas.height = 1560;

    // 1. Crisp Clean White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1080, 1560);

    const drawRestOfCard = (imgSource: HTMLImageElement | null) => {
      // 2. Full-width Hero Photo at Top (0, 0, 1080, 1000)
      if (imgSource) {
        try {
          ctx.drawImage(imgSource, 0, 0, 1080, 1000);
        } catch {
          ctx.fillStyle = '#081B4B';
          ctx.fillRect(0, 0, 1080, 1000);
        }
      }

      // 3. Message in the White Space below image
      ctx.textAlign = 'center';

      // Message Line 1
      ctx.fillStyle = '#0B1B48';
      ctx.font = '900 48px sans-serif';
      ctx.fillText('Maine Bhookasur ke saath Food Tour kiya!', 540, 1120);

      // Message Line 2
      ctx.fillStyle = '#D4380D';
      ctx.font = '800 36px sans-serif';
      ctx.fillText('Aap bhi Bhookasur ke saath Food Tour kijiye', 540, 1195);

      // Message Line 3
      ctx.fillText('aur apna food spot share kijiye!', 540, 1255);

      // 4. Website Link CTA Button (Brand Blue Pill with white text)
      const siteDomain = typeof window !== 'undefined' && window.location.host ? window.location.host : 'bhookasur.com';

      const pillX = 140;
      const pillY = 1320;
      const pillW = 800;
      const pillH = 105;

      ctx.fillStyle = '#0B1B48';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 52);
        ctx.fill();
      } else {
        ctx.fillRect(pillX, pillY, pillW, pillH);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px sans-serif';
      ctx.fillText(siteDomain, 540, 1388);

      // 5. Footer Branding
      ctx.fillStyle = '#0B1B48';
      ctx.font = '800 28px sans-serif';
      ctx.fillText('Powered by Gastrium', 540, 1468);

      ctx.fillStyle = '#64748B';
      ctx.font = '700 24px sans-serif';
      ctx.fillText('Acidity ko bolo good night', 540, 1512);

      try {
        setDownloadUrl(canvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        console.warn('Canvas export note:', err);
      }
    };

    // Use DOM image element if already loaded, or load cleanly
    if (imgElementRef.current && imgElementRef.current.complete && imgElementRef.current.naturalWidth > 0) {
      drawRestOfCard(imgElementRef.current);
    } else {
      const img = new Image();
      img.onload = () => drawRestOfCard(img);
      img.onerror = () => drawRestOfCard(null);
      img.src = heroImageSrc;
      if (img.complete) {
        drawRestOfCard(img);
      }
    }
  }, [participationId, heroImageSrc]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(generateCard, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, generateCard]);

  if (!isOpen) return null;

  const currentWebUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bhookasur-food-tour.com';

  const shareText = `*BHOOKASUR KA FOOD TOUR*\n\nMaine Bhookasur ke saath Food Tour kiya!\nAap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!\n\nLink:\n${currentWebUrl}`;

  const createPassImageFile = async (): Promise<File | null> => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // 1. Ensure image is loaded
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        if (imgElementRef.current && imgElementRef.current.complete && imgElementRef.current.naturalWidth > 0) {
          img.src = imgElementRef.current.src;
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = heroImageSrc;
        }
      });

      // 2. Exact Card Dimensions (1080 x 1560)
      canvas.width = 1080;
      canvas.height = 1560;

      // 3. Crisp White Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1080, 1560);

      // 4. Hero Photo at Top (Full width 1080 x 1000)
      try {
        ctx.drawImage(img, 0, 0, 1080, 1000);
      } catch {
        ctx.fillStyle = '#081B4B';
        ctx.fillRect(0, 0, 1080, 1000);
      }

      // 5. White space message below image
      ctx.textAlign = 'center';

      // Line 1
      ctx.fillStyle = '#0B1B48';
      ctx.font = '900 48px sans-serif';
      ctx.fillText('Maine Bhookasur ke saath Food Tour kiya!', 540, 1120);

      // Line 2 & 3
      ctx.fillStyle = '#D4380D';
      ctx.font = '800 36px sans-serif';
      ctx.fillText('Aap bhi Bhookasur ke saath Food Tour kijiye', 540, 1195);
      ctx.fillText('aur apna food spot share kijiye!', 540, 1255);

      // 6. Website Link Pill (Brand Blue Button)
      const siteDomain = typeof window !== 'undefined' && window.location.host ? window.location.host : 'bhookasur.com';
      const pillX = 140;
      const pillY = 1320;
      const pillW = 800;
      const pillH = 105;

      ctx.fillStyle = '#0B1B48';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 52);
        ctx.fill();
      } else {
        ctx.fillRect(pillX, pillY, pillW, pillH);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px sans-serif';
      ctx.fillText(siteDomain, 540, 1388);

      // 7. Footer Branding
      ctx.fillStyle = '#0B1B48';
      ctx.font = '800 28px sans-serif';
      ctx.fillText('Powered by Gastrium', 540, 1468);

      ctx.fillStyle = '#64748B';
      ctx.font = '700 24px sans-serif';
      ctx.fillText('Acidity ko bolo good night', 540, 1512);

      // 7. Convert to real JPG Blob
      let blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (!blob) {
        const res = await fetch('/images/final-frames/food-tour-pass-preview.jpg');
        blob = await res.blob();
      }

      if (blob) {
        return new File([blob], 'bhookasur-food-tour-pass.jpg', { type: 'image/jpeg' });
      }
    } catch (e) {
      console.warn('Error generating pass image:', e);
    }
    return null;
  };

  const handleShareWhatsApp = async () => {
    // 1. Create the complete pass JPG image (Photo at top + message + website link on white card)
    const file = await createPassImageFile();

    // 2. Share image file directly to WhatsApp on mobile
    if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          text: shareText
        });
        return;
      } catch (err) {
        console.warn('Share sheet cancelled or closed:', err);
        return;
      }
    }

    // 3. Fallback for desktop: open WhatsApp link
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareInstagram = async () => {
    // 1. Create the complete pass JPG image
    const file = await createPassImageFile();

    // 2. Share image file directly to Instagram on mobile
    if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          text: shareText
        });
        return;
      } catch (err) {
        console.warn('Share sheet cancelled or closed:', err);
        return;
      }
    }

    // 3. Fallback for desktop: copy text & open Instagram
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        navigator.clipboard.writeText(shareText);
      } catch {}
    }
    window.open('https://www.instagram.com/direct/inbox/', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 select-none">

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#D4380D]" />
            <span className="font-black text-sm uppercase tracking-wider text-[#0B1B48]">
              Official Foodie Pass
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Canvas Element */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Pure HTML Pass Card Preview */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-start bg-slate-100/70">
          <div
            id="bhookasur-foodie-pass-card"
            className="w-full max-w-[320px] xs:max-w-[340px] sm:max-w-[360px] bg-white rounded-3xl p-3.5 sm:p-4 shadow-xl border-2 border-slate-200 flex flex-col items-center text-center gap-3 relative select-none"
          >
            {/* Hero Image */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 relative">
              <img
                ref={imgElementRef}
                src={heroImageSrc}
                alt="Bhookasur Food Tour Feast"
                onLoad={() => generateCard()}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Simple Message (No box border, no emojis) */}
            <div className="w-full py-1 flex flex-col items-center text-center gap-1">
              <p className="text-xs xs:text-sm sm:text-base font-black text-[#0B1B48] leading-snug">
                Maine Bhookasur ke saath Food Tour kiya!
              </p>
              <p className="text-[11px] xs:text-xs sm:text-sm font-bold text-[#D4380D] leading-snug">
                Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!
              </p>
            </div>

            {/* Clickable Website Link CTA (Brand Blue Background, White Text) */}
            <a
              href={currentWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-full bg-[#0B1B48] hover:bg-[#152a68] active:scale-[0.98] text-white font-black text-xs xs:text-sm flex items-center justify-center shadow-md transition-all cursor-pointer no-underline tracking-wide"
            >
              <span className="truncate">{typeof window !== 'undefined' ? window.location.host : 'bhookasur.com'}</span>
            </a>
          </div>

          <p className="text-[11px] text-slate-500 text-center max-w-xs font-semibold mt-2.5">
            Share this pass with friends &amp; family so they can join the tour!
          </p>
        </div>

        {/* Bottom Action Bar: WhatsApp & Instagram Only */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none shrink-0" />
              <span>WhatsApp</span>
            </button>

            {/* Instagram */}
            <button
              onClick={handleShareInstagram}
              type="button"
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[#FD1D1D]/25"
            >
              <Instagram className="w-4 h-4 stroke-[2.3] shrink-0" />
              <span>Instagram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
