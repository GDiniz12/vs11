import { LeagueTeam, MatchResult, KnockoutRound, TacticType, DifficultyType } from '@/types';
import { shuffleArray } from './helpers';

// =========================================================
// LÓGICA OFFLINE / MOTOR BASE DE PARTIDAS
// =========================================================

function poissonRandom(lambda: number): number {
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
  homeTactic: TacticType,
  awayTactic: TacticType,
  isHomeUser: boolean,
  isAwayUser: boolean,
  difficulty: DifficultyType,
  homeChemistry: number = 0,
  awayChemistry: number = 0
) {
  // Entrosamento (0-100): até +10 de força extra
  const homeEffectiveStrength = homeStrength + (homeChemistry / 10);
  const awayEffectiveStrength = awayStrength + (awayChemistry / 10);

  let hStr = homeEffectiveStrength;
  let aStr = awayEffectiveStrength;

  // Dificuldade afeta a força do usuário
  if (isHomeUser && !isAwayUser) {
    if (difficulty === 'easy') hStr += 5;
    if (difficulty === 'impossible') hStr -= 8;
  } else if (!isHomeUser && isAwayUser) {
    if (difficulty === 'easy') aStr += 5;
    if (difficulty === 'impossible') aStr -= 8;
  }

  // Diferença de força
  const diff = hStr - aStr;
  
  // Base de gols esperados por time em um jogo equilibrado
  const BASE_GOALS = 1.3;
  const HOME_ADVANTAGE = 0.3;

  // Curva não linear para diferença de força
  // diff = 10 => factor ~ 0.63
  // diff = 15 => factor ~ 1.02
  const powerFactor = Math.sign(diff) * Math.pow(Math.abs(diff), 1.2) * 0.04;
  
  const homeExpectedRaw = BASE_GOALS + HOME_ADVANTAGE + powerFactor;
  const awayExpectedRaw = BASE_GOALS - powerFactor;

  // Garantir mínimos razoáveis de xG
  let homeExpected = Math.max(0.15, homeExpectedRaw);
  let awayExpected = Math.max(0.15, awayExpectedRaw);

  // Táticas afetam os gols esperados
  if (homeTactic === 'offensive') {
    homeExpected *= 1.3;
    awayExpected *= 1.2;
  } else if (homeTactic === 'defensive') {
    homeExpected *= 0.75;
    awayExpected *= 0.7;
  }

  if (awayTactic === 'offensive') {
    awayExpected *= 1.3;
    homeExpected *= 1.2;
  } else if (awayTactic === 'defensive') {
    awayExpected *= 0.75;
    homeExpected *= 0.7;
  }

  let homeGoals = poissonRandom(homeExpected);
  let awayGoals = poissonRandom(awayExpected);

  homeGoals = Math.min(Math.max(homeGoals, 0), 9);
  awayGoals = Math.min(Math.max(awayGoals, 0), 9);

  return { homeGoals, awayGoals };
}

export function checkQualification(table: LeagueTeam[], teamName: string) {
  const index = table.findIndex(t => t.name === teamName);
  return {
    qualified: index >= 0 && index < 16,
    position: index + 1
  };
}

export function generateLeaguePhase(
  userTeamName: string,
  userStrength: number,
  allTeams: {name: string, strength: number}[],
  userTactic: TacticType,
  difficulty: DifficultyType,
  userChemistry: number
) {
  const teams = [...allTeams];
  const standings: Record<string, any> = {};
  
  teams.forEach(t => {
    standings[t.name] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, isUser: t.name === userTeamName, avgOverall: t.strength };
  });

  const userMatches: MatchResult[] = [];
  const fixed = teams[0];
  const rotating = teams.slice(1);

  for (let round = 0; round < 8; round++) {
    const roundTeams = [fixed, ...rotating];
    const halfLen = Math.floor(roundTeams.length / 2);

    for (let i = 0; i < halfLen; i++) {
      const home = roundTeams[i];
      const away = roundTeams[roundTeams.length - 1 - i];

      const actualHome = round % 2 === 0 ? home : away;
      const actualAway = round % 2 === 0 ? away : home;

      const isHomeUser = actualHome.name === userTeamName;
      const isAwayUser = actualAway.name === userTeamName;

      const hTac = isHomeUser ? userTactic : 'balanced';
      const aTac = isAwayUser ? userTactic : 'balanced';
      const hChem = isHomeUser ? userChemistry : 100;
      const aChem = isAwayUser ? userChemistry : 100;

      const { homeGoals, awayGoals } = simulateMatch(
        actualHome.strength, actualAway.strength, hTac, aTac, isHomeUser, isAwayUser, difficulty, hChem, aChem
      );

      if (isHomeUser || isAwayUser) {
        userMatches.push({ homeTeam: actualHome.name, awayTeam: actualAway.name, homeGoals, awayGoals });
      }

      standings[actualHome.name].played++;
      standings[actualHome.name].goalsFor += homeGoals;
      standings[actualHome.name].goalsAgainst += awayGoals;
      if (homeGoals > awayGoals) {
        standings[actualHome.name].won++;
        standings[actualHome.name].points += 3;
      } else if (homeGoals === awayGoals) {
        standings[actualHome.name].drawn++;
        standings[actualHome.name].points += 1;
      } else {
        standings[actualHome.name].lost++;
      }

      standings[actualAway.name].played++;
      standings[actualAway.name].goalsFor += awayGoals;
      standings[actualAway.name].goalsAgainst += homeGoals;
      if (awayGoals > homeGoals) {
        standings[actualAway.name].won++;
        standings[actualAway.name].points += 3;
      } else if (awayGoals === homeGoals) {
        standings[actualAway.name].drawn++;
        standings[actualAway.name].points += 1;
      } else {
        standings[actualAway.name].lost++;
      }
    }
    rotating.unshift(rotating.pop()!);
  }

  const table: LeagueTeam[] = Object.entries(standings).map(([name, stats]) => ({
    name, played: stats.played, won: stats.won, drawn: stats.drawn, lost: stats.lost, 
    goalsFor: stats.goalsFor, goalsAgainst: stats.goalsAgainst, 
    goalDifference: stats.goalsFor - stats.goalsAgainst, 
    points: stats.points, isUser: stats.isUser, avgOverall: stats.avgOverall
  }));

  table.sort((a,b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);

  return { userMatches, table };
}

export function generateKnockoutRounds(
  leagueTable: LeagueTeam[],
  userTeamName: string,
  userStrength: number,
  userTactic: TacticType,
  difficulty: DifficultyType,
  userChemistry: number
) {
  let top16 = leagueTable.slice(0, 16).map(t => ({
    name: t.name, strength: t.avgOverall, isUser: t.name === userTeamName
  }));
  
  const knockoutRounds: KnockoutRound[] = [];
  const stageNames = ["Round of 16", "Quarter-finals", "Semi-finals", "Final"];

  for (let stage = 0; stage < 4; stage++) {
    const stageName = stageNames[stage];
    const nextRoundTeams = [];
    const isFinal = stage === 3;

    for (let i = 0; i < top16.length; i += 2) {
      const t1 = top16[i];
      const t2 = top16[i+1];
      if (!t1 || !t2) continue;

      const t1Tac = t1.isUser ? userTactic : 'balanced';
      const t2Tac = t2.isUser ? userTactic : 'balanced';
      const t1Chem = t1.isUser ? userChemistry : 100;
      const t2Chem = t2.isUser ? userChemistry : 100;

      const res1 = simulateMatch(t1.strength, t2.strength, t1Tac, t2Tac, t1.isUser, t2.isUser, difficulty, t1Chem, t2Chem);
      const leg1 = { homeTeam: t1.name, awayTeam: t2.name, homeGoals: res1.homeGoals, awayGoals: res1.awayGoals };

      let winner, leg2;

      if (isFinal) {
         if (res1.homeGoals > res1.awayGoals) winner = t1;
         else if (res1.awayGoals > res1.homeGoals) winner = t2;
         else winner = Math.random() > 0.5 ? t1 : t2; 
      } else {
         const res2 = simulateMatch(t2.strength, t1.strength, t2Tac, t1Tac, t2.isUser, t1.isUser, difficulty, t2Chem, t1Chem);
         leg2 = { homeTeam: t2.name, awayTeam: t1.name, homeGoals: res2.homeGoals, awayGoals: res2.awayGoals };

         const agg1 = leg1.homeGoals + leg2.awayGoals;
         const agg2 = leg1.awayGoals + leg2.homeGoals;
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
      if (t1.isUser || t2.isUser) {
         knockoutRounds.push({ 
           round: stageName, 
           leg1, 
           leg2, 
           winner: winner.name, 
           userOpponent: t1.isUser ? t2.name : t1.name, 
           userAdvanced: winner.isUser 
         });
      }
    }
    top16 = nextRoundTeams;
  }
  return knockoutRounds;
}

// =========================================================
// LÓGICA ONLINE: TRADICIONAL & GUERRA (Executada pelo HOST)
// =========================================================

export function generateOnlineTradicional(humanTeams: any[], allBots: any[], difficulty: string) {
  // Prepara os 36 times mesclando Humanos e Bots
  const botsCount = 36 - humanTeams.length;
  const bots = shuffleArray(allBots).slice(0, botsCount).map(b => ({
    name: b.name, 
    // MÁGICA PRO VERCEL AQUI: (s: number, p: any) explícito
    strength: b.players.reduce((s: number, p: any) => s + p.overall, 0) / b.players.length, 
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
             else winner = Math.random() > 0.5 ? t1 : t2;
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