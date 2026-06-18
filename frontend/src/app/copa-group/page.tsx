"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useLanguage } from "@/context/LanguageContext";
import { CopaGroup, MatchResult } from "@/types";
import { getNationalTeamFlag } from "@/utils/helpers";
import MatchResultCard from "@/components/MatchResultCard";

/* ─── Group table sub-component ─────────────────────────────────────── */

function TeamLabel({ name, isUser }: { name: string; isUser: boolean }) {
  const flag = getNationalTeamFlag(name);
  const label = name.replace(/\s+\d{4}$/, "").trim();
  return (
    <span className={`flex items-center gap-1 font-black truncate ${isUser ? "text-amber-300" : "text-white"}`} title={name}>
      {flag && <span className="flex-shrink-0 text-[10px]">{flag}</span>}
      <span className="truncate max-w-[72px] text-[11px]">{label}</span>
    </span>
  );
}

function GroupCard({ group, userTeamName, delay }: { group: CopaGroup; userTeamName: string; delay: number }) {
  const { name, teams, matches } = group;
  const isUserGroup = teams.some((t) => t.isUser);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`border-4 ${isUserGroup ? "border-amber-400 shadow-[6px_6px_0_0_#92400e]" : "border-white shadow-[6px_6px_0_0_rgba(0,0,0,0.5)]"}`}
    >
      <div className={`px-3 py-2 flex items-center justify-between ${isUserGroup ? "bg-amber-400" : "bg-white"}`}>
        <span className="font-black text-sm uppercase tracking-widest text-[#00183F]">GRUPO {name}</span>
        {isUserGroup && (
          <span className="text-[9px] font-black uppercase tracking-wider bg-[#00183F] text-amber-400 px-2 py-0.5">
            SEU GRUPO
          </span>
        )}
      </div>

      <table className="w-full text-xs font-black text-white bg-[#00183F]">
        <thead>
          <tr className="border-b-2 border-white/20 text-white/50">
            <th className="text-left pl-2 py-1 uppercase">Seleção</th>
            <th className="py-1 w-6">J</th>
            <th className="py-1 w-6">V</th>
            <th className="py-1 w-6">E</th>
            <th className="py-1 w-6">D</th>
            <th className="py-1 w-7">SG</th>
            <th className="py-1 w-7 pr-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => {
            const qualified = idx < 2;
            return (
              <tr
                key={team.name}
                className={`border-t border-white/10 ${team.isUser ? "bg-amber-400/20" : qualified ? "bg-emerald-900/30" : "bg-rose-900/20"}`}
              >
                <td className="pl-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${qualified ? "bg-emerald-400" : "bg-rose-400"}`} />
                    <TeamLabel name={team.name} isUser={team.isUser} />
                  </div>
                </td>
                <td className="text-center py-1.5 text-white/80">{team.played}</td>
                <td className="text-center py-1.5 text-emerald-400">{team.won}</td>
                <td className="text-center py-1.5 text-white/60">{team.drawn}</td>
                <td className="text-center py-1.5 text-rose-400">{team.lost}</td>
                <td className="text-center py-1.5 text-white/80">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                <td className={`text-center py-1.5 pr-2 font-black ${team.isUser ? "text-amber-300" : "text-white"}`}>{team.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {matches && matches.length > 0 && (
        <div className="border-t-2 border-white/20 bg-[#000f2a]">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/40 px-2 pt-1.5 pb-0.5">Resultados</p>
          {matches.map((m, i) => {
            const isUserMatch = m.homeTeam === userTeamName || m.awayTeam === userTeamName;
            const homeFlag = getNationalTeamFlag(m.homeTeam);
            const awayFlag = getNationalTeamFlag(m.awayTeam);
            const homeShort = m.homeTeam.replace(/\s+\d{4}$/, "");
            const awayShort = m.awayTeam.replace(/\s+\d{4}$/, "");
            return (
              <div key={i} className={`flex items-center text-[10px] font-black py-0.5 px-2 gap-1 ${isUserMatch ? "bg-amber-400/15" : ""}`}>
                <span className={`flex-1 text-right truncate ${m.homeTeam === userTeamName ? "text-amber-300" : "text-white/80"}`}>
                  {homeFlag} {homeShort}
                </span>
                <span className="flex-shrink-0 text-white/60 px-1 text-xs">{m.homeGoals}–{m.awayGoals}</span>
                <span className={`flex-1 truncate ${m.awayTeam === userTeamName ? "text-amber-300" : "text-white/80"}`}>
                  {awayFlag} {awayShort}
                </span>
              </div>
            );
          })}
          <div className="pb-1" />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */

export default function CopaGroupPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { copaGroups, userMatches, userTeamName, startKnockoutPhase, setPhase } = useGame();
  const isPt = lang === "pt";
  const matchesEndRef = useRef<HTMLDivElement>(null);

  const [simulationMode, setSimulationMode] = useState<"automatic" | "accompanied">("accompanied");
  const [currentMinute, setCurrentMinute] = useState(0);
  const [visibleMatches, setVisibleMatches] = useState(0);
  const [showGroups, setShowGroups] = useState(false);

  useEffect(() => {
    if (!copaGroups || copaGroups.length === 0) router.replace("/");
  }, [copaGroups, router]);

  /* Simulation timer — mirrors the tournament page logic exactly */
  useEffect(() => {
    if (!userMatches || userMatches.length === 0) return;
    if (showGroups) return;

    if (simulationMode === "automatic") {
      const interval = setInterval(() => {
        setVisibleMatches((prev) => {
          if (prev < userMatches.length) {
            setTimeout(() => matchesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            return prev + 1;
          }
          clearInterval(interval);
          setTimeout(() => setShowGroups(true), 2000);
          return prev;
        });
      }, 1500);
      return () => clearInterval(interval);
    }

    if (simulationMode === "accompanied") {
      if (visibleMatches < userMatches.length) {
        if (currentMinute <= 90) {
          const timer = setTimeout(() => setCurrentMinute((m) => m + 1), 10000 / 90);
          return () => clearTimeout(timer);
        } else {
          const timer = setTimeout(() => {
            setVisibleMatches((v) => v + 1);
            setCurrentMinute(0);
            setTimeout(() => matchesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }, 2000);
          return () => clearTimeout(timer);
        }
      } else {
        const timer = setTimeout(() => setShowGroups(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [simulationMode, userMatches, visibleMatches, currentMinute, showGroups]);

  if (!copaGroups || copaGroups.length === 0) return null;

  const userGroup = copaGroups.find((g) => g.teams.some((t) => t.isUser));
  const userPosition = userGroup ? userGroup.teams.findIndex((t) => t.isUser) : -1;
  const userQualified = userPosition === 0 || userPosition === 1;

  const handleContinue = () => {
    if (userQualified) {
      startKnockoutPhase();
      router.push("/knockout");
    } else {
      setPhase("result");
      router.push("/result");
    }
  };

  return (
    <div className="min-h-screen bg-[#00183F] px-4 py-10 font-sans text-white">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10 border-4 border-white bg-[#D9D9D9] p-6 shadow-[8px_8px_0_0_#0033A0]"
        >
          <h1 className="text-4xl md:text-6xl font-black text-[#00183F] uppercase tracking-tight">COPA DO MUNDO</h1>
          <p className="text-lg text-[#0033A0] font-black uppercase tracking-widest bg-white border-2 border-[#00183F] inline-block px-4 py-1 mt-2">
            {isPt ? "FASE DE GRUPOS" : "GROUP STAGE"}
          </p>
        </motion.div>

        {/* User match feed */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 border-l-8 border-amber-400 pl-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              {isPt ? "SUAS PARTIDAS" : "YOUR MATCHES"}
            </h2>
            {!showGroups && (
              <button
                onClick={() => setSimulationMode(simulationMode === "automatic" ? "accompanied" : "automatic")}
                className="mt-2 md:mt-0 bg-white text-[#00183F] border-4 border-[#00183F] px-4 py-2 font-black uppercase text-xs md:text-sm hover:bg-amber-400 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transition-all"
              >
                {isPt ? `Trocar para Simulação ${simulationMode === "automatic" ? "Acompanhada" : "Automática"}` : `Switch to ${simulationMode === "automatic" ? "Accompanied" : "Automatic"}`}
              </button>
            )}
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {userMatches.slice(0, visibleMatches + 1).map((match, idx) => {
                if (idx > visibleMatches) return null;
                const isCurrent = idx === visibleMatches;
                if (isCurrent && simulationMode === "automatic") return null;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                  >
                    <MatchResultCard
                      match={match}
                      userTeamName={userTeamName}
                      stage={isPt ? `Jogo ${idx + 1} da Fase de Grupos` : `Group Stage — Game ${idx + 1}`}
                      currentMinute={isCurrent && simulationMode === "accompanied" ? currentMinute : undefined}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={matchesEndRef} />
          </div>
        </div>

        {/* All 8 groups + qualification + continue */}
        {showGroups && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-4 border-l-8 border-white pl-4">
              {isPt ? "TODOS OS GRUPOS" : "ALL GROUPS"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {copaGroups.map((group, i) => (
                <GroupCard key={group.name} group={group} userTeamName={userTeamName} delay={i * 0.05} />
              ))}
            </div>

            {/* Qualification banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className={`border-4 p-6 text-center mb-8 ${
                userQualified
                  ? "border-emerald-400 bg-emerald-900/30 shadow-[8px_8px_0_0_#14532d]"
                  : "border-rose-500 bg-rose-900/30 shadow-[8px_8px_0_0_#7f1d1d]"
              }`}
            >
              {userQualified ? (
                <>
                  <p className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-1">
                    {isPt ? "CLASSIFICADO!" : "QUALIFIED!"}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black text-white uppercase">
                    {isPt ? `${userPosition + 1}º DO GRUPO ${userGroup?.name}` : `${userPosition + 1}${userPosition === 0 ? "ST" : "ND"} IN GROUP ${userGroup?.name}`}
                  </h2>
                  <p className="text-white/70 font-bold mt-2 uppercase text-sm">
                    {isPt ? "Avança para as Oitavas de Final" : "Advances to the Round of 16"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-rose-400 font-black text-xs uppercase tracking-widest mb-1">
                    {isPt ? "ELIMINADO" : "ELIMINATED"}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black text-white uppercase">
                    {isPt ? `${userPosition + 1}º DO GRUPO ${userGroup?.name}` : `${userPosition + 1}${userPosition === 2 ? "RD" : "TH"} IN GROUP ${userGroup?.name}`}
                  </h2>
                  <p className="text-white/70 font-bold mt-2 uppercase text-sm">
                    {isPt ? "Não passou da fase de grupos" : "Did not advance from group stage"}
                  </p>
                </>
              )}
            </motion.div>

            <div className="text-center pb-12">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ translateY: -2, translateX: -2, boxShadow: "10px 10px 0 0 #001a6e" }}
                whileTap={{ translateY: 2, translateX: 2, boxShadow: "0px 0px 0 0 #001a6e" }}
                onClick={handleContinue}
                className="px-10 py-5 bg-[#D9D9D9] text-[#00183F] border-4 border-[#00183F] font-black text-xl uppercase tracking-widest shadow-[6px_6px_0_0_#0033A0]"
              >
                {userQualified
                  ? isPt ? "→ OITAVAS DE FINAL" : "→ ROUND OF 16"
                  : isPt ? "VER RESULTADOS" : "VIEW RESULTS"}
              </motion.button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
