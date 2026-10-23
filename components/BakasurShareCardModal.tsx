'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Instagram, MessageCircle, Ticket, Check } from 'lucide-react';

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
  restaurantName,
  cityName,
  dishName,
  dishImage,
  participationId = 'BKT-' + Math.floor(100000 + Math.random() * 900000)
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Strictly use the official existing Bhookasur Food Tour image only
  const heroImageSrc = '/images/final-frames/food-tour-img-gastrium.jpg';
  const activeImageSrc = heroImageSrc;

  // In-memory preloaded Bhookasur photo assets
  const preloadedFileRef = useRef<File | null>(null);
  const preloadedPngBlobRef = useRef<Blob | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const shareUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://bhookasur.com');

  // Formatted message with live clickable link for WhatsApp and Instagram
  const shareText = `Maine Bhookasur ke saath Food Tour kiya!\nAap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!\n\n👉 Join the Food Tour:\n${shareUrl}`;

  // Preload and render full Food Pass Card canvas (with text message & join link embedded)
  useEffect(() => {
    let isMounted = true;
    fetch(activeImageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        if (!isMounted || !blob) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!isMounted) return;

          // Render the complete Food Pass Card (photo + text + join link + pass ID)
          const canvas = document.createElement('canvas');
          const W = 1080;
          const H = 1480;
          canvas.width = W;
          canvas.height = H;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // 1. Card Background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, W, H);

            // 2. Top Header Bar (Deep Navy)
            ctx.fillStyle = '#0B1B48';
            ctx.fillRect(0, 0, W, 125);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '900 36px sans-serif';
            ctx.fillText('BHOOKASUR KA FOOD TOUR', 50, 68);

            ctx.fillStyle = '#F59E0B';
            ctx.font = '700 22px sans-serif';
            ctx.fillText('★ OFFICIAL FOOD PASS', 50, 102);

            // Pass ID Pill Badge on top right
            const passText = participationId || 'BKT-PASS';
            ctx.font = '800 24px sans-serif';
            const passWidth = ctx.measureText(passText).width + 36;
            const passX = W - passWidth - 50;
            ctx.fillStyle = '#1D4ED8';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(passX, 44, passWidth, 48, 12);
            } else {
              ctx.rect(passX, 44, passWidth, 48);
            }
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(passText, passX + 18, 77);

            // 3. Hero Photo Inset
            const imgX = 50;
            const imgY = 150;
            const imgW = 980;
            const imgH = 740;

            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(imgX, imgY, imgW, imgH, 20);
            } else {
              ctx.rect(imgX, imgY, imgW, imgH);
            }
            ctx.clip();
            ctx.drawImage(img, imgX, imgY, imgW, imgH);
            ctx.restore();

            // Subtle border around photo
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(imgX, imgY, imgW, imgH, 20);
            } else {
              ctx.rect(imgX, imgY, imgW, imgH);
            }
            ctx.stroke();

            // 4. Details
            let textY = 945;
            if (restaurantName) {
              ctx.fillStyle = '#1D4ED8';
              ctx.font = '800 28px sans-serif';
              ctx.fillText(`📍 ${restaurantName}${cityName ? ', ' + cityName : ''}`, 55, textY);
              textY += 46;
            }

            // Headline
            ctx.fillStyle = '#0B1B48';
            ctx.font = '900 38px sans-serif';
            ctx.fillText('Maine Bhookasur ke saath Food Tour kiya! 🍽️', 55, textY);
            textY += 46;

            // Subtitle
            ctx.fillStyle = '#475569';
            ctx.font = '600 26px sans-serif';
            ctx.fillText('Aap bhi Bhookasur ke saath Food Tour kijiye aur', 55, textY);
            textY += 36;
            ctx.fillText('apna food spot share kijiye!', 55, textY);
            textY += 48;

            // Join Link Callout Box
            const boxY = textY;
            const boxH = 104;
            ctx.fillStyle = '#F8FAFC';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(50, boxY, 980, boxH, 18);
            } else {
              ctx.rect(50, boxY, 980, boxH);
            }
            ctx.fill();
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#0B1B48';
            ctx.font = '800 26px sans-serif';
            ctx.fillText('👉 Join the Food Tour:', 80, boxY + 42);

            ctx.fillStyle = '#1D4ED8';
            ctx.font = '800 30px sans-serif';
            ctx.fillText(shareUrl, 80, boxY + 80);

            // Footer
            ctx.fillStyle = '#94A3B8';
            ctx.font = '800 20px sans-serif';
            ctx.fillText('POWERED BY GASTRIUM  •  bhookasur.com', 55, H - 45);

            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            ctx.textAlign = 'right';
            ctx.fillText(timeStr, W - 55, H - 45);
            ctx.textAlign = 'left';

            canvas.toBlob((cardBlob) => {
              if (isMounted && cardBlob) {
                preloadedPngBlobRef.current = cardBlob;
                preloadedFileRef.current = new File([cardBlob], 'bhookasur-food-pass.png', { type: 'image/png' });
              }
            }, 'image/png');
          }
        };
        img.src = URL.createObjectURL(blob);
      })
      .catch((err) => console.warn('Preload photo error:', err));

    return () => {
      isMounted = false;
    };
  }, [activeImageSrc, restaurantName, cityName, participationId, shareUrl]);

  if (!isOpen) return null;

  // WhatsApp Share Handler: Shares Food Pass card image WITH formatted caption & clickable link
  const handleShareWhatsApp = async () => {
    const file = preloadedFileRef.current;

    // 1. Mobile Web Share API:
    // Shares the Food Pass card image WITH the caption text containing the clickable link!
    if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Bhookasur Ka Food Tour',
          text: shareText,
          files: [file]
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // 2. Desktop WhatsApp Web
    const waUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 200);
  };

  // Instagram Share Handler: Copies text message & opens Instagram DM with pass card
  const handleShareInstagram = async () => {
    // 1. ALWAYS copy full text message and link to clipboard first
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch (e) {
      console.warn('Clipboard write notice:', e);
    }

    const file = preloadedFileRef.current;

    // 2. Mobile Web Share API:
    // Shares the Food Pass Card file (with text embedded on the image)
    if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        showToast('📸 Card ready! 📋 Text copied to clipboard for Instagram chat.');
        await navigator.share({
          title: 'Bhookasur Ka Food Tour',
          text: shareText,
          files: [file]
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // 3. Desktop / Mobile Web / App deep link fallback:
    showToast('📋 Message & link copied! In Instagram, paste (Ctrl+V) into your chat.');
    setTimeout(() => {
      const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      if (isMobile) {
        window.location.href = 'instagram://direct';
        setTimeout(() => {
          window.open('https://www.instagram.com/direct/inbox/', '_blank');
        }, 1200);
      } else {
        window.open('https://www.instagram.com/direct/inbox/', '_blank');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 select-none">

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#D4380D]" />
            <span className="font-black text-sm uppercase tracking-wider text-[#0B1B48]">
              Share Food Tour Pass
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

        {/* Clean White Card Preview Container */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-start bg-slate-100/70">

          {/* Clean White Card */}
          <div
            id="bhookasur-single-message-preview"
            className="w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[380px] bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200/90 flex flex-col text-left relative select-none"
          >
            {/* 1. Existing Hero Image on Top */}
            <div className="w-full aspect-square rounded-xl overflow-hidden shadow-xs bg-slate-100 relative mb-3 border border-slate-100">
              <img
                src={activeImageSrc}
                alt="Bhookasur Food Tour Feast"
                className="w-full h-full object-cover block"
              />
            </div>

            {/* 2. Text Message Directly Underneath in Clean Dark Typography */}
            <div className="text-left text-slate-800 space-y-1.5 text-xs sm:text-sm leading-relaxed px-1">
              <p className="font-bold text-[#0B1B48]">
                Maine Bhookasur ke saath Food Tour kiya!
              </p>
              <p className="text-slate-600 font-medium text-[11px] sm:text-xs">
                Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!
              </p>

              <div className="pt-1 text-[11px] sm:text-xs">
                <span className="font-bold text-[#0B1B48]">👉 Join the Food Tour:</span>
                <br />
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline font-bold break-all cursor-pointer inline-block mt-0.5"
                >
                  {shareUrl}
                </a>
              </div>
            </div>

            {/* Message Delivery Meta (Timestamp) */}
            <div className="flex items-center justify-end mt-2 px-1 text-[10px] text-slate-400 font-medium">
              <span>{typeof window !== 'undefined' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '5:40 pm'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 flex flex-col gap-2.5">
          {/* Notification Toast */}
          {toastMessage && (
            <div className="py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Primary Social Share Buttons: WhatsApp Chat & Instagram DM */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[#25D366]/30"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none shrink-0" />
              <span>WhatsApp Chat</span>
            </button>

            {/* Instagram */}
            <button
              onClick={handleShareInstagram}
              type="button"
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[#FD1D1D]/25"
            >
              <Instagram className="w-4 h-4 stroke-[2.3] shrink-0" />
              <span>Instagram DM</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
