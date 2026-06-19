"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSocket } from "@/context/SocketContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FootballPitch from "@/components/FootballPitch";
import TournamentBracket from "@/components/TournamentBracket";
import { calculateTeamChemistry } from "@/utils/helpers";

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export default function ResultPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { socket, currentRoom, setCurrentRoom, clearSession } = useSocket();
  const { user, token } = useAuth();
  const ratingSubmitted = useRef(false);

  const {
    slots, userTeamName, phase,
    knockoutRounds, stats, isChampion,
    isRanked,
    clearSave, formation, manager
  } = useGame();

  const isOnline = !!currentRoom;

  useEffect(() => {
    if (!isRanked || !user || !token || ratingSubmitted.current) return;

    const multiplier = isOnline ? 2 : 1;
    const delta =
      stats.wins * 30 * multiplier +
      stats.losses * -15 * multiplier +
      stats.draws * 5 * multiplier +
      (isChampion ? 100 * multiplier : 0);

    if (delta === 0) return;
    ratingSubmitted.current = true;

    fetch(`${API_URL}/api/auth/rating`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ delta }),
    }).catch(() => {});
  }, [isRanked, user, token, stats, isChampion, isOnline]);

  const handleBackToHome = () => {
    // Limpa a sala online (se houver) para não poluir o modo offline
    clearSession();
    if (currentRoom) {
      socket?.emit("leaveRoom", currentRoom.id);
      setCurrentRoom(null);
    }
    clearSave();
    router.push("/");
  };

  const hasTeam = slots && slots.length > 0 && slots.some((s) => s.player);

  const t = {
    pt: {
      title: "SUPER MUNDIAL DE CLUBES",
      subtitle: "Relatório de Desempenho Final",
      squadError: "Nenhum elenco selecionado.",
      backBtn: "Montar Novo Time",
      winLossLabel: "VITÓRIAS - DERROTAS",
      goalsScored: "Gols Pró",
      goalsConceded: "Gols Sofridos",
      draws: "Empates",
      totalMatches: "Partidas Jogadas",
      teamTitle: "Elenco Utilizado no Torneio",
      championBadge: "🏆 CAMPEÃO DO MUNDO!",
      eliminatedBadge: "CAMPANHA ENCERRADA",
    },
    en: {
      title: "SUPER CLUB WORLD CUP",
      subtitle: "Final Performance Report",
      squadError: "No squad selected.",
      backBtn: "Build New Squad",
      winLossLabel: "WINS - LOSSES",
      goalsScored: "Goals For",
      goalsConceded: "Goals Against",
      draws: "Draws",
      totalMatches: "Matches Played",
      teamTitle: "Squad Used in Tournament",
      championBadge: "🏆 WORLD CHAMPION!",
      eliminatedBadge: "CAMPAIGN CONCLUDED",
    },
  }[lang];

  if (!hasTeam) {
    return (
      <div className="min-h-screen bg-[#00183F] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="border-4 border-white bg-white p-8 text-center max-w-md shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]">
          <h2 className="text-2xl font-black text-[#00183F] uppercase mb-4">{t.squadError}</h2>
          <Button variant="primary" onClick={handleBackToHome}>{t.backBtn}</Button>
        </div>
      </div>
    );
  }

  const totalGames = stats.wins + stats.draws + stats.losses;
  const totalOvr = slots.reduce((sum, slot) => sum + (slot.player ? slot.player.overall : 0), 0);
  const teamOvr = Math.round(totalOvr / 11) || 0;
  const teamChemistry = calculateTeamChemistry(slots, formation, manager) || 0;

  return (
    <div className="min-h-screen bg-[#00183F] p-4 md:p-12 font-sans text-white">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        
        {/* Cabeçalho */}
        <div className="border-4 border-white bg-[#D9D9D9] p-6 shadow-[8px_8px_0_0_#0033A0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#00183F]">
              {t.title}
            </h1>
            <p className="text-[#0033A0] font-black uppercase tracking-widest text-xs mt-1 border-l-4 border-[#0033A0] pl-2">
              {t.subtitle}
            </p>
          </div>
          <Button variant="secondary" onClick={handleBackToHome}>
            {t.backBtn}
          </Button>
        </div>

        {/* Status Final da Campanha */}
        <div className={`border-4 border-white text-center py-4 font-black uppercase text-xl md:text-2xl tracking-widest shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] ${isChampion ? "bg-amber-400 text-[#00183F]" : "bg-rose-600 text-white"}`}>
          {isChampion ? t.championBadge : t.eliminatedBadge}
        </div>

        {/* CARD PRINCIPAL: VITÓRIAS - DERROTAS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <Card className="p-8 border-4 border-[#00183F] bg-white text-[#00183F] shadow-[12px_12px_0_0_#0033A0] text-center">
            <span className="block text-xs md:text-sm font-black uppercase text-gray-500 tracking-widest mb-1">
              {t.winLossLabel}
            </span>
            
            {/* Placar Principal Massivo */}
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-[#00183F] my-4 drop-shadow-[4px_4px_0_#D9D9D9]">
              {stats.wins}-{stats.losses}
            </h2>

            {/* Sub-estatísticas Inferiores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t-4 border-dashed border-[#00183F]/20">
              <div className="bg-[#D9D9D9]/40 border-2 border-[#00183F] p-3 text-center">
                <span className="block text-[10px] font-black uppercase text-gray-400 mb-0.5">{t.draws}</span>
                <span className="text-xl font-black">{stats.draws}</span>
              </div>
              <div className="bg-[#D9D9D9]/40 border-2 border-[#00183F] p-3 text-center">
                <span className="block text-[10px] font-black uppercase text-gray-400 mb-0.5">{t.totalMatches}</span>
                <span className="text-xl font-black">{totalGames}</span>
              </div>
              <div className="bg-emerald-50 border-2 border-[#00183F] p-3 text-center">
                <span className="block text-[10px] font-black uppercase text-emerald-700 mb-0.5">{t.goalsScored}</span>
                <span className="text-xl font-black text-emerald-600">{stats.goalsScored}</span>
              </div>
              <div className="bg-rose-50 border-2 border-[#00183F] p-3 text-center">
                <span className="block text-[10px] font-black uppercase text-rose-700 mb-0.5">{t.goalsConceded}</span>
                <span className="text-xl font-black text-rose-600">{stats.goalsConceded}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CARD DO TIME: Exibição estruturada do campo tático */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring" }}
        >
          <Card className="p-6 border-4 border-[#00183F] bg-white shadow-[12px_12px_0_0_#0033A0]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b-4 border-[#00183F] pb-4">
              <h2 className="text-xl md:text-2xl font-black uppercase text-[#00183F] tracking-wider border-l-8 border-[#0033A0] pl-4">
                {t.teamTitle} ({userTeamName})
              </h2>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <span className="bg-[#0033A0] text-white px-3 py-1 font-black text-sm border-2 border-[#00183F] shadow-[2px_2px_0_0_#00183F]">
                  OVR: {teamOvr}
                </span>
                <span className="bg-emerald-600 text-white px-3 py-1 font-black text-sm border-2 border-[#00183F] shadow-[2px_2px_0_0_#00183F]">
                  ENT: {teamChemistry}
                </span>
              </div>
            </div>
            
            <div className="bg-[#1E293B] p-4 border-4 border-[#00183F]">
              <FootballPitch slots={slots} manager={manager} />
            </div>
          </Card>
        </motion.div>

      </div>

      {currentRoom?.mode === 'guerra' && knockoutRounds && knockoutRounds.length > 0 && (
         <div className="w-full mt-12 max-w-6xl mx-auto">
            <TournamentBracket rounds={knockoutRounds} />
         </div>
      )}
    </div>
  );
}