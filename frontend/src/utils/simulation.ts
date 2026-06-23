import { Player } from "@/types";

// NOTE: the live match engine (poissonRandom + simulateMatch) lives in
// utils/tournament.ts. The simpler versions that used to be here were dead
// code and were removed (audit A1). This file now holds only the strength
// helpers that the UI and GameContext actually import.

export function calculateTeamStrength(players: Player[], manager?: import("@/types").Manager | null): number {
  if (players.length === 0) return 80;
  
  const startingPlayers = [...players].sort((a, b) => b.overall - a.overall).slice(0, 11);
  
  let total = startingPlayers.reduce((sum, p) => sum + p.overall, 0);
  
  // Bônus Lendas: Jogadores >= 91 aumentam a média em +1 OVR cada um
  let legendsCount = startingPlayers.filter(p => p.overall >= 91).length;
  
  if (manager && manager.overall) {
    total += manager.overall;
    return Math.round((total / (startingPlayers.length + 1)) + legendsCount);
  }
  
  return Math.round((total / startingPlayers.length) + legendsCount);
}

export function calculateSectorStrengths(players: import("@/types").Player[]) {
  if (players.length === 0) return { atk: 0, mid: 0, def: 0 };
  const startingPlayers = [...players].sort((a, b) => b.overall - a.overall).slice(0, 11);

  let atkSum = 0, atkCount = 0;
  let midSum = 0, midCount = 0;
  let defSum = 0, defCount = 0;

  startingPlayers.forEach(p => {
     const pos = p.positions?.[0] || "MC";
     if (["PE", "PD", "CA"].includes(pos)) {
        atkSum += p.overall; atkCount++;
     } else if (["VOL", "MC", "MEI", "ME", "MD"].includes(pos)) {
        midSum += p.overall; midCount++;
     } else {
        defSum += p.overall; defCount++;
     }
  });

  return {
     atk: atkCount > 0 ? Math.round(atkSum / atkCount) : 0,
     mid: midCount > 0 ? Math.round(midSum / midCount) : 0,
     def: defCount > 0 ? Math.round(defSum / defCount) : 0
  };
}