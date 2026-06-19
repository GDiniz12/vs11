"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSocket } from "@/context/SocketContext"; 
import { FormationType } from "@/types";
import FootballPitch from "@/components/FootballPitch";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { TRANSLATIONS } from "@/lib/constants";

const formations: FormationType[] = ["4-3-3", "4-4-2", "3-4-3", "3-5-2", "5-4-1", "4-2-3-1"];

export default function FormationPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { currentRoom } = useSocket(); 
  const {
    formation, setFormation,
    gameMode, setGameMode,
    tactic, setTactic,
    difficulty, setDifficulty,
    isRanked, setIsRanked,
    slots, drawNextTeam, setPhase,
    setTournamentMode,
  } = useGame();

  // Sincroniza as regras da sala criadas pelo host para a máquina local do jogador
  useEffect(() => {
    if (currentRoom) {
      setGameMode(currentRoom.draftMode || "classic");
      if (currentRoom.tournamentMode) {
        setTournamentMode(currentRoom.tournamentMode);
      }
      if (currentRoom.mode === 'tradicional') {
        setDifficulty(currentRoom.difficulty || "medium");
      }
    }
  }, [currentRoom, setGameMode, setDifficulty, setTournamentMode]);

  const [infoModal, setInfoModal] = React.useState<string | null>(null);

  const handleBegin = () => {
    if (!formation) return;
    setPhase("draft");
    drawNextTeam();
    router.push("/draft");
  };

  const { user } = useAuth();
  const t = TRANSLATIONS[lang];
  const isPt = lang === "pt";

  const getSubtitle = () => {
    if (!currentRoom) return t.choose_formation_sub;
    const draftLabel = currentRoom.draftMode === 'hardcore' ? 'Hardcore' : 'Clássico';
    if (currentRoom.mode === 'guerra') return `Online: GUERRA (Mata-Mata Direto) | Draft: ${draftLabel}`;
    const diffLabel = currentRoom.difficulty === 'impossible' ? 'Impossível' : currentRoom.difficulty === 'easy' ? 'Fácil' : 'Médio';
    return `Online: Tradicional | Draft: ${draftLabel} | Dif: ${diffLabel}`;
  };

  const infoTexts: Record<string, { title: string, content: string }> = {
    classic: {
      title: isPt ? "Modo Clássico" : "Classic Mode",
      content: isPt 
        ? "No modo clássico, o seu time participará de uma fase de pontos corridos com outros 35 times (formato de liga, como o novo formato da Champions League). Os 16 melhores avançam para a fase de mata-mata! É um campeonato mais longo e permite se recuperar de eventuais tropeços." 
        : "In classic mode, your team will play in a league phase against 35 other teams (Champions League style format). The top 16 advance to the knockout stage! It's a longer tournament and allows you to recover from mistakes."
    },
    hardcore: {
      title: isPt ? "Modo Hardcore" : "Hardcore Mode",
      content: isPt
        ? "No modo hardcore, o campeonato funciona da mesma forma que o clássico, com fase de liga e mata-mata.\n\nA diferença é a dificuldade extrema na montagem do time: você terá apenas 1 opção de refazer escolha (re-roll), e as cartas dos jogadores não mostrarão o overall nem a nacionalidade. Você precisa conhecer o jogador pelo nome e clube!"
        : "In hardcore mode, the tournament works just like classic mode, with a league phase and knockout stage.\n\nThe difference is the extreme difficulty when drafting: you will only have 1 re-roll option, and the player cards will hide their overall rating and nationality. You must know the player by name and club!"
    },
    defensive: {
      title: isPt ? "Tática Defensiva" : "Defensive Tactic",
      content: isPt
        ? "Foco na defesa (Retranca).\n\nPrós: Reduz drasticamente as chances do adversário marcar e fortalece o seu sistema defensivo.\nContras: Sua equipe fará menos gols e terá muita dificuldade contra defesas muito fechadas."
        : "Focus on defense.\n\nPros: Drastically reduces the opponent's chances of scoring and strengthens your defensive line.\nCons: Your team will score fewer goals and struggle against deep defenses."
    },
    balanced: {
      title: isPt ? "Tática Equilibrada" : "Balanced Tactic",
      content: isPt
        ? "O time ataca e defende de forma padronizada.\n\nSem expor muito a defesa, mas também sem sufocar o adversário no ataque. Ideal para quando você tem um time muito bem balanceado e não quer se arriscar muito."
        : "Standard attack and defense.\n\nDoesn't expose the defense too much, but also doesn't overwhelm the opponent in attack. Ideal when you have a very balanced team and don't want to take extreme risks."
    },
    offensive: {
      title: isPt ? "Tática Ofensiva" : "Offensive Tactic",
      content: isPt
        ? "Foco total no ataque (Pressão).\n\nPrós: Aumenta muito as chances de marcar gols e dominar a posse de bola no ataque.\nContras: Deixa sua defesa vulnerável a contra-ataques, podendo sofrer muitos gols se o adversário for forte e rápido."
        : "Total focus on attack.\n\nPros: Greatly increases chances of scoring and dominating possession.\nCons: Leaves your defense vulnerable to counterattacks, risking many conceded goals against strong opponents."
    }
  };

  return (
    <div className="min-h-screen bg-[#00183F] px-4 py-12 flex flex-col items-center font-sans text-white relative">
      {!currentRoom && (
        <button
          onClick={() => router.push("/mode-select")}
          className="absolute top-4 left-4 md:top-6 md:left-6 bg-white text-[#00183F] px-4 py-2 font-black uppercase text-sm border-4 border-transparent hover:border-amber-400 hover:-translate-y-1 transition-all z-40"
        >
          ← {isPt ? 'Voltar' : 'Back'}
        </button>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-10 border-4 border-white bg-[#D9D9D9] p-6 shadow-[8px_8px_0_0_#0033A0]">
          <h1 className="text-3xl md:text-5xl font-black text-[#00183F] mb-2 uppercase tracking-tight">
            {t.choose_formation_title}
          </h1>
          <p className="text-[#0033A0] font-black uppercase tracking-widest text-xs md:text-sm border-l-4 border-[#0033A0] pl-2 inline-block mt-2">
            {getSubtitle()}
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-8 mb-10 w-full items-start ${currentRoom ? "lg:grid-cols-1 max-w-sm mx-auto" : "lg:grid-cols-4"}`}>
          
          {!currentRoom && (
            <>
              <div className="flex flex-col items-center w-full">
                <h2 className="text-sm font-black text-white uppercase tracking-widest border-b-4 border-white/20 pb-2 mb-4 w-full text-center">
                  {isPt ? "Modo" : "Mode"}
                </h2>
                <div className="flex flex-col gap-3 w-full">
                  <button onClick={() => setGameMode("classic")} className={`relative flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 w-full ${gameMode === 'classic' ? 'bg-[#0033A0] text-white translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : 'bg-[#E2E8F0] text-[#00183F] shadow-[4px_4px_0_0_#0033A0] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100'}`}>
                    <span className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                      {isPt ? 'Clássico' : 'Classic'}
                    </span>
                    <div 
                      onClick={(e) => { e.stopPropagation(); setInfoModal('classic'); }}
                      className="absolute right-3 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center border border-current text-sm font-bold transition-colors cursor-help"
                    >
                      ?
                    </div>
                  </button>
                  <button onClick={() => setGameMode("hardcore")} className={`relative flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 w-full ${gameMode === 'hardcore' ? 'bg-rose-600 text-white translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : 'bg-[#1E293B] text-rose-500 shadow-[4px_4px_0_0_#9f1239] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100'}`}>
                    <span className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                      Hardcore
                    </span>
                    <div 
                      onClick={(e) => { e.stopPropagation(); setInfoModal('hardcore'); }}
                      className="absolute right-3 w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center border border-current text-sm font-bold transition-colors cursor-help"
                    >
                      ?
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center w-full">
                <h2 className="text-sm font-black text-white uppercase tracking-widest border-b-4 border-white/20 pb-2 mb-4 w-full text-center">
                  {isPt ? "Dificuldade" : "Difficulty"}
                </h2>
                <div className="flex flex-col gap-3 w-full">
                  <button onClick={() => setDifficulty("easy")} className={`flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 ${difficulty === 'easy' ? 'bg-emerald-600 text-white translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : 'bg-[#E2E8F0] text-[#00183F] shadow-[4px_4px_0_0_#059669] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100'}`}>
                    <span className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                      {isPt ? 'Fácil' : 'Easy'}
                    </span>
                  </button>
                  <button onClick={() => setDifficulty("medium")} className={`flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 ${difficulty === 'medium' ? 'bg-[#0033A0] text-white translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : 'bg-[#E2E8F0] text-[#00183F] shadow-[4px_4px_0_0_#0033A0] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100'}`}>
                    <span className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                      {isPt ? 'Médio' : 'Medium'}
                    </span>
                  </button>
                  <button onClick={() => setDifficulty("impossible")} className={`flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 ${difficulty === 'impossible' ? 'bg-zinc-900 text-red-500 translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : 'bg-[#1E293B] text-red-500 shadow-[4px_4px_0_0_#000000] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100'}`}>
                    <span className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                      {isPt ? 'Impossível' : 'Impossible'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* RANKEADA — offline only, requires account */}
          {!currentRoom && (
            <div className="flex flex-col items-center w-full">
              <h2 className="text-sm font-black text-white uppercase tracking-widest border-b-4 border-white/20 pb-2 mb-4 w-full text-center">
                {isPt ? "Partida" : "Match"}
              </h2>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => user && setIsRanked(false)}
                  className={`flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 ${!isRanked ? 'bg-[#0033A0] text-white translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : 'bg-[#E2E8F0] text-[#00183F] shadow-[4px_4px_0_0_#0033A0] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100'}`}
                >
                  <span className="text-lg font-black uppercase tracking-widest">{isPt ? 'Normal' : 'Normal'}</span>
                </button>
                <button
                  onClick={() => user ? setIsRanked(true) : undefined}
                  title={!user ? (isPt ? 'Faça login para jogar Rankeada' : 'Login to play Ranked') : undefined}
                  className={`flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 ${isRanked ? 'bg-amber-500 text-white translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : user ? 'bg-[#E2E8F0] text-[#00183F] shadow-[4px_4px_0_0_#b45309] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100' : 'bg-[#E2E8F0] text-gray-400 border-gray-300 opacity-40 cursor-not-allowed'}`}
                >
                  <span className="text-lg font-black uppercase tracking-widest">🏆 {isPt ? 'Rankeada' : 'Ranked'}</span>
                  {!user && <span className="text-[10px] font-bold mt-0.5 opacity-60">{isPt ? 'Login necessário' : 'Login required'}</span>}
                </button>
              </div>
            </div>
          )}

          {/* TÁTICA FICA PARA TODOS (Inclusive no online) */}
          <div className="flex flex-col items-center w-full">
            <h2 className="text-sm font-black text-white uppercase tracking-widest border-b-4 border-white/20 pb-2 mb-4 w-full text-center">
              {isPt ? "Sua Tática" : "Your Tactics"}
            </h2>
            <div className="flex flex-col gap-3 w-full">
              <button onClick={() => setTactic("defensive")} className={`relative flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 ${tactic === 'defensive' ? 'bg-cyan-600 text-white translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : 'bg-[#E2E8F0] text-[#00183F] shadow-[4px_4px_0_0_#0891b2] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100'}`}>
                <span className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  {isPt ? 'Defensivo' : 'Defensive'}
                </span>
                <div 
                  onClick={(e) => { e.stopPropagation(); setInfoModal('defensive'); }}
                  className="absolute right-3 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center border border-current text-sm font-bold transition-colors cursor-help"
                >
                  ?
                </div>
              </button>
              <button onClick={() => setTactic("balanced")} className={`relative flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 ${tactic === 'balanced' ? 'bg-[#0033A0] text-white translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : 'bg-[#E2E8F0] text-[#00183F] shadow-[4px_4px_0_0_#0033A0] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100'}`}>
                <span className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  {isPt ? 'Equilibrado' : 'Balanced'}
                </span>
                <div 
                  onClick={(e) => { e.stopPropagation(); setInfoModal('balanced'); }}
                  className="absolute right-3 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center border border-current text-sm font-bold transition-colors cursor-help"
                >
                  ?
                </div>
              </button>
              <button onClick={() => setTactic("offensive")} className={`relative flex flex-col items-center justify-center p-3 border-4 transition-all duration-75 ${tactic === 'offensive' ? 'bg-orange-500 text-white translate-x-[2px] translate-y-[2px] shadow-none border-amber-400' : 'bg-[#E2E8F0] text-[#00183F] shadow-[4px_4px_0_0_#ea580c] hover:-translate-y-1 hover:-translate-x-1 border-[#00183F] opacity-70 hover:opacity-100'}`}>
                <span className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  {isPt ? 'Ofensivo' : 'Offensive'}
                </span>
                <div 
                  onClick={(e) => { e.stopPropagation(); setInfoModal('offensive'); }}
                  className="absolute right-3 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center border border-current text-sm font-bold transition-colors cursor-help"
                >
                  ?
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Seletor de Formações */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-10">
          {formations.map((f) => (
            <button
              key={f}
              onClick={() => setFormation(f)}
              className={`
                px-6 py-3 md:px-8 md:py-4 font-black text-xl md:text-2xl uppercase tracking-widest
                transition-all duration-75 border-4 border-[#00183F] rounded-none
                ${formation === f ? "bg-[#0033A0] text-white translate-x-[2px] translate-y-[2px] shadow-none" : "bg-white text-[#00183F] hover:bg-[#D9D9D9] shadow-[6px_6px_0_0_#0033A0] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_0_#0033A0]"}
              `}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-10">
          {formation ? (
            <FootballPitch key={formation} slots={slots} />
          ) : (
            <div className="w-full max-w-[420px] mx-auto p-2">
              <div className="relative w-full rounded-none border-4 border-dashed border-white/50 bg-[#1A3B2B]/40 shadow-[12px_12px_0_0_rgba(0,0,0,0.5)]" style={{ paddingBottom: "145%" }}>
                <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                  <span className="text-white/60 font-black text-lg md:text-xl uppercase tracking-widest border-b-4 border-white/20 pb-2">
                    {t.select_formation_above}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center pb-12">
          <Button variant="primary" size="lg" onClick={handleBegin} disabled={!formation} className="w-full md:w-auto min-w-[300px]">
            {t.begin_draft}
          </Button>
        </div>
      </motion.div>

      {infoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#D9D9D9] border-4 border-[#00183F] p-6 max-w-lg w-full text-[#00183F] shadow-[10px_10px_0_0_#0033A0] flex flex-col relative">
            <button
              onClick={() => setInfoModal(null)}
              className="absolute top-2 right-2 text-2xl font-black text-[#00183F] hover:text-red-600 transition-colors"
            >
              ×
            </button>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4 border-b-4 border-[#0033A0] pb-2 inline-block self-start">
              {infoTexts[infoModal]?.title}
            </h2>
            <div className="font-bold text-sm md:text-base whitespace-pre-wrap leading-relaxed">
              {infoTexts[infoModal]?.content}
            </div>
            <button
              onClick={() => setInfoModal(null)}
              className="mt-6 w-full bg-[#0033A0] text-white border-2 border-[#00183F] py-3 font-black uppercase tracking-widest shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#00183F] transition-all text-lg"
            >
              {isPt ? "Entendi" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}