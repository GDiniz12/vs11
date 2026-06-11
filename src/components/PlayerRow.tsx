"use client";

import React from "react";
import { Player } from "@/types";
import { POSITION_LABELS_MAP } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

interface PlayerRowProps {
  player: Player;
  disabled: boolean;
  onClick: () => void;
  isSelected?: boolean;
  hideOverall?: boolean; 
}

export default function PlayerRow({
  player,
  disabled,
  onClick,
  isSelected = false,
  hideOverall = false,
}: PlayerRowProps) {
  const { lang } = useLanguage();

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-none border-2 border-[#00183F]
        transition-all duration-100 mb-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.4)]
        ${
          disabled
            ? "opacity-20 cursor-not-allowed bg-gray-200 shadow-none border-gray-400 text-gray-500"
            : "cursor-pointer bg-white text-[#00183F] hover:bg-[#D9D9D9]/50 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]"
        }
        ${isSelected ? "bg-[#0033A0]/10 border-4 border-[#0033A0] shadow-[4px_4px_0_0_#00183F] translate-x-[-2px] translate-y-[-2px]" : ""}
      `}
    >
      <div className="flex gap-1 min-w-[60px]">
        {player.positions.map((pos) => (
          <span
            key={pos}
            className="text-[10px] font-black px-1.5 py-0.5 rounded-none border border-[#00183F] bg-[#D9D9D9] text-[#00183F]"
          >
            {POSITION_LABELS_MAP[lang][pos]}
          </span>
        ))}
      </div>
      
      {/* NOME + BANDEIRA NO MEIO (Oculta a bandeira se hideOverall for true) */}
      <span className="flex-1 text-sm font-bold truncate flex items-center gap-2">
        {player.name} {!hideOverall && <span className="text-sm">{player.nationality}</span>}
      </span>
      
      {/* OVR À DIREITA (Com regra do Hardcore) */}
      <span className={`text-sm font-black min-w-[28px] text-right border-l-2 border-[#00183F]/20 pl-2 ${!hideOverall && player.overall >= 90 ? "text-amber-600" : "text-[#0033A0]"}`}>
        {hideOverall ? "??" : player.overall}
      </span>
    </div>
  );
}