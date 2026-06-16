import { Player } from "@/types";

export function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export function simulateMatch(
  homeStrength: number,
  awayStrength: number,
  homeTactic: "defensive" | "balanced" | "offensive" = "balanced",
  awayTactic: "defensive" | "balanced" | "offensive" = "balanced",
  homeIsUser: boolean = false,
  awayIsUser: boolean = false,
  difficulty: "easy" | "medium" | "impossible" = "medium",
  homeChemistry: number = 100, // NOVO PARÂMETRO
  awayChemistry: number = 100  // NOVO PARÂMETRO
): { homeGoals: number; awayGoals: number } {
  const BASE_GOALS = 1.25;
  const HOME_ADVANTAGE = 0.2;

  // Modificador de Entrosamento: Química 100 = +5 de OVR. Química 0 = -5 de OVR.
  const hChemMod = (homeChemistry - 50) / 10;
  const aChemMod = (awayChemistry - 50) / 10;

  let hStr = homeStrength + hChemMod;
  let aStr = awayStrength + aChemMod;

  if (homeIsUser) {
    if (difficulty === "easy") hStr += 5;
    if (difficulty === "impossible") hStr -= 8;
  }
  if (awayIsUser) {
    if (difficulty === "easy") aStr += 5;
    if (difficulty === "impossible") aStr -= 8;
  }

  const diff = hStr - aStr;
  let homeExpected = Math.max(0.1, BASE_GOALS + HOME_ADVANTAGE + diff * 0.082);
  let awayExpected = Math.max(0.1, BASE_GOALS - diff * 0.082);

  const applyTactic = (teamTactic: string, isHome: boolean) => {
    if (teamTactic === "offensive") {
      if (isHome) { homeExpected *= 1.35; awayExpected *= 1.25; }
      else { awayExpected *= 1.35; homeExpected *= 1.25; }
    } else if (teamTactic === "defensive") {
      if (isHome) { homeExpected *= 0.65; awayExpected *= 0.65; }
      else { awayExpected *= 0.65; homeExpected *= 0.65; }
    }
  };

  applyTactic(homeTactic, true);
  applyTactic(awayTactic, false);

  let homeGoals = poissonRandom(homeExpected);
  let awayGoals = poissonRandom(awayExpected);

  homeGoals = Math.min(homeGoals, 9);
  awayGoals = Math.min(awayGoals, 9);

  return { homeGoals, awayGoals };
}

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
     if (["PE", "PD", "CA", "SA", "ATA"].includes(pos)) {
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