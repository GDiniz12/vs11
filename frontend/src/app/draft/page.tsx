"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSocket } from "@/context/SocketContext"; 
import { Player, FormationSlot, TeamData } from "@/types";
import { getAvailablePositions, getAllTeams, getBrazilianTeams, getCountryEmoji, calculateTeamChemistry, getManagerBonus } from "@/utils/helpers";
import { calculateTeamStrength, calculateSectorStrengths } from "@/utils/simulation";
import { generateOnlineGuerra, generateOnlineTradicional, generateOnlineBrasileirao, generateOnlineCopa } from "@/utils/tournament";
import { americans, europeans, nationalTeams } from "@/data/data";
import FootballPitch from "@/components/FootballPitch";
import TeamCard from "@/components/TeamCard";
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
    tournamentMode, startCopaGroupStage, startBrasileirao,
    tactic, setOnlineTournamentState, swapPlayers
  } = useGame();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showChemModal, setShowChemModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<FormationSlot[]>([]);
  const [swapSourceSlot, setSwapSourceSlot] = useState<FormationSlot | null>(null);
  const [swapAvailableSlots, setSwapAvailableSlots] = useState<FormationSlot[]>([]);
  
  const allTeams = useMemo(() => {
    if (tournamentMode === 'copa-do-mundo') return getAllTeams({} as any, {} as any, nationalTeams);
    if (tournamentMode === 'brasileirao') return getBrazilianTeams(americans);
    if (tournamentMode === 'super-mundial') return getAllTeams(americans, europeans);
    return getAllTeams(americans, europeans, nationalTeams); // louco: everything
  }, [tournamentMode]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingTeam, setRollingTeam] = useState<TeamData | null>(null);

  const maxRerolls = gameMode === "hardcore" ? 1 : 3;
  const [rerollsLeft, setRerollsLeft] = useState(maxRerolls);

  const baseChemistry = useMemo(() => calculateTeamChemistry(slots, formation, null), [slots, formation]);
  
  const teamOvr = useMemo(() => {
    const totalOvr = slots.reduce((sum, slot) => sum + (slot.player ? slot.player.overall : 0), 0);
    return Math.round(totalOvr / 11);
  }, [slots]);
  const teamChemistry = useMemo(() => calculateTeamChemistry(slots, formation, manager), [slots, formation, manager]);
  const draftedPlayers = useMemo(() => slots.map(s => s.player).filter(Boolean) as Player[], [slots]);
  const sectors = useMemo(() => calculateSectorStrengths(draftedPlayers), [draftedPlayers]);

  const isManagerDraft = draftRound === 11;
  const isDraftComplete = draftRound >= 12;

  const [onlineProgress, setOnlineProgress] = useState<{ finishedCount: number, totalPlayers: number, playersStatus?: { nickname: string, draftFinished: boolean }[] }>({ finishedCount: 1, totalPlayers: 1 });
  const [hasEmittedComplete, setHasEmittedComplete] = useState(false);
  const [allDraftsComplete, setAllDraftsComplete] = useState(false);
  const [finalPlayersData, setFinalPlayersData] = useState<any[]>([]);
  const [roomHostId, setRoomHostId] = useState<string>('');
  const [roomHostNickname, setRoomHostNickname] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);

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
      const penalizedPlayers = slots.filter((s) => s.player).map((s) => {
        const p = { ...s.player! };
        if (!p.positions.includes(s.position)) {
          p.overall = Math.max(40, p.overall - 12);
          p.name = p.name + " ⚠️";
        }
        return p;
      });
      const strength = calculateTeamStrength(penalizedPlayers, manager);
      const chemistry = calculateTeamChemistry(slots, formation, manager);
      
      socket?.emit("playerDraftComplete", currentRoom.id, {
        nickname,
        strength,
        chemistry,
        tactic,
        players: penalizedPlayers,
        managerBonus: getManagerBonus(manager),
      });
      setHasEmittedComplete(true);
    }
  }, [isDraftComplete, currentRoom, hasEmittedComplete, slots, formation, manager, nickname, tactic, socket]);

  // ESCUTA as simulações e resultados
  useEffect(() => {
    if (!currentRoom) return;

    const onDraftProgress = (data: any) => setOnlineProgress(data);
    
    const onAllDraftsComplete = (data: { playersData: any[], hostId: string, hostNickname?: string }) => {
      setAllDraftsComplete(true);
      setFinalPlayersData(data.playersData);
      setRoomHostId(data.hostId);
      if (data.hostNickname) setRoomHostNickname(data.hostNickname);
    };

    const onOnlineTournamentReady = (data: any) => {
      setOnlineTournamentState(data, nickname);
      if (data.mode === 'guerra') {
        router.push("/knockout");
      } else if (data.tournamentMode === 'brasileirao') {
        router.push("/brasileirao");
      } else if (data.tournamentMode === 'copa-do-mundo') {
        router.push("/copa-group");
      } else {
        router.push("/tournament");
      }
    };

    socket?.on("draftProgress", onDraftProgress);
    socket?.on("allDraftsComplete", onAllDraftsComplete);
    socket?.on("onlineTournamentReady", onOnlineTournamentReady);

    return () => {
      socket?.off("draftProgress", onDraftProgress);
      socket?.off("allDraftsComplete", onAllDraftsComplete);
      socket?.off("onlineTournamentReady", onOnlineTournamentReady);
    }
  }, [currentRoom, socket, router, nickname, setOnlineTournamentState, allTeams]);

  const handleHostStartSimulation = () => {
    if (!currentRoom || isSimulating) return;
    setIsSimulating(true);
    const tournamentMode = currentRoom.tournamentMode || 'super-mundial';
    const isRanked = !!currentRoom.isRanked;
    const difficulty = currentRoom.difficulty || 'medium';
    if (currentRoom.mode === 'guerra') {
      const data = generateOnlineGuerra(finalPlayersData);
      socket?.emit("onlineTournamentData", currentRoom.id, { mode: 'guerra', tournamentMode, isRanked, ...data });
    } else if (tournamentMode === 'brasileirao') {
      const data = generateOnlineBrasileirao(finalPlayersData, allTeams, difficulty);
      socket?.emit("onlineTournamentData", currentRoom.id, { mode: 'tradicional', tournamentMode, isRanked, ...data });
    } else if (tournamentMode === 'copa-do-mundo') {
      const data = generateOnlineCopa(finalPlayersData, allTeams, difficulty);
      socket?.emit("onlineTournamentData", currentRoom.id, { mode: 'tradicional', tournamentMode, isRanked, ...data });
    } else {
      const data = generateOnlineTradicional(finalPlayersData, allTeams, difficulty);
      socket?.emit("onlineTournamentData", currentRoom.id, { mode: 'tradicional', tournamentMode, isRanked, ...data });
    }
  };


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
    if (selectedPlayer?.name === player.name) {
      setSelectedPlayer(null);
      setAvailableSlots([]);
      return;
    }
    const isAlreadyDrafted = slots.some((s) => s.player?.name === player.name);
    if (isAlreadyDrafted) return;

    const availIds = getAvailablePositions(slots, player.positions);
    const avail = slots.filter((s) => availIds.includes(s.id));

    if (avail.length === 0) return;
    
    setSelectedPlayer(player);
    setAvailableSlots(avail);
  };

  const startSwap = (slot: FormationSlot) => {
    const player = slot.player;
    if (!player) return;

    const validSlots = slots.filter(targetSlot => {
      if (targetSlot.id === slot.id) return false;
      
      const p1CanPlayTarget = player.positions.includes(targetSlot.position);
      if (!p1CanPlayTarget) return false;

      if (targetSlot.player) {
        return targetSlot.player.positions.includes(slot.position);
      }
      
      return true;
    });

    if (validSlots.length > 0) {
      setSwapSourceSlot(slot);
      setSwapAvailableSlots(validSlots);
    }
  };

  const handleSlotClick = (slotId: number) => {
    if (selectedPlayer && highlightedSlotIds.includes(slotId)) {
      assignPlayerToSlot(selectedPlayer, slotId);
      setSelectedPlayer(null);
      setAvailableSlots([]);
      return;
    }

    if (swapSourceSlot) {
      if (swapAvailableSlots.find(s => s.id === slotId)) {
        swapPlayers(swapSourceSlot.id, slotId);
        setSwapSourceSlot(null);
        setSwapAvailableSlots([]);
      } else {
        const clickedSlot = slots.find(s => s.id === slotId);
        if (clickedSlot?.player && clickedSlot.id !== swapSourceSlot.id) {
          startSwap(clickedSlot);
        } else {
          setSwapSourceSlot(null);
          setSwapAvailableSlots([]);
        }
      }
      return;
    }

    if (!selectedPlayer && !swapSourceSlot) {
      const clickedSlot = slots.find(s => s.id === slotId);
      if (clickedSlot?.player) {
        startSwap(clickedSlot);
      }
    }
  };

  const handleCancel = () => {
    setSelectedPlayer(null);
    setAvailableSlots([]);
    setSwapSourceSlot(null);
    setSwapAvailableSlots([]);
  };

  const highlightedSlotIds = selectedPlayer 
    ? availableSlots.map((s) => s.id) 
    : (swapSourceSlot ? swapAvailableSlots.map(s => s.id) : []);
  const { lang } = useLanguage();

  const tDraft = {
    pt: {
      title: "Opções de Sorteio", chances: "Sorteios Restantes", freeDesc: "Nenhum Jogador Encaixa",
      reroll: "Refazer Sorteio", freeReroll: "Sorteio Grátis", ready: "Elenco pronto para a Glória!",
      simulateBtn: "Simular Agora", rolling: "Sorteando...", managerTitle: "Escolha seu Técnico",
      chemBtn: "COMO FUNCIONA O ENTROSAMENTO?",
      showResults: "Mostrar Resultados", waitingHost: "Aguardando o host mostrar os resultados...",
      waitingPlayers: "Aguardando outros jogadores...", playerReady: "Pronto", playerBuilding: "Montando...",
      choosePos: (name: string) => `ESCOLHA A POSIÇÃO NO CAMPO PARA ${name}`,
      swapPos: (name: string) => `TROCAR POSIÇÃO DE ${name}`,
      cancel: "CANCELAR",
      atkLabel: "ATA:", midLabel: "MEI:", defLabel: "DEF:",
      chemTitle: "Como funciona o Entrosamento?",
      chem100: "100 (Verde): Mesmo time exato e mesmo país",
      chem90: "90 (Amarelo): Mesmo time exato, países diferentes",
      chem85: "85 (Laranja): Mesmo clube (de anos diferentes) e mesmo país",
      chem75: "75 (Azul): Apenas mesmo país",
      chem65: "65 (Vermelho): Apenas mesmo clube (de anos diferentes)",
      chem40: "40 (Branco): Sem nenhuma ligação óbvia",
      chemManagerTitle: "Bônus do Treinador",
      chemManagerDesc: (bold: string) => `O técnico gera um bônus ${bold} no entrosamento se você tiver jogadores que ele treinou no mesmo clube. Experimente combinar o técnico daquele clube histórico com os jogadores certos e veja a mágica acontecer!`,
      chemClose: "Entendi",
    },
    en: {
      title: "Draft Options", chances: "Re-rolls Left", freeDesc: "No Players Fit",
      reroll: "Re-roll Draft", freeReroll: "Free Re-roll", ready: "Squad ready for Glory!",
      simulateBtn: "Simulate Now", rolling: "Drawing...", managerTitle: "Choose your Manager",
      chemBtn: "HOW DOES CHEMISTRY WORK?",
      showResults: "Show Results", waitingHost: "Waiting for host to show results...",
      waitingPlayers: "Waiting for other players...", playerReady: "Ready", playerBuilding: "Building...",
      choosePos: (name: string) => `CHOOSE POSITION FOR ${name}`,
      swapPos: (name: string) => `SWAP POSITION OF ${name}`,
      cancel: "CANCEL",
      atkLabel: "ATK:", midLabel: "MID:", defLabel: "DEF:",
      chemTitle: "How does Chemistry work?",
      chem100: "100 (Green): Same exact team and same country",
      chem90: "90 (Yellow): Same exact team, different countries",
      chem85: "85 (Orange): Same club (different years) and same country",
      chem75: "75 (Blue): Same country only",
      chem65: "65 (Red): Same club only (different years)",
      chem40: "40 (White): No obvious connection",
      chemManagerTitle: "Manager Bonus",
      chemManagerDesc: (bold: string) => `The manager gives a ${bold} chemistry bonus if you have players he coached at the same club. Try combining the manager of that historic club with the right players and watch the magic happen!`,
      chemClose: "Got it",
    },
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
            <button
              onClick={() => setShowChemModal(true)}
              className="bg-sky-400 text-[#00183F] font-black uppercase text-[10px] md:text-xs px-2 py-1 md:px-3 md:py-2 border-2 border-[#00183F] shadow-[3px_3px_0_0_rgba(0,0,0,0.5)] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transition-all"
            >
              {tDraft.chemBtn}
            </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex flex-col gap-6 h-full">
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
                  {allDraftsComplete ? (
                    (currentRoom.host === socket?.id || roomHostId === socket?.id || currentRoom.hostNickname === nickname || roomHostNickname === nickname) ? (
                      <button
                        onClick={handleHostStartSimulation}
                        disabled={isSimulating}
                        className={`w-full px-8 py-5 border-4 border-[#00183F] font-black text-2xl uppercase tracking-widest transition-all duration-75 ${isSimulating ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-[#D9D9D9] text-[#00183F] shadow-[6px_6px_0_0_#0033A0] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_#0033A0] active:translate-y-2 active:translate-x-2 active:shadow-none'}`}
                      >
                        {isSimulating ? '...' : tDraft.showResults}
                      </button>
                    ) : (
                      <p className="text-xl font-bold uppercase text-amber-600 mb-2">{tDraft.waitingHost}</p>
                    )
                  ) : (
                    <>
                      <p className="text-xl font-bold uppercase text-amber-600 mb-2">{tDraft.waitingPlayers}</p>
                      <div className="text-4xl font-black text-[#00183F]">
                        {onlineProgress.finishedCount} / {onlineProgress.totalPlayers}
                      </div>
                      <div className="w-full bg-gray-200 h-4 border-2 border-[#00183F] mt-4">
                        <div 
                          className="bg-[#0033A0] h-full transition-all duration-300" 
                          style={{ width: `${(onlineProgress.finishedCount / onlineProgress.totalPlayers) * 100}%` }}
                        />
                      </div>
                      
                      {onlineProgress.playersStatus && onlineProgress.playersStatus.length > 0 && (
                        <div className="w-full mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 border-t-2 border-dashed border-[#00183F]/20 pt-4">
                          {onlineProgress.playersStatus.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-[#00183F]/5 px-3 py-2 border-2 border-[#00183F]/10">
                              <span className="font-bold text-[#00183F]">{p.nickname}</span>
                              {p.draftFinished ? (
                                <span className="text-emerald-600 font-black flex items-center gap-1 text-sm uppercase">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                  {tDraft.playerReady}
                                </span>
                              ) : (
                                <span className="text-amber-500 font-bold flex items-center gap-1 text-xs uppercase">
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  {tDraft.playerBuilding}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-gray-500 font-bold uppercase tracking-widest mb-10 text-sm md:text-base">
                    {tDraft.ready}
                  </p>
                  <button
                    onClick={() => {
                      if (tournamentMode === 'copa-do-mundo') {
                        startCopaGroupStage();
                        router.push("/copa-group");
                      } else if (tournamentMode === 'brasileirao') {
                        startBrasileirao();
                        router.push("/brasileirao");
                      } else {
                        router.push("/tournament");
                      }
                    }}
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
                {currentDraftManagers.map((mgr, idx) => {
                  const chemWithManager = calculateTeamChemistry(slots, formation, mgr);
                  const chemDiff = chemWithManager - baseChemistry;
                  
                  return (
                  <div
                    key={idx}
                    onClick={() => assignManager(mgr)}
                    className="bg-white border-4 border-[#00183F] p-4 cursor-pointer hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#0033A0] transition-transform flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-[#00183F] text-lg md:text-xl uppercase leading-none">{mgr.tecnico}</span>
                      {mgr.overall && (
                        <span className="bg-[#0033A0] text-white px-2 py-1 text-sm font-black border-2 border-[#00183F]">
                          OVR {mgr.overall}
                        </span>
                      )}
                    </div>
                    {gameMode !== 'hardcore' && chemDiff > 0 && (
                      <span className="bg-emerald-500 text-white font-black text-[10px] md:text-xs px-2 py-0.5 border-2 border-[#00183F] self-start shadow-[2px_2px_0_0_#00183F] mb-2 animate-pulse-soft">
                        ENTROSAMENTO +{chemDiff}
                      </span>
                    )}
                    <span className="text-xs md:text-sm font-black text-[#0033A0] uppercase mt-auto">
                      {mgr.clubeAno.replace(/-/g, " ")}
                    </span>
                    <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase mt-2 border-t-2 border-dashed pt-2">
                      {getCountryEmoji(mgr.nacionalidade)} {mgr.nacionalidade}
                    </span>
                  </div>
                )})}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border-4 border-[#00183F] p-4 shadow-[6px_6px_0_0_#0033A0] mb-4 md:mb-6 gap-4 shrink-0">
                <div>
                  <h3 className="text-base md:text-lg font-black text-[#00183F] uppercase leading-none">
                    {tDraft.title}
                  </h3>
                  <p className={`text-xs md:text-sm font-bold uppercase mt-1 ${!hasSelectablePlayers ? "text-emerald-600" : "text-gray-500"}`}>
                    {!hasSelectablePlayers ? tDraft.freeDesc : `${tDraft.chances}: ${rerollsLeft}/${maxRerolls}`}
                  </p>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleReroll}
                    disabled={isRolling || (rerollsLeft === 0 && hasSelectablePlayers)}
                    className={`
                      px-4 md:px-6 py-2 md:py-3 font-black uppercase text-sm md:text-base tracking-widest border-4 border-[#00183F] transition-all duration-75 flex-1 sm:flex-none
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
              </div>

              <div className="flex-1 min-h-0">
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
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col h-full space-y-6">
          <Card className="flex-1 p-4 md:p-6 bg-[#1E293B] flex flex-col">
            <div className="flex flex-col gap-2 mb-4 bg-white p-3 border-4 border-[#00183F] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <div className="flex gap-2">
                  <span className="text-xs md:text-sm bg-[#0033A0] text-white border-2 border-[#00183F] px-2 py-0.5 shadow-[2px_2px_0_0_#00183F] font-black" title="Overall">
                    OVR: {teamOvr}
                  </span>
                  <span className="text-xs md:text-sm bg-emerald-600 text-white border-2 border-[#00183F] px-2 py-0.5 shadow-[2px_2px_0_0_#00183F] font-black" title="Entrosamento">
                    ENT: {teamChemistry}
                  </span>
                </div>
                <div className="flex flex-wrap items-center bg-gray-100 border-2 border-[#00183F] p-1 shadow-inner text-xs font-black gap-2">
                  <div className="flex items-center gap-1 text-red-700">
                    <span>{tDraft.atkLabel}</span> <span className="text-sm">{sectors.atk}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-400" />
                  <div className="flex items-center gap-1 text-emerald-700">
                    <span>{tDraft.midLabel}</span> <span className="text-sm">{sectors.mid}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-400" />
                  <div className="flex items-center gap-1 text-blue-700">
                    <span>{tDraft.defLabel}</span> <span className="text-sm">{sectors.def}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedPlayer && (
               <div className="bg-amber-400 border-4 border-[#00183F] p-3 mb-4 flex justify-between items-center shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                 <span className="text-[#00183F] font-black uppercase text-xs md:text-sm">
                   {tDraft.choosePos(selectedPlayer.name)}
                 </span>
                 <button onClick={handleCancel} className="bg-rose-500 text-white font-black text-xs px-2 py-1 border-2 border-[#00183F] hover:bg-rose-600 transition-colors">
                   {tDraft.cancel}
                 </button>
               </div>
            )}
            {swapSourceSlot && !selectedPlayer && (
               <div className="bg-sky-400 border-4 border-[#00183F] p-3 mb-4 flex justify-between items-center shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                 <span className="text-[#00183F] font-black uppercase text-xs md:text-sm">
                   {tDraft.swapPos(swapSourceSlot.player?.name ?? "")}
                 </span>
                 <button onClick={handleCancel} className="bg-rose-500 text-white font-black text-xs px-2 py-1 border-2 border-[#00183F] hover:bg-rose-600 transition-colors">
                   {tDraft.cancel}
                 </button>
               </div>
            )}
            <div className="flex-1 flex flex-col justify-center">
              <FootballPitch
                slots={slots}
                formation={formation}
                onSlotClick={handleSlotClick}
                highlightedSlots={highlightedSlotIds}
                manager={manager}
              />
            </div>
          </Card>
        </div>
      </div>



      {showChemModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#D9D9D9] border-4 border-[#00183F] p-6 max-w-lg w-full text-[#00183F] shadow-[10px_10px_0_0_#0033A0] flex flex-col relative">
            <button
              onClick={() => setShowChemModal(false)}
              className="absolute top-2 right-2 text-2xl font-black text-[#00183F] hover:text-red-600 transition-colors"
            >
              ×
            </button>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">{tDraft.chemTitle}</h2>

            <ul className="space-y-3 font-bold text-sm">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#22c55e] border border-[#00183F] rounded-full inline-block"></span>
                <span>{tDraft.chem100}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#eab308] border border-[#00183F] rounded-full inline-block"></span>
                <span>{tDraft.chem90}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#f97316] border border-[#00183F] rounded-full inline-block"></span>
                <span>{tDraft.chem85}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#3b82f6] border border-[#00183F] rounded-full inline-block"></span>
                <span>{tDraft.chem75}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#ef4444] border border-[#00183F] rounded-full inline-block"></span>
                <span>{tDraft.chem65}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 bg-white/60 border border-[#00183F] rounded-full inline-block"></span>
                <span>{tDraft.chem40}</span>
              </li>
            </ul>

            <div className="mt-4 pt-4 border-t-2 border-[#00183F] border-dashed">
              <h3 className="font-black uppercase mb-1">{tDraft.chemManagerTitle}</h3>
              <p className="text-xs font-bold text-[#00183F] leading-tight">
                {tDraft.chemManagerDesc(<strong className="text-[#0033A0] text-sm">GIGANTE</strong> as any)}
              </p>
            </div>

            <button
              onClick={() => setShowChemModal(false)}
              className="mt-6 w-full bg-[#0033A0] text-white border-2 border-[#00183F] py-3 font-black uppercase tracking-widest shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#00183F] transition-all text-lg"
            >
              {tDraft.chemClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}