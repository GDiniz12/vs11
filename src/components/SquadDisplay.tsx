"use client";

import React from "react";
import { FormationSlot } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { POSITION_LABELS_MAP } from "@/lib/constants";

interface SquadDisplayProps {
  slots: FormationSlot[];
}

export default function SquadDisplay({ slots }: SquadDisplayProps) {
  const { lang } = useLanguage();
  
  return (
    <div className="bg-white text-[#00183F] border-4 border-[#00183F] p-4 shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] h-full">
      <h3 className="text-xl font-black uppercase tracking-widest border-b-4 border-[#00183F] pb-2 mb-4">
        {lang === "pt" ? "Seu Elenco" : "Your Squad"}
      </h3>
      
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] md:max-h-full pr-2">
        {slots.map((slot) => (
          <div 
            key={slot.id} 
            className="flex items-center border-2 border-[#00183F] bg-[#D9D9D9]/30 p-2"
          >
            {/* Tag da Posição */}
            <div className="bg-[#00183F] text-white w-10 text-center py-1 text-xs font-black">
              {POSITION_LABELS_MAP[lang][slot.position]}
            </div>
            
            {/* Nome do Jogador */}
            <div className="ml-3 flex-1 font-bold text-sm truncate uppercase text-[#00183F]">
              {slot.player ? slot.player.name : <span className="text-gray-400">---</span>}
            </div>
            
            {/* OVR Destacado */}
            {slot.player && (
              <div className="ml-2 font-black text-lg bg-white border-2 border-[#00183F] px-2 shadow-[2px_2px_0_0_#00183F]">
                {slot.player.overall}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}