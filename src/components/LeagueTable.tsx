"use client";

import React from "react";
import { LeagueTeam } from "@/types";
import { clubLogos } from "@/data/data";

interface LeagueTableProps {
  table: LeagueTeam[];
}

// Função para formatar o nome do time e buscar a logo correspondente
const getLogoUrl = (teamName: string) => {
  if (!teamName) return "";
  let formatted = teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/\s+/g, "-"); // Substitui espaços por hífen
  
  // Remove o ano se existir
  formatted = formatted.replace(/-\d{4}$/, "");
  return clubLogos[formatted] || "";
};

export default function LeagueTable({ table }: LeagueTableProps) {
  return (
    <div className="overflow-x-auto border-4 border-[#00183F] bg-white shadow-[8px_8px_0_0_#00183F] rounded-none">
      <table className="w-full text-sm font-bold text-[#00183F]">
        <thead className="bg-[#00183F] text-white border-b-4 border-[#00183F] uppercase tracking-wider text-xs md:text-sm">
          <tr>
            <th className="py-3 px-3 text-left font-black w-10">#</th>
            <th className="py-3 px-3 text-left font-black min-w-[200px]">Time</th>
            <th className="py-3 px-2 text-center font-black w-8">J</th>
            <th className="py-3 px-2 text-center font-black w-8">V</th>
            <th className="py-3 px-2 text-center font-black w-8">E</th>
            <th className="py-3 px-2 text-center font-black w-8">D</th>
            <th className="py-3 px-2 text-center font-black w-8">GP</th>
            <th className="py-3 px-2 text-center font-black w-8">GC</th>
            <th className="py-3 px-2 text-center font-black w-10">SG</th>
            <th className="py-3 px-3 text-center font-black text-amber-400 w-10">Pts</th>
          </tr>
        </thead>
        <tbody>
          {table.map((team, idx) => {
            const pos = idx + 1;
            const isQualified = pos <= 16;
            const logo = getLogoUrl(team.name);

            return (
              <tr
                key={team.name}
                className={`
                  border-b-2 border-[#00183F]/20 transition-colors
                  ${team.isUser ? "bg-[#0033A0]/20 border-b-[#0033A0] border-b-4" : idx % 2 === 0 ? "bg-white" : "bg-[#D9D9D9]/30"}
                `}
              >
                <td className="py-3 px-3 border-r-2 border-[#00183F]/10">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-6 border-2 border-[#00183F] ${
                        team.isUser
                          ? "bg-[#0033A0]"
                          : isQualified
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <span className="text-xs md:text-sm">{pos}</span>
                  </div>
                </td>
                <td className={`py-3 px-3 uppercase tracking-tight ${team.isUser ? "text-[#0033A0] font-black" : ""}`}>
                  <div className="flex items-center gap-2">
                    {logo && (
                      <img src={logo} alt={team.name} className="w-5 h-5 md:w-6 md:h-6 object-contain drop-shadow-sm" />
                    )}
                    <span className="truncate">{team.name}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center text-gray-500">{team.played}</td>
                <td className="py-3 px-2 text-center">{team.won}</td>
                <td className="py-3 px-2 text-center">{team.drawn}</td>
                <td className="py-3 px-2 text-center">{team.lost}</td>
                <td className="py-3 px-2 text-center">{team.goalsFor}</td>
                <td className="py-3 px-2 text-center">{team.goalsAgainst}</td>
                <td className="py-3 px-2 text-center font-black">
                  {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                </td>
                <td className="py-3 px-3 text-center font-black text-lg">
                  {team.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}