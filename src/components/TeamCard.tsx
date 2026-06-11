"use client";

import React from "react";
import { motion } from "framer-motion";
import { TeamData, FormationSlot, Player } from "@/types";
import { canPlayerFillAnyRemaining } from "@/utils/helpers";
import { clubLogos } from "@/data/data";
import PlayerRow from "./PlayerRow";
import Card from "./ui/Card";

interface TeamCardProps {
  team: TeamData;
  slots: FormationSlot[];
  onPlayerSelect: (player: Player) => void;
  selectedPlayer?: Player | null;
  hideOverall?: boolean; // Nova propriedade
}

export default function TeamCard({
  team,
  slots,
  onPlayerSelect,
  selectedPlayer,
  hideOverall,
}: TeamCardProps) {
  
  const baseTeamName = team.key ? team.key.replace(/-\d{4}$/, "") : "";
  const logoUrl = clubLogos[baseTeamName];

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden p-4 md:p-6 bg-white border-4 border-[#00183F] shadow-[8px_8px_0_0_#0033A0]">
        
        <div className="mb-6 pb-4 border-b-4 border-[#00183F] flex flex-col items-start gap-3">
          <div className="flex items-center gap-3 md:gap-4">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt={`Escudo do ${team.name}`} 
                className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
              />
            )}
            <h3 className="text-2xl md:text-3xl font-black text-[#00183F] uppercase tracking-tight leading-none">
              {team.name}
            </h3>
          </div>
          
          <span className="inline-block bg-[#D9D9D9] text-[#00183F] border-2 border-[#00183F] px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_0_#00183F]">
            {team.continent === "american" ? "🌎 Americas" : "🌍 Europe"}
          </span>
        </div>

        <div className="space-y-2">
          {team.players.map((player, idx) => {
            const isAlreadyDrafted = slots.some((s) => s.player?.name === player.name);
            
            const disabled = isAlreadyDrafted || !canPlayerFillAnyRemaining(
              player.positions,
              slots
            );
            
            const isSelected = selectedPlayer?.name === player.name && selectedPlayer?.teamKey === player.teamKey;
            
            return (
              <PlayerRow
                key={`${player.name}-${idx}`}
                player={player}
                disabled={disabled}
                onClick={() => onPlayerSelect(player)}
                isSelected={isSelected}
                hideOverall={hideOverall} // Repassando a regra do hardcore
              />
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}