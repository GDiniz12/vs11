"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useLanguage } from "@/context/LanguageContext";
import LeagueTable from "@/components/LeagueTable";
import MatchResultCard from "@/components/MatchResultCard";


export default function BrasileiraoPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { brasilRounds, userTeamName, isChampion, clearSave, setPhase } = useGame();
  const isPt = lang === "pt";

  const [displayedRound, setDisplayedRound] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!brasilRounds || brasilRounds.length === 0) {
      router.replace("/");
    }
  }, [brasilRounds, router]);

  if (!brasilRounds || brasilRounds.length === 0) return null;

  const totalRounds = brasilRounds.length; // 38
  const currentData = brasilRounds[displayedRound];
  const isLastRound = displayedRound === totalRounds - 1;
  const isFinal = showAll || isLastRound;

  const finalStandings = brasilRounds[totalRounds - 1].standingsAfterRound;
  // Match by name, not isUser — in online mode multiple humans have isUser: true
  const userPosition = finalStandings.findIndex((t) => t.name === userTeamName);
  const userIsChampion = isChampion;

  const handleSimulateAll = () => {
    setShowAll(true);
    setDisplayedRound(totalRounds - 1);
  };

  const handleNextRound = () => {
    if (!isLastRound) setDisplayedRound((r) => r + 1);
  };

  const handleBackToMenu = () => {
    clearSave();
    router.push("/");
  };

  const standings = isFinal
    ? finalStandings
    : currentData.standingsAfterRound;

  const progress = ((displayedRound + 1) / totalRounds) * 100;

  return (
    <div className="min-h-screen bg-[#00183F] px-4 py-10 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8 border-4 border-white bg-[#D9D9D9] p-6 shadow-[8px_8px_0_0_#0a5a00]"
        >
          <h1 className="text-4xl md:text-6xl font-black text-[#00183F] uppercase tracking-tight">
            BRASILEIRÃO
          </h1>
          <p className="text-lg text-[#0a5a00] font-black uppercase tracking-widest bg-white border-2 border-[#00183F] inline-block px-4 py-1 mt-2">
            {isFinal
              ? isPt ? "CLASSIFICAÇÃO FINAL" : "FINAL STANDINGS"
              : isPt ? `RODADA ${currentData.roundNumber} DE ${totalRounds}` : `ROUND ${currentData.roundNumber} OF ${totalRounds}`}
          </p>
        </motion.div>

        {/* Progress bar */}
        {!isFinal && (
          <div className="mb-6 border-2 border-white/30 bg-white/10 h-3">
            <motion.div
              className="h-full bg-emerald-400"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Champion / result banner (final only) */}
        {isFinal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`border-4 p-6 text-center mb-8 ${
              userIsChampion
                ? "border-amber-400 bg-amber-900/30 shadow-[8px_8px_0_0_#92400e]"
                : "border-white/40 bg-white/5 shadow-[8px_8px_0_0_rgba(0,0,0,0.3)]"
            }`}
          >
            {userIsChampion ? (
              <>
                <p className="text-amber-400 font-black text-xs uppercase tracking-widest mb-1">
                  {isPt ? "CAMPEÃO BRASILEIRO!" : "BRAZILIAN CHAMPION!"}
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase">
                  🏆 {userTeamName}
                </h2>
              </>
            ) : (
              <>
                <p className="text-white/60 font-black text-xs uppercase tracking-widest mb-1">
                  {isPt ? "CLASSIFICAÇÃO FINAL" : "FINAL STANDING"}
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase">
                  {isPt ? `${userPosition + 1}º LUGAR` : `${userPosition + 1}${["ST","ND","RD"][userPosition] || "TH"} PLACE`}
                </h2>
                {userPosition >= 16 && (
                  <p className="text-rose-400 font-black text-sm uppercase mt-1">
                    {isPt ? "Rebaixado" : "Relegated"}
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* User match for the current round */}
        {!isFinal && currentData.userMatch && (
          <AnimatePresence mode="wait">
            <motion.div
              key={displayedRound}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="mb-6"
            >
              <MatchResultCard
                match={currentData.userMatch}
                userTeamName={userTeamName}
                stage={isPt ? `Rodada ${currentData.roundNumber}` : `Round ${currentData.roundNumber}`}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Action buttons */}
        {!isFinal && (
          <div className="flex gap-4 mb-8">
            <motion.button
              whileHover={{ translateY: -2, translateX: -2, boxShadow: "8px 8px 0 0 #064e3b" }}
              whileTap={{ translateY: 1, translateX: 1, boxShadow: "0px 0px 0 0 #064e3b" }}
              onClick={handleSimulateAll}
              className="flex-1 py-4 bg-emerald-700 text-white border-4 border-emerald-400 font-black text-base uppercase tracking-widest shadow-[4px_4px_0_0_#064e3b]"
            >
              {isPt ? "Simular Tudo" : "Simulate All"}
            </motion.button>
            <motion.button
              whileHover={{ translateY: -2, translateX: -2, boxShadow: "8px 8px 0 0 #001a6e" }}
              whileTap={{ translateY: 1, translateX: 1, boxShadow: "0px 0px 0 0 #001a6e" }}
              onClick={handleNextRound}
              disabled={isLastRound}
              className="flex-1 py-4 bg-[#D9D9D9] text-[#00183F] border-4 border-[#00183F] font-black text-base uppercase tracking-widest shadow-[4px_4px_0_0_#0033A0] disabled:opacity-40"
            >
              {isLastRound
                ? isPt ? "Última Rodada" : "Last Round"
                : isPt ? `Rodada ${displayedRound + 2} →` : `Round ${displayedRound + 2} →`}
            </motion.button>
          </div>
        )}

        {/* Standings table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-white/50 font-black text-xs uppercase tracking-widest mb-2">
            {isFinal
              ? isPt ? "CLASSIFICAÇÃO FINAL" : "FINAL TABLE"
              : isPt ? `CLASSIFICAÇÃO APÓS RODADA ${currentData.roundNumber}` : `STANDINGS AFTER ROUND ${currentData.roundNumber}`}
          </p>

          <LeagueTable table={standings} />
        </motion.div>

        {/* Back to menu / See Results (final only) */}
        {isFinal && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ translateY: -2, translateX: -2, boxShadow: "10px 10px 0 0 #001a6e" }}
              whileTap={{ translateY: 2, translateX: 2, boxShadow: "0px 0px 0 0 #001a6e" }}
              onClick={() => { setPhase("result"); router.push("/result"); }}
              className="px-10 py-5 bg-[#0033A0] text-white border-4 border-[#00183F] font-black text-xl uppercase tracking-widest shadow-[6px_6px_0_0_#00183F]"
            >
              {isPt ? "Ver Resultados" : "See Results"}
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ translateY: -2, translateX: -2, boxShadow: "10px 10px 0 0 #001a6e" }}
              whileTap={{ translateY: 2, translateX: 2, boxShadow: "0px 0px 0 0 #001a6e" }}
              onClick={handleBackToMenu}
              className="px-10 py-5 bg-[#D9D9D9] text-[#00183F] border-4 border-[#00183F] font-black text-xl uppercase tracking-widest shadow-[6px_6px_0_0_#0033A0]"
            >
              {isPt ? "Montar Novo Time" : "Build New Squad"}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
