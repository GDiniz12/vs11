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

const getOpponentPlayers = (teamName: string) => {
  const allTeams = { ...americans, ...europeans };
  
  const exactKey = teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
  
  if (allTeams[exactKey]) {
    return allTeams[exactKey].map((p: any) => p[0] as string);
  }

  const baseName = exactKey.replace(/-\d{4}$/, "");
  const fallbackKey = Object.keys(allTeams).find((k) => k.startsWith(baseName));
  if (fallbackKey) {
    return allTeams[fallbackKey].map((p: any) => p[0] as string);
  }
  
  return ["Jogador 1", "Jogador 2", "Jogador 3", "Jogador 4", "Jogador 5"];
};

export default function KnockoutMatch({ roundData, userTeamName, tick, startTick }: KnockoutMatchProps) {
  const { lang } = useLanguage();
  const { slots } = useGame();
  
  const showHeader = tick >= startTick; 
  const showLeg1 = tick >= startTick; 
  const showLeg2 = roundData.leg2 && tick >= startTick + 1; 
  const showAgg = roundData.leg2 ? tick >= startTick + 2 : tick >= startTick + 1; 

  const { isTie, userTotal, oppTotal, userPenalties, oppPenalties, userPenScore, oppPenScore } = useMemo(() => {
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

    let userPens: {name: string, scored: boolean}[] = [];
    let oppPens: {name: string, scored: boolean}[] = [];
    let uPenScore = 0;
    let oPenScore = 0;

    if (tie) {
      const seedString = `${userTeamName}-${roundData.userOpponent}-${roundData.round}-penalties`;
      let seed = 0;
      for (let i = 0; i < seedString.length; i++) {
        seed = seedString.charCodeAt(i) + ((seed << 5) - seed);
      }
      
      const random = () => {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      const shuffle = (array: any[]) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
          randomIndex = Math.floor(random() * currentIndex);
          currentIndex--;
          [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
      };

      const userAdv = roundData.userAdvanced;
      const scores = userAdv ? [[5,4], [5,3], [4,3], [4,2], [3,2]] : [[4,5], [3,5], [3,4], [2,4], [2,3]];
      const chosenScore = scores[Math.floor(random() * scores.length)];
      uPenScore = chosenScore[0];
      oPenScore = chosenScore[1];

      let uPlayers = slots && slots.length > 0 ? slots.filter(s => s.player).map(s => s.player!.name) : [];
      if (uPlayers.length < 5) uPlayers = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Atacante"]; 
      
      let oPlayers = getOpponentPlayers(roundData.userOpponent);
      
      uPlayers = shuffle([...uPlayers]).slice(0, 5);
      oPlayers = shuffle([...oPlayers]).slice(0, 5);

      const createSeq = (goals: number) => {
        let seq = Array(5).fill(false);
        for(let i=0; i<goals; i++) seq[i] = true;
        return shuffle(seq);
      };

      const uSeq = createSeq(uPenScore);
      const oSeq = createSeq(oPenScore);

      userPens = uPlayers.map((name, i) => ({ name, scored: uSeq[i] }));
      oppPens = oPlayers.map((name, i) => ({ name, scored: oSeq[i] }));
    }

    return { 
      isTie: tie, 
      userTotal: uTotal, 
      oppTotal: oTotal,
      userPenalties: userPens,
      oppPenalties: oppPens,
      userPenScore: uPenScore,
      oppPenScore: oPenScore
    };
  }, [roundData, userTeamName, slots]);

  if (!showHeader) return null;

  const userLogo = getLogoUrl(userTeamName);
  const oppLogo = getLogoUrl(roundData.userOpponent);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#1E293B] border-4 border-white p-3 sm:p-4 md:p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.6)] mb-8"
    >
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b-4 border-white/20 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400 uppercase tracking-widest drop-shadow-[2px_2px_0_#00183F]">
          {roundData.round}
        </h2>
        
        {showAgg && (
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={`px-3 py-1.5 border-2 border-white font-black uppercase tracking-widest text-[10px] md:text-sm shadow-[3px_3px_0_0_#00183F] ${roundData.userAdvanced ? "bg-emerald-500 text-white" : "bg-rose-600 text-white"}`}
          >
            {roundData.userAdvanced ? (lang === "pt" ? "Avançou" : "Advanced") : (lang === "pt" ? "Eliminado" : "Eliminated")}
          </motion.div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        {showLeg1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MatchResultCard 
              match={roundData.leg1} 
              userTeamName={userTeamName} 
              stage={lang === "pt" ? (roundData.leg2 ? "Jogo de Ida" : "Jogo Único") : (roundData.leg2 ? "1st Leg" : "Single Match")} 
            />
          </motion.div>
        )}
        
        {showLeg2 && roundData.leg2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MatchResultCard 
              match={roundData.leg2} 
              userTeamName={userTeamName} 
              stage={lang === "pt" ? "Jogo de Volta" : "2nd Leg"} 
            />
          </motion.div>
        )}
      </div>

      {showAgg && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white text-[#00183F] border-4 border-[#00183F] p-4 md:p-8 text-center shadow-[4px_4px_0_0_#00183F]"
        >
          <span className="block text-[10px] md:text-xs font-black uppercase text-gray-500 tracking-widest mb-4">
            {lang === "pt" ? "Placar Agregado" : "Aggregate Score"}
          </span>
          
          <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-8 flex-nowrap">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              {userLogo && (
                <img src={userLogo} alt={userTeamName} className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 object-contain flex-shrink-0 drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" />
              )}
              <span className={`text-3xl sm:text-4xl md:text-5xl font-black ${roundData.userAdvanced && !isTie ? "text-emerald-600" : "text-[#00183F]"}`}>
                {userTotal}
              </span>
            </div>

            <span className="text-gray-400 font-black text-xl sm:text-2xl md:text-3xl flex-shrink-0">X</span>
            
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <span className={`text-3xl sm:text-4xl md:text-5xl font-black ${!roundData.userAdvanced && !isTie ? "text-rose-600" : "text-[#00183F]"}`}>
                {oppTotal}
              </span>
              {oppLogo && (
                <img src={oppLogo} alt={roundData.userOpponent} className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 object-contain flex-shrink-0 drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" />
              )}
            </div>
          </div>
          
          {isTie && (
            <div className="mt-8 pt-8 border-t-4 border-dashed border-[#00183F]/20">
              <h4 className="text-lg md:text-2xl font-black uppercase tracking-widest text-[#00183F] mb-6 text-center">
                {lang === "pt" ? "Decisão nos Pênaltis" : "Penalty Shootout"}
              </h4>
              
              <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8 bg-[#D9D9D9] py-3 sm:py-4 border-y-4 border-[#00183F]">
                 <span className={`text-3xl sm:text-4xl md:text-5xl font-black ${roundData.userAdvanced ? "text-emerald-600" : "text-[#00183F]"}`}>{userPenScore}</span>
                 <span className="text-gray-500 font-black text-lg sm:text-xl md:text-2xl">X</span>
                 <span className={`text-3xl sm:text-4xl md:text-5xl font-black ${!roundData.userAdvanced ? "text-rose-600" : "text-[#00183F]"}`}>{oppPenScore}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-4 text-[10px] md:text-sm font-bold uppercase tracking-wide">
                
                <div className="flex-1 flex flex-col items-start gap-2 sm:gap-3 min-w-0">
                  <span className="text-[#0033A0] font-black border-b-2 border-[#0033A0] pb-1 mb-1 truncate w-full text-left">
                    {userTeamName}
                  </span>
                  {userPenalties.map((pen, i) => (
                    <div key={i} className="flex items-center gap-1.5 sm:gap-2 w-full">
                      <span className="text-xs sm:text-sm md:text-base flex-shrink-0">
                        {pen.scored ? "✅" : "❌"}
                      </span>
                      <span className={`truncate ${pen.scored ? "text-[#00183F]" : "text-gray-400 line-through"}`}>
                        {pen.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex flex-col items-start sm:items-end gap-2 sm:gap-3 min-w-0">
                  <span className="text-rose-700 font-black border-b-2 border-rose-700 pb-1 mb-1 truncate w-full text-left sm:text-right">
                    {roundData.userOpponent}
                  </span>
                  {oppPenalties.map((pen, i) => (
                    <div key={i} className="flex items-center gap-1.5 sm:gap-2 sm:flex-row-reverse w-full">
                      <span className="text-xs sm:text-sm md:text-base flex-shrink-0">
                        {pen.scored ? "✅" : "❌"}
                      </span>
                      <span className={`truncate sm:text-right ${pen.scored ? "text-[#00183F]" : "text-gray-400 line-through"}`}>
                        {pen.name}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
              
              <div className="mt-8 bg-[#00183F] p-3 text-center font-black text-white uppercase tracking-widest border-2 border-white shadow-[4px_4px_0_0_#D9D9D9] text-[10px] sm:text-xs md:text-sm">
                {lang === "pt" ? "Vencedor nos Pênaltis:" : "Shootout Winner:"} <span className={roundData.userAdvanced ? "text-emerald-400" : "text-rose-400"}>{roundData.userAdvanced ? userTeamName : roundData.userOpponent}</span>
              </div>
            </div>
          )}

        </motion.div>
      )}

    </motion.div>
  );
}