import { LeagueTeam, MatchResult, KnockoutRound, TacticType, DifficultyType, MatchEvent } from '@/types';
import { shuffleArray, calculateBotChemistry } from './helpers';

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
  awayChemistry: number = 0,
  homePlayers: any[] = [],
  awayPlayers: any[] = []
) {
  let hChemMod = 0;
  if (homeChemistry > 75) {
     hChemMod = (homeChemistry - 75) * 0.4;
  } else {
     hChemMod = (homeChemistry - 50) * 0.05;
  }
  
  let aChemMod = 0;
  if (awayChemistry > 75) {
     aChemMod = (awayChemistry - 75) * 0.4; 
  } else {
     aChemMod = (awayChemistry - 50) * 0.05; 
  }

  const getSector = (players: any[], defaultStr: number) => {
    if (!players || players.length === 0) return { atk: defaultStr, mid: defaultStr, def: defaultStr, gk: defaultStr };
    let atk=0, atkC=0, mid=0, midC=0, def=0, defC=0, gk=0, gkC=0;
    players.slice(0, 11).forEach(p => {
       const pos = p.positions?.[0] || "MC";
       if (pos === "GOL") { gk += p.overall; gkC++; }
       else if (["ZAG", "LD", "LE"].includes(pos)) { def += p.overall; defC++; }
       else if (["VOL", "MC", "MEI", "ME", "MD"].includes(pos)) { mid += p.overall; midC++; }
       else { atk += p.overall; atkC++; }
    });
    const avg = (t: number, c: number) => c > 0 ? t / c : defaultStr - 5;
    return { atk: avg(atk, atkC), mid: avg(mid, midC), def: avg(def, defC), gk: avg(gk, gkC) };
  };

  const hSect = getSector(homePlayers, homeStrength);
  const aSect = getSector(awayPlayers, awayStrength);

  const applyMods = (sect: any, chemMod: number, mult: number) => ({
    atk: (sect.atk + chemMod) * mult,
    mid: (sect.mid + chemMod) * mult,
    def: (sect.def + chemMod) * mult,
    gk: (sect.gk + chemMod) * mult
  });
  
  let hMult = 1, aMult = 1;
  if (isHomeUser && !isAwayUser) {
    if (difficulty === 'easy') { aMult = 0.85; hMult = 1.05; }
    if (difficulty === 'medium') { aMult = 1.05; }
    if (difficulty === 'impossible') { aMult = 1.12; hMult = 0.98; }
  } else if (!isHomeUser && isAwayUser) {
    if (difficulty === 'easy') { hMult = 0.85; aMult = 1.05; }
    if (difficulty === 'medium') { hMult = 1.05; }
    if (difficulty === 'impossible') { hMult = 1.12; aMult = 0.98; }
  }

  const homeEff = applyMods(hSect, hChemMod, hMult);
  const awayEff = applyMods(aSect, aChemMod, aMult);

  const midDiff = homeEff.mid - awayEff.mid;
  const homeMidBonus = Math.max(0, midDiff * 0.2);
  const awayMidBonus = Math.max(0, -midDiff * 0.2);

  const homeAtkDiff = (homeEff.atk + homeMidBonus) - (awayEff.def * 0.7 + awayEff.gk * 0.3);
  const awayAtkDiff = (awayEff.atk + awayMidBonus) - (homeEff.def * 0.7 + homeEff.gk * 0.3);

  const BASE_GOALS = 1.0;
  const HOME_ADVANTAGE = 0.3;

  const powerFactor = (diff: number) => Math.sign(diff) * Math.pow(Math.abs(diff), 1.25) * 0.035;
  
  let homeExpected = Math.max(0.15, BASE_GOALS + HOME_ADVANTAGE + powerFactor(homeAtkDiff));
  let awayExpected = Math.max(0.15, BASE_GOALS + powerFactor(awayAtkDiff));

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

  let events: MatchEvent[] = [];

  const addGoals = (goals: number, team: "home"|"away", players: any[]) => {
    for(let i = 0; i < goals; i++) {
      const minute = Math.floor(Math.random() * 90) + 1;
      let playerStr = "Jogador";
      if (players && players.length > 0) {
         let validScorers = players.filter(p => p.name === "Rogério Ceni" || !(p.positions && p.positions.includes("GOL")));
         if (validScorers.length === 0) validScorers = players;
         
         const sumWeights = validScorers.reduce((acc, p) => {
            let w = 10;
            if (p.positions) {
              if (["PE", "PD", "CA"].some((pos: string) => p.positions.includes(pos))) w = 50;
              else if (["MEI", "MC", "ME", "MD"].some((pos: string) => p.positions.includes(pos))) w = 25;
            }
            return acc + w;
         }, 0);
         
         let rand = Math.random() * sumWeights;
         for (const p of validScorers) {
            let w = 10;
            if (p.positions) {
              if (["PE", "PD", "CA"].some((pos: string) => p.positions.includes(pos))) w = 50;
              else if (["MEI", "MC", "ME", "MD"].some((pos: string) => p.positions.includes(pos))) w = 25;
            }
            if (rand < w) {
               playerStr = p.name;
               break;
            }
            rand -= w;
         }
      }
      events.push({ minute, player: playerStr, team, type: "goal" });
    }
  }

  addGoals(homeGoals, "home", homePlayers);
  addGoals(awayGoals, "away", awayPlayers);

  events.sort((a,b) => a.minute - b.minute);

  // Compute stats
  let homePossession = Math.round(50 + midDiff * 0.5);
  homePossession = Math.max(20, Math.min(80, homePossession)); // Cap at 20-80
  const awayPossession = 100 - homePossession;

  const homeShots = homeGoals + Math.floor(Math.random() * 6) + Math.max(0, Math.round(homeAtkDiff * 0.3));
  const awayShots = awayGoals + Math.floor(Math.random() * 6) + Math.max(0, Math.round(awayAtkDiff * 0.3));

  return { 
    homeGoals, 
    awayGoals, 
    events, 
    stats: { 
      possession: [homePossession, awayPossession] as [number, number], 
      shots: [Math.max(homeGoals, homeShots), Math.max(awayGoals, awayShots)] as [number, number] 
    } 
  };
}

function simulatePenalties(homePlayers: any[], awayPlayers: any[]) {
  let homePen = 0;
  let awayPen = 0;
  let homeKicks = 0;
  let awayKicks = 0;
  let events: MatchEvent[] = [];
  
  const isGK = (p: any) => p && p.positions && p.positions.includes("GOL");
  const hPlayers = [...(homePlayers || [])].sort((a, b) => {
    if (isGK(a) && !isGK(b)) return 1;
    if (!isGK(a) && isGK(b)) return -1;
    return 0;
  });
  const aPlayers = [...(awayPlayers || [])].sort((a, b) => {
    if (isGK(a) && !isGK(b)) return 1;
    if (!isGK(a) && isGK(b)) return -1;
    return 0;
  });

  const homeGkOvr = homePlayers?.find(isGK)?.overall || 80;
  const awayGkOvr = awayPlayers?.find(isGK)?.overall || 80;

  const simulateKick = (kicker: any, gkOvr: number) => {
    const kickerOvr = kicker?.overall || 80;
    const diff = kickerOvr - gkOvr;
    const prob = Math.min(0.95, Math.max(0.3, 0.75 + (diff * 0.01)));
    return Math.random() < prob;
  };
  
  for(let i=0; i<5; i++){
     const kicker = hPlayers.length > 0 ? hPlayers[i % hPlayers.length] : null;
     const hScore = simulateKick(kicker, awayGkOvr);
     if(hScore) homePen++;
     homeKicks++;
     events.push({ minute: 120 + events.length, player: kicker?.name || "Jogador", team: "home", type: hScore ? "penalty_goal" : "penalty_miss" });

     if (homePen > awayPen + (5 - awayKicks)) break;
     if (awayPen > homePen + (5 - homeKicks)) break;

     const aKicker = aPlayers.length > 0 ? aPlayers[i % aPlayers.length] : null;
     const aScore = simulateKick(aKicker, homeGkOvr);
     if(aScore) awayPen++;
     awayKicks++;
     events.push({ minute: 120 + events.length, player: aKicker?.name || "Jogador", team: "away", type: aScore ? "penalty_goal" : "penalty_miss" });

     if (homePen > awayPen + (5 - awayKicks)) break;
     if (awayPen > homePen + (5 - homeKicks)) break;
  }

  let currentRound = 5;
  while(homePen === awayPen) {
     const kicker = hPlayers.length > 0 ? hPlayers[currentRound % hPlayers.length] : null;
     const hScore = simulateKick(kicker, awayGkOvr);
     if(hScore) homePen++;
     homeKicks++;
     events.push({ minute: 120 + events.length, player: kicker?.name || "Jogador", team: "home", type: hScore ? "penalty_goal" : "penalty_miss" });

     const aKicker = aPlayers.length > 0 ? aPlayers[currentRound % aPlayers.length] : null;
     const aScore = simulateKick(aKicker, homeGkOvr);
     if(aScore) awayPen++;
     awayKicks++;
     events.push({ minute: 120 + events.length, player: aKicker?.name || "Jogador", team: "away", type: aScore ? "penalty_goal" : "penalty_miss" });
     
     currentRound++;
     if(homePen !== awayPen || currentRound > 22) break;
  }

  return { homePen, awayPen, penaltyEvents: events };
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
  allTeams: {name: string, strength: number, players?: any[]}[],
  userTactic: TacticType,
  difficulty: DifficultyType,
  userChemistry: number
) {
  const teams = [...allTeams];
  const standings: Record<string, any> = {};
  
  teams.forEach(t => {
    standings[t.name] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, isUser: t.name === userTeamName, avgOverall: t.strength, players: t.players };
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
      const hChem = isHomeUser ? userChemistry : calculateBotChemistry(actualHome.players || []);
      const aChem = isAwayUser ? userChemistry : calculateBotChemistry(actualAway.players || []);

      const { homeGoals, awayGoals, events } = simulateMatch(
        actualHome.strength, actualAway.strength, hTac, aTac, isHomeUser, isAwayUser, difficulty, hChem, aChem, actualHome.players, actualAway.players
      );

      if (isHomeUser || isAwayUser) {
        userMatches.push({ homeTeam: actualHome.name, awayTeam: actualAway.name, homeGoals, awayGoals, events });
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
    points: stats.points, isUser: stats.isUser, avgOverall: stats.avgOverall, players: stats.players
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
    name: t.name, strength: t.avgOverall, isUser: t.name === userTeamName, players: t.players
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
      const t1Chem = t1.isUser ? userChemistry : calculateBotChemistry(t1.players || []);
      const t2Chem = t2.isUser ? userChemistry : calculateBotChemistry(t2.players || []);

      const res1 = simulateMatch(t1.strength, t2.strength, t1Tac, t2Tac, t1.isUser, t2.isUser, difficulty, t1Chem, t2Chem, t1.players, t2.players);
      const leg1: MatchResult = { homeTeam: t1.name, awayTeam: t2.name, homeGoals: res1.homeGoals, awayGoals: res1.awayGoals, events: res1.events };

      let winner, leg2: MatchResult | undefined;

      if (isFinal) {
         if (res1.homeGoals > res1.awayGoals) winner = t1;
         else if (res1.awayGoals > res1.homeGoals) winner = t2;
         else {
            const pen = simulatePenalties(t1.players || [], t2.players || []);
            leg1.isPenalties = true;
            leg1.homePenalties = pen.homePen;
            leg1.awayPenalties = pen.awayPen;
            leg1.penaltyEvents = pen.penaltyEvents;
            winner = pen.homePen > pen.awayPen ? t1 : t2;
         }
      } else {
         const res2 = simulateMatch(t2.strength, t1.strength, t2Tac, t1Tac, t2.isUser, t1.isUser, difficulty, t2Chem, t1Chem, t2.players, t1.players);
         leg2 = { homeTeam: t2.name, awayTeam: t1.name, homeGoals: res2.homeGoals, awayGoals: res2.awayGoals, events: res2.events };

         const agg1 = leg1.homeGoals + leg2.awayGoals;
         const agg2 = leg1.awayGoals + leg2.homeGoals;
         if (agg1 > agg2) winner = t1;
         else if (agg2 > agg1) winner = t2;
         else {
            const away1 = leg2.awayGoals;
            const away2 = leg1.awayGoals;
            if (away1 > away2) winner = t1;
            else if (away2 > away1) winner = t2;
            else {
              const pen = simulatePenalties(t2.players || [], t1.players || []);
              leg2.isPenalties = true;
              leg2.homePenalties = pen.homePen;
              leg2.awayPenalties = pen.awayPen;
              leg2.penaltyEvents = pen.penaltyEvents;
              winner = pen.homePen > pen.awayPen ? t2 : t1;
            }
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
  const botsCount = 36 - humanTeams.length;
  const bots = shuffleArray(allBots).slice(0, botsCount).map(b => ({
    name: b.name, 
    strength: b.players.reduce((s: number, p: any) => s + p.overall, 0) / b.players.length, 
    isBot: true, tactic: 'balanced' as TacticType, chemistry: calculateBotChemistry(b.players), players: b.players
  }));
  
  const humans = humanTeams.map(h => ({
    name: h.nickname, strength: h.strength, isBot: false, tactic: h.tactic as TacticType, chemistry: h.chemistry, players: h.players
  }));
  
  const teams = shuffleArray([...humans, ...bots]);
  const standings: Record<string, any> = {};
  teams.forEach(t => standings[t.name] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, avgOverall: t.strength, isUser: !t.isBot, players: t.players });

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

      const { homeGoals, awayGoals, events } = simulateMatch(
        actualHome.strength, actualAway.strength, actualHome.tactic, actualAway.tactic, !actualHome.isBot, !actualAway.isBot, difficulty as DifficultyType, actualHome.chemistry, actualAway.chemistry, actualHome.players, actualAway.players
      );

      const match: MatchResult = { homeTeam: actualHome.name, awayTeam: actualAway.name, homeGoals, awayGoals, events };

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
     name, played: stats.played, won: stats.won, drawn: stats.drawn, lost: stats.lost, goalsFor: stats.goalsFor, goalsAgainst: stats.goalsAgainst, goalDifference: stats.goalsFor - stats.goalsAgainst, points: stats.won * 3 + stats.drawn, isUser: stats.isUser, avgOverall: stats.avgOverall, players: stats.players
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

         const res1 = simulateMatch(t1.strength, t2.strength, t1.tactic, t2.tactic, !t1.isBot, !t2.isBot, difficulty as DifficultyType, t1.chemistry, t2.chemistry, t1.players, t2.players);
         const leg1: MatchResult = { homeTeam: t1.name, awayTeam: t2.name, homeGoals: res1.homeGoals, awayGoals: res1.awayGoals, events: res1.events };

         let winner, leg2: MatchResult | undefined;

         if (isFinal) {
             if (res1.homeGoals > res1.awayGoals) winner = t1;
             else if (res1.awayGoals > res1.homeGoals) winner = t2;
             else {
               const pen = simulatePenalties(t1.players || [], t2.players || []);
               leg1.isPenalties = true;
               leg1.homePenalties = pen.homePen;
               leg1.awayPenalties = pen.awayPen;
               leg1.penaltyEvents = pen.penaltyEvents;
               winner = pen.homePen > pen.awayPen ? t1 : t2;
             }
         } else {
             const res2 = simulateMatch(t2.strength, t1.strength, t2.tactic, t1.tactic, !t2.isBot, !t1.isBot, difficulty as DifficultyType, t2.chemistry, t1.chemistry, t2.players, t1.players);
             leg2 = { homeTeam: t2.name, awayTeam: t1.name, homeGoals: res2.homeGoals, awayGoals: res2.awayGoals, events: res2.events };

             const agg1 = leg1.homeGoals + (leg2 ? leg2.awayGoals : 0);
             const agg2 = leg1.awayGoals + (leg2 ? leg2.homeGoals : 0);
             if (agg1 > agg2) winner = t1;
             else if (agg2 > agg1) winner = t2;
             else {
                const away1 = leg2.awayGoals;
                const away2 = leg1.awayGoals;
                if (away1 > away2) winner = t1;
                else if (away2 > away1) winner = t2;
                else {
                  const pen = simulatePenalties(t2.players || [], t1.players || []);
                  leg2.isPenalties = true;
                  leg2.homePenalties = pen.homePen;
                  leg2.awayPenalties = pen.awayPen;
                  leg2.penaltyEvents = pen.penaltyEvents;
                  winner = pen.homePen > pen.awayPen ? t2 : t1;
                }
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
  const sorted = [...humanTeams].sort((a, b) => (b.strength + b.chemistry / 10) - (a.strength + a.chemistry / 10));
  const num = sorted.length;
  let roundsData: KnockoutRound[] = [];

  const doMatch = (t1: any, t2: any, roundName: string, isFinal = false) => {
     const res1 = simulateMatch(t1.strength, t2.strength, t1.tactic, t2.tactic, true, true, 'medium', t1.chemistry, t2.chemistry, t1.players, t2.players);
     const leg1: MatchResult = { homeTeam: t1.nickname, awayTeam: t2.nickname, homeGoals: res1.homeGoals, awayGoals: res1.awayGoals, events: res1.events };
     let winner, leg2: MatchResult | undefined;

     if (isFinal) {
        if (res1.homeGoals > res1.awayGoals) winner = t1;
        else if (res1.awayGoals > res1.homeGoals) winner = t2;
        else {
           const pen = simulatePenalties(t1.players || [], t2.players || []);
           leg1.isPenalties = true;
           leg1.homePenalties = pen.homePen;
           leg1.awayPenalties = pen.awayPen;
           leg1.penaltyEvents = pen.penaltyEvents;
           winner = pen.homePen > pen.awayPen ? t1 : t2;
        }
     } else {
        const res2 = simulateMatch(t2.strength, t1.strength, t2.tactic, t1.tactic, true, true, 'medium', t2.chemistry, t1.chemistry, t2.players, t1.players);
        leg2 = { homeTeam: t2.nickname, awayTeam: t1.nickname, homeGoals: res2.homeGoals, awayGoals: res2.awayGoals, events: res2.events };
        const agg1 = leg1.homeGoals + leg2.awayGoals;
        const agg2 = leg1.awayGoals + leg2.homeGoals;
        if (agg1 > agg2) winner = t1;
        else if (agg2 > agg1) winner = t2;
        else {
           const pen = simulatePenalties(t2.players || [], t1.players || []);
           leg2.isPenalties = true;
           leg2.homePenalties = pen.homePen;
           leg2.awayPenalties = pen.awayPen;
           leg2.penaltyEvents = pen.penaltyEvents;
           winner = pen.homePen > pen.awayPen ? t2 : t1;
        }
     }

     roundsData.push({ round: roundName, leg1, leg2, winner: winner.nickname, userOpponent: t2.nickname, userAdvanced: false });
     return winner;
  };

  const getRoundName = (n: number) => {
    if (n === 8) return "Quarter-finals";
    if (n === 4) return "Semi-finals";
    if (n === 2) return "Final";
    return `Round of ${n}`;
  };

  let nextPower = 2;
  while (nextPower < num) nextPower *= 2;

  const byes = nextPower - num;
  let currentRoundTeams = sorted.slice(0, byes);
  let playersToPlay = sorted.slice(byes);

  if (playersToPlay.length > 0) {
    let firstRoundWinners = [];
    const stageName = getRoundName(nextPower);
    const half = playersToPlay.length / 2;
    for (let i = 0; i < half; i++) {
      const t1 = playersToPlay[i];
      const t2 = playersToPlay[playersToPlay.length - 1 - i];
      const w = doMatch(t1, t2, stageName, false);
      firstRoundWinners.push(w);
    }
    currentRoundTeams = [...currentRoundTeams, ...firstRoundWinners];
  }

  while (currentRoundTeams.length > 1) {
    const stageName = getRoundName(currentRoundTeams.length);
    const isFinal = currentRoundTeams.length === 2;
    let nextRoundTeams = [];
    const half = currentRoundTeams.length / 2;
    for (let i = 0; i < half; i++) {
      const t1 = currentRoundTeams[i];
      const t2 = currentRoundTeams[currentRoundTeams.length - 1 - i];
      const w = doMatch(t1, t2, stageName, isFinal);
      nextRoundTeams.push(w);
    }
    currentRoundTeams = nextRoundTeams;
  }

  return { knockoutRounds: roundsData };
}