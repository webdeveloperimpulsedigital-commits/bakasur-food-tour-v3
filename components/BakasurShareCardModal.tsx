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
  restaurantName = 'Local Food Spot',
  cityName = 'Pune',
  dishName = 'Signature Food',
  participationId = 'BKT-' + Math.floor(100000 + Math.random() * 900000)
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElementRef = useRef<HTMLImageElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const heroImageSrc = '/images/final-frames/food-tour-img.png';

  const generateCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Standard 9:16 mobile canvas: 1080 x 1920
    canvas.width = 1080;
    canvas.height = 1920;

    // 1. Crisp Clean White Background (Simple & Sweet)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1080, 1920);

    // Outer Border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, 1020, 1860);

    ctx.strokeStyle = '#D4380D';
    ctx.lineWidth = 3;
    ctx.strokeRect(42, 42, 996, 1836);

    // 2. Header Branding
    ctx.fillStyle = '#D4380D';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BHOOKASUR KA FOOD TOUR 🍽️', 540, 115);

    ctx.fillStyle = '#0B1B48';
    ctx.font = '900 66px sans-serif';
    ctx.fillText('OFFICIAL FOODIE PASS', 540, 195);

    // Pass ID Badge Pill
    ctx.fillStyle = '#FFF1EC';
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(340, 225, 400, 56, 28);
    } else {
      ctx.fillRect(340, 225, 400, 56);
    }
    ctx.fill();
    ctx.strokeStyle = '#D4380D';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#D4380D';
    ctx.font = '800 28px monospace';
    ctx.fillText(`PASS ID: ${participationId}`, 540, 263);

    const drawRestOfCard = (imgSource: HTMLImageElement | null) => {
      // 3. Hero Photo Box (920 x 920 square)
      const imgX = 80;
      const imgY = 310;
      const imgSize = 920;
      const imgRadius = 28;

      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(imgX, imgY, imgSize, imgSize, imgRadius);
      } else {
        ctx.rect(imgX, imgY, imgSize, imgSize);
      }
      ctx.clip();

      if (imgSource) {
        try {
          ctx.drawImage(imgSource, imgX, imgY, imgSize, imgSize);
        } catch {
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(imgX, imgY, imgSize, imgSize);
        }
      } else {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(imgX, imgY, imgSize, imgSize);
      }
      ctx.restore();

      // Border around Photo
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(imgX, imgY, imgSize, imgSize, imgRadius);
      } else {
        ctx.rect(imgX, imgY, imgSize, imgSize);
      }
      ctx.stroke();

      // 4. Details Box (Selected Restaurant & Selected Dish)
      const cardX = 80;
      const cardY = 1260;
      const cardW = 920;
      const cardH = 340;
      const cardRadius = 24;

      ctx.fillStyle = '#F8FAFC';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
      } else {
        ctx.fillRect(cardX, cardY, cardW, cardH);
      }
      ctx.fill();

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Dish
      ctx.fillStyle = '#D4380D';
      ctx.font = '800 24px sans-serif';
      ctx.fillText('RECOMMENDED DISH', 540, 1315);

      ctx.fillStyle = '#0B1B48';
      ctx.font = '900 50px sans-serif';
      const cleanDish = dishName.length > 28 ? dishName.slice(0, 26) + '...' : dishName;
      ctx.fillText(cleanDish, 540, 1375);

      // Divider
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 1410);
      ctx.lineTo(940, 1410);
      ctx.stroke();

      // Restaurant
      ctx.fillStyle = '#D4380D';
      ctx.font = '800 24px sans-serif';
      ctx.fillText('SELECTED RESTAURANT', 540, 1460);

      ctx.fillStyle = '#0B1B48';
      ctx.font = '900 42px sans-serif';
      const cleanRest = restaurantName.length > 30 ? restaurantName.slice(0, 28) + '...' : restaurantName;
      ctx.fillText(`📍 ${cleanRest}`, 540, 1515);

      ctx.fillStyle = '#64748B';
      ctx.font = '700 26px sans-serif';
      ctx.fillText(`City: ${cityName}`, 540, 1565);

      // 5. Website Link Pill
      const siteDomain = typeof window !== 'undefined' && window.location.host ? window.location.host : 'bhookasur.com';

      const pillX = 100;
      const pillY = 1630;
      const pillW = 880;
      const pillH = 92;

      ctx.fillStyle = '#FFF1EC';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(pillX, pillY, pillW, pillH, 46);
      } else {
        ctx.fillRect(pillX, pillY, pillW, pillH);
      }
      ctx.fill();

      ctx.strokeStyle = '#D4380D';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#D4380D';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(`🌐 ${siteDomain}`, 540, 1690);

      ctx.fillStyle = '#64748B';
      ctx.font = '700 26px sans-serif';
      ctx.fillText('Link par click karke aap bhi favourite food recommend karein!', 540, 1775);

      ctx.fillStyle = '#0B1B48';
      ctx.font = '800 26px sans-serif';
      ctx.fillText('Fast Relief Gastrium Ke Saath 💊', 540, 1825);

      try {
        setDownloadUrl(canvas.toDataURL('image/png'));
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
  }, [dishName, restaurantName, cityName, participationId, heroImageSrc]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(generateCard, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, generateCard]);

  if (!isOpen) return null;

  const currentWebUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bhookasur-food-tour.com';


  const handleShareWhatsApp = () => {
    const text = `🔥 *BHOOKASUR KA FOOD TOUR PASS* 🔥\n\nI recommended *${dishName}* at *${restaurantName} (${cityName})* on Bhookasur Food Tour!\n\n👇 Click this link to see the tour & recommend your favourite spot:\n${currentWebUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareInstagram = async () => {
    generateCard();
    const url = downloadUrl || (canvasRef.current ? canvasRef.current.toDataURL('image/png') : '');
    const text = `🔥 *BHOOKASUR KA FOOD TOUR PASS* 🔥\n\nI recommended *${dishName}* at *${restaurantName} (${cityName})* on Bhookasur Food Tour!\n\n👇 Click this link to see the tour & join:\n${currentWebUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share && url) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], `Bhookasur_Foodie_Pass_${participationId}.png`, { type: 'image/png' });
        await navigator.share({
          title: 'Bhookasur Ka Food Tour Pass',
          text,
          files: [file]
        });
        return;
      } catch (e) {
        console.warn('Native Instagram share failed, falling back:', e);
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {}
    }
    window.open('https://www.instagram.com', '_blank');
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

        {/* Pure HTML Pass Card Preview (Guaranteed to show image crystal clear & sharp!) */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-start bg-slate-100/70">
          <div
            id="bhookasur-foodie-pass-card"
            className="w-full max-w-[320px] xs:max-w-[340px] sm:max-w-[360px] bg-white rounded-3xl p-3.5 sm:p-4 shadow-xl border-2 border-slate-200 flex flex-col items-center text-center gap-2.5 relative select-none"
          >
            {/* Pass Header */}
            <div className="flex flex-col items-center w-full">
              <span className="text-[10px] xs:text-xs font-black uppercase tracking-wider text-[#D4380D]">
                Bhookasur Ka Food Tour 🍽️
              </span>
              <h2 className="text-base xs:text-lg sm:text-xl font-black text-[#0B1B48] tracking-tight leading-tight">
                OFFICIAL FOODIE PASS
              </h2>
              <div className="mt-1 px-3 py-0.5 rounded-full bg-[#FFF1EC] border border-[#D4380D]/40 text-[#D4380D] font-mono font-bold text-[10px] xs:text-xs">
                PASS ID: {participationId}
              </div>
            </div>

            {/* Hero Image (Native Image Rendering - 100% Reliable & Crisp) */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 relative">
              <img
                ref={imgElementRef}
                src={heroImageSrc}
                alt="Bhookasur Food Tour Feast"
                onLoad={() => generateCard()}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Recommendation Details */}
            <div className="w-full bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200 flex flex-col items-center text-center gap-1.5">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4380D]">
                  RECOMMENDED DISH
                </span>
                <span className="text-sm xs:text-base font-black text-[#0B1B48] leading-tight">
                  {dishName}
                </span>
              </div>

              <div className="w-full h-px bg-slate-200" />

              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4380D]">
                  SELECTED RESTAURANT
                </span>
                <span className="text-xs xs:text-sm font-black text-[#0B1B48] leading-tight">
                  📍 {restaurantName}
                </span>
                <span className="text-[10px] xs:text-[11px] font-bold text-slate-500">
                  City: {cityName} • Verified Food Spot
                </span>
              </div>
            </div>

            {/* Website Link Pill */}
            <div className="w-full py-2 px-3 rounded-full bg-[#FFF1EC] border border-[#D4380D] text-[#D4380D] font-black text-xs xs:text-sm flex items-center justify-center gap-1.5 shadow-xs">
              <span>🌐</span>
              <span>{typeof window !== 'undefined' ? window.location.host : 'bhookasur.com'}</span>
            </div>

            <p className="text-[10px] text-slate-500 font-semibold leading-tight">
              Link par click karke aap bhi food tour mein judiye!
            </p>
          </div>

          <p className="text-[11px] text-slate-500 text-center max-w-xs font-semibold mt-2.5">
            Share this pass on WhatsApp or Instagram so friends and family can join!
          </p>
        </div>

        {/* Bottom Clean Action Bar: WhatsApp & Instagram Only */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleShareInstagram}
              type="button"
              className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[#FD1D1D]/25"
            >
              <Instagram className="w-4 h-4 stroke-[2.3]" />
              <span>Instagram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
