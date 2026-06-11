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

// Pega a lista de jogadores de um time adversário para simular quem fez os gols contra você
const getOpponentPlayers = (teamName: string) => {
  const allTeams = { ...americans, ...europeans };
  let formatted = teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
  formatted = formatted.replace(/-\d{4}$/, "");
  
  const teamKey = Object.keys(allTeams).find((k) => k.startsWith(formatted));
  if (teamKey) {
    return allTeams[teamKey].map((p: any) => p[0] as string);
  }
  return ["Atacante", "Meia", "Zagueiro", "Ponta", "Volante"];
};

export default function MatchResultCard({ match, userTeamName, index, stage }: MatchResultCardProps) {
  // Puxando o seu elenco montado diretamente do Contexto!
  const { slots } = useGame(); 

  const isHome = match.homeTeam === userTeamName;
  const userGoals = isHome ? match.homeGoals : match.awayGoals;
  const oppGoals = isHome ? match.awayGoals : match.homeGoals;
  const opponentName = isHome ? match.awayTeam : match.homeTeam;

  const isUserWinner = userGoals > oppGoals;
  const isDraw = userGoals === oppGoals;

  const userLogo = getLogoUrl(userTeamName);
  const oppLogo = getLogoUrl(opponentName);

  // === GERADOR DETERMINÍSTICO DE ARTILHEIROS ===
  // Garante que os autores dos gols nunca mudem sozinhos ao trocar de tela
  const { userScorers, oppScorers } = useMemo(() => {
    // Cria uma semente única para cada jogo
    const seedString = `${match.homeTeam}-${match.awayTeam}-${match.homeGoals}-${match.awayGoals}-${stage || "group"}`;
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
      seed = seedString.charCodeAt(i) + ((seed << 5) - seed);
    }
    
    // Função matemática que imita random, mas é fixa para a semente
    const random = () => {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const generateForTeam = (teamName: string, goals: number) => {
      if (goals === 0) return [];
      let players: string[] = [];
      
      // Se for o seu time, pega APENAS os jogadores que você draftou!
      if (teamName === userTeamName && slots && slots.length > 0) {
        players = slots.filter((s) => s.player).map((s) => s.player!.name);
      } else {
        // Se for o adversário, busca o elenco original na base
        players = getOpponentPlayers(teamName);
      }

      const scorers: string[] = [];
      for (let i = 0; i < goals; i++) {
        // 70% de chance de o gol sair de um jogador do ataque/meio (final do array)
        const isAttacker = random() > 0.3; 
        let randIdx = 0;
        
        if (isAttacker && players.length > 5) {
          randIdx = Math.floor(random() * 5) + (players.length - 5);
        } else {
          randIdx = Math.floor(random() * players.length);
        }
        
        scorers.push(players[randIdx] || "Jogador Anônimo");
      }
      return scorers;
    };

    return {
      userScorers: generateForTeam(userTeamName, userGoals),
      oppScorers: generateForTeam(opponentName, oppGoals),
    };
  }, [match.homeTeam, match.awayTeam, match.homeGoals, match.awayGoals, userTeamName, slots, stage]);

  return (
    <div className="p-0 overflow-hidden bg-white text-[#00183F] border-4 border-[#00183F] shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] flex flex-col mb-4 transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_rgba(0,0,0,0.9)]">
      
      {stage && (
        <div className="bg-[#00183F] text-white text-xs font-black uppercase px-4 py-1.5 tracking-widest border-b-4 border-[#00183F]">
          {stage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch">
        <div className={`w-full sm:w-4 min-h-[12px] sm:min-h-full ${isUserWinner ? "bg-emerald-500" : isDraw ? "bg-amber-400" : "bg-rose-500"} border-b-4 sm:border-b-0 sm:border-r-4 border-[#00183F]`} />

        <div className="flex-1 p-4 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            
            {/* Seu Time */}
            <div className="flex-1 flex items-center justify-start gap-2 md:gap-3 min-w-[100px]">
              {userLogo && (
                <img src={userLogo} alt={userTeamName} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)] hidden sm:block" />
              )}
              <div className="text-left">
                <h3 className="text-sm md:text-xl font-black uppercase tracking-tight text-[#0033A0] truncate">
                  {userTeamName}
                </h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase">{isHome ? "Mandante" : "Visitante"}</span>
              </div>
            </div>

            {/* Placar Brutal */}
            <div className="flex items-center gap-2 bg-[#D9D9D9] border-2 border-[#00183F] px-4 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,0.2)]">
              <span className="text-xl md:text-3xl font-black">{userGoals}</span>
              <span className="text-sm md:text-lg font-black text-gray-400">X</span>
              <span className="text-xl md:text-3xl font-black">{oppGoals}</span>
            </div>

            {/* Adversário */}
            <div className="flex-1 flex items-center justify-end gap-2 md:gap-3 min-w-[100px]">
              <div className="text-right">
                <h3 className="text-sm md:text-xl font-black uppercase tracking-tight text-rose-700 truncate">
                  {opponentName}
                </h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase">{isHome ? "Visitante" : "Mandante"}</span>
              </div>
              {oppLogo && (
                <img src={oppLogo} alt={opponentName} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)] hidden sm:block" />
              )}
            </div>

          </div>

          {/* Área dos Artilheiros */}
          {(userScorers.length > 0 || oppScorers.length > 0) && (
            <div className="mt-4 pt-3 border-t-2 border-dashed border-[#00183F]/20 flex justify-between gap-4 text-[10px] md:text-xs font-black uppercase tracking-wider">
              
              {/* Artilheiros do Seu Time */}
              <div className="flex-1 flex flex-col items-start gap-1">
                {userScorers.map((scorer, i) => (
                  <div key={`user-scorer-${i}`} className="flex items-center gap-1.5 text-[#0033A0]">
                    <span className="text-[8px] md:text-[10px] drop-shadow-sm">⚽</span>
                    <span>{scorer}</span>
                  </div>
                ))}
              </div>

              {/* Artilheiros do Adversário */}
              <div className="flex-1 flex flex-col items-end gap-1">
                {oppScorers.map((scorer, i) => (
                  <div key={`opp-scorer-${i}`} className="flex items-center justify-end gap-1.5 text-rose-700">
                    <span>{scorer}</span>
                    <span className="text-[8px] md:text-[10px] drop-shadow-sm">⚽</span>
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