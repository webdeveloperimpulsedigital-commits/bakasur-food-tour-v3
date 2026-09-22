'use client';

import React, { useState } from 'react';
import { Menu, ArrowRight, X, Phone, User, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { InteractiveTourMap } from './InteractiveTourMap';

interface Frame11LiveMapProps {
  sessionId?: string;
  currentUserSpot?: {
    name: string;
    city: string;
    dishName: string;
    latitude?: number;
    longitude?: number;
  } | null;
  onRegisterLiveTour?: () => void;
  onSuggestAnotherSpot: () => void;
  onRegisterSubmit?: (mobile: string, name?: string, concern?: string) => Promise<boolean | void>;
  isRegistering?: boolean;
  regError?: string;
}

export const Frame11LiveMap: React.FC<Frame11LiveMapProps> = ({
  sessionId,
  currentUserSpot,
  onRegisterLiveTour,
  onSuggestAnotherSpot,
  onRegisterSubmit,
  isRegistering = false,
  regError = ''
}) => {
  const [stats, setStats] = useState<{ foodSpots: number | null; mustTryDishes: number | null; citiesCount: number | null }>({
    foodSpots: null,
    mustTryDishes: null,
    citiesCount: null
  });

  // Registration Popup State (Only Mobile Number & User Consent Checkbox)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [mobile, setMobile] = useState<string>('');
  const [consent, setConsent] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  // Fetch dynamic stats from /api/campaign/map immediately
  React.useEffect(() => {
    async function loadStats() {
      try {
        const url = sessionId ? `/api/campaign/map?session_id=${encodeURIComponent(sessionId)}` : '/api/campaign/map';
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && json.data?.stats) {
          setStats(json.data.stats);
        }
      } catch (err) {
        console.warn('Failed to load map stats:', err);
      }
    }
    loadStats();
  }, [sessionId]);

  const handleOpenRegistration = () => {
    setLocalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      setLocalError('Kripya apna sahi 10-digit mobile number daalein.');
      return;
    }

    if (!consent) {
      setLocalError('Kripya Live Food Tour communication consent checkbox check karein (Required).');
      return;
    }

    if (onRegisterSubmit) {
      const ok = await onRegisterSubmit(cleanMobile);
      if (ok) {
        setIsSubmittedSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1200);
      }
    } else if (onRegisterLiveTour) {
      setIsModalOpen(false);
      onRegisterLiveTour();
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between text-left animate-in fade-in duration-300 bg-white relative overflow-hidden">
      {/* 1. Top Header Bar: BAKASUR KA FOOD TOUR with Hamburger Menu Icon */}
      <div className="shrink-0 bg-[#08173E] py-3 px-4 flex items-center justify-between text-white shadow-sm z-10">
        <div className="w-6" /> {/* spacer for centered title */}
        <span className="font-black text-xs sm:text-sm tracking-widest uppercase text-center flex-1">
          BAKASUR KA FOOD TOUR
        </span>
        <button
          type="button"
          aria-label="Menu"
          className="p-1 rounded text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* ========================================================== */}
      {/* 2. MOBILE VIEW (< md): EXACT SAME VERTICAL LAYOUT AS BEFORE */}
      {/* ========================================================== */}
      <div className="flex md:hidden flex-1 flex-col justify-between px-3.5 sm:px-4 py-1.5 sm:py-2 gap-1.5 sm:gap-2 overflow-y-auto">
        {/* Headline & Subtitle */}
        <div className="shrink-0 pt-0.5">
          <h1 className="text-[20px] xs:text-[22px] sm:text-[25px] font-black tracking-tight leading-[1.15]">
            <span className="text-[#0B1B48]">Bakasur ka pet bharna mushkil hai.</span><br />
            <span className="text-[#D4380D]">Map bharna nahi.</span>
          </h1>
          <p className="text-xs sm:text-[13px] font-semibold text-[#0B1B48]/80 mt-0.5 leading-snug">
            India ki recommendations. Bakasur ka live Food Tour Map.
          </p>
        </div>

        {/* Center Map Component */}
        <div className="w-full shrink-0">
          <InteractiveTourMap
            sessionId={sessionId}
            currentUserSpot={currentUserSpot}
            onStatsLoaded={(s) => setStats(s)}
          />
        </div>

        {/* Stats Bar */}
        <div className="w-full bg-[#F3F5FA] rounded-2xl border border-slate-200/90 shadow-xs flex items-center py-1.5 px-1 shrink-0">
          <div className="flex-1 text-center border-r border-slate-200/90 px-1">
            <div className="text-lg sm:text-2xl font-black text-[#D4380D] leading-none">
              [{stats.foodSpots !== null ? stats.foodSpots : '...'}]
            </div>
            <div className="text-[10px] sm:text-[11px] font-black text-[#0B1B48] mt-0.5 tracking-tight">
              Food spots
            </div>
          </div>

          <div className="flex-1 text-center border-r border-slate-200/90 px-1">
            <div className="text-lg sm:text-2xl font-black text-[#D4380D] leading-none">
              [{stats.mustTryDishes !== null ? stats.mustTryDishes : '...'}]
            </div>
            <div className="text-[10px] sm:text-[11px] font-black text-[#0B1B48] mt-0.5 tracking-tight">
              Must-try dishes
            </div>
          </div>

          <div className="flex-1 text-center px-1">
            <div className="text-lg sm:text-2xl font-black text-[#D4380D] leading-none">
              [{stats.citiesCount !== null ? stats.citiesCount : '...'}]
            </div>
            <div className="text-[10px] sm:text-[11px] font-black text-[#0B1B48] mt-0.5 tracking-tight">
              Cities on tour
            </div>
          </div>
        </div>

        {/* Primary CTA: EK AUR FOOD STOP JODO */}
        <div className="w-full shrink-0">
          <button
            onClick={onSuggestAnotherSpot}
            type="button"
            className="w-full py-3 sm:py-3.5 px-5 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-md shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
          >
            <span>EK AUR FOOD STOP JODO</span>
          </button>
        </div>

        {/* Influencer Subtext */}
        <div className="w-full text-center -my-0.5 shrink-0">
          <p className="text-[10.5px] sm:text-[11.5px] font-bold text-[#0B1B48]/90 leading-tight">
            Apne favourite food influencer ke saath Live Food Tour ka chance.
          </p>
        </div>

        {/* Secondary CTA: LIVE FOOD TOUR KE LIYE REGISTER KARO */}
        <div className="w-full pb-1 shrink-0">
          <button
            onClick={handleOpenRegistration}
            type="button"
            className="w-full py-2.5 sm:py-3 px-5 rounded-2xl bg-white hover:bg-slate-50 text-[#0B1B48] border-2 border-[#0B1B48] font-black text-xs sm:text-sm uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>LIVE FOOD TOUR KE LIYE REGISTER KARO</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. DESKTOP VIEW (md:flex): LEFT SIDE MAP, RIGHT SIDE BUTTONS */}
      {/* ========================================================== */}
      <div className="hidden md:flex flex-1 min-h-0 flex-row overflow-hidden">
        {/* LEFT SIDE: MAP */}
        <div className="w-1/2 h-full flex items-center justify-center p-6 lg:p-8 bg-slate-50/70 border-r border-slate-200/80 relative overflow-hidden">
          <div className="w-full max-w-[540px] flex items-center justify-center">
            <InteractiveTourMap
              sessionId={sessionId}
              currentUserSpot={currentUserSpot}
              onStatsLoaded={(s) => setStats(s)}
            />
          </div>
        </div>

        {/* RIGHT SIDE: HEADLINE, STATS & BUTTONS */}
        <div className="w-1/2 h-full flex flex-col justify-center px-8 lg:px-12 py-8 gap-5 lg:gap-6 bg-white overflow-y-auto">
          {/* Headline & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight leading-[1.15]">
              <span className="text-[#0B1B48]">Bakasur ka pet bharna mushkil hai.</span><br />
              <span className="text-[#D4380D]">Map bharna nahi.</span>
            </h1>
            <p className="text-sm lg:text-base font-semibold text-[#0B1B48]/80 mt-1 leading-snug">
              India ki recommendations. Bakasur ka live Food Tour Map.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="w-full bg-[#F3F5FA] rounded-2xl border border-slate-200/90 shadow-xs flex items-center py-3 px-2">
            <div className="flex-1 text-center border-r border-slate-200/90 px-2">
              <div className="text-2xl lg:text-3xl font-black text-[#D4380D] leading-none">
                [{stats.foodSpots !== null ? stats.foodSpots : '...'}]
              </div>
              <div className="text-xs lg:text-sm font-black text-[#0B1B48] mt-1 tracking-tight">
                Food spots
              </div>
            </div>

            <div className="flex-1 text-center border-r border-slate-200/90 px-2">
              <div className="text-2xl lg:text-3xl font-black text-[#D4380D] leading-none">
                [{stats.mustTryDishes !== null ? stats.mustTryDishes : '...'}]
              </div>
              <div className="text-xs lg:text-sm font-black text-[#0B1B48] mt-1 tracking-tight">
                Must-try dishes
              </div>
            </div>

            <div className="flex-1 text-center px-2">
              <div className="text-2xl lg:text-3xl font-black text-[#D4380D] leading-none">
                [{stats.citiesCount !== null ? stats.citiesCount : '...'}]
              </div>
              <div className="text-xs lg:text-sm font-black text-[#0B1B48] mt-1 tracking-tight">
                Cities on tour
              </div>
            </div>
          </div>

          {/* Primary CTA: EK AUR FOOD STOP JODO */}
          <div className="w-full pt-1">
            <button
              onClick={onSuggestAnotherSpot}
              type="button"
              className="w-full py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-base lg:text-lg uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
            >
              <span>EK AUR FOOD STOP JODO</span>
            </button>
          </div>

          {/* Influencer Subtext */}
          <div className="w-full text-center">
            <p className="text-xs lg:text-sm font-bold text-[#0B1B48]/90 leading-tight">
              Apne favourite food influencer ke saath Live Food Tour ka chance.
            </p>
          </div>

          {/* Secondary CTA: LIVE FOOD TOUR KE LIYE REGISTER KARO */}
          <div className="w-full">
            <button
              onClick={handleOpenRegistration}
              type="button"
              className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 text-[#0B1B48] border-2 border-[#0B1B48] font-black text-sm lg:text-base uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>LIVE FOOD TOUR KE LIYE REGISTER KARO</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 8. REGISTRATION POPUP MODAL (Mobile Number & Consent Only) */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 relative flex flex-col gap-3 animate-in zoom-in-95 duration-200 max-h-[92%] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              type="button"
              className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div>
              <h3 className="text-lg font-black text-[#0B1B48] leading-tight">
                Live Food Tour Registration
              </h3>
              <p className="text-[11px] font-semibold text-[#0B1B48]/75 mt-0.5 leading-snug">
                Apne favourite food influencer ke saath tour par chalne ke liye apna number register karein.
              </p>
            </div>

            {/* Success State if Submitted */}
            {isSubmittedSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                <h4 className="font-black text-base text-[#0B1B48]">Registration Kamyab!</h4>
                <p className="text-xs text-slate-600">Aapka Tour Pass generate ho raha hai...</p>
              </div>
            ) : (
              /* Registration Form: ONLY Mobile Number + Consent Checkbox */
              <form onSubmit={handleModalSubmit} className="flex flex-col gap-3">
                {/* Field 1: Mobile Number (Required) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-[#0B1B48] uppercase tracking-wider flex items-center justify-between">
                    <span>Mobile Number</span>
                    <span className="text-[#D4380D] font-bold text-[10px]">* Required</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-700 flex items-center gap-1">
                      <span>🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number"
                      maxLength={10}
                      required
                      autoFocus
                      className="w-full pl-16 pr-3 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm font-black tracking-wider placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4380D] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Field 2: User Consent Checkbox (Required) */}
                <div className="flex flex-col gap-1 pt-0.5">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      required
                      className="mt-0.5 rounded text-[#D4380D] focus:ring-[#D4380D] h-4 w-4 border-slate-300 accent-[#D4380D] cursor-pointer"
                    />
                    <span className="text-[10.5px] sm:text-[11px] font-semibold text-slate-700 leading-snug">
                      Main contest updates, WhatsApp messages aur Live Food Tour ki details prapt karne ke liye sehmat hoon. <span className="text-[#D4380D] font-bold">*</span>
                    </span>
                  </label>
                </div>

                {/* Error Message */}
                {(localError || regError) && (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{localError || regError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isRegistering || mobile.length !== 10 || !consent}
                    className="w-full py-3 px-4 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? (
                      <span className="animate-pulse">Registering...</span>
                    ) : (
                      <>
                        <span>TOUR PASS CLAIM KARO</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
