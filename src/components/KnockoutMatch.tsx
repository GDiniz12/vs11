"use client";

import React from "react";
import { motion } from "framer-motion";
import { KnockoutRound } from "@/types";
import MatchResultCard from "./MatchResultCard";
import { useLanguage } from "@/context/LanguageContext";
import { clubLogos } from "@/data/data";

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
  formatted = formatted.replace(/-\d{4}$/, "");
  return clubLogos[formatted] || "";
};

export default function KnockoutMatch({ roundData, userTeamName, tick, startTick }: KnockoutMatchProps) {
  const { lang } = useLanguage();
  
  const showHeader = tick >= startTick; 
  const showLeg1 = tick >= startTick; 
  const showLeg2 = roundData.leg2 && tick >= startTick + 1; 
  const showAgg = roundData.leg2 ? tick >= startTick + 2 : tick >= startTick + 1; 

  if (!showHeader) return null;

  const isHomeLeg1 = roundData.leg1.homeTeam === userTeamName;
  const userGoals1 = isHomeLeg1 ? roundData.leg1.homeGoals : roundData.leg1.awayGoals;
  const oppGoals1 = isHomeLeg1 ? roundData.leg1.awayGoals : roundData.leg1.homeGoals;

  let userTotal = userGoals1;
  let oppTotal = oppGoals1;

  if (roundData.leg2) {
    const isHomeLeg2 = roundData.leg2.homeTeam === userTeamName;
    userTotal += isHomeLeg2 ? roundData.leg2.homeGoals : roundData.leg2.awayGoals;
    oppTotal += isHomeLeg2 ? roundData.leg2.awayGoals : roundData.leg2.homeGoals;
  }

  const isTie = userTotal === oppTotal;

  const userLogo = getLogoUrl(userTeamName);
  const oppLogo = getLogoUrl(roundData.userOpponent);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#1E293B] border-4 border-white p-4 md:p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.6)] mb-8"
    >
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b-4 border-white/20 gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-amber-400 uppercase tracking-widest drop-shadow-[2px_2px_0_#00183F]">
          {roundData.round}
        </h2>
        
        {showAgg && (
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={`px-4 py-1.5 border-2 border-white font-black uppercase tracking-widest text-xs md:text-sm shadow-[3px_3px_0_0_#00183F] ${roundData.userAdvanced ? "bg-emerald-500 text-white" : "bg-rose-600 text-white"}`}
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
          className="bg-white text-[#00183F] border-4 border-[#00183F] p-4 md:p-6 text-center shadow-[4px_4px_0_0_#00183F]"
        >
          <span className="block text-xs font-black uppercase text-gray-500 tracking-widest mb-4">
            {lang === "pt" ? "Placar Agregado / Final" : "Aggregate / Final Score"}
          </span>
          
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {/* Logo e Placar do Usuário */}
            <div className="flex items-center gap-3">
              {userLogo && (
                <img src={userLogo} alt={userTeamName} className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)] hidden sm:block" />
              )}
              <span className={`text-4xl md:text-5xl font-black ${roundData.userAdvanced ? "text-emerald-600" : "text-[#00183F]"}`}>
                {userTotal}
              </span>
            </div>

            <span className="text-gray-400 font-black text-2xl md:text-3xl">X</span>
            
            {/* Logo e Placar do Adversário */}
            <div className="flex items-center gap-3">
              <span className={`text-4xl md:text-5xl font-black ${!roundData.userAdvanced ? "text-rose-600" : "text-[#00183F]"}`}>
                {oppTotal}
              </span>
              {oppLogo && (
                <img src={oppLogo} alt={roundData.userOpponent} className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)] hidden sm:block" />
              )}
            </div>
          </div>
          
          {isTie && (
            <div className="mt-6 pt-3 border-t-4 border-dashed border-[#00183F]/20 text-sm md:text-base font-black text-amber-600 uppercase tracking-widest bg-[#D9D9D9]/30 p-2 border-2 border-amber-600 inline-block">
              {lang === "pt" ? "Vencedor no Desempate:" : "Tiebreaker Winner:"}{" "}
              <span className="text-[#00183F] ml-2">{roundData.userAdvanced ? userTeamName : roundData.userOpponent}</span>
            </div>
          )}
        </motion.div>
      )}

    </motion.div>
  );
}