import { LeagueTeam, MatchResult, KnockoutRound, TacticType, DifficultyType } from "@/types";
import { simulateMatch } from "./simulation";
import { shuffleArray } from "./helpers";

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

export function generateOnlineTradicional(humanTeams: any[], allBots: any[], difficulty: string) {
  // Prepara os 36 times mesclando Humanos e Bots
  const botsCount = 36 - humanTeams.length;
  const bots = shuffleArray(allBots).slice(0, botsCount).map(b => ({
    name: b.name, 
    strength: b.players.reduce((s, p) => s + p.overall, 0) / b.players.length, 
    isBot: true, tactic: 'balanced' as TacticType, chemistry: 100
  }));
  
  const humans = humanTeams.map(h => ({
    name: h.nickname, strength: h.strength, isBot: false, tactic: h.tactic as TacticType, chemistry: h.chemistry
  }));
  
  const teams = shuffleArray([...humans, ...bots]);
  const standings: Record<string, any> = {};
  teams.forEach(t => standings[t.name] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, avgOverall: t.strength, isUser: !t.isBot });

  const playerMatches: Record<string, MatchResult[]> = {};
  humanTeams.forEach(h => playerMatches[h.nickname] = []);

  const fixed = teams[0];
  const rotating = teams.slice(1);

  // Simula 8 Rodadas (Todos contra Todos adaptado)
  for (let round = 0; round < 8; round++) {
    const roundTeams = [fixed, ...rotating];
    const halfLen = Math.floor(roundTeams.length / 2);

    for (let i = 0; i < halfLen; i++) {
      const home = roundTeams[i];
      const away = roundTeams[roundTeams.length - 1 - i];

      const actualHome = round % 2 === 0 ? home : away;
      const actualAway = round % 2 === 0 ? away : home;

      const { homeGoals, awayGoals } = simulateMatch(
        actualHome.strength, actualAway.strength, actualHome.tactic, actualAway.tactic, !actualHome.isBot, !actualAway.isBot, difficulty as DifficultyType, actualHome.chemistry, actualAway.chemistry
      );

      const match: MatchResult = { homeTeam: actualHome.name, awayTeam: actualAway.name, homeGoals, awayGoals };

      standings[actualHome.name].played++;
      standings[actualHome.name].goalsFor += homeGoals;
      standings[actualHome.name].goalsAgainst += awayGoals;
      if (homeGoals > awayGoals) standings[actualHome.name].won++;
      else if (homeGoals === awayGoals) standings[actualHome.name].drawn++;
      else standings[actualHome.name].lost++;

      standings[actualAway.name].played++;
      standings[actualAway.name].goalsFor += awayGoals;
      standings[actualAway.name].goalsAgainst += homeGoals;
      if (awayGoals > homeGoals) standings[actualAway.name].won++;
      else if (awayGoals === homeGoals) standings[actualAway.name].drawn++;
      else standings[actualAway.name].lost++;

      if (!actualHome.isBot) playerMatches[actualHome.name].push(match);
      if (!actualAway.isBot) playerMatches[actualAway.name].push(match);
    }
    rotating.unshift(rotating.pop()!);
  }

  const table: LeagueTeam[] = Object.entries(standings).map(([name, stats]) => ({
     name, played: stats.played, won: stats.won, drawn: stats.drawn, lost: stats.lost, goalsFor: stats.goalsFor, goalsAgainst: stats.goalsAgainst, goalDifference: stats.goalsFor - stats.goalsAgainst, points: stats.won * 3 + stats.drawn, isUser: stats.isUser, avgOverall: stats.avgOverall
  }));
  table.sort((a,b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);

  // Mata-Mata Geral dos 16 melhores
  let top16 = table.slice(0, 16).map(t => teams.find(f => f.name === t.name));
  const knockoutRounds = [];
  const stageNames = ["Round of 16", "Quarter-finals", "Semi-finals", "Final"];

  for(let stage = 0; stage < 4; stage++) {
     const stageName = stageNames[stage];
     const nextRoundTeams = [];
     const isFinal = stage === 3;

     for(let i=0; i < top16.length; i+=2) {
         const t1 = top16[i];
         const t2 = top16[i+1];
         if (!t1 || !t2) continue;

         const res1 = simulateMatch(t1.strength, t2.strength, t1.tactic, t2.tactic, !t1.isBot, !t2.isBot, difficulty as DifficultyType, t1.chemistry, t2.chemistry);
         const leg1 = { homeTeam: t1.name, awayTeam: t2.name, homeGoals: res1.homeGoals, awayGoals: res1.awayGoals };

         let winner, leg2;

         if (isFinal) {
             if (res1.homeGoals > res1.awayGoals) winner = t1;
             else if (res1.awayGoals > res1.homeGoals) winner = t2;
             else winner = Math.random() > 0.5 ? t1 : t2; // Penaltis no Host
         } else {
             const res2 = simulateMatch(t2.strength, t1.strength, t2.tactic, t1.tactic, !t2.isBot, !t1.isBot, difficulty as DifficultyType, t2.chemistry, t1.chemistry);
             leg2 = { homeTeam: t2.name, awayTeam: t1.name, homeGoals: res2.homeGoals, awayGoals: res2.awayGoals };

             const agg1 = leg1.homeGoals + (leg2 ? leg2.awayGoals : 0);
             const agg2 = leg1.awayGoals + (leg2 ? leg2.homeGoals : 0);
             if (agg1 > agg2) winner = t1;
             else if (agg2 > agg1) winner = t2;
             else {
                const away1 = leg2.awayGoals;
                const away2 = leg1.awayGoals;
                if (away1 > away2) winner = t1;
                else if (away2 > away1) winner = t2;
                else winner = Math.random() > 0.5 ? t1 : t2;
             }
         }
         nextRoundTeams.push(winner);
         knockoutRounds.push({ round: stageName, leg1, leg2, winner: winner.name, userOpponent: t2.name, userAdvanced: false });
     }
     top16 = nextRoundTeams;
  }

  return { table, playerMatches, knockoutRounds };
}

export function generateOnlineGuerra(humanTeams: any[]) {
  // Ordena por Força + Entrosamento (Para o bypass de 6 jogadores)
  const sorted = [...humanTeams].sort((a,b) => (b.strength + b.chemistry/10) - (a.strength + a.chemistry/10));
  const num = sorted.length;
  let roundsData: KnockoutRound[] = [];

  const doMatch = (t1: any, t2: any, roundName: string, isFinal=false) => {
     const res1 = simulateMatch(t1.strength, t2.strength, t1.tactic, t2.tactic, true, true, 'medium', t1.chemistry, t2.chemistry);
     const leg1 = { homeTeam: t1.nickname, awayTeam: t2.nickname, homeGoals: res1.homeGoals, awayGoals: res1.awayGoals };
     let winner, leg2;

     if(isFinal) {
        if(res1.homeGoals > res1.awayGoals) winner = t1;
        else if (res1.awayGoals > res1.homeGoals) winner = t2;
        else winner = Math.random() > 0.5 ? t1 : t2;
     } else {
        const res2 = simulateMatch(t2.strength, t1.strength, t2.tactic, t1.tactic, true, true, 'medium', t2.chemistry, t1.chemistry);
        leg2 = { homeTeam: t2.nickname, awayTeam: t1.nickname, homeGoals: res2.homeGoals, awayGoals: res2.awayGoals };
        const agg1 = leg1.homeGoals + leg2.awayGoals;
        const agg2 = leg1.awayGoals + leg2.homeGoals;
        if(agg1 > agg2) winner = t1;
        else if(agg2 > agg1) winner = t2;
        else winner = Math.random() > 0.5 ? t1 : t2;
     }

     roundsData.push({ round: roundName, leg1, leg2, winner: winner.nickname, userOpponent: t2.nickname, userAdvanced: false });
     return winner;
  }

  if (num === 2) {
     doMatch(sorted[0], sorted[1], "Final", true);
  }
  else if (num === 4) {
     const w1 = doMatch(sorted[0], sorted[3], "Semi-final");
     const w2 = doMatch(sorted[1], sorted[2], "Semi-final");
     doMatch(w1, w2, "Final", true);
  }
  else if (num === 6) {
     // 1 e 2 tem "BYE" (Classificam direto)
     const w1 = doMatch(sorted[2], sorted[5], "Quarter-final");
     const w2 = doMatch(sorted[3], sorted[4], "Quarter-final");
     const s1 = doMatch(sorted[0], w2, "Semi-final");
     const s2 = doMatch(sorted[1], w1, "Semi-final");
     doMatch(s1, s2, "Final", true);
  }
  else if (num === 8) {
     const w1 = doMatch(sorted[0], sorted[7], "Quarter-final");
     const w2 = doMatch(sorted[1], sorted[6], "Quarter-final");
     const w3 = doMatch(sorted[2], sorted[5], "Quarter-final");
     const w4 = doMatch(sorted[3], sorted[4], "Quarter-final");
     const s1 = doMatch(w1, w4, "Semi-final");
     const s2 = doMatch(w2, w3, "Semi-final");
     doMatch(s1, s2, "Final", true);
  }

  return { knockoutRounds: roundsData };
}