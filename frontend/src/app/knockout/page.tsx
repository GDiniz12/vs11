"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSocket } from "@/context/SocketContext"; 
import KnockoutMatch from "@/components/KnockoutMatch";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/constants";

export default function KnockoutPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { currentRoom } = useSocket(); 
  const {
    knockoutRounds,
    userTeamName,
    isChampion,
    setPhase,
    startKnockoutPhase
  } = useGame();

  const [visibleRounds, setVisibleRounds] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Só roda offline. No online o Gabarito do Host já vem preenchido!
    if (knockoutRounds.length === 0 && !currentRoom) {
      startKnockoutPhase();
    }
  }, [knockoutRounds.length, startKnockoutPhase, currentRoom]);

  useEffect(() => {
    if (knockoutRounds.length === 0) return;
    
    const interval = setInterval(() => {
      setVisibleRounds((prev) => {
        if (prev < knockoutRounds.length) {
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [knockoutRounds]);

  if (knockoutRounds.length === 0) {
    return (
      <div className="min-h-screen bg-[#00183F] flex items-center justify-center">
        <div className="text-white font-black text-2xl uppercase tracking-widest animate-pulse">
          {lang === "pt" ? "Gerando Confrontos..." : "Generating Bracket..."}
        </div>
      </div>
    );
  }

  const showResults = visibleRounds === knockoutRounds.length;

  const handleContinue = () => {
    setPhase("result");
    router.push("/result");
  };

  const title = lang === "pt" ? "SUPER MUNDIAL DE CLUBES" : "SUPER CLUB WORLD CUP";
  const phaseLabel = lang === "pt" ? "FASE MATA-MATA" : "KNOCKOUT STAGE";

  return (
    <div className="min-h-screen bg-[#00183F] px-4 py-10 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          
          <div className="text-center mb-10 border-4 border-white bg-[#D9D9D9] p-6 shadow-[8px_8px_0_0_#0033A0]">
            <h1 className="text-3xl md:text-5xl font-black text-[#00183F] mb-2 uppercase tracking-tight">
              {title}
            </h1>
            <p className="text-[#0033A0] font-black uppercase tracking-widest bg-white border-2 border-[#00183F] inline-block px-4 py-1">
              {phaseLabel}
            </p>
          </div>

          <div className="space-y-6 mb-10">
            <AnimatePresence>
              {knockoutRounds.slice(0, visibleRounds).map((round, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  {/* CORREÇÃO AQUI: De 'match={round}' para 'roundData={round}' */}
                  <KnockoutMatch roundData={round} userTeamName={userTeamName} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={endRef} />
          </div>

          {showResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
            >
              <Card className="text-center mb-10 border-4 border-white bg-white p-8">
                {isChampion ? (
                  <>
                    <div className="text-6xl mb-4 drop-shadow-[4px_4px_0_#0033A0]">🏆</div>
                    <h2 className="text-4xl font-black text-amber-500 uppercase tracking-tighter">
                      {TRANSLATIONS[lang].champion_title}
                    </h2>
                    <p className="text-[#00183F] font-bold uppercase mt-2">
                      {TRANSLATIONS[lang].champion_desc}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4 drop-shadow-[4px_4px_0_#9f1239]">❌</div>
                    <h2 className="text-4xl font-black text-rose-600 uppercase tracking-tighter">
                      {TRANSLATIONS[lang].eliminated_title}
                    </h2>
                    <p className="text-[#00183F] font-bold uppercase mt-2">
                      {TRANSLATIONS[lang].eliminated_desc}
                    </p>
                  </>
                )}
              </Card>

              <div className="text-center">
                <Button variant="primary" size="lg" onClick={handleContinue} className="w-full md:w-auto min-w-[300px]">
                  {TRANSLATIONS[lang].view_results}
                </Button>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}