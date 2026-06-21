"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import SupportModal from "./SupportModal";

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { lang } = useLanguage();

  const t = {
    pt: { btnSupport: "APOIE O vs11", footerText: "Ajude a manter o vs11, sua ajuda vale muito!" },
    en: { btnSupport: "SUPPORT vs11", footerText: "Help maintain vs11, your support means a lot!" },
  }[lang];

  return (
    <>
      <footer className="w-full mt-16 pb-8 px-4 flex flex-col items-center">
        <div className="w-full max-w-4xl border-t-4 border-dashed border-white/20 mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <p className="text-white/90 font-black text-sm md:text-base uppercase">{t.footerText}</p>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#FF5E5B] text-white px-6 py-3 font-black uppercase tracking-widest text-sm md:text-base border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#00183F]"
          >
            {t.btnSupport}
          </button>
        </div>
      </footer>

      <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
