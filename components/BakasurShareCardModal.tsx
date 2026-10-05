'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Download, Share2, MessageCircle, Sparkles, Camera } from 'lucide-react';
import { getDishVisualAssets } from '@/lib/dishAssets';

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
  dishImage,
  participationId = 'BKT-' + Math.floor(100000 + Math.random() * 900000)
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  const visualAsset = getDishVisualAssets(dishName, dishImage);
  const plateImg = visualAsset.plateImage || dishImage || '/images/eating/samosa_flying.png';

  const generateCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);

    // Instagram Story standard 9:16 aspect ratio: 1080 x 1920
    canvas.width = 1080;
    canvas.height = 1920;

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#030a24');
    bgGrad.addColorStop(0.4, '#071746');
    bgGrad.addColorStop(0.75, '#120422');
    bgGrad.addColorStop(1, '#020512');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Radial Gold Glow in Center
    const radGlow = ctx.createRadialGradient(540, 850, 50, 540, 850, 600);
    radGlow.addColorStop(0, 'rgba(212, 56, 13, 0.35)');
    radGlow.addColorStop(0.6, 'rgba(251, 191, 36, 0.12)');
    radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative Gold Border Frame
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, 1000, 1840);

    ctx.strokeStyle = '#D4380D';
    ctx.lineWidth = 4;
    ctx.strokeRect(55, 55, 970, 1810);

    // Corner Accents
    const drawCorner = (x: number, y: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(0, 0, 30, 8);
      ctx.fillRect(0, 0, 8, 30);
      ctx.restore();
    };
    drawCorner(55, 55, 0);
    drawCorner(1025, 55, Math.PI / 2);
    drawCorner(1025, 1865, Math.PI);
    drawCorner(55, 1865, -Math.PI / 2);

    // 2. HEADER BRANDING
    ctx.fillStyle = '#FBBF24';
    ctx.font = '900 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 BHOOKASUR KA FOOD TOUR 🔥', 540, 130);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 68px sans-serif';
    ctx.fillText('OFFICIAL FOODIE PASS', 540, 215);

    // Pass ID Badge Pill
    ctx.fillStyle = 'rgba(212, 56, 13, 0.9)';
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(320, 245, 440, 65, 30);
    } else {
      ctx.fillRect(320, 245, 440, 65);
    }
    ctx.fill();
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px monospace';
    ctx.fillText(`PASS ID: ${participationId}`, 540, 290);

    // 3. MAIN DISH IMAGE / HERO SPOTLIGHT
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = plateImg;

    const drawRestOfCard = () => {
      // Dish spotlight circle glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 720, 310, 0, Math.PI * 2);
      ctx.fillStyle = '#061138';
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.clip();
      try {
        ctx.drawImage(img, 230, 410, 620, 620);
      } catch {
        ctx.fillStyle = '#D4380D';
        ctx.font = '900 48px sans-serif';
        ctx.fillText('🍲 ' + dishName, 540, 720);
      }
      ctx.restore();

      // 4. DISH & RESTAURANT DETAILS CARD
      ctx.fillStyle = 'rgba(10, 25, 74, 0.92)';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(100, 1100, 880, 420, 36);
      } else {
        ctx.fillRect(100, 1100, 880, 420);
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Recommendation Tag
      ctx.fillStyle = '#D4380D';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('⭐ TOP FOOD RECOMMENDATION', 540, 1165);

      // Dish Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 56px sans-serif';
      ctx.fillText(dishName.toUpperCase(), 540, 1245);

      // Restaurant Name & City
      ctx.fillStyle = '#FBBF24';
      ctx.font = '800 40px sans-serif';
      ctx.fillText(`📍 ${restaurantName}`, 540, 1315);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '700 32px sans-serif';
      ctx.fillText(`City: ${cityName} • Verified Food Stop`, 540, 1375);

      // Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(160, 1410);
      ctx.lineTo(920, 1410);
      ctx.stroke();

      // Certified By Bhookasur Quote
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'italic 700 30px sans-serif';
      ctx.fillText('“Aapne suggest kiya. Bhookasur ne khaana shuru kar diya!”', 540, 1470);

      // 5. FOOTER BRANDING (GASTRIUM)
      ctx.fillStyle = '#D4380D';
      ctx.font = '900 44px sans-serif';
      ctx.fillText('KHAO DIL KHOL KE! 😋', 540, 1620);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 32px sans-serif';
      ctx.fillText('Fast Relief Gastrium Ke Saath! 💊', 540, 1675);

      // Slogan Pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(140, 1720, 800, 70, 35);
      } else {
        ctx.fillRect(140, 1720, 800, 70);
      }
      ctx.fill();

      ctx.fillStyle = '#FBBF24';
      ctx.font = '800 26px sans-serif';
      ctx.fillText('🌐 Join Bhookasur Food Tour at bhookasur-food-tour.com', 540, 1765);

      // Update state data URL for download
      setDownloadUrl(canvas.toDataURL('image/png'));
      setIsGenerating(false);
    };

    img.onload = drawRestOfCard;
    img.onerror = drawRestOfCard;
  }, [dishName, plateImg, restaurantName, cityName, participationId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(generateCard, 100);
    }
  }, [isOpen, generateCard]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `Bhookasur_Foodie_Pass_${participationId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareWhatsApp = () => {
    const text = `🔥 *BHOOKASUR KA FOOD TOUR PASS* 🔥\n\nI just recommended *${dishName}* at *${restaurantName} (${cityName})* on Bhookasur Food Tour!\n\nCheck out the food map and win live tour passes here 👇`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share && downloadUrl) {
      try {
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const file = new File([blob], `Bhookasur_Foodie_Pass_${participationId}.png`, { type: 'image/png' });

        await navigator.share({
          title: 'Bhookasur Ka Food Tour Pass',
          text: `Check out my food recommendation: ${dishName} at ${restaurantName}!`,
          files: [file]
        });
      } catch {
        handleShareWhatsApp();
      }
    } else {
      handleShareWhatsApp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#071746] rounded-3xl border-2 border-amber-400/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] text-white select-none">
        {/* Top Header */}
        <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm uppercase tracking-wider text-amber-300">
              Instagram & WhatsApp Foodie Card
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Canvas Element */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scrollable Preview Section */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col items-center justify-center gap-3">
          {isGenerating ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Sparkles className="w-10 h-10 text-amber-400 animate-spin" />
              <span className="text-sm font-extrabold text-amber-200">Generating Your Story Card...</span>
            </div>
          ) : (
            downloadUrl && (
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-amber-400/40 transform hover:scale-[1.02] transition-transform">
                <img
                  src={downloadUrl}
                  alt="Bhookasur Foodie Pass Story Preview"
                  className="w-full h-auto block"
                />
              </div>
            )
          )}

          <p className="text-xs text-slate-300 text-center max-w-xs font-medium">
            Post this card on Instagram Story or WhatsApp status to invite friends to Bhookasur Food Tour!
          </p>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-black/50 border-t border-white/10 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleDownload}
              type="button"
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download Image</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none" />
              <span>Share WhatsApp</span>
            </button>
          </div>

          <button
            onClick={handleNativeShare}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-[#D4380D] hover:bg-[#eb4010] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border border-white/20"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Share Story Card</span>
          </button>
        </div>
      </div>
    </div>
  );
};
