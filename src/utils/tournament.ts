import { LeagueTeam, MatchResult, KnockoutRound, TacticType, DifficultyType } from "@/types";
import { simulateMatch } from "./simulation"; // Certo! Caminho corrigido para a mesma pasta

interface TeamEntry {
  name: string;
  strength: number;
}

export function generateLeaguePhase(
  userTeamName: string,
  userStrength: number,
  allTeams: TeamEntry[],
  userTactic: TacticType = "balanced",
  difficulty: DifficultyType = "medium",
  userChemistry: number = 100
): { userMatches: MatchResult[]; table: LeagueTeam[] } {
  const teams = [...allTeams];
  const standings: Record<string, any> = {};

  teams.forEach((t) => {
    standings[t.name] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, avgOverall: t.strength };
  });

  const userMatches: MatchResult[] = [];
  const teamsCopy = [...teams];
  const fixed = teamsCopy[0];
  const rotating = teamsCopy.slice(1);

  for (let round = 0; round < 8; round++) {
    const roundTeams = [fixed, ...rotating];
    const halfLen = Math.floor(roundTeams.length / 2);

    for (let i = 0; i < halfLen; i++) {
      const home = roundTeams[i];
      const away = roundTeams[roundTeams.length - 1 - i];

      if (!home || !away) continue;

      const actualHome = round % 2 === 0 ? home : away;
      const actualAway = round % 2 === 0 ? away : home;

      const isHomeUser = actualHome.name === userTeamName;
      const isAwayUser = actualAway.name === userTeamName;
      
      const hTactic = isHomeUser ? userTactic : "balanced";
      const aTactic = isAwayUser ? userTactic : "balanced";
      
      const hChem = isHomeUser ? userChemistry : 100;
      const aChem = isAwayUser ? userChemistry : 100;

      const { homeGoals, awayGoals } = simulateMatch(
        actualHome.strength,
        actualAway.strength,
        hTactic,
        aTactic,
        isHomeUser,
        isAwayUser,
        difficulty,
        hChem,
        aChem
      );

      const match: MatchResult = { homeTeam: actualHome.name, awayTeam: actualAway.name, homeGoals, awayGoals };

      if (standings[actualHome.name]) {
        standings[actualHome.name].played++;
        standings[actualHome.name].goalsFor += homeGoals;
        standings[actualHome.name].goalsAgainst += awayGoals;
        if (homeGoals > awayGoals) standings[actualHome.name].won++;
        else if (homeGoals === awayGoals) standings[actualHome.name].drawn++;
        else standings[actualHome.name].lost++;
      }

      if (standings[actualAway.name]) {
        standings[actualAway.name].played++;
        standings[actualAway.name].goalsFor += awayGoals;
        standings[actualAway.name].goalsAgainst += homeGoals;
        if (awayGoals > homeGoals) standings[actualAway.name].won++;
        else if (awayGoals === homeGoals) standings[actualAway.name].drawn++;
        else standings[actualAway.name].lost++;
      }

      if (isHomeUser || isAwayUser) userMatches.push(match);
    }
    rotating.unshift(rotating.pop()!);
  }

  const table: LeagueTeam[] = Object.entries(standings).map(([name, stats]) => ({
    name, played: stats.played, won: stats.won, drawn: stats.drawn, lost: stats.lost, goalsFor: stats.goalsFor, goalsAgainst: stats.goalsAgainst, goalDifference: stats.goalsFor - stats.goalsAgainst, points: stats.won * 3 + stats.drawn, isUser: name === userTeamName, avgOverall: stats.avgOverall
  }));

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return { userMatches, table };
}

export function checkQualification(table: LeagueTeam[], userTeamName: string) {
  const idx = table.findIndex((t) => t.name === userTeamName);
  return { qualified: idx + 1 <= 16, position: idx + 1 };
}

export function generateKnockoutRounds(
  table: LeagueTeam[],
  userTeamName: string,
  userStrength: number,
  userTactic: TacticType = "balanced",
  difficulty: DifficultyType = "medium",
  userChemistry: number = 100
): KnockoutRound[] {
  const rounds: KnockoutRound[] = [];
  const roundNames = ["Round of 16", "Quarter-finals", "Semi-finals", "Final"];
  const qualified = table.slice(0, 16).filter((t) => t.name !== userTeamName);
  const shuffled = [...qualified].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 4; i++) {
    const roundName = roundNames[i];
    const opponent = shuffled[Math.min(i, shuffled.length - 1)] || shuffled[0];
    if (!opponent) break;

    const oppStrength = opponent.avgOverall;

    const getPenaltyWinner = () => {
      let uStr = userStrength;
      if (difficulty === "easy") uStr += 5;
      if (difficulty === "impossible") uStr -= 8;
      const winChance = Math.max(0.1, Math.min(0.9, 0.5 + ((uStr - oppStrength) * 0.02)));
      return Math.random() < winChance ? userTeamName : opponent.name;
    };

    if (roundName === "Final") {
      const { homeGoals, awayGoals } = simulateMatch(userStrength, oppStrength, userTactic, "balanced", true, false, difficulty, userChemistry, 100);
      const leg1: MatchResult = { homeTeam: userTeamName, awayTeam: opponent.name, homeGoals, awayGoals };
      
      let winner = homeGoals > awayGoals ? userTeamName : awayGoals > homeGoals ? opponent.name : getPenaltyWinner();
      rounds.push({ round: roundName, userOpponent: opponent.name, leg1, winner, userAdvanced: winner === userTeamName });
    } else {
      const leg1Result = simulateMatch(userStrength, oppStrength, userTactic, "balanced", true, false, difficulty, userChemistry, 100);
      const leg2Result = simulateMatch(oppStrength, userStrength, "balanced", userTactic, false, true, difficulty, 100, userChemistry);

      const leg1: MatchResult = { homeTeam: userTeamName, awayTeam: opponent.name, homeGoals: leg1Result.homeGoals, awayGoals: leg1Result.awayGoals };
      const leg2: MatchResult = { homeTeam: opponent.name, awayTeam: userTeamName, homeGoals: leg2Result.homeGoals, awayGoals: leg2Result.awayGoals };

      const userAgg = leg1Result.homeGoals + leg2Result.awayGoals;
      const oppAgg = leg1Result.awayGoals + leg2Result.homeGoals;

      let winner;
      if (userAgg > oppAgg) winner = userTeamName;
      else if (oppAgg > userAgg) winner = opponent.name;
      else {
        const userAway = leg2Result.awayGoals;
        const oppAway = leg1Result.awayGoals;
        if (userAway > oppAway) winner = userTeamName;
        else if (oppAway > userAway) winner = opponent.name;
        else winner = getPenaltyWinner();
      }

      rounds.push({ round: roundName, userOpponent: opponent.name, leg1, leg2, winner, userAdvanced: winner === userTeamName });
    }
    if (!rounds[rounds.length - 1].userAdvanced) break;
    const oppIdx = shuffled.indexOf(opponent);
    if (oppIdx !== -1) shuffled.splice(oppIdx, 1);
  }
  return rounds;
}