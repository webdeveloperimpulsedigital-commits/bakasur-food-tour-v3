'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Instagram, MessageCircle, Ticket, Download, Check, Copy } from 'lucide-react';

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
  participationId = 'BKT-' + Math.floor(100000 + Math.random() * 900000)
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElementRef = useRef<HTMLImageElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const heroImageSrc = '/images/final-frames/food-tour-img.jpg';
  const foodTourImageSrc = '/images/final-frames/food-tour-img.jpg';

  // In-memory preloaded assets for instant, synchronous zero-latency user-gesture execution
  const preloadedFileRef = useRef<File | null>(null);
  const preloadedBlobRef = useRef<Blob | null>(null);
  const preloadedPngBlobRef = useRef<Blob | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Helper for drawing rounded rectangles on canvas across all browser versions
  const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  };

  const generateCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card dimensions: 1080 x 1560 (Image on top, message below)
    canvas.width = 1080;
    canvas.height = 1560;

    const siteDomain = typeof window !== 'undefined' && window.location.host ? window.location.host : 'bhookasur.com';

    const drawCompositeCard = (imgSource: HTMLImageElement | null) => {
      // 1. Crisp White Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1080, 1560);

      // Card outer subtle border
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 8;
      drawRoundRect(ctx, 16, 16, 1048, 1528, 40);
      ctx.stroke();

      // 2. Hero Photo at Top (Image on Top: 980 x 860)
      const imgX = 50;
      const imgY = 50;
      const imgW = 980;
      const imgH = 860;
      const imgRadius = 28;

      ctx.save();
      drawRoundRect(ctx, imgX, imgY, imgW, imgH, imgRadius);
      ctx.clip();

      if (imgSource) {
        try {
          ctx.drawImage(imgSource, imgX, imgY, imgW, imgH);
        } catch {
          ctx.fillStyle = '#081B4B';
          ctx.fillRect(imgX, imgY, imgW, imgH);
        }
      } else {
        ctx.fillStyle = '#081B4B';
        ctx.fillRect(imgX, imgY, imgW, imgH);
      }
      ctx.restore();

      // Border around photo
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 3;
      drawRoundRect(ctx, imgX, imgY, imgW, imgH, imgRadius);
      ctx.stroke();

      // 3. Message section directly underneath image
      ctx.textAlign = 'center';

      // Title: BHOOKASUR KA FOOD TOUR 🍔🔥
      ctx.fillStyle = '#0B1B48';
      ctx.font = '900 46px system-ui, -apple-system, sans-serif';
      ctx.fillText('BHOOKASUR KA FOOD TOUR 🍔🔥', 540, 975);

      // Subheading: Maine Bhookasur ke saath Food Tour kiya!
      ctx.fillStyle = '#0B1B48';
      ctx.font = '700 34px system-ui, -apple-system, sans-serif';
      ctx.fillText('Maine Bhookasur ke saath Food Tour kiya!', 540, 1030);

      // Dynamic Dish Line (if dishName)
      let currentY = 1085;
      if (dishName) {
        ctx.fillStyle = '#D4380D';
        ctx.font = '800 36px system-ui, -apple-system, sans-serif';
        ctx.fillText(`🍽️ Dish: ${dishName}`, 540, currentY);
        currentY += 52;
      }

      // Dynamic Spot Line (if restaurantName)
      if (restaurantName) {
        ctx.fillStyle = '#0B1B48';
        ctx.font = '800 32px system-ui, -apple-system, sans-serif';
        ctx.fillText(`📍 Spot: ${restaurantName} (${cityName || 'Pune'})`, 540, currentY);
        currentY += 52;
      }

      // Invitation
      ctx.fillStyle = '#D4380D';
      ctx.font = '700 28px system-ui, -apple-system, sans-serif';
      ctx.fillText('Aap bhi Bhookasur ke saath Food Tour kijiye', 540, currentY);
      currentY += 40;
      ctx.fillText('aur apna food spot share kijiye!', 540, currentY);
      currentY += 60;

      // Website Link Pill Button (Navy Blue with white text)
      const pillX = 140;
      const pillY = currentY;
      const pillW = 800;
      const pillH = 92;

      ctx.fillStyle = '#0B1B48';
      drawRoundRect(ctx, pillX, pillY, pillW, pillH, 46);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.fillText(`👉 Join the Food Tour: ${siteDomain}`, 540, pillY + 58);

      // Gastrium Branding Footer
      ctx.fillStyle = '#0B1B48';
      ctx.font = '800 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('Powered by Gastrium', 540, 1475);

      ctx.fillStyle = '#64748B';
      ctx.font = '700 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('Acidity ko bolo good night', 540, 1510);

      // 4. Export to Blobs & DataURL
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setDownloadUrl(dataUrl);

        canvas.toBlob((blob) => {
          if (blob) {
            preloadedBlobRef.current = blob;
            preloadedFileRef.current = new File([blob], 'bhookasur-food-tour-pass.jpg', { type: 'image/jpeg' });
          }
        }, 'image/jpeg', 0.95);

        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            preloadedPngBlobRef.current = pngBlob;
          }
        }, 'image/png');
      } catch (err) {
        console.warn('Canvas export note:', err);
      }
    };

    if (imgElementRef.current && imgElementRef.current.complete && imgElementRef.current.naturalWidth > 0) {
      drawCompositeCard(imgElementRef.current);
    } else {
      const img = new Image();
      img.onload = () => drawCompositeCard(img);
      img.onerror = () => drawCompositeCard(null);
      img.src = heroImageSrc;
      if (img.complete) {
        drawCompositeCard(img);
      }
    }
  }, [heroImageSrc, dishName, restaurantName, cityName]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(generateCard, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, generateCard]);

  if (!isOpen) return null;

  const currentWebUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bhookasur.com';
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const previewDomain = isLocal ? 'https://bhookasur.com' : currentWebUrl;

  const dishLine = dishName ? `🍽️ Dish: ${dishName}\n` : '';
  const restLine = restaurantName ? `📍 Spot: ${restaurantName} (${cityName || 'Pune'})\n` : '';

  // Message in text format (used as caption for WhatsApp and Instagram share)
  const shareText = `*BHOOKASUR KA FOOD TOUR* 🍔🔥\n\nMaine Bhookasur ke saath Food Tour kiya!\n${dishLine}${restLine}Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!\n\n👉 Join the Food Tour:\n${currentWebUrl}`;

  // Trigger browser download of unified food tour pass card
  const handleDownloadPass = () => {
    try {
      const link = document.createElement('a');
      link.href = downloadUrl || foodTourImageSrc;
      link.download = 'bhookasur-food-tour-pass.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📸 Pass card downloaded to your device!');
    } catch (err) {
      console.warn('Download error:', err);
    }
  };

  // Copy pass image to system clipboard
  const handleCopyImage = async () => {
    const pngBlob = preloadedPngBlobRef.current;
    if (pngBlob && typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
        showToast('✅ Pass card copied! Paste (Ctrl+V) directly in your chat.');
        return;
      } catch (e) {
        console.warn('Clipboard write failed:', e);
      }
    }
    handleDownloadPass();
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = async () => {
    // 1. Mobile Web Share API: Synchronous call with preloaded image file
    const file = preloadedFileRef.current;
    if (file && typeof navigator !== 'undefined' && navigator.canShare) {
      const shareData = {
        title: 'Bhookasur Ka Food Tour',
        text: shareText,
        files: [file]
      };

      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      } else if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Bhookasur Ka Food Tour',
            text: shareText
          });
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }
    }

    // 2. Desktop Fallback:
    // A. Copy unified pass card image to clipboard
    const pngBlob = preloadedPngBlobRef.current;
    if (pngBlob && typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
      } catch (clipErr) {
        console.warn('Clipboard write notice:', clipErr);
      }
    }

    // B. Trigger automatic pass download
    handleDownloadPass();

    // C. Show toast banner
    showToast('📸 Pass copied & downloaded! Open WhatsApp chat and paste (Ctrl+V) to send as one message.');

    // D. Open WhatsApp Web directly (user pastes to send as one unified message)
    setTimeout(() => {
      window.open('https://web.whatsapp.com', '_blank');
    }, 400);
  };

  // Instagram Share Handler
  const handleShareInstagram = async () => {
    // 1. Mobile Web Share API: Synchronous call with preloaded image file
    const file = preloadedFileRef.current;
    if (file && typeof navigator !== 'undefined' && navigator.canShare) {
      const shareData = {
        title: 'Bhookasur Ka Food Tour',
        text: shareText,
        files: [file]
      };

      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      } else if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Bhookasur Ka Food Tour',
            text: shareText
          });
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }
    }

    // 2. Desktop Fallback:
    // A. Copy pass image to system clipboard
    const pngBlob = preloadedPngBlobRef.current;
    if (pngBlob && typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
      } catch (clipErr) {
        console.warn('Clipboard write notice:', clipErr);
      }
    }

    // B. Download image
    handleDownloadPass();

    // C. Show toast banner
    showToast('📸 Pass copied & downloaded! Paste (Ctrl+V) into Instagram Direct message.');

    // D. Open Instagram direct
    setTimeout(() => {
      window.open('https://www.instagram.com/direct/inbox/', '_blank');
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

        {/* Unified Pass Card Preview (Image on Top, Message Directly Below) */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-start bg-slate-100/70">
          <div
            id="bhookasur-foodie-pass-card"
            className="w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[380px] bg-white rounded-3xl p-3.5 sm:p-4 shadow-xl border-2 border-slate-200 flex flex-col items-center text-center gap-2.5 relative select-none"
          >
            {/* 1. Hero Image on Top */}
            <div className="w-full aspect-[4/3.3] rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 relative">
              <img
                ref={imgElementRef}
                src={heroImageSrc}
                alt="Bhookasur Food Tour Feast"
                onLoad={() => generateCard()}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 2. Message directly underneath */}
            <div className="w-full py-0.5 flex flex-col items-center text-center gap-1">
              <span className="text-xs xs:text-sm font-black text-[#0B1B48] uppercase tracking-wide">
                BHOOKASUR KA FOOD TOUR 🍔🔥
              </span>
              <p className="text-xs xs:text-sm font-bold text-[#0B1B48] leading-tight">
                Maine Bhookasur ke saath Food Tour kiya!
              </p>
              {dishName && (
                <p className="text-xs xs:text-sm font-black text-[#D4380D] leading-tight">
                  🍽️ Dish: {dishName}
                </p>
              )}
              {restaurantName && (
                <p className="text-[11px] xs:text-xs font-bold text-[#0B1B48] leading-tight">
                  📍 Spot: {restaurantName} ({cityName || 'Pune'})
                </p>
              )}
              <p className="text-[11px] xs:text-xs font-semibold text-[#D4380D] leading-tight mt-0.5">
                Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!
              </p>
            </div>

            {/* 3. Clickable Website Link CTA */}
            <a
              href={currentWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-full bg-[#0B1B48] hover:bg-[#152a68] active:scale-[0.98] text-white font-black text-xs xs:text-sm flex items-center justify-center shadow-md transition-all cursor-pointer no-underline tracking-wide"
            >
              <span className="truncate">👉 Join the Food Tour: {typeof window !== 'undefined' ? window.location.host : 'bhookasur.com'}</span>
            </a>

            {/* 4. Gastrium Branding Footer */}
            <div className="text-[10px] text-slate-400 font-semibold tracking-wide">
              Powered by Gastrium • Acidity ko bolo good night
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center max-w-xs font-semibold mt-2.5">
            Share this pass with friends &amp; family so they can join the tour!
          </p>
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

          {/* Social Share Buttons: WhatsApp Chat & Instagram DM */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
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

          {/* Direct Utilities: Download & Copy Image */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPass}
              type="button"
              className="py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0B1B48] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-[#D4380D]" />
              <span>Download Image</span>
            </button>
            <button
              onClick={handleCopyImage}
              type="button"
              className="py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0B1B48] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] border border-slate-200"
            >
              <Copy className="w-3.5 h-3.5 text-[#0B1B48]" />
              <span>Copy Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
