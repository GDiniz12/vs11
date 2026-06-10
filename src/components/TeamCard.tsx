"use client";

import React from "react";
import { motion } from "framer-motion";
import { TeamData, FormationSlot, Player } from "@/types";
import { canPlayerFillAnyRemaining } from "@/utils/helpers";
import PlayerRow from "./PlayerRow";
import Card from "./ui/Card";

interface TeamCardProps {
  team: TeamData;
  slots: FormationSlot[];
  onPlayerSelect: (player: Player) => void;
  selectedPlayer?: Player | null;
}

export default function TeamCard({
  team,
  slots,
  onPlayerSelect,
  selectedPlayer,
}: TeamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden p-4 md:p-6 bg-white border-4 border-[#00183F] shadow-[8px_8px_0_0_#0033A0]">
        
        {/* Cabeçalho do Time Brutalista */}
        <div className="mb-6 pb-4 border-b-4 border-[#00183F] flex flex-col items-start gap-3">
          <h3 className="text-2xl md:text-3xl font-black text-[#00183F] uppercase tracking-tight leading-none">
            {team.name}
          </h3>
          
          <span className="inline-block bg-[#D9D9D9] text-[#00183F] border-2 border-[#00183F] px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_0_#00183F]">
            {team.continent === "american" ? "🌎 Americas" : "🌍 Europe"}
          </span>
        </div>

        {/* Lista de Jogadores */}
        <div className="space-y-2">
          {team.players.map((player, idx) => {
            // Verifica se o jogador já está em algum slot do time
            const isAlreadyDrafted = slots.some((s) => s.player?.name === player.name);
            
            // O botão ficará desabilitado se o jogador já estiver no time OU se não houver posição livre
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
              />
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}