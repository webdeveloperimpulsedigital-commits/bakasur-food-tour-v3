'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Instagram, MessageCircle, Ticket, Download, Check, Copy, FileText } from 'lucide-react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElementRef = useRef<HTMLImageElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const heroImageSrc = '/images/final-frames/food-tour-img.jpg';
  const activeImageSrc = dishImage || heroImageSrc;

  // In-memory preloaded clean photo assets (No message baked into image)
  const preloadedFileRef = useRef<File | null>(null);
  const preloadedBlobRef = useRef<Blob | null>(null);
  const preloadedPngBlobRef = useRef<Blob | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Preload clean image file directly from source for zero-latency instant mobile sharing
  useEffect(() => {
    let isMounted = true;
    fetch(activeImageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        if (isMounted && blob && blob.size > 1000) {
          preloadedBlobRef.current = blob;
          preloadedFileRef.current = new File([blob], 'bhookasur-food-tour.jpg', { type: 'image/jpeg' });
        }
      })
      .catch((err) => console.warn('Preload clean photo error:', err));
    return () => {
      isMounted = false;
    };
  }, [activeImageSrc]);

  // Generate clean image in canvas (PURE PHOTO ONLY - ALL MESSAGE TEXT REMOVED FROM IMAGE)
  const generateCleanImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Standard square photo dimensions: 1080 x 1080
    canvas.width = 1080;
    canvas.height = 1080;

    const drawPhoto = (imgSource: HTMLImageElement | null) => {
      ctx.fillStyle = '#081B4B';
      ctx.fillRect(0, 0, 1080, 1080);

      if (imgSource) {
        try {
          ctx.drawImage(imgSource, 0, 0, 1080, 1080);
        } catch {
          ctx.fillStyle = '#081B4B';
          ctx.fillRect(0, 0, 1080, 1080);
        }
      }

      // Export clean photo to Blobs & DataURL (NO text message baked in!)
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setDownloadUrl(dataUrl);

        canvas.toBlob((blob) => {
          if (blob) {
            preloadedBlobRef.current = blob;
            preloadedFileRef.current = new File([blob], 'bhookasur-food-tour.jpg', { type: 'image/jpeg' });
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
      drawPhoto(imgElementRef.current);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => drawPhoto(img);
      img.onerror = () => drawPhoto(null);
      img.src = activeImageSrc;
      if (img.complete) {
        drawPhoto(img);
      }
    }
  }, [activeImageSrc]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(generateCleanImage, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, generateCleanImage]);

  if (!isOpen) return null;

  const currentWebUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bhookasur.com';

  // Message in text format (used as caption for WhatsApp and Instagram share - dish & spot removed)
  const shareText = `*BHOOKASUR KA FOOD TOUR* 🍔🔥\n\nMaine Bhookasur ke saath Food Tour kiya!\nAap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!\n\n👉 Join the Food Tour:\n${currentWebUrl}`;

  // Trigger browser download of clean photo (pure image without baked text)
  const handleDownloadPass = () => {
    try {
      const link = document.createElement('a');
      link.href = downloadUrl || activeImageSrc;
      link.download = 'bhookasur-food-tour.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📸 Food Tour photo downloaded!');
    } catch (err) {
      console.warn('Download error:', err);
    }
  };

  // Copy pure image to system clipboard
  const handleCopyImage = async () => {
    const pngBlob = preloadedPngBlobRef.current;
    if (pngBlob && typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
        showToast('✅ Photo copied! Paste (Ctrl+V) directly into WhatsApp or Instagram.');
        return;
      } catch (e) {
        console.warn('Clipboard write failed:', e);
      }
    }
    handleDownloadPass();
  };

  // Copy caption text message to system clipboard
  const handleCopyText = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('📋 Caption text copied to clipboard!');
        return;
      } catch (e) {
        console.warn('Clipboard write text failed:', e);
      }
    }
  };

  // WhatsApp Share Handler: Sends as ONE single message with Image on top and Caption below
  const handleShareWhatsApp = async () => {
    const file = preloadedFileRef.current;

    // 1. Mobile Web Share API: Sends clean image + text caption together in a single WhatsApp message
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
    // Copy clean photo to clipboard so user can paste (Ctrl+V) into WhatsApp Web
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

    // Auto-download clean image for easy attach
    handleDownloadPass();

    // Show toast banner
    showToast('📸 Photo copied & downloaded! Paste (Ctrl+V) in WhatsApp to send photo + caption as 1 message.');

    // Open WhatsApp Web
    setTimeout(() => {
      window.open('https://web.whatsapp.com', '_blank');
    }, 400);
  };

  // Instagram Share Handler
  const handleShareInstagram = async () => {
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

    // Desktop Fallback
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

    handleDownloadPass();
    showToast('📸 Photo copied & downloaded! Paste (Ctrl+V) into Instagram Direct message.');

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

        {/* Hidden Canvas Element */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Unified Single Message Preview (First Image on Top, Then Text Below in One Bubble) */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-start bg-slate-900/95">
          {/* Badge: Single Message Preview */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black tracking-wide uppercase mb-3 border border-emerald-500/30">
            <MessageCircle className="w-3.5 h-3.5 fill-emerald-300 stroke-none" />
            <span>Single WhatsApp Message Preview</span>
          </div>

          {/* WhatsApp Outgoing Message Bubble */}
          <div
            id="bhookasur-single-message-preview"
            className="w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[380px] bg-[#005C4B] rounded-2xl p-2.5 shadow-xl border border-emerald-600/30 flex flex-col text-left relative select-none"
          >
            {/* 1. Hero Image on Top (Pure Photo - No Baked-In Message) */}
            <div className="w-full aspect-square rounded-xl overflow-hidden shadow-sm bg-black/30 relative mb-2">
              <img
                ref={imgElementRef}
                src={activeImageSrc}
                alt="Bhookasur Food Tour Feast"
                onLoad={() => generateCleanImage()}
                className="w-full h-full object-cover block"
              />
            </div>

            {/* 2. Text Message Directly Underneath in the Same Message */}
            <div className="text-left text-[#E9EDEF] space-y-1.5 text-xs sm:text-sm leading-relaxed px-1">
              <p className="font-black text-white tracking-wide text-xs sm:text-sm">
                BHOOKASUR KA FOOD TOUR 🍔🔥
              </p>
              <p className="font-semibold text-white/95">
                Maine Bhookasur ke saath Food Tour kiya!
              </p>
              <p className="text-white/90 text-[11px] sm:text-xs">
                Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!
              </p>

              <div className="pt-1 text-[11px] sm:text-xs">
                <span className="font-bold text-white">👉 Join the Food Tour:</span>
                <br />
                <a
                  href={currentWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 underline font-semibold break-all"
                >
                  {currentWebUrl}
                </a>
              </div>
            </div>

            {/* Message Delivery Meta (Timestamp & Checkmarks) */}
            <div className="flex items-center justify-end gap-1 mt-1.5 px-1 text-[10px] text-emerald-200/80">
              <span>{typeof window !== 'undefined' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '5:40 pm'}</span>
              <span className="text-[#53bdeb] font-black">✓✓</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center max-w-xs font-medium mt-3">
            Shared as a single message: photo on top, formatted caption text directly below.
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

          {/* Secondary Quick Actions: Download Photo, Copy Photo, Copy Caption */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownloadPass}
              type="button"
              className="py-2 px-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0B1B48] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98] border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-[#D4380D] shrink-0" />
              <span className="truncate">Download Photo</span>
            </button>
            <button
              onClick={handleCopyImage}
              type="button"
              className="py-2 px-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0B1B48] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98] border border-slate-200"
            >
              <Copy className="w-3.5 h-3.5 text-[#0B1B48] shrink-0" />
              <span className="truncate">Copy Photo</span>
            </button>
            <button
              onClick={handleCopyText}
              type="button"
              className="py-2 px-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0B1B48] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98] border border-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Copy Caption</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
