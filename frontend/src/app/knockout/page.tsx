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
    tournamentMode,
    setPhase,
    startKnockoutPhase
  } = useGame();

  const [simulationMode, setSimulationMode] = useState<'automatic' | 'accompanied'>('accompanied');
  const [tick, setTick] = useState(0);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [penaltyTick, setPenaltyTick] = useState(0);
  const [currentPenaltyRoundIdx, setCurrentPenaltyRoundIdx] = useState<number | null>(null);
  const [completedPenaltyRounds, setCompletedPenaltyRounds] = useState<Set<number>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Só roda offline. No online o Gabarito do Host já vem preenchido!
    if (knockoutRounds.length === 0 && !currentRoom) {
      startKnockoutPhase();
    }
  }, [knockoutRounds.length, startKnockoutPhase, currentRoom]);

  const startTicks = React.useMemo(() => {
    let currentTick = 0;
    return knockoutRounds.map((round) => {
      const start = currentTick;
      currentTick += round.leg2 ? 3 : 2;
      return start;
    });
  }, [knockoutRounds]);

  const maxTick = startTicks.length > 0 
    ? startTicks[startTicks.length - 1] + (knockoutRounds[knockoutRounds.length - 1].leg2 ? 3 : 2) 
    : 0;

  useEffect(() => {
    if (knockoutRounds.length === 0) return;
    
    if (simulationMode === 'automatic') {
      const interval = setInterval(() => {
        setTick((prev) => {
          if (prev < maxTick) {
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 1500); // Rápido
      return () => clearInterval(interval);
    }

    if (simulationMode === 'accompanied') {
      if (tick < maxTick) {
        // Verifica se o tick atual é a exibição de uma partida (leg1 ou leg2) ou do resultado (showAgg)
        // Cada round ocupa 2 ou 3 ticks:
        // Round sem leg2: startTick = leg1, startTick + 1 = Agg
        // Round com leg2: startTick = leg1, startTick + 1 = leg2, startTick + 2 = Agg
        
        let isMatchTick = false;
        let isAggTick = false;
        let currentRound = knockoutRounds[0];
        let currentRoundIdx = 0;

        for (let i = 0; i < knockoutRounds.length; i++) {
           const sTick = startTicks[i];
           const hasLeg2 = knockoutRounds[i].leg2;
           if (hasLeg2) {
             if (tick === sTick || tick === sTick + 1) { isMatchTick = true; currentRound = knockoutRounds[i]; currentRoundIdx = i; }
             if (tick === sTick + 2) { isAggTick = true; currentRound = knockoutRounds[i]; currentRoundIdx = i; }
           } else {
             if (tick === sTick) { isMatchTick = true; currentRound = knockoutRounds[i]; currentRoundIdx = i; }
             if (tick === sTick + 1) { isAggTick = true; currentRound = knockoutRounds[i]; currentRoundIdx = i; }
           }
        }

        if (isMatchTick) {
          if (currentMinute <= 90) {
            const timer = setTimeout(() => {
              setCurrentMinute(m => m + 1);
            }, 10000 / 90); // 10 segundos para simular 90 mins
            return () => clearTimeout(timer);
          } else {
            const timer = setTimeout(() => {
              setTick(t => t + 1);
              setCurrentMinute(0);
              setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }, 2000);
            return () => clearTimeout(timer);
          }
        } else if (isAggTick) {
          // Check if penalties are needed
          let tie = false;
          let hasPenalties = false;
          if (currentRound) {
            const h1 = currentRound.leg1.homeGoals;
            const a1 = currentRound.leg1.awayGoals;
            let uTot = currentRound.leg1.homeTeam === userTeamName ? h1 : a1;
            let oTot = currentRound.leg1.homeTeam === userTeamName ? a1 : h1;
            
            if (currentRound.leg2) {
               const h2 = currentRound.leg2.homeGoals;
               const a2 = currentRound.leg2.awayGoals;
               uTot += currentRound.leg2.homeTeam === userTeamName ? h2 : a2;
               oTot += currentRound.leg2.homeTeam === userTeamName ? a2 : h2;
            }
            tie = (uTot === oTot);
            hasPenalties = (currentRound.leg1.isPenalties || (currentRound.leg2 && currentRound.leg2.isPenalties)) ? true : false;
          }

          if (tie && hasPenalties) {
             // Track which round is actively showing penalties
             if (currentPenaltyRoundIdx !== currentRoundIdx) {
               setCurrentPenaltyRoundIdx(currentRoundIdx);
             }
             // We are at penalties!
             if (penaltyTick < 12) { // Allow up to 12 penalties total (or dynamically based on length)
               const timer = setTimeout(() => {
                 setPenaltyTick(pt => pt + 1);
                 setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
               }, 2000); // 2 seconds delay per penalty event
               return () => clearTimeout(timer);
             } else {
               const timer = setTimeout(() => {
                 setCompletedPenaltyRounds(prev => new Set(prev).add(currentRoundIdx));
                 setTick(t => t + 1);
                 setPenaltyTick(0);
                 setCurrentPenaltyRoundIdx(null);
                 setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
               }, 3000);
               return () => clearTimeout(timer);
             }
          } else {
             // No penalties, just move on
             const timer = setTimeout(() => {
               setTick(t => t + 1);
               setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
             }, 3000);
             return () => clearTimeout(timer);
          }
        }
      }
    }
  }, [simulationMode, knockoutRounds, tick, maxTick, startTicks, currentMinute, penaltyTick, userTeamName, currentPenaltyRoundIdx]);

  if (knockoutRounds.length === 0) {
    return (
      <div className="min-h-screen bg-[#00183F] flex items-center justify-center">
        <div className="text-white font-black text-2xl uppercase tracking-widest animate-pulse">
          {lang === "pt" ? "Gerando Confrontos..." : "Generating Bracket..."}
        </div>
      </div>
    );
  }

  const showResults = tick >= maxTick;

  const handleContinue = () => {
    setPhase("result");
    router.push("/result");
  };

  const title = tournamentMode === 'copa-do-mundo'
    ? (lang === "pt" ? "COPA DO MUNDO" : "WORLD CUP")
    : tournamentMode === 'louco'
    ? (lang === "pt" ? "MODO LOUCOS" : "CRAZY MODE")
    : (lang === "pt" ? "SUPER MUNDIAL DE CLUBES" : "SUPER CLUB WORLD CUP");
  const phaseLabel = lang === "pt" ? "FASE MATA-MATA" : "KNOCKOUT STAGE";

  const userKnockoutRounds = knockoutRounds.filter(r =>
    r.leg1.homeTeam === userTeamName || r.leg1.awayTeam === userTeamName
  );
  const knockoutGoals = userKnockoutRounds.reduce(
    (acc, r) => {
      const isHome1 = r.leg1.homeTeam === userTeamName;
      let scored = isHome1 ? r.leg1.homeGoals : r.leg1.awayGoals;
      let conceded = isHome1 ? r.leg1.awayGoals : r.leg1.homeGoals;
      if (r.leg2) {
        const isHome2 = r.leg2.homeTeam === userTeamName;
        scored += isHome2 ? r.leg2.homeGoals : r.leg2.awayGoals;
        conceded += isHome2 ? r.leg2.awayGoals : r.leg2.homeGoals;
      }
      return { scored: acc.scored + scored, conceded: acc.conceded + conceded };
    },
    { scored: 0, conceded: 0 }
  );
  const knockoutWins = userKnockoutRounds.filter(r => r.userAdvanced).length;
  const lastRound = userKnockoutRounds[userKnockoutRounds.length - 1]?.round || "";

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
            <div className="flex justify-end mb-4">
              {!showResults && (
                <button 
                  onClick={() => setSimulationMode(simulationMode === 'automatic' ? 'accompanied' : 'automatic')}
                  className="bg-white text-[#00183F] border-4 border-[#00183F] px-4 py-2 font-black uppercase text-xs md:text-sm hover:bg-amber-400 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transition-all"
                >
                  Trocar para Simulação {simulationMode === 'automatic' ? 'Acompanhada' : 'Automática'}
                </button>
              )}
            </div>

              <AnimatePresence>
                {knockoutRounds.map((round, idx) => {
                  const sTick = startTicks[idx];
                  if (tick < sTick) return null;

                  // Determine qual leg está sendo simulada neste momento
                  let activeMinute1, activeMinute2;
                  if (simulationMode === 'accompanied') {
                     if (!round.leg2) {
                       if (tick === sTick) activeMinute1 = currentMinute;
                     } else {
                       if (tick === sTick) activeMinute1 = currentMinute;
                       if (tick === sTick + 1) activeMinute2 = currentMinute;
                     }
                  }

                  // Compute effective penalty tick for this specific round
                  let effectivePenaltyTick = penaltyTick;
                  if (completedPenaltyRounds.has(idx)) {
                    // This round's penalties have been fully revealed
                    effectivePenaltyTick = 999;
                  } else if (currentPenaltyRoundIdx !== idx) {
                    // Not the active penalty round
                    effectivePenaltyTick = 0;
                  }

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -30, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 100 }}
                    >
                      <KnockoutMatch 
                        roundData={round} 
                        userTeamName={userTeamName} 
                        tick={tick}
                        startTick={sTick}
                        currentMinute1={activeMinute1}
                        currentMinute2={activeMinute2}
                        penaltyTick={effectivePenaltyTick}
                        simulationMode={simulationMode}
                        isUserMatch={round.isUserMatch}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={endRef} />
            </div>

          {showResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="mt-8 relative z-50"
            >
              {isChampion ? (
                <div className="border-4 border-amber-400 bg-white text-center shadow-[8px_8px_0_0_#b45309] overflow-hidden">
                  <div className="bg-amber-400 border-b-4 border-[#00183F] px-6 py-2">
                    <span className="text-[#00183F] font-black uppercase text-xs tracking-widest">
                      {TRANSLATIONS[lang].champion_desc}
                    </span>
                  </div>

                  <div className="p-8 md:p-12 flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0, y: -50, rotate: -8 }}
                      animate={{ scale: 1, y: 0, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.55, duration: 1.2 }}
                      className="mb-6"
                    >
                      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                        <path d="M18 8h36v8c0 12-8 20-18 22C26 36 18 28 18 16V8z" fill="#F59E0B"/>
                        <path d="M18 16v-8H8v4c0 6 4 11 10 13V16z" fill="#D97706"/>
                        <path d="M54 16v-8h10v4c0 6-4 11-10 13V16z" fill="#D97706"/>
                        <path d="M30 38v8h-4v6h20v-6h-4v-8" fill="#D97706"/>
                        <rect x="22" y="52" width="28" height="5" rx="1" fill="#F59E0B"/>
                        <rect x="18" y="57" width="36" height="5" rx="1" fill="#92400E"/>
                      </svg>
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45, duration: 0.6 }}
                      className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-amber-600 mb-8"
                    >
                      {TRANSLATIONS[lang].champion_title}
                    </motion.h2>

                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 }}
                      className="w-full grid grid-cols-2 sm:grid-cols-4 border-4 border-[#00183F] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]"
                    >
                      {[
                        { label: lang === "pt" ? "Vitórias" : "Wins", value: knockoutWins },
                        { label: lang === "pt" ? "Gols" : "Goals", value: knockoutGoals.scored },
                        { label: lang === "pt" ? "Sofridos" : "Conceded", value: knockoutGoals.conceded },
                        { label: lang === "pt" ? "Rodadas" : "Rounds", value: userKnockoutRounds.length },
                      ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center py-5 bg-[#00183F] border-r-2 border-white/20 last:border-r-0">
                          <span className="text-2xl md:text-3xl font-black text-white tracking-tighter">{stat.value}</span>
                          <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/50 mt-1">{stat.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="border-4 border-[#00183F] bg-[#D9D9D9] text-center shadow-[8px_8px_0_0_rgba(0,0,0,0.8)] overflow-hidden">
                  {lastRound && (
                    <div className="bg-[#00183F] border-b-4 border-[#00183F] px-6 py-2">
                      <span className="text-white font-black uppercase text-xs tracking-widest">
                        {lastRound}
                      </span>
                    </div>
                  )}

                  <div className="p-8 md:p-12 flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 1.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="mb-6"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-600 border-4 border-[#00183F] flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                          <path d="M4 4L28 28M28 4L4 28" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </motion.div>

                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-rose-600 mb-2">
                      {TRANSLATIONS[lang].eliminated_title}
                    </h2>

                    <p className="text-[#00183F] font-bold uppercase text-[10px] tracking-[0.2em] mb-8">
                      {TRANSLATIONS[lang].eliminated_desc}
                    </p>

                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="w-full grid grid-cols-2 sm:grid-cols-4 border-4 border-[#00183F] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]"
                    >
                      {[
                        { label: lang === "pt" ? "Vitórias" : "Wins", value: knockoutWins },
                        { label: lang === "pt" ? "Gols" : "Goals", value: knockoutGoals.scored },
                        { label: lang === "pt" ? "Sofridos" : "Conceded", value: knockoutGoals.conceded },
                        { label: lang === "pt" ? "Rodadas" : "Rounds", value: userKnockoutRounds.length },
                      ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center py-5 bg-[#00183F] border-r-2 border-white/20 last:border-r-0">
                          <span className="text-2xl md:text-3xl font-black text-white tracking-tighter">{stat.value}</span>
                          <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/50 mt-1">{stat.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}

              <div className="text-center mt-10">
                <Button variant="primary" size="lg" onClick={handleContinue} className="w-full md:w-auto min-w-[300px] shadow-[0_0_20px_rgba(255,255,255,0.2)]">
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