"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { KnockoutRound } from "@/types";
import MatchResultCard from "./MatchResultCard";
import { useLanguage } from "@/context/LanguageContext";
import { clubLogos, americans, europeans } from "@/data/data";
import { useGame } from "@/context/GameContext";

interface KnockoutMatchProps {
  roundData: KnockoutRound;
  userTeamName: string;
  tick: number;
  startTick: number;
  currentMinute1?: number;
  currentMinute2?: number;
  penaltyTick?: number;
  simulationMode?: string;
  isUserMatch?: boolean;
}

const getLogoUrl = (teamName: string) => {
  if (!teamName) return "";
  let formatted = teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
  formatted = formatted.replace(/-\d{4}$/, ""); // Remove o ano pro logo
  return clubLogos[formatted] || "";
};

export default function KnockoutMatch({ roundData, userTeamName, tick, startTick, currentMinute1, currentMinute2, penaltyTick, simulationMode, isUserMatch }: KnockoutMatchProps) {
  const { lang } = useLanguage();

  // Detect neutral (non-user) match
  const isNeutral = isUserMatch === false || (roundData.leg1.homeTeam !== userTeamName && roundData.leg1.awayTeam !== userTeamName);
  
  const showHeader = tick >= startTick; 
  const showLeg1 = tick >= startTick; 
  const showLeg2 = roundData.leg2 && tick >= startTick + 1; 
  const showAgg = roundData.leg2 ? tick >= startTick + 2 : tick >= startTick + 1; 

  // Team references for neutral display
  const team1Name = roundData.leg1.homeTeam;
  const team2Name = roundData.leg1.awayTeam;

  const { isTie, userTotal, oppTotal, userPenalties, oppPenalties, userPenScore, oppPenScore } = useMemo(() => {
    if (isNeutral) {
      // Neutral mode: use homeTeam of leg1 as team1, awayTeam as team2
      let t1Total = roundData.leg1.homeGoals;
      let t2Total = roundData.leg1.awayGoals;

      if (roundData.leg2) {
        // In leg2 the home/away might be swapped, so find by team name
        const isT1HomeLeg2 = roundData.leg2.homeTeam === team1Name;
        t1Total += isT1HomeLeg2 ? roundData.leg2.homeGoals : roundData.leg2.awayGoals;
        t2Total += isT1HomeLeg2 ? roundData.leg2.awayGoals : roundData.leg2.homeGoals;
      }

      const tie = t1Total === t2Total;
      const hasPenalties = (roundData.leg1.isPenalties || (roundData.leg2 && roundData.leg2.isPenalties)) ? true : false;
      const isPenTie = tie && hasPenalties;

      let t1Pens: {name: string, scored: boolean, missed: boolean, order: number}[] = [];
      let t2Pens: {name: string, scored: boolean, missed: boolean, order: number}[] = [];
      let t1PenScore = 0;
      let t2PenScore = 0;

      if (isPenTie) {
        const penMatch = roundData.leg2 && roundData.leg2.isPenalties ? roundData.leg2 : roundData.leg1;
        const isT1HomePen = penMatch.homeTeam === team1Name;
        const pEvents = penMatch.penaltyEvents || [];
        pEvents.forEach((ev, idx) => {
          const isMiss = ev.type === "penalty_miss";
          const isEvHome = ev.team === "home";
          const isT1 = isEvHome ? isT1HomePen : !isT1HomePen;
          if (simulationMode === 'accompanied' && penaltyTick !== undefined) {
            if (idx >= penaltyTick) return;
          }
          if (isT1) {
            t1Pens.push({ name: ev.player, scored: !isMiss, missed: isMiss, order: idx });
            if (!isMiss) t1PenScore++;
          } else {
            t2Pens.push({ name: ev.player, scored: !isMiss, missed: isMiss, order: idx });
            if (!isMiss) t2PenScore++;
          }
        });
      }

      return {
        isTie: isPenTie,
        userTotal: t1Total,
        oppTotal: t2Total,
        userPenalties: t1Pens,
        oppPenalties: t2Pens,
        userPenScore: t1PenScore,
        oppPenScore: t2PenScore
      };
    }

    // User match: original logic
    const isHomeLeg1 = roundData.leg1.homeTeam === userTeamName;
    const userGoals1 = isHomeLeg1 ? roundData.leg1.homeGoals : roundData.leg1.awayGoals;
    const oppGoals1 = isHomeLeg1 ? roundData.leg1.awayGoals : roundData.leg1.homeGoals;

    let uTotal = userGoals1;
    let oTotal = oppGoals1;

    if (roundData.leg2) {
      const isHomeLeg2 = roundData.leg2.homeTeam === userTeamName;
      uTotal += isHomeLeg2 ? roundData.leg2.homeGoals : roundData.leg2.awayGoals;
      oTotal += isHomeLeg2 ? roundData.leg2.awayGoals : roundData.leg2.homeGoals;
    }

    const tie = uTotal === oTotal;
    const hasPenalties = (roundData.leg1.isPenalties || (roundData.leg2 && roundData.leg2.isPenalties)) ? true : false;
    const isPenTie = tie && hasPenalties;

    let userPens: {name: string, scored: boolean, missed: boolean, order: number}[] = [];
    let oppPens: {name: string, scored: boolean, missed: boolean, order: number}[] = [];
    let uPenScore = 0;
    let oPenScore = 0;

    if (isPenTie) {
      const penMatch = roundData.leg2 && roundData.leg2.isPenalties ? roundData.leg2 : roundData.leg1;
      const isHomePen = penMatch.homeTeam === userTeamName;
      
      const pEvents = penMatch.penaltyEvents || [];
      
      pEvents.forEach((ev, idx) => {
         const isMiss = ev.type === "penalty_miss";
         const isEvHome = ev.team === "home";
         
         const isUser = isEvHome ? isHomePen : !isHomePen;
         
         // Limitar pelos ticks em modo acompanhado
         if (simulationMode === 'accompanied' && penaltyTick !== undefined) {
            if (idx >= penaltyTick) return;
         }

         if (isUser) {
            userPens.push({ name: ev.player, scored: !isMiss, missed: isMiss, order: idx });
            if (!isMiss) uPenScore++;
         } else {
            oppPens.push({ name: ev.player, scored: !isMiss, missed: isMiss, order: idx });
            if (!isMiss) oPenScore++;
         }
      });
    }

    return { 
      isTie: isPenTie, 
      userTotal: uTotal, 
      oppTotal: oTotal,
      userPenalties: userPens,
      oppPenalties: oppPens,
      userPenScore: uPenScore,
      oppPenScore: oPenScore
    };
  }, [roundData, userTeamName, simulationMode, penaltyTick, isNeutral, team1Name]);

  // Determine whether the penalty reveal is complete
  const penMatchLocal = roundData.leg2 && roundData.leg2.isPenalties ? roundData.leg2 : roundData.leg1;
  const actualTotalEvents = penMatchLocal?.penaltyEvents?.length || 0;
  const penaltiesFullyRevealed = !isTie || (
    simulationMode === 'automatic' || 
    simulationMode === 'instant' ||
    (simulationMode === 'accompanied' && penaltyTick !== undefined && penaltyTick >= actualTotalEvents && actualTotalEvents > 0)
  );

  // Hide penalty details in the leg cards until the aggregate penalty reveal is done
  const shouldHidePenaltiesInLegs = isTie && !penaltiesFullyRevealed;

  if (!showHeader) return null;

  const displayTeam1 = isNeutral ? team1Name : userTeamName;
  const displayTeam2 = isNeutral ? team2Name : roundData.userOpponent;
  const team1Won = roundData.winner === displayTeam1;

  const userLogo = getLogoUrl(displayTeam1);
  const oppLogo = getLogoUrl(displayTeam2);

  const isFinal = roundData.round === 'Final' || roundData.round === 'Finals' || roundData.round === 'FINAL';
  const containerClass = isFinal
    ? "bg-gradient-to-br from-[#1E293B] to-[#0f172a] border-4 border-yellow-400 p-3 sm:p-4 md:p-6 shadow-[10px_10px_0_0_#b45309] mb-8 relative overflow-hidden"
    : "bg-[#1E293B] border-4 border-white p-3 sm:p-4 md:p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.6)] mb-8";

  const titleClass = isFinal
    ? "text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)]"
    : "text-xl sm:text-2xl md:text-3xl font-black text-amber-400 uppercase tracking-widest drop-shadow-[2px_2px_0_#00183F]";

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={containerClass}
    >
      {isFinal && (
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(250,204,21,0.5) 10px, rgba(250,204,21,0.5) 20px)" }} />
      )}
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b-4 border-white/20 gap-4">
        <h2 className={titleClass}>
          {roundData.round}
        </h2>
        
        {showAgg && penaltiesFullyRevealed && (
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={`px-3 py-1.5 border-2 border-white font-black uppercase tracking-widest text-[10px] md:text-sm shadow-[3px_3px_0_0_#00183F] ${isNeutral ? "bg-sky-600 text-white" : roundData.userAdvanced ? "bg-emerald-500 text-white" : "bg-rose-600 text-white"}`}
          >
            {isNeutral
              ? `${roundData.winner} ${lang === "pt" ? "avançou" : "advanced"}`
              : roundData.userAdvanced ? (lang === "pt" ? "Avançou" : "Advanced") : (lang === "pt" ? "Eliminado" : "Eliminated")
            }
          </motion.div>
        )}
      </div>

      <div className="relative z-10 space-y-4 mb-6">
        {showLeg1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MatchResultCard 
              match={roundData.leg1} 
              userTeamName={displayTeam1} 
              stage={lang === "pt" ? (roundData.leg2 ? "Jogo de Ida" : "Jogo Único") : (roundData.leg2 ? "1st Leg" : "Single Match")} 
              currentMinute={currentMinute1}
              hidePenalties={shouldHidePenaltiesInLegs}
            />
          </motion.div>
        )}
        
        {showLeg2 && roundData.leg2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MatchResultCard 
              match={roundData.leg2} 
              userTeamName={displayTeam1} 
              stage={lang === "pt" ? "Jogo de Volta" : "2nd Leg"} 
              currentMinute={currentMinute2}
              hidePenalties={shouldHidePenaltiesInLegs}
            />
          </motion.div>
        )}
      </div>

      {showAgg && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          className="relative z-10 mt-4 overflow-hidden border-4 border-[#00183F] shadow-[8px_8px_0_0_rgba(0,0,0,0.8)]"
        >
          {/* Label bar */}
          <div className="flex items-center justify-between bg-[#00183F] px-4 py-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {lang === "pt" ? "Placar Agregado" : "Aggregate Score"}
            </span>
            {showAgg && penaltiesFullyRevealed && (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-0.5 border-2 border-white shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] ${
                  isNeutral ? "bg-sky-500 text-white" : roundData.userAdvanced ? "bg-emerald-500 text-white" : "bg-rose-600 text-white"
                }`}
              >
                {isNeutral
                  ? roundData.winner
                  : roundData.userAdvanced
                    ? (lang === "pt" ? "▶ Avançou" : "▶ Advanced")
                    : (lang === "pt" ? "✕ Eliminado" : "✕ Eliminated")
                }
              </motion.span>
            )}
          </div>

          {/* Split panels */}
          <div className="flex border-t-4 border-[#00183F]">
            {/* Team 1 panel */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className={`flex-1 relative flex flex-col items-center justify-center gap-2 py-8 px-4 overflow-hidden ${
                isNeutral
                  ? team1Won && !isTie ? "bg-white" : "bg-[#D9D9D9]"
                  : roundData.userAdvanced && !isTie ? "bg-white" : "bg-[#D9D9D9]"
              }`}
            >
              {/* Left accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-[6px] ${
                isNeutral
                  ? team1Won && !isTie ? "bg-sky-500" : "bg-[#00183F]/20"
                  : roundData.userAdvanced && !isTie ? "bg-emerald-500" : "bg-rose-500"
              }`} />

              {userLogo && (
                <img
                  src={userLogo}
                  alt={displayTeam1}
                  className="relative w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
                />
              )}
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.45, delay: 0.18 }}
                className={`relative text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none select-none ${
                  isNeutral
                    ? team1Won && !isTie ? "text-[#00183F]" : "text-[#00183F]/30"
                    : roundData.userAdvanced && !isTie ? "text-[#00183F]" : isTie ? "text-[#00183F]/60" : "text-[#00183F]/30"
                }`}
              >
                {userTotal}
              </motion.span>
              <span className="relative text-[8px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-[#00183F]/60 text-center max-w-[100px] sm:max-w-[140px] truncate">
                {displayTeam1}
              </span>

              {/* Per-leg chips */}
              {roundData.leg2 && (
                <div className="relative flex gap-1 mt-1.5">
                  {([roundData.leg1, roundData.leg2] as NonNullable<typeof roundData.leg2>[]).map((leg, i) => {
                    const isT1Home = leg.homeTeam === displayTeam1;
                    const t1g = isT1Home ? leg.homeGoals : leg.awayGoals;
                    const t2g = isT1Home ? leg.awayGoals : leg.homeGoals;
                    return (
                      <span key={i} className="text-[8px] font-mono font-black px-1.5 py-0.5 bg-[#00183F]/10 border border-[#00183F]/20 text-[#00183F]/50 tracking-wide">
                        {i === 0 ? (lang === "pt" ? "J1" : "L1") : (lang === "pt" ? "J2" : "L2")} {t1g}–{t2g}
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Center divider */}
            <div className="w-1 flex-shrink-0 bg-[#00183F]" />

            {/* Team 2 panel */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className={`flex-1 relative flex flex-col items-center justify-center gap-2 py-8 px-4 overflow-hidden ${
                isNeutral
                  ? !team1Won && !isTie ? "bg-white" : "bg-[#D9D9D9]"
                  : !roundData.userAdvanced && !isTie ? "bg-white" : "bg-[#D9D9D9]"
              }`}
            >
              {/* Right accent bar */}
              <div className={`absolute right-0 top-0 bottom-0 w-[6px] ${
                isNeutral
                  ? !team1Won && !isTie ? "bg-sky-500" : "bg-[#00183F]/20"
                  : !roundData.userAdvanced && !isTie ? "bg-emerald-500" : "bg-rose-500"
              }`} />

              {oppLogo && (
                <img
                  src={oppLogo}
                  alt={displayTeam2}
                  className="relative w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
                />
              )}
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.45, delay: 0.18 }}
                className={`relative text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none select-none ${
                  isNeutral
                    ? !team1Won && !isTie ? "text-[#00183F]" : "text-[#00183F]/30"
                    : !roundData.userAdvanced && !isTie ? "text-[#00183F]" : isTie ? "text-[#00183F]/60" : "text-[#00183F]/30"
                }`}
              >
                {oppTotal}
              </motion.span>
              <span className="relative text-[8px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-[#00183F]/60 text-center max-w-[100px] sm:max-w-[140px] truncate">
                {displayTeam2}
              </span>

              {/* Per-leg chips */}
              {roundData.leg2 && (
                <div className="relative flex gap-1 mt-1.5">
                  {([roundData.leg1, roundData.leg2] as NonNullable<typeof roundData.leg2>[]).map((leg, i) => {
                    const isT2Home = leg.homeTeam === displayTeam2;
                    const t2g = isT2Home ? leg.homeGoals : leg.awayGoals;
                    const t1g = isT2Home ? leg.awayGoals : leg.homeGoals;
                    return (
                      <span key={i} className="text-[8px] font-mono font-black px-1.5 py-0.5 bg-[#00183F]/10 border border-[#00183F]/20 text-[#00183F]/50 tracking-wide">
                        {i === 0 ? (lang === "pt" ? "J1" : "L1") : (lang === "pt" ? "J2" : "L2")} {t2g}–{t1g}
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Penalties Section */}
          {isTie && (
            <div className="bg-white border-t-4 border-[#00183F] px-6 pt-6 pb-6 text-[#00183F]">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-[2px] bg-[#00183F]/10" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em] px-2">
                  {lang === "pt" ? "Disputa de Pênaltis" : "Penalty Shootout"}
                </span>
                <div className="flex-1 h-[2px] bg-[#00183F]/10" />
              </div>

              <div className="flex items-center justify-center gap-8 sm:gap-14 mb-6">
                <span className={`text-4xl sm:text-5xl font-black tracking-tighter ${
                  isNeutral ? (team1Won ? "text-[#00183F]" : "text-[#00183F]/40") : (roundData.userAdvanced ? "text-emerald-600" : "text-[#00183F]/40")
                }`}>{userPenScore}</span>
                <span className="text-[#00183F]/40 font-black text-2xl">—</span>
                <span className={`text-4xl sm:text-5xl font-black tracking-tighter ${
                  isNeutral ? (!team1Won ? "text-[#00183F]" : "text-[#00183F]/40") : (!roundData.userAdvanced ? "text-rose-600" : "text-[#00183F]/40")
                }`}>{oppPenScore}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                {/* Team 1 Penalties */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 border-[#00183F]/20 truncate">
                    {displayTeam1}
                  </span>
                  {userPenalties.map((pen, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 bg-[#D9D9D9] border-2 border-[#00183F]/20"
                    >
                      <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${pen.scored ? "text-emerald-600" : "text-rose-500"}`}>
                        {pen.scored ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                      </div>
                      <span className={`text-xs font-black uppercase truncate ${pen.missed ? "opacity-40 line-through" : ""}`}>
                        {pen.name}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Team 2 Penalties */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 border-[#00183F]/20 truncate">
                    {displayTeam2}
                  </span>
                  {oppPenalties.map((pen, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 bg-[#D9D9D9] border-2 border-[#00183F]/20"
                    >
                      <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${pen.scored ? "text-emerald-600" : "text-rose-500"}`}>
                        {pen.scored ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                      </div>
                      <span className={`text-xs font-black uppercase truncate ${pen.missed ? "opacity-40 line-through" : ""}`}>
                        {pen.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {penaltiesFullyRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 px-4 py-3 text-center border-4 border-[#00183F] bg-[#00183F] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[3px_3px_0_0_rgba(0,0,0,0.5)]"
                >
                  {lang === "pt" ? "Vencedor nos Pênaltis:" : "Shootout Winner:"}{" "}
                  <span className={`ml-1 ${isNeutral ? "text-sky-300" : roundData.userAdvanced ? "text-emerald-400" : "text-rose-400"}`}>
                    {roundData.winner}
                  </span>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}

    </motion.div>
  );
}