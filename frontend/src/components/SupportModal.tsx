"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT_URL = "https://pixgg.com/gdiniz12";
const STORAGE_KEY = "16a0_support_ts";
const COOLDOWN_DAYS = 7;

export function shouldShowSupportModal(): boolean {
  try {
    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) return true;
    const daysSince = (Date.now() - parseInt(last)) / (1000 * 60 * 60 * 24);
    return daysSince >= COOLDOWN_DAYS;
  } catch {
    return false;
  }
}

export function markSupportModalShown(): void {
  try {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch {}
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { lang } = useLanguage();
  const router = useRouter();

  const t = {
    pt: {
      title: "Gostou do vs11?",
      text: "O vs11 é gratuito e feito com muito amor. Se você curtiu a experiência, considere apoiar o desenvolvimento!",
      supportBtn: "Apoiar o Projeto",
      closeBtn: "Talvez depois",
    },
    en: {
      title: "Enjoying vs11?",
      text: "vs11 is free and made with a lot of love. If you enjoyed the experience, consider supporting the development!",
      supportBtn: "Support the Project",
      closeBtn: "Maybe later",
    },
  }[lang];

  if (!isOpen) return null;

  const handleSupport = () => {
    window.open(SUPPORT_URL, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#00183F]/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-[#00183F] p-6 md:p-8 w-full max-w-md shadow-[10px_10px_0_0_#0033A0] flex flex-col gap-6 relative">

        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-rose-600 text-white font-black border-2 border-[#00183F] hover:bg-rose-700"
        >
          X
        </button>

        <div className="text-center mt-2">
          <div className="text-4xl mb-3">⚽</div>
          <h2 className="text-2xl font-black text-[#00183F] uppercase tracking-tighter mb-2">
            {t.title}
          </h2>
          <p className="text-sm font-bold text-gray-600">{t.text}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSupport}
            className="w-full py-3 font-black uppercase text-sm tracking-widest border-4 border-[#00183F] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0_0_#00183F] bg-[#FF5E5B] text-white"
          >
            {t.supportBtn}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 font-black uppercase text-sm tracking-widest bg-[#D9D9D9] text-[#00183F] border-4 border-[#00183F] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0_0_#00183F]"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
