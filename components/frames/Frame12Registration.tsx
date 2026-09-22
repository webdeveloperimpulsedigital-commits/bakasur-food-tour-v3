'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { FrameFooter } from './FrameFooter';

interface Frame12RegistrationProps {
  onSubmitNumber: (mobile: string, name?: string) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export const Frame12Registration: React.FC<Frame12RegistrationProps> = ({
  onSubmitNumber,
  onBack,
  isLoading = false,
  error = ''
}) => {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(true);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const clean = mobile.replace(/\D/g, '');
    if (!clean || clean.length !== 10) {
      setLocalError('Kripya apna sahi 10-digit mobile number daalein.');
      return;
    }
    if (!consent) {
      setLocalError('Kripya communication consent check karein.');
      return;
    }

    await onSubmitNumber(clean, name.trim());
  };

  return (
    <div className="w-full h-full flex flex-col justify-between min-h-0 animate-in fade-in duration-300 gap-2 text-left">
      {/* Top Section: Back Button */}
      <div className="shrink-0 flex items-center justify-start gap-2">
        <button
          onClick={onBack}
          type="button"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Wapas Map Par</span>
        </button>
      </div>

      {/* Frame Copy Header */}
      <div className="shrink-0">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1B48] brand-font leading-[1.15]">
          Live Food Tour par chalne ke liye apna number register karo.
        </h2>
        <p className="text-xs text-[#2A3B66] font-medium mt-1 leading-snug">
          Select hone par aapko Food Tour ki details registered number par milengi.
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col justify-center gap-2.5 my-auto">
        {/* Optional Name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Aapka Naam (Optional):
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jaise: Rahul Sharma"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-semibold placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4380D] shadow-sm"
            />
          </div>
        </div>

        {/* Required Field: Mobile number */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-[#0B1B48] uppercase tracking-wider">
            Mobile Number (Required):
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600">
              +91
            </div>
            <input
              type="tel"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-slate-900 text-sm font-black tracking-wider placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4380D] shadow-sm"
            />
          </div>
        </div>

        {/* Consent Checkbox: "I agree to receive campaign-related communication." */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-0.5 select-none">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#D4380D] focus:ring-[#D4380D] cursor-pointer"
          />
          <span className="text-xs text-slate-600 font-medium leading-tight">
            I agree to receive campaign-related communication.
          </span>
        </label>

        {(localError || error) && (
          <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
            ⚠️ {localError || error}
          </p>
        )}
      </form>

      {/* Primary CTA: Mera naam jodo */}
      <div className="shrink-0 pt-1">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          type="button"
          className="w-full py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer brand-font disabled:opacity-50"
        >
          <span>{isLoading ? 'JOD RAHE HAIN...' : 'MERA NAAM JODO'}</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Footer */}
      <FrameFooter />
    </div>
  );
};
