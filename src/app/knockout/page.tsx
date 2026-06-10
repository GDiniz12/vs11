"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import KnockoutMatch from "@/components/KnockoutMatch";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

export default function KnockoutPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { knockoutRounds, isChampion, userTeamName, setPhase } = useGame();

  const [tick, setTick] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const roundsWithTiming = useMemo(() => {
    if (!knockoutRounds) return [];
    let currentStart = 0;
    return knockoutRounds.map((round) => {
      const startTick = currentStart;
      const hasLeg2 = !!round.leg2;
      const duration = hasLeg2 ? 3 : 2; 
      currentStart += duration;
      return { roundData: round, startTick, duration };
    });
  }, [knockoutRounds]);

  const totalTicks = roundsWithTiming.reduce((acc, curr) => acc + curr.duration, 0);

  useEffect(() => {
    if (!knockoutRounds || knockoutRounds.length === 0) return;

    const interval = setInterval(() => {
      setTick((t) => {
        if (t < totalTicks) {
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          return t + 1;
        }
        clearInterval(interval);
        return t;
      });
    }, 3000); 

    return () => clearInterval(interval);
  }, [knockoutRounds, totalTicks]);

  const t = {
    pt: {
      title: "SUPER MUNDIAL DE CLUBES",
      subtitle: "Fase Eliminatória",
      loading: "Sorteando e Simulando Chaveamento...",
      champion: "🏆 CAMPEÃO DO MUNDO!",
      eliminated: "❌ ELIMINADO",
      viewResults: "Ver Relatório Final",
    },
    en: {
      title: "SUPER CLUB WORLD CUP",
      subtitle: "Knockout Phase",
      loading: "Drawing and Simulating Bracket...",
      champion: "🏆 WORLD CHAMPION!",
      eliminated: "❌ ELIMINATED",
      viewResults: "View Final Report",
    }
  }[lang];

  if (!knockoutRounds || knockoutRounds.length === 0) {
    return (
      <div className="min-h-screen bg-[#00183F] flex items-center justify-center">
        <div className="text-white font-black text-2xl uppercase tracking-widest animate-pulse">
          {t.loading}
        </div>
      </div>
    );
  }

  const showRemainingContent = tick >= totalTicks;

  const handleFinish = () => {
    setPhase("result");
    router.push("/result");
  };

  return (
    <div className="min-h-screen bg-[#00183F] px-4 py-10 font-sans text-white">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="text-center mb-10 border-4 border-white bg-[#D9D9D9] p-6 shadow-[8px_8px_0_0_#0033A0]">
            <h1 className="text-4xl md:text-6xl font-black text-[#00183F] mb-2 uppercase tracking-tight">
              {t.title}
            </h1>
            <p className="text-lg text-[#0033A0] font-black uppercase tracking-widest bg-white border-2 border-[#00183F] inline-block px-4 py-1 shadow-[2px_2px_0_0_#0033A0]">
              {t.subtitle}
            </p>
          </div>

          <div className="mb-10">
            <div className="space-y-8">
              <AnimatePresence>
                {roundsWithTiming.map(({ roundData, startTick }, idx) => (
                  <KnockoutMatch 
                    key={idx} 
                    roundData={roundData} 
                    userTeamName={userTeamName} 
                    tick={tick}
                    startTick={startTick}
                  />
                ))}
              </AnimatePresence>
              <div ref={endRef} className="h-4" />
            </div>
          </div>

          {showRemainingContent && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* CORREÇÃO AQUI: Trocamos o componente <Card> por uma <div> normal */}
              <div className={`text-center mb-8 border-4 border-white p-8 shadow-[12px_12px_0_0_#00183F] ${isChampion ? "bg-amber-400" : "bg-rose-600"}`}>
                <h3 className={`text-4xl md:text-5xl font-black uppercase tracking-widest ${isChampion ? "text-[#00183F]" : "text-white"}`}>
                  {isChampion ? t.champion : t.eliminated}
                </h3>
              </div>

              <div className="text-center mb-10">
                <Button variant="primary" size="lg" onClick={handleFinish} className="w-full md:w-auto min-w-[300px]">
                  {t.viewResults}
                </Button>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}