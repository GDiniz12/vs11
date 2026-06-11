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

export function calculateTeamStrength(players: Player[]): number {
  if (players.length === 0) return 80;
  const total = players.reduce((sum, p) => sum + p.overall, 0);
  return total / players.length;
}