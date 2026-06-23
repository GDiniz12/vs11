"use client";

import React, { useEffect, useRef, useState } from "react";
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
import SupportModal, { shouldShowSupportModal, markSupportModalShown } from "@/components/SupportModal";
import { calculateTeamChemistry } from "@/utils/helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type RatingBreakdown = { winPts: number; drawPts: number; lossPts: number; base: number; delta: number };

function calcRating(
  stats: { wins: number; draws: number; losses: number },
  isOnline: boolean,
  difficulty: string,
  isHardcore: boolean,
  isChampion: boolean
): RatingBreakdown {
  let winPts: number, drawPts: number, lossPts: number;
  if (isOnline) {
    winPts = 100; drawPts = 30; lossPts = -50;
  } else if (difficulty === 'easy') {
    winPts = 15; drawPts = 3; lossPts = -7;
  } else if (difficulty === 'impossible') {
    winPts = 60; drawPts = 10; lossPts = -30;
  } else {
    winPts = 30; drawPts = 5; lossPts = -15;
  }
  const raw = stats.wins * winPts + stats.draws * drawPts + stats.losses * lossPts;
  const base = isHardcore ? Math.round(raw * 1.35) : raw;
  const delta = isChampion ? base * 2 : base;
  return { winPts, drawPts, lossPts, base, delta };
}

export default function ResultPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { socket, currentRoom, setCurrentRoom, clearSession } = useSocket();
  const { user, token, updateRating } = useAuth();
  const ratingSubmitted = useRef(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [ratingError, setRatingError] = useState(false);

  const {
    slots, userTeamName, phase,
    knockoutRounds, stats, isChampion, difficulty, gameMode,
    isRanked, tournamentMode, gameId,
    clearSave, formation, manager
  } = useGame();

  const isOnline = !!currentRoom;
  const isHardcore = gameMode === 'hardcore';

  useEffect(() => {
    if (!user || !token || !isRanked || !gameId || ratingSubmitted.current) return;
    const { delta } = calcRating(stats, isOnline, difficulty, isHardcore, isChampion);
    if (delta === 0) return;
    ratingSubmitted.current = true;

    // The server recomputes the delta from these facts and applies it at most
    // once per gameId — the client value is only used for the on-screen preview.
    fetch(`${API_URL}/api/auth/rating`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        gameId,
        wins: stats.wins, draws: stats.draws, losses: stats.losses,
        isOnline, difficulty, isHardcore, isChampion,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("rating save failed");
        return res.json();
      })
      .then((data) => { if (data.user) updateRating(data.user.rating); })
      .catch(() => { setRatingError(true); ratingSubmitted.current = false; });
  }, [user, token, isRanked, gameId, stats, isOnline, difficulty]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowSupportModal()) {
        markSupportModalShown();
        setShowSupportModal(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

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

  const tournamentTitles: Record<string, { pt: string; en: string }> = {
    "super-mundial": { pt: "SUPER MUNDIAL DE CLUBES", en: "SUPER CLUB WORLD CUP" },
    "copa-do-mundo": { pt: "COPA DO MUNDO", en: "WORLD CUP" },
    "brasileirao": { pt: "BRASILEIRÃO", en: "BRASILEIRÃO" },
    "louco": { pt: "MODO LOUCOS", en: "CRAZY MODE" },
  };
  const tournamentTitle = (tournamentTitles[tournamentMode] || tournamentTitles["super-mundial"])[lang];

  const t = {
    pt: {
      title: tournamentTitle,
      subtitle: "Relatório de Desempenho Final",
      squadError: "Nenhum elenco selecionado.",
      backBtn: "Montar Novo Time",
      winLossLabel: "VITÓRIAS - DERROTAS",
      goalsScored: "Gols Pró",
      goalsConceded: "Gols Sofridos",
      draws: "Empates",
      totalMatches: "Partidas Jogadas",
      teamTitle: "Elenco Utilizado no Torneio",
      championBadge: tournamentMode === 'brasileirao' ? "🏆 CAMPEÃO BRASILEIRO!" : "🏆 CAMPEÃO DO MUNDO!",
      eliminatedBadge: "CAMPANHA ENCERRADA",
      ratingTitle: "PONTUAÇÃO OBTIDA",
      ratingGained: "Pontos ganhos",
      ratingTotal: "Rating atual",
      wins: "Vitórias",
      losses: "Derrotas",
      ratingError: "Não foi possível salvar o resultado ranqueado. Verifique sua conexão.",
    },
    en: {
      title: tournamentTitle,
      subtitle: "Final Performance Report",
      squadError: "No squad selected.",
      backBtn: "Build New Squad",
      winLossLabel: "WINS - LOSSES",
      goalsScored: "Goals For",
      goalsConceded: "Goals Against",
      draws: "Draws",
      totalMatches: "Matches Played",
      teamTitle: "Squad Used in Tournament",
      championBadge: tournamentMode === 'brasileirao' ? "🏆 BRAZILIAN CHAMPION!" : "🏆 WORLD CHAMPION!",
      eliminatedBadge: "CAMPAIGN CONCLUDED",
      ratingTitle: "POINTS EARNED",
      ratingGained: "Points gained",
      ratingTotal: "Current rating",
      wins: "Wins",
      losses: "Losses",
      ratingError: "Couldn't save your ranked result. Please check your connection.",
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

  const { winPts, drawPts, lossPts, base: ratingBase, delta: ratingDelta } = calcRating(stats, isOnline, difficulty, isHardcore, isChampion);

  return (
    <div className="min-h-screen bg-[#00183F] p-4 md:p-12 font-sans text-white">
      {ratingError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-4 py-3 font-bold text-sm border-2 border-white shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] max-w-md text-center">
          {t.ratingError}
        </div>
      )}
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

        {/* CARD DE PONTUAÇÃO */}
        {user && isRanked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <div className={`border-4 border-[#00183F] shadow-[8px_8px_0_0_#00183F] ${ratingDelta >= 0 ? "bg-emerald-500" : "bg-rose-600"} text-white`}>
              {isChampion && (
                <div className="bg-amber-400 text-[#00183F] text-center py-1 font-black uppercase text-xs tracking-widest border-b-4 border-[#00183F]">
                  {lang === 'pt' ? '🏆 BÔNUS DE CAMPEÃO — PONTUAÇÃO DOBRADA!' : '🏆 CHAMPION BONUS — POINTS DOUBLED!'}
                </div>
              )}
              <div className="flex items-center justify-between px-6 py-4 gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.ratingTitle}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-5xl font-black tracking-tighter leading-none">
                      {ratingDelta >= 0 ? "+" : ""}{ratingDelta}
                    </p>
                    {isChampion && (
                      <span className="text-sm font-black opacity-70 line-through">{ratingBase >= 0 ? "+" : ""}{ratingBase}</span>
                    )}
                  </div>
                  <p className="text-xs font-bold opacity-70 mt-1">
                    {t.wins} ×{winPts >= 0 ? "+" : ""}{winPts} &nbsp;|&nbsp;
                    {t.draws} ×{drawPts >= 0 ? "+" : ""}{drawPts} &nbsp;|&nbsp;
                    {t.losses} ×{lossPts}
                    {isChampion && <span className="ml-2 font-black opacity-90">&nbsp;×2</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.ratingTotal}</p>
                  <p className="text-3xl font-black">{user.rating}</p>
                  <p className="text-xs font-bold opacity-70">@{user.nickname}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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

      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
    </div>
  );
}