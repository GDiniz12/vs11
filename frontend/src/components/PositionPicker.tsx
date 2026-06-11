"use client";

import React from "react";
import { motion } from "framer-motion";
import { Player, FormationSlot } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { POSITION_LABELS_MAP } from "@/lib/constants";

interface PositionPickerProps {
  player: Player;
  availableSlots: FormationSlot[];
  onConfirm: (slotId: number) => void;
  onCancel: () => void;
}

export default function PositionPicker({
  player,
  availableSlots,
  onConfirm,
  onCancel,
}: PositionPickerProps) {
  const { lang } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00183F]/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-4 border-[#00183F] shadow-[12px_12px_0_0_#0033A0] max-w-sm w-full p-6 text-[#00183F]"
      >
        <h2 className="text-2xl font-black uppercase mb-1 leading-tight text-[#00183F]">
          {lang === "pt" ? "Alocar Jogador" : "Assign Player"}
        </h2>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b-2 border-[#00183F]/20 pb-4 mb-6">
          {lang === "pt" ? `Onde escalar ${player.name}?` : `Where to play ${player.name}?`}
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {availableSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => onConfirm(slot.id)}
              className="flex items-center justify-between border-4 border-[#00183F] bg-[#D9D9D9] hover:bg-[#0033A0] hover:text-white p-3 transition-colors group shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-[#00183F]"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[#00183F] text-white group-hover:bg-white group-hover:text-[#00183F] px-2 py-1 text-xs font-black transition-colors">
                  {POSITION_LABELS_MAP[lang][slot.position]}
                </span>
                <span className="font-black uppercase text-sm">
                  {lang === "pt" ? "Escolher" : "Select"}
                </span>
              </div>
              <span className="font-black">➜</span>
            </button>
          ))}
        </div>

        {/* Botão Cancelar visível e agressivo */}
        <button
          onClick={onCancel}
          className="w-full border-4 border-rose-600 bg-white text-rose-600 hover:bg-rose-600 hover:text-white p-3 font-black uppercase transition-all shadow-[4px_4px_0_0_rgba(225,29,72,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
        >
          {lang === "pt" ? "Cancelar" : "Cancel"}
        </button>
      </motion.div>
    </div>
  );
}