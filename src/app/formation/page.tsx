"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { FormationType } from "@/types";
import FootballPitch from "@/components/FootballPitch";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/constants";

const formations: FormationType[] = ["4-3-3", "4-4-2", "3-4-3", "3-5-2", "5-4-1", "4-2-3-1"];

export default function FormationPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { formation, setFormation, gameMode, setGameMode, slots, drawNextTeam, setPhase } = useGame();

  const handleBegin = () => {
    if (!formation) return;
    setPhase("draft");
    drawNextTeam();
    router.push("/draft");
  };

  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-[#00183F] px-4 py-12 flex flex-col items-center font-sans text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Cabeçalho Brutalista */}
        <div className="text-center mb-10 border-4 border-white bg-[#D9D9D9] p-6 shadow-[8px_8px_0_0_#0033A0]">
          <h1 className="text-3xl md:text-5xl font-black text-[#00183F] mb-2 uppercase tracking-tight">
            {t.choose_formation_title}
          </h1>
          <p className="text-[#0033A0] font-black uppercase tracking-widest text-xs md:text-sm border-l-4 border-[#0033A0] pl-2 inline-block mt-2">
            {t.choose_formation_sub}
          </p>
        </div>

        {/* MODO DE JOGO */}
        <div className="mb-10 w-full flex flex-col items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-widest border-b-4 border-white/20 pb-2 mb-6">
            {lang === "pt" ? "Escolha o Modo" : "Choose Game Mode"}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setGameMode("classic")}
              className={`flex flex-col items-center justify-center p-4 border-4 border-[#00183F] w-full sm:w-64 transition-all duration-75 ${
                gameMode === 'classic' 
                ? 'bg-[#0033A0] text-white translate-x-[2px] translate-y-[2px] shadow-none' 
                : 'bg-white text-[#00183F] shadow-[6px_6px_0_0_#0033A0] hover:-translate-y-1 hover:-translate-x-1'
              }`}
            >
              <span className="text-xl font-black uppercase tracking-widest">{lang === 'pt' ? 'Clássico' : 'Classic'}</span>
              <span className="text-xs font-bold mt-2 opacity-80">{lang === 'pt' ? '3 Sorteios • Overalls Visíveis' : '3 Re-rolls • Visible Overalls'}</span>
            </button>
            <button
              onClick={() => setGameMode("hardcore")}
              className={`flex flex-col items-center justify-center p-4 border-4 transition-all duration-75 w-full sm:w-64 ${
                gameMode === 'hardcore' 
                ? 'bg-rose-600 text-white translate-x-[2px] translate-y-[2px] shadow-none border-[#00183F]' 
                : 'bg-[#1E293B] text-rose-500 shadow-[6px_6px_0_0_#9f1239] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F]'
              }`}
            >
              <span className="text-xl font-black uppercase tracking-widest">Hardcore</span>
              <span className="text-xs font-bold mt-2 opacity-80">{lang === 'pt' ? '1 Sorteio • Overalls Ocultos' : '1 Re-roll • Hidden Overalls'}</span>
            </button>
          </div>
        </div>

        {/* Seletor de Formações */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-10">
          {formations.map((f) => (
            <button
              key={f}
              onClick={() => setFormation(f)}
              className={`
                px-6 py-3 md:px-8 md:py-4 font-black text-xl md:text-2xl uppercase tracking-widest
                transition-all duration-75 border-4 border-[#00183F] rounded-none
                ${
                  formation === f
                    ? "bg-[#0033A0] text-white translate-x-[2px] translate-y-[2px] shadow-none"
                    : "bg-white text-[#00183F] hover:bg-[#D9D9D9] shadow-[6px_6px_0_0_#0033A0] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_#0033A0]"
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Campo de Futebol */}
        <div className="flex justify-center mb-10">
          {formation ? (
            <FootballPitch key={formation} slots={slots} />
          ) : (
            <div className="w-full max-w-[420px] mx-auto p-2">
              <div 
                className="relative w-full rounded-none border-4 border-dashed border-white/50 bg-[#1A3B2B]/40 shadow-[12px_12px_0_0_rgba(0,0,0,0.5)]" 
                style={{ paddingBottom: "145%" }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                  <span className="text-white/60 font-black text-lg md:text-xl uppercase tracking-widest border-b-4 border-white/20 pb-2">
                    {t.select_formation_above}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleBegin}
            disabled={!formation}
            className="w-full md:w-auto min-w-[300px]"
          >
            {t.begin_draft}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}