"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSocket } from "@/context/SocketContext"; // <--- NOVO
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
  const { currentRoom } = useSocket(); // <--- NOVO
  const {
    leagueTable,
    userMatches,
    startLeaguePhase,
    startKnockoutPhase,
    userTeamName,
    setPhase,
  } = useGame();

  const [visibleMatches, setVisibleMatches] = useState(0);
  const matchesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Se o jogo NÃO for online e a tabela não tiver carregado, simula localmente!
    if (leagueTable.length === 0 && !currentRoom) {
      startLeaguePhase();
    }
  }, [leagueTable.length, startLeaguePhase, currentRoom]);

  useEffect(() => {
    if (userMatches.length === 0) return;
    
    const interval = setInterval(() => {
      setVisibleMatches((prev) => {
        if (prev < userMatches.length) {
          setTimeout(() => matchesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [userMatches]);

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
  const showRemainingContent = visibleMatches === userMatches.length;

  const handleContinue = () => {
    if (qualified) {
      if (!currentRoom) startKnockoutPhase(); // Mata-mata já vem preenchido do backend se for Online!
      router.push("/knockout");
    } else {
      setPhase("result");
      router.push("/result");
    }
  };

  const title = lang === "pt" ? "SUPER MUNDIAL DE CLUBES" : "SUPER CLUB WORLD CUP";

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
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-4 border-l-8 border-amber-400 pl-4">
              {TRANSLATIONS[lang].your_matches}
            </h2>
            <div className="space-y-2">
              <AnimatePresence>
                {userMatches.slice(0, visibleMatches).map((match, idx) => (
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
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={matchesEndRef} />
            </div>
          </div>

          {showRemainingContent && (
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