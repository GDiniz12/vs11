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

  const [simulationMode, setSimulationMode] = useState<'idle' | 'automatic' | 'accompanied'>('idle');
  const [tick, setTick] = useState(0);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [penaltyTick, setPenaltyTick] = useState(0);
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
    if (simulationMode === 'idle' || knockoutRounds.length === 0) return;
    
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

        for (let i = 0; i < knockoutRounds.length; i++) {
           const sTick = startTicks[i];
           const hasLeg2 = knockoutRounds[i].leg2;
           if (hasLeg2) {
             if (tick === sTick || tick === sTick + 1) { isMatchTick = true; currentRound = knockoutRounds[i]; }
             if (tick === sTick + 2) { isAggTick = true; currentRound = knockoutRounds[i]; }
           } else {
             if (tick === sTick) { isMatchTick = true; currentRound = knockoutRounds[i]; }
             if (tick === sTick + 1) { isAggTick = true; currentRound = knockoutRounds[i]; }
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
             // We are at penalties!
             if (penaltyTick < 12) { // Allow up to 12 penalties total (or dynamically based on length)
               const timer = setTimeout(() => {
                 setPenaltyTick(pt => pt + 1);
                 setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
               }, 2000); // 2 seconds delay per penalty event
               return () => clearTimeout(timer);
             } else {
               const timer = setTimeout(() => {
                 setTick(t => t + 1);
                 setPenaltyTick(0);
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
  }, [simulationMode, knockoutRounds, tick, maxTick, startTicks, currentMinute, penaltyTick, userTeamName]);

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

          {simulationMode === 'idle' && (
            <Card className="text-center mb-10 border-4 border-white">
              <h2 className="text-2xl font-black text-[#00183F] uppercase tracking-widest mb-6">
                ESCOLHA O MODO DE SIMULAÇÃO
              </h2>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="primary" onClick={() => setSimulationMode('automatic')} className="w-full sm:w-auto">
                  SIMULAÇÃO AUTOMÁTICA
                </Button>
                <Button variant="outline" onClick={() => setSimulationMode('accompanied')} className="w-full sm:w-auto border-[#00183F] text-[#00183F] hover:bg-[#00183F] hover:text-white">
                  SIMULAÇÃO ACOMPANHADA
                </Button>
              </div>
            </Card>
          )}

          {simulationMode !== 'idle' && (
            <div className="space-y-6 mb-10">



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
                        penaltyTick={penaltyTick}
                        simulationMode={simulationMode}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={endRef} />
            </div>
          )}

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