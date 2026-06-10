"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { Player, FormationSlot } from "@/types";
import { getAvailablePositions } from "@/utils/helpers";
import FootballPitch from "@/components/FootballPitch";
import TeamCard from "@/components/TeamCard";
import SquadDisplay from "@/components/SquadDisplay";
import PositionPicker from "@/components/PositionPicker";
import Card from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/constants";

export default function DraftPage() {
  const router = useRouter();
  const {
    draftRound,
    currentDraftTeam,
    slots,
    assignPlayerToSlot,
    drawNextTeam,
  } = useGame();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<FormationSlot[]>([]);
  
  const [rerollsLeft, setRerollsLeft] = useState(3);

  // CORREÇÃO: Os sorteios agora duram o draft inteiro. Só resetam se você iniciar um novo jogo (Rodada 0).
  useEffect(() => {
    if (draftRound === 0) {
      setRerollsLeft(3);
    }
  }, [draftRound]);

  useEffect(() => {
    if (!currentDraftTeam && draftRound < 11) {
      drawNextTeam();
    }
  }, [currentDraftTeam, draftRound, drawNextTeam]);

  useEffect(() => {
    if (draftRound >= 11) {
      const timer = setTimeout(() => {
        router.push("/tournament");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [draftRound, router]);

  const hasSelectablePlayers = currentDraftTeam?.players.some(
    (p) => getAvailablePositions(slots, p.positions).length > 0
  ) ?? true;

  const handleReroll = () => {
    if (!hasSelectablePlayers) {
      drawNextTeam();
    } else if (rerollsLeft > 0) {
      setRerollsLeft((prev) => prev - 1);
      drawNextTeam();
    }
  };

  const handlePlayerSelect = (player: Player) => {
    const availIds = getAvailablePositions(slots, player.positions);
    const avail = slots.filter((s) => availIds.includes(s.id));

    if (avail.length === 0) return;

    if (avail.length === 1) {
      assignPlayerToSlot(player, avail[0].id);
      setSelectedPlayer(null);
      setShowPositionPicker(false);
      return;
    }

    setSelectedPlayer(player);
    setAvailableSlots(avail);
    setShowPositionPicker(true);
  };

  const handlePositionConfirm = (slotId: number) => {
    if (selectedPlayer) {
      assignPlayerToSlot(selectedPlayer, slotId);
      setSelectedPlayer(null);
      setShowPositionPicker(false);
      setAvailableSlots([]);
    }
  };

  const handleCancel = () => {
    setSelectedPlayer(null);
    setShowPositionPicker(false);
    setAvailableSlots([]);
  };

  const highlightedSlotIds = availableSlots.map((s) => s.id);
  const { lang } = useLanguage();

  const tDraft = {
    pt: {
      title: "Opções de Sorteio",
      chances: "Sorteios Restantes",
      freeDesc: "Nenhum Jogador Encaixa - Sorteio Livre",
      reroll: "Refazer Sorteio",
      freeReroll: "Sorteio Grátis"
    },
    en: {
      title: "Draft Options",
      chances: "Re-rolls Left",
      freeDesc: "No Players Fit - Free Re-roll",
      reroll: "Re-roll Draft",
      freeReroll: "Free Re-roll"
    }
  }[lang];

  if (draftRound >= 11) {
    return (
      <div className="min-h-screen bg-[#00183F] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white border-4 border-[#00183F] p-8 shadow-[12px_12px_0_0_#0033A0]"
        >
          <span className="text-6xl mb-6 block drop-shadow-[4px_4px_0_#D9D9D9]">✅</span>
          <h2 className="text-3xl font-black text-[#00183F] mb-2 uppercase tracking-tighter">
            {TRANSLATIONS[lang].squad_complete}
          </h2>
          <p className="text-[#0033A0] font-bold uppercase tracking-widest bg-[#D9D9D9] border-2 border-[#0033A0] inline-block px-4 py-1 mt-2">
            {TRANSLATIONS[lang].starting_tournament}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00183F] px-4 py-8 md:py-12 max-w-7xl mx-auto font-sans text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 border-4 border-white bg-[#D9D9D9] p-4 md:p-6 shadow-[8px_8px_0_0_#0033A0]"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <h1 className="text-3xl md:text-4xl font-black text-[#00183F] uppercase tracking-tight">
            {TRANSLATIONS[lang].build_your_squad}
          </h1>
          <div className="flex items-center gap-2 bg-white border-4 border-[#00183F] px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
            <span className="text-xs md:text-sm font-black text-gray-500 uppercase">
              {TRANSLATIONS[lang].round_label}
            </span>
            <span className="text-xl md:text-2xl font-black text-[#0033A0]">
              {draftRound + 1}
            </span>
            <span className="text-sm md:text-lg font-black text-[#00183F]">/ 11</span>
          </div>
        </div>

        <div className="w-full h-6 bg-white border-4 border-[#00183F] relative overflow-hidden">
          <motion.div
            className="h-full bg-[#0033A0] border-r-4 border-[#00183F]"
            initial={{ width: 0 }}
            animate={{ width: `${(draftRound / 11) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border-4 border-[#00183F] p-4 shadow-[6px_6px_0_0_#0033A0]">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-base md:text-lg font-black text-[#00183F] uppercase leading-none">
                {tDraft.title}
              </h3>
              <p className={`text-xs md:text-sm font-bold uppercase mt-1 ${!hasSelectablePlayers ? "text-emerald-600" : "text-gray-500"}`}>
                {!hasSelectablePlayers ? tDraft.freeDesc : `${tDraft.chances}: ${rerollsLeft}/3`}
              </p>
            </div>

            <button
              onClick={handleReroll}
              disabled={rerollsLeft === 0 && hasSelectablePlayers}
              className={`
                px-4 md:px-6 py-2 md:py-3 font-black uppercase text-sm md:text-base tracking-widest border-4 border-[#00183F] transition-all duration-75 w-full sm:w-auto
                ${
                  !hasSelectablePlayers
                    ? "bg-emerald-400 text-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#00183F]"
                    : rerollsLeft > 0
                    ? "bg-amber-400 text-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#00183F]"
                    : "bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed shadow-none"
                }
              `}
            >
              {!hasSelectablePlayers ? tDraft.freeReroll : `${tDraft.reroll} (${rerollsLeft})`}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {currentDraftTeam && (
              <TeamCard
                key={currentDraftTeam.key + "-" + draftRound}
                team={currentDraftTeam}
                slots={slots}
                onPlayerSelect={handlePlayerSelect}
                selectedPlayer={selectedPlayer}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <Card className="p-4 md:p-6 bg-[#1E293B]">
            <FootballPitch
              slots={slots}
              highlightedSlots={highlightedSlotIds}
            />
          </Card>

          {/* Wrapper ajustado para evitar que o componente bugue as cores */}
          <div className="p-0 overflow-hidden bg-white text-[#00183F]">
            <SquadDisplay slots={slots} />
          </div>
        </div>
      </div>

      {showPositionPicker && selectedPlayer && (
        <PositionPicker
          player={selectedPlayer}
          availableSlots={availableSlots}
          onConfirm={handlePositionConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}