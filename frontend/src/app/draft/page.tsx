"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSocket } from "@/context/SocketContext"; 
import { Player, FormationSlot, TeamData } from "@/types";
import { getAvailablePositions, getAllTeams, getCountryEmoji, calculateTeamChemistry } from "@/utils/helpers";
import { calculateTeamStrength } from "@/utils/simulation";
import { generateOnlineGuerra, generateOnlineTradicional } from "@/utils/tournament";
import { americans, europeans } from "@/data/data";
import FootballPitch from "@/components/FootballPitch";
import TeamCard from "@/components/TeamCard";
import SquadDisplay from "@/components/SquadDisplay";
import PositionPicker from "@/components/PositionPicker";
import Card from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/constants";

export default function DraftPage() {
  const router = useRouter();
  const { socket, currentRoom, nickname } = useSocket(); 
  
  const {
    draftRound, currentDraftTeam, currentDraftManagers, manager,
    assignManager, slots, formation, assignPlayerToSlot, drawNextTeam, gameMode,
    tactic, setOnlineTournamentState
  } = useGame();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<FormationSlot[]>([]);
  
  const allTeams = useMemo(() => getAllTeams(americans, europeans), []);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingTeam, setRollingTeam] = useState<TeamData | null>(null);

  const maxRerolls = gameMode === "hardcore" ? 1 : 3;
  const [rerollsLeft, setRerollsLeft] = useState(maxRerolls);

  const isManagerDraft = draftRound === 11;
  const isDraftComplete = draftRound >= 12;

  const [onlineProgress, setOnlineProgress] = useState({ finishedCount: 1, totalPlayers: 1 });
  const [hasEmittedComplete, setHasEmittedComplete] = useState(false);

  useEffect(() => {
    if (draftRound === 0) setRerollsLeft(maxRerolls);
  }, [draftRound, maxRerolls]);

  useEffect(() => {
    if (!currentDraftTeam && draftRound < 11) drawNextTeam();
    if (draftRound === 11 && currentDraftManagers.length === 0) drawNextTeam();
  }, [currentDraftTeam, currentDraftManagers.length, draftRound, drawNextTeam]);

  useEffect(() => {
    if (currentDraftTeam && !isManagerDraft) {
      setIsRolling(true);
      let ticks = 0;
      const interval = setInterval(() => {
        setRollingTeam(allTeams[Math.floor(Math.random() * allTeams.length)]);
        ticks++;
        if (ticks >= 15) { 
          clearInterval(interval);
          setIsRolling(false);
        }
      }, 80);
      return () => clearInterval(interval);
    }
  }, [currentDraftTeam, allTeams, isManagerDraft]);

  // EMITE que terminou
  useEffect(() => {
    if (isDraftComplete && currentRoom && !hasEmittedComplete) {
      const userPlayers = slots.filter((s) => s.player).map((s) => s.player!);
      const strength = calculateTeamStrength(userPlayers);
      const chemistry = calculateTeamChemistry(slots, formation, manager);
      
      socket?.emit("playerDraftComplete", currentRoom.id, {
        nickname,
        strength,
        chemistry,
        tactic,
      });
      setHasEmittedComplete(true);
    }
  }, [isDraftComplete, currentRoom, hasEmittedComplete, slots, formation, manager, nickname, tactic, socket]);

  // ESCUTA as simulações e resultados
  useEffect(() => {
    if (!currentRoom) return;

    const onDraftProgress = (data: any) => setOnlineProgress(data);
    
    // Apenas o Host receberá esse sinal!
    const onHostStartSimulation = (playersData: any[]) => {
      if (currentRoom.mode === 'guerra') {
        const data = generateOnlineGuerra(playersData);
        socket?.emit("onlineTournamentData", currentRoom.id, { mode: 'guerra', ...data });
      } else {
        const data = generateOnlineTradicional(playersData, allTeams, currentRoom.difficulty || 'medium');
        socket?.emit("onlineTournamentData", currentRoom.id, { mode: 'tradicional', ...data });
      }
    };

    const onOnlineTournamentReady = (data: any) => {
      setOnlineTournamentState(data, nickname);
      if (data.mode === 'guerra') {
        router.push("/knockout");
      } else {
        router.push("/tournament");
      }
    };

    socket?.on("draftProgress", onDraftProgress);
    socket?.on("hostStartSimulation", onHostStartSimulation);
    socket?.on("onlineTournamentReady", onOnlineTournamentReady);

    return () => {
      socket?.off("draftProgress", onDraftProgress);
      socket?.off("hostStartSimulation", onHostStartSimulation);
      socket?.off("onlineTournamentReady", onOnlineTournamentReady);
    }
  }, [currentRoom, socket, router, nickname, setOnlineTournamentState, allTeams]);


  // [TODO O RESTANTE DO CÓDIGO PERMANECE IDENTICO]
  const hasSelectablePlayers = currentDraftTeam?.players.some(
    (p) => {
      const isAlreadyDrafted = slots.some((s) => s.player?.name === p.name);
      return !isAlreadyDrafted && getAvailablePositions(slots, p.positions).length > 0;
    }
  ) ?? true;

  const handleReroll = () => {
    if (isRolling) return; 
    if (!isManagerDraft && !hasSelectablePlayers) drawNextTeam();
    else if (rerollsLeft > 0) {
      setRerollsLeft((prev) => prev - 1);
      drawNextTeam();
    }
  };

  const handlePlayerSelect = (player: Player) => {
    if (isRolling) return;
    const isAlreadyDrafted = slots.some((s) => s.player?.name === player.name);
    if (isAlreadyDrafted) return;

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
    pt: { title: "Opções de Sorteio", chances: "Sorteios Restantes", freeDesc: "Nenhum Jogador Encaixa", reroll: "Refazer Sorteio", freeReroll: "Sorteio Grátis", ready: "Elenco pronto para a Glória!", simulateBtn: "Simular Agora", rolling: "Sorteando...", managerTitle: "Escolha seu Técnico" },
    en: { title: "Draft Options", chances: "Re-rolls Left", freeDesc: "No Players Fit", reroll: "Re-roll Draft", freeReroll: "Free Re-roll", ready: "Squad ready for Glory!", simulateBtn: "Simulate Now", rolling: "Drawing...", managerTitle: "Choose your Manager" }
  }[lang];

  const teamToDisplay = isRolling ? (rollingTeam || currentDraftTeam) : currentDraftTeam;

  return (
    <div className="min-h-screen bg-[#00183F] px-4 py-8 md:py-12 max-w-7xl mx-auto font-sans text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 border-4 border-white bg-[#D9D9D9] p-4 md:p-6 shadow-[8px_8px_0_0_#0033A0]"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <h1 className="text-2xl md:text-4xl font-black text-[#00183F] uppercase tracking-tight flex items-center gap-3">
            {TRANSLATIONS[lang].build_your_squad}
            {gameMode === "hardcore" && (
              <span className="bg-rose-600 text-white text-xs px-2 py-1 border-2 border-[#00183F]">HARDCORE</span>
            )}
            {currentRoom && (
              <span className="bg-emerald-500 text-[#00183F] text-xs px-2 py-1 border-2 border-[#00183F]">ONLINE</span>
            )}
          </h1>
          
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center bg-white border-4 border-[#00183F] px-3 md:px-4 py-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
              <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase">{TRANSLATIONS[lang].round_label}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl md:text-2xl font-black text-[#0033A0]">{Math.min(draftRound + 1, 12)}</span>
                <span className="text-sm md:text-lg font-black text-[#00183F]">/ 12</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-6 bg-white border-4 border-[#00183F] relative overflow-hidden">
          <motion.div
            className="h-full bg-[#0033A0] border-r-4 border-[#00183F]"
            initial={{ width: 0 }}
            animate={{ width: `${(Math.min(draftRound, 12) / 12) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-6">
          {isDraftComplete ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="text-center bg-white border-4 border-[#00183F] p-8 md:p-12 shadow-[10px_10px_0_0_#0033A0] flex flex-col items-center justify-center h-full min-h-[300px]"
            >
              <span className="text-6xl mb-4 block drop-shadow-[4px_4px_0_#D9D9D9]">✅</span>
              <h2 className="text-3xl md:text-4xl font-black text-[#00183F] mb-2 uppercase tracking-tighter">
                {TRANSLATIONS[lang].squad_complete}
              </h2>

              {currentRoom ? (
                <div className="mt-6 flex flex-col items-center">
                  <p className="text-xl font-bold uppercase text-amber-600 mb-2">Aguardando outros jogadores...</p>
                  <div className="text-4xl font-black text-[#00183F]">
                    {onlineProgress.finishedCount} / {onlineProgress.totalPlayers}
                  </div>
                  <div className="w-full bg-gray-200 h-4 border-2 border-[#00183F] mt-4">
                    <div 
                      className="bg-[#0033A0] h-full transition-all duration-300" 
                      style={{ width: `${(onlineProgress.finishedCount / onlineProgress.totalPlayers) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-500 font-bold uppercase tracking-widest mb-10 text-sm md:text-base">
                    {tDraft.ready}
                  </p>
                  <button
                    onClick={() => router.push("/tournament")}
                    className="w-full px-8 py-5 bg-[#D9D9D9] text-[#00183F] border-4 border-[#00183F] font-black text-2xl uppercase tracking-widest transition-all duration-75 shadow-[6px_6px_0_0_#0033A0] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_#0033A0] active:translate-y-2 active:translate-x-2 active:shadow-none"
                  >
                    {tDraft.simulateBtn}
                  </button>
                </>
              )}
            </motion.div>
          ) : isManagerDraft ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border-4 border-[#00183F] p-4 shadow-[6px_6px_0_0_#0033A0]">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-base md:text-lg font-black text-[#00183F] uppercase leading-none">
                    {tDraft.managerTitle}
                  </h3>
                  <p className="text-xs md:text-sm font-bold uppercase mt-1 text-gray-500">
                    {tDraft.chances}: {rerollsLeft}/{maxRerolls}
                  </p>
                </div>

                <button
                  onClick={handleReroll}
                  disabled={rerollsLeft === 0}
                  className={`
                    px-4 md:px-6 py-2 md:py-3 font-black uppercase text-sm md:text-base tracking-widest border-4 border-[#00183F] transition-all duration-75 w-full sm:w-auto
                    ${rerollsLeft > 0
                        ? "bg-amber-400 text-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#00183F]"
                        : "bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed shadow-none"
                    }
                  `}
                >
                  {`${tDraft.reroll} (${rerollsLeft})`}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentDraftManagers.map((mgr, idx) => (
                  <div
                    key={idx}
                    onClick={() => assignManager(mgr)}
                    className="bg-white border-4 border-[#00183F] p-4 cursor-pointer hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0033A0] transition-transform flex flex-col"
                  >
                    <span className="font-black text-[#00183F] text-lg md:text-xl uppercase leading-none">{mgr.tecnico}</span>
                    <span className="text-xs md:text-sm font-black text-[#0033A0] uppercase mt-2">
                      {mgr.clubeAno.replace(/-/g, " ")}
                    </span>
                    <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase mt-2 border-t-2 border-dashed pt-2">
                      {getCountryEmoji(mgr.nacionalidade)} {mgr.nacionalidade}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border-4 border-[#00183F] p-4 shadow-[6px_6px_0_0_#0033A0]">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-base md:text-lg font-black text-[#00183F] uppercase leading-none">
                    {tDraft.title}
                  </h3>
                  <p className={`text-xs md:text-sm font-bold uppercase mt-1 ${!hasSelectablePlayers ? "text-emerald-600" : "text-gray-500"}`}>
                    {!hasSelectablePlayers ? tDraft.freeDesc : `${tDraft.chances}: ${rerollsLeft}/${maxRerolls}`}
                  </p>
                </div>

                <button
                  onClick={handleReroll}
                  disabled={isRolling || (rerollsLeft === 0 && hasSelectablePlayers)}
                  className={`
                    px-4 md:px-6 py-2 md:py-3 font-black uppercase text-sm md:text-base tracking-widest border-4 border-[#00183F] transition-all duration-75 w-full sm:w-auto
                    ${
                      isRolling
                        ? "bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed shadow-none"
                        : !hasSelectablePlayers
                        ? "bg-emerald-400 text-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#00183F]"
                        : rerollsLeft > 0
                        ? "bg-amber-400 text-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#00183F]"
                        : "bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed shadow-none"
                    }
                  `}
                >
                  {isRolling ? tDraft.rolling : (!hasSelectablePlayers ? tDraft.freeReroll : `${tDraft.reroll} (${rerollsLeft})`)}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {teamToDisplay && (
                  <TeamCard
                    key={currentDraftTeam?.key + "-" + draftRound}
                    team={teamToDisplay}
                    slots={slots}
                    onPlayerSelect={isRolling ? () => {} : handlePlayerSelect}
                    selectedPlayer={selectedPlayer}
                    hideOverall={gameMode === "hardcore" || isRolling}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-4 md:p-6 bg-[#1E293B]">
            <FootballPitch
              slots={slots}
              formation={formation}
              highlightedSlots={highlightedSlotIds}
              manager={manager}
            />
          </Card>

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