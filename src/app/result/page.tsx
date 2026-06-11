"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useLanguage } from "@/context/LanguageContext";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FootballPitch from "@/components/FootballPitch";

export default function ResultPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  
  // Lendo as propriedades reais expostas pelo seu GameContext
  const { slots, stats, isChampion, resetGame, userTeamName } = useGame();

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
          <Button variant="primary" onClick={() => router.push("/")}>{t.backBtn}</Button>
        </div>
      </div>
    );
  }

  const totalGames = stats.wins + stats.draws + stats.losses;

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
          <Button variant="secondary" onClick={() => { resetGame(); router.push("/"); }}>
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
            <h2 className="text-xl md:text-2xl font-black uppercase text-[#00183F] tracking-wider mb-6 border-l-8 border-[#0033A0] pl-4">
              {t.teamTitle} ({userTeamName})
            </h2>
            
            <div className="bg-[#1E293B] p-4 border-4 border-[#00183F]">
              <FootballPitch slots={slots} />
            </div>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}