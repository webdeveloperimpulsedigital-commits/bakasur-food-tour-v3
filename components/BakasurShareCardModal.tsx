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

  // Preload the Bhookasur image directly as File and PNG blob for mobile & desktop sharing
  useEffect(() => {
    let isMounted = true;
    fetch(activeImageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        if (isMounted && blob) {
          preloadedFileRef.current = new File([blob], 'bhookasur-food-tour.jpg', { type: 'image/jpeg' });

          // Generate PNG blob for desktop clipboard pasting (Ctrl+V) into WhatsApp / Instagram
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 1080;
            canvas.height = img.naturalHeight || 1080;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((pngBlob) => {
                if (isMounted && pngBlob) {
                  preloadedPngBlobRef.current = pngBlob;
                }
              }, 'image/png');
            }
          };
          img.src = URL.createObjectURL(blob);
        }
      })
      .catch((err) => console.warn('Preload photo error:', err));

    return () => {
      isMounted = false;
    };
  }, [activeImageSrc]);

  const shareUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://bhookasur.com');

  // Formatted message with live clickable link for WhatsApp and Instagram
  const shareText = `Maine Bhookasur ke saath Food Tour kiya!\nAap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!\n\n👉 Join the Food Tour:\n${shareUrl}`;

  if (!isOpen) return null;

  // WhatsApp Share Handler: Shares Bhookasur photo WITH formatted caption & clickable link
  const handleShareWhatsApp = async () => {
    const file = preloadedFileRef.current;

    // 1. Mobile Web Share API:
    // Shares the Bhookasur photo file WITH the caption text containing the clickable link!
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

    // 2. Desktop WhatsApp Web:
    // Copy the Bhookasur photo to clipboard so user can press Ctrl+V in WhatsApp Web to send photo with caption
    const pngBlob = preloadedPngBlobRef.current;
    if (pngBlob && typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
        showToast('📸 Bhookasur photo copied to clipboard! Paste (Ctrl+V) in WhatsApp chat to attach photo.');
      } catch (clipErr) {
        console.warn('Clipboard write notice:', clipErr);
      }
    }

    // Open WhatsApp Web with caption pre-filled
    const waUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 400);
  };

  // Instagram Share Handler: Copies Bhookasur photo & opens Instagram DM
  const handleShareInstagram = async () => {
    const file = preloadedFileRef.current;

    // 1. Mobile Web Share API
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

    // 2. Desktop Instagram DM:
    // Copy Bhookasur photo to clipboard & open Instagram inbox
    const pngBlob = preloadedPngBlobRef.current;
    if (pngBlob && typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
        showToast('📸 Bhookasur photo copied to clipboard! Paste (Ctrl+V) into Instagram chat.');
      } catch (clipErr) {
        console.warn('Clipboard write notice:', clipErr);
      }
    }

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
