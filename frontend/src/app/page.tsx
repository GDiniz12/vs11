"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const dreamTeam = [
  { name: "Pelé", pos: "CA", ovr: 99, team: "Santos '62" },
  { name: "C. Ronaldo", pos: "PE", ovr: 94, team: "Real Madrid '17" },
  { name: "Messi", pos: "PD", ovr: 96, team: "Barcelona '11" },
  { name: "Zidane", pos: "MEI", ovr: 94, team: "Real Madrid '02" },
  { name: "Busquets", pos: "VOL", ovr: 90, team: "Barcelona '15" },
  { name: "Ronaldinho", pos: "MEI", ovr: 92, team: "Atlético-MG '13" },
  { name: "R. Carlos", pos: "LE", ovr: 91, team: "Real Madrid '02" },
  { name: "Maldini", pos: "ZAG", ovr: 91, team: "Milan '94" },
  { name: "S. Ramos", pos: "ZAG", ovr: 90, team: "Real Madrid '14" },
  { name: "Cafu", pos: "LD", ovr: 90, team: "São Paulo '92" },
  { name: "Rogério C.", pos: "GOL", ovr: 91, team: "São Paulo '05" },
];

export default function HomePage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.5 },
    },
  };

  const translations = {
    pt: {
      badge: "O Simulador Definitivo",
      subtitle: <>A Glória Eterna <br /> te aguarda.</>,
      description: <>Construa seu elenco dos sonhos draftando as maiores lendas da <span className="text-amber-400 font-bold"> Copa Libertadores</span> e da <span className="text-blue-400 font-bold"> Champions League</span>. Desafie os maiores times da história e conquiste o topo do mundo.</>,
      button: "Jogar Offline",
      buttonOnline: "Jogar Online",
      footer: "Exemplo de Elenco Supremo"
    },
    en: {
      badge: "The Ultimate Simulator",
      subtitle: <>Eternal Glory <br /> Awaits You.</>,
      description: <>Build your dream squad by drafting the greatest legends from the <span className="text-amber-400 font-bold"> Copa Libertadores</span> and the <span className="text-blue-400 font-bold"> Champions League</span>. Challenge history's biggest teams and conquer the top of the world.</>,
      button: "Play Offline",
      buttonOnline: "Play Online",
      footer: "Supreme Squad Example"
    }
  };

  const t = translations[lang];

  return (
    <div className="relative min-h-screen bg-[#00183F] flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 overflow-hidden gap-12 font-sans">
      
      <LanguageSelector />

      <motion.div
        className="flex-1 w-full max-w-2xl flex flex-col items-start justify-center z-10 pt-12 lg:pt-0"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="bg-plum px-4 py-1 mb-6 border-2 border-white shadow-[4px_4px_0_0_#D9D9D9]">
          <span className="text-white font-bold tracking-widest uppercase text-sm">
            {t.badge}
          </span>
        </div>

        <h1 className="text-7xl md:text-9xl font-black text-white leading-none tracking-tighter drop-shadow-[8px_8px_0_#0033A0]">
          16-0
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mt-6 border-l-8 border-sage pl-4 uppercase">
          {t.subtitle}
        </h2>

        <p className="text-gray-300 mt-6 text-lg md:text-xl max-w-lg leading-relaxed bg-black/20 p-4 border border-white/10 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
          {t.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <motion.button
            onClick={() => router.push("/formation")}
            className="px-8 py-4 bg-[#D9D9D9] text-[#00183F] border-4 border-[#00183F] font-black text-xl uppercase tracking-wider transition-all duration-75 shadow-[6px_6px_0_0_#0033A0]"
            whileHover={{ translateY: -2, translateX: -2, boxShadow: "10px 10px 0 0 #0033A0" }}
            whileTap={{ translateY: 4, translateX: 4, boxShadow: "0px 0px 0 0 #0033A0" }}
          >
            {t.button}
          </motion.button>

          <motion.button
            onClick={() => router.push("/online")}
            className="px-8 py-4 bg-emerald-500 text-[#00183F] border-4 border-[#00183F] font-black text-xl uppercase tracking-wider transition-all duration-75 shadow-[6px_6px_0_0_#00183F]"
            whileHover={{ translateY: -2, translateX: -2, boxShadow: "10px 10px 0 0 #00183F" }}
            whileTap={{ translateY: 4, translateX: 4, boxShadow: "0px 0px 0 0 #00183F" }}
          >
            {t.buttonOnline}
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="flex-1 w-full max-w-lg hidden md:flex flex-col relative z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <div className="w-full bg-[#1A3B2B] border-4 border-white shadow-[16px_16px_0_0_rgba(0,0,0,0.8)] relative p-6 flex flex-col justify-between" style={{ height: "700px" }}>
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/30 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-white/30 -translate-x-1/2 -translate-y-1/2 rounded-none transform rotate-45" />
          <div className="absolute top-0 left-1/2 w-48 h-32 border-b-4 border-l-4 border-r-4 border-white/30 -translate-x-1/2" />
          <div className="absolute bottom-0 left-1/2 w-48 h-32 border-t-4 border-l-4 border-r-4 border-white/30 -translate-x-1/2" />

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="h-full flex flex-col justify-between relative z-10 py-4">
            <div className="flex justify-between px-4">
              <PlayerCard player={dreamTeam[1]} /> 
              <PlayerCard player={dreamTeam[0]} /> 
              <PlayerCard player={dreamTeam[2]} /> 
            </div>
            <div className="flex justify-around px-8 mt-4">
              <PlayerCard player={dreamTeam[5]} /> 
              <PlayerCard player={dreamTeam[4]} className="mt-8" /> 
              <PlayerCard player={dreamTeam[3]} /> 
            </div>
            <div className="flex justify-between px-0 mt-4">
              <PlayerCard player={dreamTeam[6]} /> 
              <PlayerCard player={dreamTeam[7]} /> 
              <PlayerCard player={dreamTeam[8]} /> 
              <PlayerCard player={dreamTeam[9]} /> 
            </div>
            <div className="flex justify-center mt-4">
              <PlayerCard player={dreamTeam[10]} /> 
            </div>
          </motion.div>
        </div>

        <div className="mt-6 text-right">
          <p className="text-sage text-sm font-bold uppercase tracking-widest">
            {t.footer}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function PlayerCard({ player, className = "" }: { player: any; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" } }
      }}
      whileHover={{ scale: 1.1, zIndex: 20, boxShadow: "6px 6px 0 0 #0033A0" }}
      className={`bg-white border-2 border-[#00183F] shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] w-[46px] h-[60px] sm:w-[54px] sm:h-[68px] md:w-[72px] md:h-[85px] flex flex-col relative cursor-default overflow-hidden ${className}`}
    >
      <div className="bg-[#00183F] text-white text-[7px] md:text-[10px] font-black text-center border-b-2 border-[#00183F]">{player.pos}</div>
      <div className="flex-1 flex items-center justify-center bg-[#D9D9D9]">
        <span className={`text-sm md:text-2xl font-black ${player.ovr >= 95 ? 'text-amber-600' : 'text-[#00183F]'}`}>{player.ovr}</span>
      </div>
      <div className="bg-white p-0.5 md:p-1 text-center border-t-2 border-[#00183F]">
        <h3 className="text-[7px] md:text-[9px] font-bold text-[#00183F] leading-none truncate uppercase">{player.name}</h3>
        <p className="text-[5px] md:text-[7px] text-gray-500 font-semibold truncate mt-0.5">{player.team}</p>
      </div>
    </motion.div>
  );
}