"use client";

import React from "react";
import { FormationSlot, FormationType } from "@/types";
import PlayerMarker from "./PlayerMarker";
import { FORMATION_LINKS } from "@/utils/formations";
import { getLinkChemistry, getLinkColor } from "@/utils/helpers";

interface FootballPitchProps {
  slots: FormationSlot[];
  formation?: FormationType | null;
  onSlotClick?: (id: number) => void;
  highlightedSlots?: number[];
}

export default function FootballPitch({ slots, formation, onSlotClick, highlightedSlots = [] }: FootballPitchProps) {
  return (
    <div className="w-full max-w-[420px] mx-auto p-2">
      <div className="relative w-full rounded-none border-4 border-white shadow-[12px_12px_0_0_rgba(0,0,0,0.7)]" style={{ paddingBottom: "145%", background: "#1A3B2B" }}>
        
        {/* Linhas de marcação do campo (Cosmético) */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/30 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-20 h-20 md:w-28 md:h-28 border-4 border-white/30 -translate-x-1/2 -translate-y-1/2 transform rotate-45 pointer-events-none" />
        <div className="absolute top-0 left-1/2 w-[55%] h-[18%] border-b-4 border-l-4 border-r-4 border-white/30 -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-[55%] h-[18%] border-t-4 border-l-4 border-r-4 border-white/30 -translate-x-1/2 pointer-events-none" />

        {/* LISTRAS DO GRAMADO */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute left-0 right-0 pointer-events-none z-0" style={{ top: `${(i * 100) / 10}%`, height: `${100 / 10}%`, background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.02)" }} />
        ))}

        {/* LINHAS DE ENTROSAMENTO (CHEMISTRY) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {formation && FORMATION_LINKS[formation]?.map(([id1, id2], idx) => {
            const slot1 = slots.find(s => s.id === id1);
            const slot2 = slots.find(s => s.id === id2);
            if (!slot1 || !slot2) return null;
            
            const chem = getLinkChemistry(slot1.player, slot2.player);
            const color = getLinkColor(chem);
            return (
              <line key={idx} x1={`${slot1.x}%`} y1={`${slot1.y}%`} x2={`${slot2.x}%`} y2={`${slot2.y}%`} stroke={color} strokeWidth="4" strokeDasharray={chem === 0 ? "4,4" : "none"} />
            );
          })}
        </svg>

        {/* JOGADORES (Z-index superior) */}
        {slots.map((slot) => (
          <PlayerMarker key={slot.id} slot={slot} onClick={onSlotClick ? () => onSlotClick(slot.id) : undefined} isHighlighted={highlightedSlots.includes(slot.id)} />
        ))}
      </div>
    </div>
  );
}