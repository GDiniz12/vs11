"use client";

import React, { useMemo } from "react";
import { MatchResult } from "@/types";
import { clubLogos, americans, europeans } from "@/data/data";
import { useGame } from "@/context/GameContext";

interface MatchResultCardProps {
  match: MatchResult;
  userTeamName: string;
  index?: number;
  stage?: string;
  currentMinute?: number;
}

const getLogoUrl = (teamName: string) => {
  if (!teamName) return "";
  let formatted = teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
  formatted = formatted.replace(/-\d{4}$/, ""); // Para o logo, nós removemos o ano
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
  
  return ["Atacante", "Meia", "Zagueiro", "Ponta", "Volante"];
};

export default function MatchResultCard({ match, userTeamName, index, stage, currentMinute }: MatchResultCardProps) {
  const { slots } = useGame(); 

  const isHome = match.homeTeam === userTeamName;
  const opponentName = isHome ? match.awayTeam : match.homeTeam;

  const userLogo = getLogoUrl(userTeamName);
  const oppLogo = getLogoUrl(opponentName);

  const { userScorers, oppScorers, currentHomeGoals, currentAwayGoals } = useMemo(() => {
    const uScorers: { name: string; minute?: number; isPenalty?: boolean; missed?: boolean }[] = [];
    const oScorers: { name: string; minute?: number; isPenalty?: boolean; missed?: boolean }[] = [];

    let hGoals = 0;
    let aGoals = 0;

    if (match.events) {
      match.events.forEach(e => {
        if (currentMinute !== undefined && e.minute > currentMinute) return;
        
        if (e.team === "home") hGoals++;
        else aGoals++;

        if (e.team === "home") {
          if (isHome) uScorers.push({ name: e.player, minute: e.minute });
          else oScorers.push({ name: e.player, minute: e.minute });
        } else {
          if (isHome) oScorers.push({ name: e.player, minute: e.minute });
          else uScorers.push({ name: e.player, minute: e.minute });
        }
      });
    } else {
      // Fallback se não tiver events
      hGoals = match.homeGoals;
      aGoals = match.awayGoals;
    }

    if (match.penaltyEvents) {
      match.penaltyEvents.forEach(e => {
        if (currentMinute !== undefined && e.minute > currentMinute) return;

        const isMiss = e.type === "penalty_miss";
        if (e.team === "home") {
          if (isHome) uScorers.push({ name: e.player, isPenalty: true, missed: isMiss });
          else oScorers.push({ name: e.player, isPenalty: true, missed: isMiss });
        } else {
          if (isHome) oScorers.push({ name: e.player, isPenalty: true, missed: isMiss });
          else uScorers.push({ name: e.player, isPenalty: true, missed: isMiss });
        }
      });
    }

    return { userScorers: uScorers, oppScorers: oScorers, currentHomeGoals: hGoals, currentAwayGoals: aGoals };
  }, [match, isHome, currentMinute]);

  const userGoals = currentMinute !== undefined && match.events ? (isHome ? currentHomeGoals : currentAwayGoals) : (isHome ? match.homeGoals : match.awayGoals);
  const oppGoals = currentMinute !== undefined && match.events ? (isHome ? currentAwayGoals : currentHomeGoals) : (isHome ? match.awayGoals : match.homeGoals);

  const isUserWinner = userGoals > oppGoals;
  const isDraw = userGoals === oppGoals;

  return (
    <div className="p-0 overflow-hidden bg-white text-[#00183F] border-4 border-[#00183F] shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] flex flex-col mb-4 transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_rgba(0,0,0,0.9)] relative">
      
      {currentMinute !== undefined && currentMinute <= 90 && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 z-10">
          <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${(currentMinute / 90) * 100}%` }} />
        </div>
      )}

      {stage && (
        <div className="bg-[#00183F] text-white text-[10px] md:text-xs font-black uppercase px-4 py-1.5 tracking-widest border-b-4 border-[#00183F] flex justify-between items-center mt-[1px]">
          <span>{stage}</span>
          {currentMinute !== undefined && currentMinute <= 90 && (
            <span className="text-amber-400 font-mono text-sm animate-pulse">{currentMinute}'</span>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch">
        <div className={`w-full sm:w-4 min-h-[8px] sm:min-h-full ${isUserWinner ? "bg-emerald-500" : isDraw ? "bg-amber-400" : "bg-rose-500"} border-b-4 sm:border-b-0 sm:border-r-4 border-[#00183F]`} />

        <div className="flex-1 p-3 md:p-4 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
            
            {/* Seu Time */}
            <div className="flex-1 flex items-center justify-start gap-1.5 sm:gap-2 md:gap-3 min-w-0">
              {userLogo && (
                <img src={userLogo} alt={userTeamName} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain flex-shrink-0 drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" />
              )}
              <div className="text-left min-w-0">
                <h3 className="text-xs sm:text-sm md:text-xl font-black uppercase tracking-tight text-[#0033A0] truncate">
                  {userTeamName}
                </h3>
                <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase">{isHome ? "Mandante" : "Visitante"}</span>
              </div>
            </div>

            {/* Placar Brutal */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#D9D9D9] border-2 border-[#00183F] px-2 sm:px-4 py-1.5 sm:py-2 shadow-[3px_3px_0_0_rgba(0,0,0,0.2)]">
                <span className="text-lg sm:text-xl md:text-3xl font-black">{userGoals}</span>
                <span className="text-xs sm:text-sm md:text-lg font-black text-gray-400">X</span>
                <span className="text-lg sm:text-xl md:text-3xl font-black">{oppGoals}</span>
              </div>
              {match.isPenalties && (
                <div className="text-[10px] md:text-xs font-black uppercase mt-1 bg-[#00183F] text-white px-2 py-0.5">
                  PEN: {isHome ? match.homePenalties : match.awayPenalties} - {isHome ? match.awayPenalties : match.homePenalties}
                </div>
              )}
            </div>

            {/* Adversário */}
            <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2 md:gap-3 min-w-0">
              <div className="text-right min-w-0">
                <h3 className="text-xs sm:text-sm md:text-xl font-black uppercase tracking-tight text-rose-700 truncate">
                  {opponentName}
                </h3>
                <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase">{isHome ? "Visitante" : "Mandante"}</span>
              </div>
              {oppLogo && (
                <img src={oppLogo} alt={opponentName} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain flex-shrink-0 drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" />
              )}
            </div>

          </div>

          {/* Área dos Artilheiros */}
          {(userScorers.length > 0 || oppScorers.length > 0) && (
            <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t-2 border-dashed border-[#00183F]/20 flex justify-between gap-4 text-[9px] md:text-xs font-black uppercase tracking-wider">
              
              <div className="flex-1 flex flex-col items-start gap-1">
                {userScorers.map((scorer, i) => (
                  <div key={`user-scorer-${i}`} className={`flex items-center gap-1.5 ${scorer.missed ? 'text-gray-400 opacity-50' : 'text-[#0033A0]'}`}>
                    <span className="text-[8px] md:text-[10px] drop-shadow-sm flex-shrink-0">{scorer.missed ? '❌' : '⚽'}</span>
                    <span className="truncate">{scorer.name} {scorer.minute ? `(${scorer.minute}')` : ''}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 flex flex-col items-end gap-1">
                {oppScorers.map((scorer, i) => (
                  <div key={`opp-scorer-${i}`} className={`flex items-center justify-end gap-1.5 ${scorer.missed ? 'text-gray-400 opacity-50' : 'text-rose-700'}`}>
                    <span className="truncate">{scorer.name} {scorer.minute ? `(${scorer.minute}')` : ''}</span>
                    <span className="text-[8px] md:text-[10px] drop-shadow-sm flex-shrink-0">{scorer.missed ? '❌' : '⚽'}</span>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}