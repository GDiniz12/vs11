"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSocket } from "@/context/SocketContext";
import { checkQualification } from "@/utils/tournament";
import LeagueTable from "@/components/LeagueTable";
import MatchResultCard from "@/components/MatchResultCard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/constants";

export default function TournamentPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { currentRoom } = useSocket();
  const {
    leagueTable,
    userMatches,
    startLeaguePhase,
    userTeamName,
    tournamentMode,
    setPhase,
  } = useGame();

  const [simulationMode, setSimulationMode] = useState<'automatic' | 'accompanied'>('accompanied');
  const [currentMinute, setCurrentMinute] = useState(0);
  const [visibleMatches, setVisibleMatches] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const matchesEndRef = useRef<HTMLDivElement>(null);

  // Guard (A4): this page renders the Super Mundial / Louco league. If we land
  // here in a mode that has its own bracket (e.g. after a refresh restored the
  // wrong phase), redirect instead of generating an incorrect league.
  useEffect(() => {
    if (tournamentMode === 'copa-do-mundo') router.replace('/copa-group');
    else if (tournamentMode === 'brasileirao') router.replace('/brasileirao');
  }, [tournamentMode, router]);

  useEffect(() => {
    if (tournamentMode === 'copa-do-mundo' || tournamentMode === 'brasileirao') return;
    // Se o jogo NÃO for online e a tabela não tiver carregado, simula localmente!
    if (leagueTable.length === 0 && !currentRoom) {
      startLeaguePhase();
    }
  }, [leagueTable.length, startLeaguePhase, currentRoom, tournamentMode]);

  useEffect(() => {
    if (userMatches.length === 0) return;

    if (simulationMode === 'automatic') {
      const interval = setInterval(() => {
        setVisibleMatches((prev) => {
          if (prev < userMatches.length) {
            setTimeout(() => matchesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            return prev + 1;
          }
          clearInterval(interval);
          setTimeout(() => setShowTable(true), 3000);
          return prev;
        });
      }, 1500);
      return () => clearInterval(interval);
    }

    if (simulationMode === 'accompanied') {
      if (visibleMatches < userMatches.length) {
        if (currentMinute <= 90) {
          const timer = setTimeout(() => {
            setCurrentMinute(m => m + 1);
          }, 10000 / 90); // 10s per match
          return () => clearTimeout(timer);
        } else {
          const timer = setTimeout(() => {
            setVisibleMatches(v => v + 1);
            setCurrentMinute(0);
            setTimeout(() => matchesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }, 2000);
          return () => clearTimeout(timer);
        }
      } else {
        setTimeout(() => setShowTable(true), 3000);
      }
    }
  }, [simulationMode, userMatches.length, visibleMatches, currentMinute]);

  if (leagueTable.length === 0) {
    return (
      <div className="min-h-screen bg-[#00183F] flex items-center justify-center">
        <div className="text-white font-black text-2xl uppercase tracking-widest animate-pulse">
          {lang === "pt" ? "Simulando Confrontos..." : "Simulating Matches..."}
        </div>
      </div>
    );
  }

  const { qualified, position } = checkQualification(leagueTable, userTeamName);

  const handleContinue = () => {
    if (qualified) {
      router.push("/knockout");
    } else {
      setPhase("result");
      router.push("/result");
    }
  };

  const title = tournamentMode === 'louco'
    ? (lang === "pt" ? "MODO LOUCOS" : "CRAZY MODE")
    : (lang === "pt" ? "SUPER MUNDIAL DE CLUBES" : "SUPER CLUB WORLD CUP");

  return (
    <div className="min-h-screen bg-[#00183F] px-4 py-10 font-sans text-white">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          
          <div className="text-center mb-10 border-4 border-white bg-[#D9D9D9] p-6 shadow-[8px_8px_0_0_#0033A0]">
            <h1 className="text-4xl md:text-6xl font-black text-[#00183F] mb-2 uppercase tracking-tight">
              {title}
            </h1>
            <p className="text-lg text-[#0033A0] font-black uppercase tracking-widest bg-white border-2 border-[#00183F] inline-block px-4 py-1">
              {TRANSLATIONS[lang].league_phase}
            </p>
          </div>

          <div className="mb-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 border-l-8 border-amber-400 pl-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                {TRANSLATIONS[lang].your_matches}
              </h2>
              {!showTable && (
                <button 
                  onClick={() => setSimulationMode(simulationMode === 'automatic' ? 'accompanied' : 'automatic')}
                  className="mt-2 md:mt-0 bg-white text-[#00183F] border-4 border-[#00183F] px-4 py-2 font-black uppercase text-xs md:text-sm hover:bg-amber-400 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transition-all"
                >
                  {lang === "pt"
                    ? `Trocar para Simulação ${simulationMode === 'automatic' ? 'Acompanhada' : 'Automática'}`
                    : `Switch to ${simulationMode === 'automatic' ? 'Accompanied' : 'Automatic'} Mode`}
                </button>
              )}
            </div>

            <div className="space-y-2">
                <AnimatePresence>
                  {userMatches.slice(0, visibleMatches + 1).map((match, idx) => {
                    // Only render up to visibleMatches completely, and the current match partially if accompanied
                    if (idx > visibleMatches) return null;
                    const isCurrent = idx === visibleMatches;
                    if (isCurrent && simulationMode === 'automatic') return null; // Wait for interval to fully show

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
                          stage={`${lang === "pt" ? "Rodada" : "Round"} ${idx + 1}`}
                          currentMinute={isCurrent && simulationMode === 'accompanied' ? currentMinute : undefined}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={matchesEndRef} />
              </div>
            </div>

          {showTable && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-10">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-4 border-l-8 border-emerald-500 pl-4">
                  {TRANSLATIONS[lang].standings}
                </h2>
                <LeagueTable table={leagueTable} />
                <div className="flex items-center gap-6 mt-4 text-xs font-black uppercase tracking-widest text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white bg-emerald-500" />
                    <span>{TRANSLATIONS[lang].qualified_label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white bg-rose-500" />
                    <span>{TRANSLATIONS[lang].eliminated_label}</span>
                  </div>
                </div>
              </div>

              <Card className="text-center mb-8 border-4 border-white">
                <div className="py-4">
                  {qualified ? (
                    <>
                      <h3 className="text-3xl font-black text-[#0033A0] mt-3 uppercase">
                        {TRANSLATIONS[lang].qualified_title}
                      </h3>
                      <p className="text-[#00183F] mt-2 font-bold text-lg uppercase">
                        {TRANSLATIONS[lang].you_finished}{" "}
                        <span className="font-black text-emerald-600 border-b-4 border-emerald-600">{position}º</span>{" "}
                        {TRANSLATIONS[lang].advance_to_knockout}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-3xl font-black text-rose-600 mt-3 uppercase">
                        {TRANSLATIONS[lang].eliminated_label}
                      </h3>
                      <p className="text-[#00183F] mt-2 font-bold text-lg uppercase">
                        {TRANSLATIONS[lang].you_finished}{" "}
                        <span className="font-black text-rose-600 border-b-4 border-rose-600">{position}º</span>{" "}
                        {TRANSLATIONS[lang].did_not_qualify}
                      </p>
                    </>
                  )}
                </div>
              </Card>

              <div className="text-center mb-10">
                <Button variant="primary" size="lg" onClick={handleContinue} className="w-full md:w-auto">
                  {qualified ? TRANSLATIONS[lang].continue_to_knockout : TRANSLATIONS[lang].view_results}
                </Button>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}