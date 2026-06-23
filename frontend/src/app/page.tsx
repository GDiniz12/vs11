"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import LanguageSelector from "@/components/LanguageSelector";
import FootballPitch from "@/components/FootballPitch";
import { getFormationSlots } from "@/utils/formations";
import { Player, FormationSlot } from "@/types";

const demoPlayers: Player[] = [
  { name: "Neuer",      overall: 94, positions: ["GOL"],       nationality: "🇩🇪", teamName: "Bayern Munich", teamKey: "bayern-munich-2020" },
  { name: "D. Alves",   overall: 89, positions: ["LD", "MD"],  nationality: "🇧🇷", teamName: "Barcelona",     teamKey: "barcelona-2011" },
  { name: "Van Dijk",   overall: 95, positions: ["ZAG"],       nationality: "🇳🇱", teamName: "Liverpool",     teamKey: "liverpool-2019" },
  { name: "S. Ramos",   overall: 90, positions: ["ZAG"],       nationality: "🇪🇸", teamName: "Real Madrid",   teamKey: "real-madrid-2017" },
  { name: "R. Carlos",  overall: 91, positions: ["LE", "ME"],  nationality: "🇧🇷", teamName: "Real Madrid",   teamKey: "real-madrid-2002" },
  { name: "Rodri",      overall: 92, positions: ["VOL", "MC"], nationality: "🇪🇸", teamName: "Man City",      teamKey: "manchester-city-2023" },
  { name: "Iniesta",    overall: 93, positions: ["MC", "MEI"], nationality: "🇪🇸", teamName: "Barcelona",     teamKey: "barcelona-2011" },
  { name: "Zidane",     overall: 94, positions: ["MEI", "MC"], nationality: "🇫🇷", teamName: "Real Madrid",   teamKey: "real-madrid-2002" },
  { name: "Vini Jr.",   overall: 93, positions: ["PE", "CA"],  nationality: "🇧🇷", teamName: "Real Madrid",   teamKey: "real-madrid-2024" },
  { name: "C. Ronaldo", overall: 97, positions: ["CA", "PE"],  nationality: "🇵🇹", teamName: "Real Madrid",   teamKey: "real-madrid-2017" },
  { name: "Messi",      overall: 97, positions: ["PD", "MEI"], nationality: "🇦🇷", teamName: "Barcelona",     teamKey: "barcelona-2011" },
];

const demoSlots: FormationSlot[] = getFormationSlots("4-3-3").map((slot, i) => ({
  ...slot,
  player: demoPlayers[i],
}));

const avgOvr = Math.round(demoPlayers.reduce((s, p) => s + p.overall, 0) / demoPlayers.length);

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
        <div className="w-full max-w-[420px]">

          {/* Pitch header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 font-black text-[10px] uppercase tracking-widest">{t.pitchLabel}</p>
            <span className="bg-[#0033A0] border-2 border-white/30 text-white text-[9px] font-black uppercase px-2 py-0.5 tracking-wider">
              4-3-3
            </span>
          </div>

          {/* The Pitch */}
          <FootballPitch slots={demoSlots} formation="4-3-3" />

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
