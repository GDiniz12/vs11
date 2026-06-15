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
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white text-[#00183F] border-4 border-[#00183F] p-4 md:p-8 text-center shadow-[4px_4px_0_0_#00183F]"
        >
          <span className="block text-[10px] md:text-xs font-black uppercase text-gray-500 tracking-widest mb-4">
            {lang === "pt" ? "Placar Agregado" : "Aggregate Score"}
          </span>
          
          <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-8 flex-nowrap">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              {userLogo && (
                <img src={userLogo} alt={displayTeam1} className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 object-contain flex-shrink-0 drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" />
              )}
              <span className={`text-3xl sm:text-4xl md:text-5xl font-black ${isNeutral ? (team1Won && !isTie ? "text-sky-600" : "text-[#00183F]") : (roundData.userAdvanced && !isTie ? "text-emerald-600" : "text-[#00183F]")}`}>
                {userTotal}
              </span>
            </div>

            <span className="text-gray-400 font-black text-xl sm:text-2xl md:text-3xl flex-shrink-0">X</span>
            
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <span className={`text-3xl sm:text-4xl md:text-5xl font-black ${isNeutral ? (!team1Won && !isTie ? "text-sky-600" : "text-[#00183F]") : (!roundData.userAdvanced && !isTie ? "text-rose-600" : "text-[#00183F]")}`}>
                {oppTotal}
              </span>
              {oppLogo && (
                <img src={oppLogo} alt={displayTeam2} className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 object-contain flex-shrink-0 drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" />
              )}
            </div>
          </div>
          
          {isTie && (
            <div className="mt-8 pt-8 border-t-4 border-dashed border-[#00183F]/20">
              <h4 className="text-lg md:text-2xl font-black uppercase tracking-widest text-[#00183F] mb-6 text-center">
                {lang === "pt" ? "Decisão nos Pênaltis" : "Penalty Shootout"}
              </h4>
              
              <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8 bg-[#D9D9D9] py-3 sm:py-4 border-y-4 border-[#00183F]">
                 <span className={`text-3xl sm:text-4xl md:text-5xl font-black ${isNeutral ? (team1Won ? "text-sky-600" : "text-[#00183F]") : (roundData.userAdvanced ? "text-emerald-600" : "text-[#00183F]")}`}>{userPenScore}</span>
                 <span className="text-gray-500 font-black text-lg sm:text-xl md:text-2xl">X</span>
                 <span className={`text-3xl sm:text-4xl md:text-5xl font-black ${isNeutral ? (!team1Won ? "text-sky-600" : "text-[#00183F]") : (!roundData.userAdvanced ? "text-rose-600" : "text-[#00183F]")}`}>{oppPenScore}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-4 text-[10px] md:text-sm font-bold uppercase tracking-wide">
                
                <div className="flex-1 flex flex-col items-start gap-2 sm:gap-3 min-w-0">
                  <span className={`font-black border-b-2 pb-1 mb-1 truncate w-full text-left ${isNeutral ? "text-[#00183F] border-[#00183F]" : "text-[#0033A0] border-[#0033A0]"}`}>
                    {displayTeam1}
                  </span>
                  {userPenalties.map((pen, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 sm:gap-2 w-full"
                    >
                      <span className="text-xs sm:text-sm md:text-base flex-shrink-0">
                        {pen.scored ? "✅" : "❌"}
                      </span>
                      <span className={`truncate ${pen.scored ? "text-[#00183F]" : "text-gray-400 line-through"}`}>
                        {pen.name}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex-1 flex flex-col items-start sm:items-end gap-2 sm:gap-3 min-w-0">
                  <span className={`font-black border-b-2 pb-1 mb-1 truncate w-full text-left sm:text-right ${isNeutral ? "text-[#00183F] border-[#00183F]" : "text-rose-700 border-rose-700"}`}>
                    {displayTeam2}
                  </span>
                  {oppPenalties.map((pen, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 sm:gap-2 sm:flex-row-reverse w-full"
                    >
                      <span className="text-xs sm:text-sm md:text-base flex-shrink-0">
                        {pen.scored ? "✅" : "❌"}
                      </span>
                      <span className={`truncate sm:text-right ${pen.scored ? "text-[#00183F]" : "text-gray-400 line-through"}`}>
                        {pen.name}
                      </span>
                    </motion.div>
                  ))}
                </div>

              </div>
              
              {penaltiesFullyRevealed && (
                <div className="mt-8 bg-[#00183F] p-3 text-center font-black text-white uppercase tracking-widest border-2 border-white shadow-[4px_4px_0_0_#D9D9D9] text-[10px] sm:text-xs md:text-sm">
                  {lang === "pt" ? "Vencedor nos Pênaltis:" : "Shootout Winner:"} <span className={isNeutral ? "text-sky-400" : roundData.userAdvanced ? "text-emerald-400" : "text-rose-400"}>{roundData.winner}</span>
                </div>
              )}
            </div>
          )}

        </motion.div>
      )}

    </motion.div>
  );
}