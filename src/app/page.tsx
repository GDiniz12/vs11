"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Time dos sonhos combinando Libertadores + Champions League (Baseado no seu data.ts)
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

  // Variantes de animação para os jogadores aparecerem em cascata
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.5 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
  };

  return (
    <div className="min-h-screen bg-[#00183F] flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 overflow-hidden gap-12 font-sans">
      
      {/* LADO ESQUERDO: Textos e Botão */}
      <motion.div
        className="flex-1 w-full max-w-2xl flex flex-col items-start justify-center z-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="bg-plum px-4 py-1 mb-6 border-2 border-white shadow-[4px_4px_0_0_#D9D9D9]">
          <span className="text-white font-bold tracking-widest uppercase text-sm">
            O Simulador Definitivo
          </span>
        </div>

        <h1 className="text-7xl md:text-9xl font-black text-white leading-none tracking-tighter drop-shadow-[8px_8px_0_#0033A0]">
          16-0
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mt-6 border-l-8 border-sage pl-4 uppercase">
          A Glória Eterna <br /> te aguarda.
        </h2>

        <p className="text-gray-300 mt-6 text-lg md:text-xl max-w-lg leading-relaxed bg-black/20 p-4 border border-white/10 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
          Construa seu elenco dos sonhos draftando as maiores lendas da 
          <span className="text-amber-400 font-bold"> Copa Libertadores</span> e da 
          <span className="text-blue-400 font-bold"> Champions League</span>. 
          Desafie os maiores times da história e conquiste o topo do mundo.
        </p>

        {/* BOTÃO JOGAR AGORA COM ESTILO NEO-BRUTALISTA */}
        <motion.button
          onClick={() => router.push("/formation")}
          className="mt-10 px-10 py-5 bg-[#D9D9D9] text-[#00183F] border-4 border-[#00183F] font-black text-2xl uppercase tracking-wider transition-all duration-75 shadow-[8px_8px_0_0_#0033A0]"
          whileHover={{ 
            translateY: -2, 
            translateX: -2, 
            boxShadow: "12px 12px 0 0 #0033A0" 
          }}
          whileTap={{ 
            translateY: 8, 
            translateX: 8, 
            boxShadow: "0px 0px 0 0 #0033A0" 
          }}
        >
          Jogar Agora
        </motion.button>
      </motion.div>

      {/* LADO DIREITO: Campo com o Time dos Sonhos */}
      <motion.div
        className="flex-1 w-full max-w-lg hidden md:flex flex-col relative z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <div className="w-full bg-[#1A3B2B] border-4 border-white shadow-[16px_16px_0_0_rgba(0,0,0,0.8)] relative p-6 flex flex-col justify-between" style={{ height: "700px" }}>
          
          {/* Linhas do Campo (Retas, sem círculos) */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/30 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-white/30 -translate-x-1/2 -translate-y-1/2 rounded-none transform rotate-45" /> {/* Losango central no lugar do círculo para manter o tema reto */}
          <div className="absolute top-0 left-1/2 w-48 h-32 border-b-4 border-l-4 border-r-4 border-white/30 -translate-x-1/2" />
          <div className="absolute bottom-0 left-1/2 w-48 h-32 border-t-4 border-l-4 border-r-4 border-white/30 -translate-x-1/2" />

          {/* Jogadores (4-3-3) */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="h-full flex flex-col justify-between relative z-10 py-4">
            
            {/* Ataque */}
            <div className="flex justify-between px-4">
              <PlayerCard player={dreamTeam[1]} /> {/* PE */}
              <PlayerCard player={dreamTeam[0]} /> {/* CA */}
              <PlayerCard player={dreamTeam[2]} /> {/* PD */}
            </div>

            {/* Meio-campo */}
            <div className="flex justify-around px-8 mt-4">
              <PlayerCard player={dreamTeam[5]} /> {/* MEI */}
              <PlayerCard player={dreamTeam[4]} className="mt-8" /> {/* VOL (mais recuado) */}
              <PlayerCard player={dreamTeam[3]} /> {/* MEI */}
            </div>

            {/* Defesa */}
            <div className="flex justify-between px-0 mt-4">
              <PlayerCard player={dreamTeam[6]} /> {/* LE */}
              <PlayerCard player={dreamTeam[7]} /> {/* ZAG */}
              <PlayerCard player={dreamTeam[8]} /> {/* ZAG */}
              <PlayerCard player={dreamTeam[9]} /> {/* LD */}
            </div>

            {/* Goleiro */}
            <div className="flex justify-center mt-4">
              <PlayerCard player={dreamTeam[10]} /> {/* GOL */}
            </div>

          </motion.div>
        </div>

        <div className="mt-6 text-right">
          <p className="text-sage text-sm font-bold uppercase tracking-widest">
            Exemplo de Elenco Supremo
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Componente para o Card do Jogador com design não-arredondado
function PlayerCard({ player, className = "" }: { player: any; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" } }
      }}
      whileHover={{ 
        scale: 1.1, 
        zIndex: 20,
        boxShadow: "6px 6px 0 0 #0033A0"
      }}
      className={`bg-white border-2 border-[#00183F] shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] w-[72px] h-[85px] flex flex-col relative cursor-default ${className}`}
    >
      {/* Posição no topo */}
      <div className="bg-[#00183F] text-white text-[10px] font-black text-center border-b-2 border-[#00183F]">
        {player.pos}
      </div>
      
      {/* OVR em destaque */}
      <div className="flex-1 flex items-center justify-center bg-[#D9D9D9]">
        <span className={`text-2xl font-black ${player.ovr >= 95 ? 'text-amber-600' : 'text-[#00183F]'}`}>
          {player.ovr}
        </span>
      </div>
      
      {/* Nome e Time */}
      <div className="bg-white p-1 text-center border-t-2 border-[#00183F]">
        <h3 className="text-[9px] font-bold text-[#00183F] leading-none truncate uppercase">{player.name}</h3>
        <p className="text-[7px] text-gray-500 font-semibold truncate mt-0.5">{player.team}</p>
      </div>
    </motion.div>
  );
}