"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { lang } = useLanguage();

  const url = `https://pixgg.com/gdiniz12`;

  const handleRedirect = () => {
    // Abre a página do Ko-fi em uma nova aba de forma segura
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const t = {
    pt: {
      btnSupport: "APOIE O vs11",
      modalTitle: "Apoie o Projeto!",
      modalText: "Se você curtiu a experiência, considere apoiar o desenvolvimento do vs11!",
      redirectBtn: "Apoiar",
      closeBtn: "Fechar",
    },
    en: {
      btnSupport: "SUPPORT vs11",
      modalTitle: "Support the Project!",
      modalText: "If you enjoyed the experience, consider supporting the vs11 development!",
      redirectBtn: "Support",
      closeBtn: "Close",
    }
  }[lang];

  return (
    <>
      {/* Rodapé de Apoio (Footer) */}
      <footer className="w-full mt-16 pb-8 px-4 flex flex-col items-center">
        <div className="w-full max-w-4xl border-t-4 border-dashed border-white/20 mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <p className="text-white/90 font-black text-sm md:text-base uppercase">
            {lang === 'pt' ? 'Ajude a manter o 16a0, sua ajuda vale muito!' : 'Help maintain 16a0, your support means a lot!'}
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#FF5E5B] text-white px-6 py-3 font-black uppercase tracking-widest text-sm md:text-base border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#00183F]"
          >
            {t.btnSupport}
          </button>
        </div>
      </footer>

      {/* Modal de Apoio */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#00183F]/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#00183F] p-6 md:p-8 w-full max-w-md shadow-[10px_10px_0_0_#0033A0] flex flex-col gap-6 relative">
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-rose-600 text-white font-black border-2 border-[#00183F] hover:bg-rose-700"
            >
              X
            </button>

            <div className="text-center mt-2">
              <h2 className="text-2xl font-black text-[#00183F] uppercase tracking-tighter mb-2">
                {t.modalTitle}
              </h2>
              <p className="text-sm font-bold text-gray-600">
                {t.modalText}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRedirect}
                className="w-full py-3 font-black uppercase text-sm tracking-widest border-4 border-[#00183F] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0_0_#00183F] bg-[#FF5E5B] text-white flex items-center justify-center gap-2"
              >
                {t.redirectBtn}
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 font-black uppercase text-sm tracking-widest bg-[#D9D9D9] text-[#00183F] border-4 border-[#00183F] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0_0_#00183F]"
              >
                {t.closeBtn}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}