"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import LanguageSelector from "@/components/LanguageSelector";

type DemoPlayer = { name: string; pos: string; ovr: number; team: string; flag: string };

const dreamTeam: DemoPlayer[] = [
  { name: "Neuer",      pos: "GOL", ovr: 94, team: "Bayern '20",       flag: "🇩🇪" },
  { name: "D. Alves",   pos: "LD",  ovr: 89, team: "Barcelona '11",    flag: "🇧🇷" },
  { name: "Van Dijk",   pos: "ZAG", ovr: 95, team: "Liverpool '19",    flag: "🇳🇱" },
  { name: "S. Ramos",   pos: "ZAG", ovr: 90, team: "Real Madrid '17",  flag: "🇪🇸" },
  { name: "R. Carlos",  pos: "LE",  ovr: 91, team: "Real Madrid '02",  flag: "🇧🇷" },
  { name: "Rodri",      pos: "VOL", ovr: 92, team: "Man City '23",     flag: "🇪🇸" },
  { name: "Iniesta",    pos: "MC",  ovr: 93, team: "Barcelona '11",    flag: "🇪🇸" },
  { name: "Zidane",     pos: "MEI", ovr: 94, team: "Real Madrid '02",  flag: "🇫🇷" },
  { name: "Vini Jr.",   pos: "PE",  ovr: 93, team: "Real Madrid '24",  flag: "🇧🇷" },
  { name: "C. Ronaldo", pos: "CA",  ovr: 97, team: "Real Madrid '17",  flag: "🇵🇹" },
  { name: "Messi",      pos: "PD",  ovr: 97, team: "Barcelona '11",    flag: "🇦🇷" },
];

// 4-3-3: ATK → MID → DEF → GK (top to bottom)
const pitchRows: DemoPlayer[][] = [
  [dreamTeam[8], dreamTeam[9], dreamTeam[10]],
  [dreamTeam[7], dreamTeam[6], dreamTeam[5]],
  [dreamTeam[4], dreamTeam[3], dreamTeam[2], dreamTeam[1]],
  [dreamTeam[0]],
];

function posAccent(pos: string): string {
  if (pos === "GOL") return "bg-amber-400 text-[#00183F]";
  if (["LD", "ZAG", "LE"].includes(pos)) return "bg-[#0033A0] text-white";
  if (["VOL", "MC", "MEI", "ME", "MD"].includes(pos)) return "bg-emerald-600 text-white";
  return "bg-rose-600 text-white";
}

function ovrColor(ovr: number): string {
  if (ovr >= 95) return "text-rose-500";
  if (ovr >= 90) return "text-amber-500";
  return "text-[#00183F]";
}

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.85 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

function PlayerCard({ p, className = "" }: { p: DemoPlayer; className?: string }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.18, zIndex: 30, boxShadow: "5px 5px 0 0 #0033A0" }}
      className={`bg-white border-2 border-[#00183F] w-[58px] h-[80px] md:w-[66px] md:h-[90px] flex flex-col overflow-hidden cursor-default select-none shadow-[3px_3px_0_0_rgba(0,0,0,0.65)] ${className}`}
    >
      <div className={`${posAccent(p.pos)} text-[8px] font-black text-center border-b-2 border-[#00183F] py-[3px] uppercase tracking-wide`}>
        {p.pos}
      </div>
      <div className="flex-1 bg-[#D9D9D9] flex flex-col items-center justify-center gap-0.5">
        <span className={`text-[21px] md:text-2xl font-black leading-none ${ovrColor(p.ovr)}`}>{p.ovr}</span>
        <span className="text-[12px]">{p.flag}</span>
      </div>
      <div className="bg-white border-t-2 border-[#00183F] py-[3px] px-[3px] text-center">
        <p className="text-[7px] md:text-[8px] font-black text-[#00183F] truncate uppercase leading-none">{p.name}</p>
        <p className="text-[5px] md:text-[6px] text-gray-400 font-semibold truncate mt-[2px]">{p.team}</p>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user, logout, isLoading } = useAuth();
  const [hallModal, setHallModal] = useState(false);
  const [hallRanking, setHallRanking] = useState<{ nickname: string; rating: number }[]>([]);
  const [hallLoading, setHallLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const openHall = async () => {
    setHallModal(true);
    setHallLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/hall-da-fama`);
      const data = await res.json();
      setHallRanking(data.ranking || []);
    } catch {
      setHallRanking([]);
    }
    setHallLoading(false);
  };

  const t = lang === "pt"
    ? {
        badge: "O Simulador Definitivo de Futebol",
        h1: "A Glória",
        h2: "te Aguarda.",
        desc: "Draftie as maiores lendas da Libertadores e da Champions. Monte seu 11, enfrente os maiores da história e prove quem manda.",
        btnOffline: "Jogar Offline",
        btnOnline: "Jogar Online",
        btnHall: "Hall da Fama",
        pitchLabel: "Elenco Supremo · Exemplo",
        avgLabel: "OVR Médio",
        s1n: "40+",  s1l: "Times Históricos",
        s2n: "440+", s2l: "Lendas",
        s3n: "2",    s3l: "Modos",
        login: "Entrar",
        register: "Criar Conta",
        logout: "Sair",
        rating: "Rating",
        hallTitle: "Hall da Fama",
        hallEmpty: "Nenhum jogador ainda.",
        hallClose: "Fechar",
      }
    : {
        badge: "The Ultimate Football Simulator",
        h1: "Eternal Glory",
        h2: "Awaits You.",
        desc: "Draft the greatest legends from the Libertadores and Champions League. Build your squad, face the best clubs in history, and prove you're the boss.",
        btnOffline: "Play Offline",
        btnOnline: "Play Online",
        btnHall: "Hall of Fame",
        pitchLabel: "Supreme Squad · Example",
        avgLabel: "Avg OVR",
        s1n: "40+",  s1l: "Historic Clubs",
        s2n: "440+", s2l: "Legends",
        s3n: "2",    s3l: "Modes",
        login: "Login",
        register: "Sign Up",
        logout: "Logout",
        rating: "Rating",
        hallTitle: "Hall of Fame",
        hallEmpty: "No players yet.",
        hallClose: "Close",
      };

  const avgOvr = Math.round(dreamTeam.reduce((s, p) => s + p.ovr, 0) / dreamTeam.length);

  const ctaButtons = [
    { label: t.btnOffline, bg: "bg-[#D9D9D9]", tc: "text-[#00183F]", shadow: "#0033A0", border: "border-[#00183F]", onClick: () => router.push("/mode-select") },
    { label: t.btnOnline,  bg: "bg-emerald-500", tc: "text-[#00183F]", shadow: "#00183F", border: "border-[#00183F]", onClick: () => router.push("/online") },
    { label: `🏆 ${t.btnHall}`, bg: "bg-amber-400", tc: "text-[#00183F]", shadow: "#b45309", border: "border-[#00183F]", onClick: openHall },
  ];

  return (
    <div className="relative min-h-screen bg-[#00183F] flex flex-col lg:flex-row overflow-hidden font-sans">

      {/* Dot grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.04,
          backgroundImage: "radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Diagonal accent — desktop only */}
      <div
        className="absolute inset-0 pointer-events-none hidden lg:block"
        style={{
          background: "linear-gradient(135deg, transparent 55%, rgba(0,51,160,0.08) 55%)",
        }}
      />

      {/* ── TOP BAR ─────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3 border-b border-white/10">
        {!isLoading && (
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div>
                  <p className="text-white font-black text-sm uppercase leading-none tracking-wide">{user.nickname}</p>
                  <p className="text-amber-400 text-xs font-bold mt-0.5">{t.rating}: {user.rating}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1 border-2 border-white/30 text-white/60 font-bold text-xs uppercase hover:border-white hover:text-white transition-all"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-1.5 border-2 border-white/40 text-white font-bold text-xs uppercase hover:border-white transition-all"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="px-4 py-1.5 bg-emerald-500 border-2 border-emerald-600 text-[#00183F] font-black text-xs uppercase hover:bg-emerald-400 transition-all"
                >
                  {t.register}
                </button>
              </>
            )}
          </div>
        )}
        <LanguageSelector />
      </div>

      {/* ── LEFT PANEL ──────────────────────────── */}
      <motion.div
        className="lg:w-[55%] flex flex-col justify-center px-6 lg:px-16 z-10 pt-20 pb-10 lg:py-0"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        {/* Badge */}
        <div className="self-start flex items-center gap-2 border-2 border-white/30 px-3 py-1.5 mb-7">
          <div className="w-2 h-2 bg-amber-400 flex-shrink-0" />
          <span className="text-white/80 font-bold tracking-widest uppercase text-xs">{t.badge}</span>
        </div>

        {/* Logo — displayed inside a white card so the PNG background blends cleanly */}
        <div className="self-start mb-7">
          <div className="inline-flex items-center bg-white border-4 border-[#00183F] shadow-[8px_8px_0_0_#0033A0] px-5 py-3">
            <Image
              src="/logo.png"
              alt="VS11"
              width={154}
              height={58}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Headline */}
        <div className="border-l-8 border-amber-400 pl-5 mb-6">
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-black text-white uppercase leading-[0.9] tracking-tighter">
            {t.h1}
          </h1>
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-black text-amber-400 uppercase leading-[0.9] tracking-tighter">
            {t.h2}
          </h1>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-base md:text-[17px] leading-relaxed max-w-md mb-8">
          {t.desc}
        </p>

        {/* Stats */}
        <div className="flex gap-3 mb-9">
          {[
            { n: t.s1n, l: t.s1l },
            { n: t.s2n, l: t.s2l },
            { n: t.s3n, l: t.s3l },
          ].map(({ n, l }) => (
            <div key={l} className="flex-1 max-w-[108px] border-2 border-white/20 bg-white/5 py-3 text-center">
              <p className="text-white font-black text-xl leading-none">{n}</p>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider mt-1.5 leading-tight">{l}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3">
          {ctaButtons.map(({ label, bg, tc, shadow, border, onClick }) => (
            <motion.button
              key={label}
              onClick={onClick}
              className={`px-6 py-3 ${bg} ${tc} ${border} border-4 font-black text-base uppercase tracking-wide transition-colors`}
              style={{ boxShadow: `5px 5px 0 0 ${shadow}` }}
              whileHover={{ translateY: -2, translateX: -2, boxShadow: `9px 9px 0 0 ${shadow}` }}
              whileTap={{ translateY: 3, translateX: 3, boxShadow: `0px 0px 0 0 ${shadow}` }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── RIGHT PANEL: PITCH ───────────────────── */}
      <motion.div
        className="hidden md:flex lg:w-[45%] items-center justify-center px-6 py-10 lg:py-12 z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.18 }}
      >
        <div className="w-full max-w-[290px]">

          {/* Pitch header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 font-black text-[10px] uppercase tracking-widest">{t.pitchLabel}</p>
            <span className="bg-[#0033A0] border-2 border-white/30 text-white text-[9px] font-black uppercase px-2 py-0.5 tracking-wider">
              4-3-3
            </span>
          </div>

          {/* The Pitch */}
          <div
            className="bg-[#1B4A28] border-4 border-white shadow-[16px_16px_0_0_rgba(0,0,0,0.75)] relative overflow-hidden"
            style={{ height: 510 }}
          >
            {/* Pitch markings */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
              <div className="absolute top-1/2 left-1/2 w-[72px] h-[72px] border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-12 border-b border-l border-r border-white/15" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-12 border-t border-l border-r border-white/15" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-6 border-b border-l border-r border-white/10" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-6 border-t border-l border-r border-white/10" />
            </div>

            {/* Player cards */}
            <motion.div
              className="relative z-10 h-full flex flex-col justify-between py-4 px-2"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.35 } },
              }}
              initial="hidden"
              animate="show"
            >
              {pitchRows.map((row, ri) => (
                <div key={ri} className="flex items-center justify-around w-full">
                  {row.map((p, pi) => (
                    <PlayerCard key={pi} p={p} />
                  ))}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Footer: avg OVR + position legend */}
          <div className="mt-4 flex items-end justify-between">
            <div className="border-l-4 border-amber-400 pl-3">
              <p className="text-amber-400/70 text-[9px] font-black uppercase tracking-widest">{t.avgLabel}</p>
              <p className="text-white text-3xl font-black leading-none">{avgOvr}</p>
            </div>
            <div className="flex gap-2">
              {[
                ["GOL", "bg-amber-400/20 border-amber-400/60 text-amber-400"],
                ["DEF", "bg-[#0033A0]/30 border-[#0033A0]/60 text-blue-300"],
                ["MID", "bg-emerald-600/20 border-emerald-600/60 text-emerald-400"],
                ["ATK", "bg-rose-600/20 border-rose-600/60 text-rose-400"],
              ].map(([label, cls]) => (
                <span key={label} className={`${cls} border text-[8px] font-black uppercase px-1.5 py-0.5`}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── HALL DA FAMA MODAL ───────────────────── */}
      {hallModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setHallModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#D9D9D9] border-4 border-[#00183F] max-w-md w-full text-[#00183F] shadow-[12px_12px_0_0_#0033A0] flex flex-col"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed header */}
            <div className="px-6 pt-6 pb-3 border-b-4 border-[#0033A0] flex-shrink-0">
              <h2 className="text-3xl font-black uppercase tracking-tight">
                🏆 {t.hallTitle}
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0033A0] mt-1">Top 10 · Rating</p>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {hallLoading ? (
                <div className="py-10 text-center font-black uppercase text-gray-400 tracking-widest">...</div>
              ) : hallRanking.length === 0 ? (
                <p className="py-10 text-center font-bold text-gray-500">{t.hallEmpty}</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {hallRanking.map((entry, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 border-4 border-[#00183F] font-black uppercase shadow-[3px_3px_0_0_#00183F] ${
                        i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-300" : i === 2 ? "bg-orange-300" : "bg-white"
                      }`}
                    >
                      <span className="text-xl w-8 text-center flex-shrink-0">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <span className="flex-1 text-sm tracking-widest truncate">{entry.nickname}</span>
                      <span className="text-sm flex-shrink-0">{entry.rating} pts</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Fixed close button */}
            <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t-4 border-[#0033A0]">
              <button
                onClick={() => setHallModal(false)}
                className="w-full bg-[#0033A0] text-white border-2 border-[#00183F] py-3 font-black uppercase tracking-widest shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#00183F] transition-all text-lg"
              >
                {t.hallClose}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
