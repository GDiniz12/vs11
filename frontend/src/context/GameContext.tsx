'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FormationType, FormationSlot, Player, TeamData, GamePhase, LeagueTeam, MatchResult, KnockoutRound, GameStats, GameMode, TacticType, DifficultyType, Manager } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/constants';
import { getFormationSlots } from '@/utils/formations';
import { getRandomTeam, getAllTeams, shuffleArray, calculateTeamChemistry } from '@/utils/helpers';
import { calculateTeamStrength } from '@/utils/simulation';
import { generateLeaguePhase, generateKnockoutRounds } from '@/utils/tournament';
import { americans, europeans, managersData } from '@/data/data';

interface GameState {
  phase: GamePhase;
  formation: FormationType | null;
  gameMode: GameMode;
  tactic: TacticType;
  difficulty: DifficultyType;
  slots: FormationSlot[];
  draftRound: number;
  currentDraftTeam: TeamData | null;
  currentDraftManagers: Manager[];
  manager: Manager | null;
  leagueTable: LeagueTeam[];
  userMatches: MatchResult[];
  knockoutRounds: KnockoutRound[];
  isChampion: boolean;
  stats: GameStats;
  userTeamName: string;
}

interface GameContextType extends GameState {
  setFormation: (f: FormationType) => void;
  setGameMode: (m: GameMode) => void;
  setTactic: (t: TacticType) => void;
  setDifficulty: (d: DifficultyType) => void;
  assignPlayerToSlot: (player: Player, slotId: number) => void;
  assignManager: (manager: Manager) => void;
  drawNextTeam: () => void;
  startLeaguePhase: () => void;
  startKnockoutPhase: () => void;
  setPhase: (p: GamePhase) => void;
  setOnlineTournamentState: (data: any, nickname: string) => void;
  resetGame: () => void;
}

const initialStats: GameStats = { wins: 0, losses: 0, draws: 0, goalsScored: 0, goalsConceded: 0 };

const initialState: GameState = {
  phase: 'home',
  formation: null,
  gameMode: 'classic',
  tactic: 'balanced',
  difficulty: 'medium',
  slots: [],
  draftRound: 0,
  currentDraftTeam: null,
  currentDraftManagers: [],
  manager: null,
  leagueTable: [],
  userMatches: [],
  knockoutRounds: [],
  isChampion: false,
  stats: { ...initialStats },
  userTeamName: '',
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [state, setState] = useState<GameState>({ ...initialState, userTeamName: TRANSLATIONS[lang].your_team });

  const setFormation = useCallback((f: FormationType) => setState((prev) => ({ ...prev, formation: f, slots: getFormationSlots(f) })), []);
  const setGameMode = useCallback((m: GameMode) => setState((prev) => ({ ...prev, gameMode: m })), []);
  const setTactic = useCallback((t: TacticType) => setState((prev) => ({ ...prev, tactic: t })), []);
  const setDifficulty = useCallback((d: DifficultyType) => setState((prev) => ({ ...prev, difficulty: d })), []);
  
  const drawNextTeam = useCallback(() => {
    setState((prev) => {
      if (prev.draftRound < 11) {
        return { ...prev, currentDraftTeam: getRandomTeam(americans, europeans) };
      } else if (prev.draftRound === 11) {
        return { ...prev, currentDraftManagers: shuffleArray(managersData).slice(0, 5), currentDraftTeam: null };
      }
      return prev;
    });
  }, []);

  const assignPlayerToSlot = useCallback((player: Player, slotId: number) => {
    setState((prev) => {
      const newSlots = prev.slots.map((slot) => slot.id === slotId ? { ...slot, player } : slot);
      const newRound = prev.draftRound + 1;
      let nextTeam: TeamData | null = null;
      let nextManagers: Manager[] = [];
      
      if (newRound < 11) {
        nextTeam = getRandomTeam(americans, europeans);
      } else if (newRound === 11) {
        nextManagers = shuffleArray(managersData).slice(0, 5);
      }
      
      return { ...prev, slots: newSlots, draftRound: newRound, currentDraftTeam: nextTeam, currentDraftManagers: nextManagers };
    });
  }, []);

  const assignManager = useCallback((manager: Manager) => {
    setState((prev) => {
      return { ...prev, manager, draftRound: prev.draftRound + 1, currentDraftManagers: [] };
    });
  }, []);

  const setOnlineTournamentState = useCallback((data: any, nickname: string) => {
    setState((prev) => {
      const ko = data.knockoutRounds || [];
      const newStats = { wins: 0, losses: 0, draws: 0, goalsScored: 0, goalsConceded: 0 };

      // Contabiliza pontos na Liga Tradicional
      const uMatches = data.mode === 'tradicional' ? (data.playerMatches[nickname] || []) : [];
      uMatches.forEach((m: any) => {
        const isHome = m.homeTeam === nickname;
        const userGoals = isHome ? m.homeGoals : m.awayGoals;
        const oppGoals = isHome ? m.awayGoals : m.homeGoals;
        newStats.goalsScored += userGoals;
        newStats.goalsConceded += oppGoals;
        if (userGoals > oppGoals) newStats.wins++;
        else if (userGoals < oppGoals) newStats.losses++;
        else newStats.draws++;
      });

      // Contabiliza o Mata-Mata filtrando as partidas do jogador
      const koWithUserContext = ko.map((r: any) => {
        const isLeg1Home = r.leg1.homeTeam === nickname;
        const isLeg1Away = r.leg1.awayTeam === nickname;
        let myOpponent = r.userOpponent;

        // Verifica se a partida envolvia esse jogador específico
        if (isLeg1Home || isLeg1Away) {
          myOpponent = isLeg1Home ? r.leg1.awayTeam : r.leg1.homeTeam;

          // Soma os placares da Ida
          const ug1 = isLeg1Home ? r.leg1.homeGoals : r.leg1.awayGoals;
          const og1 = isLeg1Home ? r.leg1.awayGoals : r.leg1.homeGoals;
          newStats.goalsScored += ug1; newStats.goalsConceded += og1;
          if (ug1 > og1) newStats.wins++; else if (ug1 < og1) newStats.losses++; else newStats.draws++;

          // Soma os placares da Volta (Se existir)
          if (r.leg2) {
            const isLeg2Home = r.leg2.homeTeam === nickname;
            const ug2 = isLeg2Home ? r.leg2.homeGoals : r.leg2.awayGoals;
            const og2 = isLeg2Home ? r.leg2.awayGoals : r.leg2.homeGoals;
            newStats.goalsScored += ug2; newStats.goalsConceded += og2;
            if (ug2 > og2) newStats.wins++; else if (ug2 < og2) newStats.losses++; else newStats.draws++;
          }
        }

        return {
          ...r,
          userAdvanced: r.winner === nickname,
          userOpponent: myOpponent
        };
      });

      const isChampion = ko.length > 0 && ko[ko.length - 1].winner === nickname;

      return {
        ...prev,
        phase: data.mode === 'guerra' ? 'knockout' : 'league',
        leagueTable: data.mode === 'tradicional' ? data.table : [],
        userMatches: uMatches,
        knockoutRounds: koWithUserContext,
        userTeamName: nickname,
        isChampion,
        stats: newStats // <- A mágica final para a página de resultados!
      };
    });
  }, []);

  const startLeaguePhase = useCallback(() => {
    setState((prev) => {
      const userPlayers = prev.slots.filter((s) => s.player).map((s) => s.player!);
      const userStrength = calculateTeamStrength(userPlayers);
      const userTeamName = TRANSLATIONS[lang].your_team;
      const userChemistry = calculateTeamChemistry(prev.slots, prev.formation, prev.manager);

      const allDataTeams = getAllTeams(americans, europeans);
      const teamEntries = allDataTeams.map((t) => ({ name: t.name, strength: t.players.reduce((sum, p) => sum + p.overall, 0) / t.players.length }));

      const shuffled = shuffleArray(teamEntries).slice(0, 35);
      const allTeams = [{ name: userTeamName, strength: userStrength }, ...shuffled];

      const { userMatches, table } = generateLeaguePhase(userTeamName, userStrength, allTeams, prev.tactic, prev.difficulty, userChemistry);

      const stats: GameStats = { ...initialStats };
      userMatches.forEach((m) => {
        const isHome = m.homeTeam === userTeamName;
        const userGoals = isHome ? m.homeGoals : m.awayGoals;
        const oppGoals = isHome ? m.awayGoals : m.homeGoals;
        stats.goalsScored += userGoals;
        stats.goalsConceded += oppGoals;
        if (userGoals > oppGoals) stats.wins++;
        else if (userGoals < oppGoals) stats.losses++;
        else stats.draws++;
      });

      return { ...prev, phase: 'league' as GamePhase, leagueTable: table, userMatches, stats, userTeamName };
    });
  }, [lang]);

  const startKnockoutPhase = useCallback(() => {
    setState((prev) => {
      const userPlayers = prev.slots.filter((s) => s.player).map((s) => s.player!);
      const userStrength = calculateTeamStrength(userPlayers);
      const userChemistry = calculateTeamChemistry(prev.slots, prev.formation, prev.manager);

      const rounds = generateKnockoutRounds(prev.leagueTable, prev.userTeamName, userStrength, prev.tactic, prev.difficulty, userChemistry);

      const newStats = { ...prev.stats };
      rounds.forEach((r) => {
        const isHomeLeg1 = r.leg1.homeTeam === prev.userTeamName;
        const ug1 = isHomeLeg1 ? r.leg1.homeGoals : r.leg1.awayGoals;
        const og1 = isHomeLeg1 ? r.leg1.awayGoals : r.leg1.homeGoals;
        newStats.goalsScored += ug1; newStats.goalsConceded += og1;
        if (ug1 > og1) newStats.wins++; else if (ug1 < og1) newStats.losses++; else newStats.draws++;

        if (r.leg2) {
          const isHomeLeg2 = r.leg2.homeTeam === prev.userTeamName;
          const ug2 = isHomeLeg2 ? r.leg2.homeGoals : r.leg2.awayGoals;
          const og2 = isHomeLeg2 ? r.leg2.awayGoals : r.leg2.homeGoals;
          newStats.goalsScored += ug2; newStats.goalsConceded += og2;
          if (ug2 > og2) newStats.wins++; else if (ug2 < og2) newStats.losses++; else newStats.draws++;
        }
      });

      const lastRound = rounds[rounds.length - 1];
      const isChampion = lastRound?.round === 'Final' && lastRound?.userAdvanced;

      return { ...prev, phase: 'knockout' as GamePhase, knockoutRounds: rounds, stats: newStats, isChampion };
    });
  }, []);

  const setPhase = useCallback((p: GamePhase) => setState((prev) => ({ ...prev, phase: p })), []);
  const resetGame = useCallback(() => setState({ ...initialState, userTeamName: TRANSLATIONS[lang].your_team }), [lang]);

  return (
    <GameContext.Provider value={{ ...state, setFormation, setGameMode, setTactic, setDifficulty, assignPlayerToSlot, assignManager, drawNextTeam, startLeaguePhase, startKnockoutPhase, setPhase, setOnlineTournamentState, resetGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}