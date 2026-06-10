"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2">
      <button
        onClick={() => setLang("pt")}
        className={`px-3 py-1.5 text-[10px] md:text-xs font-black border-2 border-[#00183F] transition-all duration-75 ${
          lang === "pt"
            ? "bg-[#0033A0] text-white translate-x-[2px] translate-y-[2px] shadow-none cursor-default"
            : "bg-white text-[#00183F] hover:bg-[#D9D9D9] shadow-[4px_4px_0_0_#00183F]"
        }`}
      >
        PT
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1.5 text-[10px] md:text-xs font-black border-2 border-[#00183F] transition-all duration-75 ${
          lang === "en"
            ? "bg-[#0033A0] text-white translate-x-[2px] translate-y-[2px] shadow-none cursor-default"
            : "bg-white text-[#00183F] hover:bg-[#D9D9D9] shadow-[4px_4px_0_0_#00183F]"
        }`}
      >
        EN
      </button>
    </div>
  );
}