'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  FormationType,
  FormationSlot,
  Player,
  TeamData,
  GamePhase,
  LeagueTeam,
  MatchResult,
  KnockoutRound,
  GameStats,
  GameMode,
} from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/constants';
import { getFormationSlots } from '@/utils/formations';
import { getRandomTeam, getAllTeams, shuffleArray } from '@/utils/helpers';
import { calculateTeamStrength } from '@/utils/simulation';
import {
  generateLeaguePhase,
  checkQualification,
  generateKnockoutRounds,
} from '@/utils/tournament';
import { americans, europeans } from '@/data/data';

interface GameState {
  phase: GamePhase;
  formation: FormationType | null;
  gameMode: GameMode;
  slots: FormationSlot[];
  draftRound: number;
  currentDraftTeam: TeamData | null;
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
  assignPlayerToSlot: (player: Player, slotId: number) => void;
  drawNextTeam: () => void;
  startLeaguePhase: () => void;
  startKnockoutPhase: () => void;
  setPhase: (p: GamePhase) => void;
  resetGame: () => void;
}

const initialStats: GameStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  goalsScored: 0,
  goalsConceded: 0,
};

const initialState: GameState = {
  phase: 'home',
  formation: null,
  gameMode: 'classic', // Default é clássico
  slots: [],
  draftRound: 0,
  currentDraftTeam: null,
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

  const setFormation = useCallback((f: FormationType) => {
    setState((prev) => ({
      ...prev,
      formation: f,
      slots: getFormationSlots(f),
    }));
  }, []);

  const setGameMode = useCallback((m: GameMode) => {
    setState((prev) => ({
      ...prev,
      gameMode: m,
    }));
  }, []);

  const drawNextTeam = useCallback(() => {
    const team = getRandomTeam(americans, europeans);
    setState((prev) => ({ ...prev, currentDraftTeam: team }));
  }, []);

  const assignPlayerToSlot = useCallback(
    (player: Player, slotId: number) => {
      setState((prev) => {
        const newSlots = prev.slots.map((slot) =>
          slot.id === slotId ? { ...slot, player } : slot
        );
        const newRound = prev.draftRound + 1;

        let nextTeam: TeamData | null = null;
        if (newRound < 11) {
          nextTeam = getRandomTeam(americans, europeans);
        }

        return {
          ...prev,
          slots: newSlots,
          draftRound: newRound,
          currentDraftTeam: nextTeam,
        };
      });
    },
    []
  );

  const startLeaguePhase = useCallback(() => {
    setState((prev) => {
      const userPlayers = prev.slots
        .filter((s) => s.player)
        .map((s) => s.player!);
      const userStrength = calculateTeamStrength(userPlayers);
      const userTeamName = TRANSLATIONS[lang].your_team;

      const allDataTeams = getAllTeams(americans, europeans);
      const teamEntries = allDataTeams.map((t) => ({
        name: t.name,
        strength:
          t.players.reduce((sum, p) => sum + p.overall, 0) /
          t.players.length,
      }));

      const shuffled = shuffleArray(teamEntries).slice(0, 35);
      const allTeams = [
        { name: userTeamName, strength: userStrength },
        ...shuffled,
      ];

      const { userMatches, table } = generateLeaguePhase(
        userTeamName,
        userStrength,
        allTeams
      );

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

      return {
        ...prev,
        phase: 'league' as GamePhase,
        leagueTable: table,
        userMatches,
        stats,
        userTeamName,
      };
    });
  }, [lang]);

  const startKnockoutPhase = useCallback(() => {
    setState((prev) => {
      const userPlayers = prev.slots
        .filter((s) => s.player)
        .map((s) => s.player!);
      const userStrength = calculateTeamStrength(userPlayers);

      const rounds = generateKnockoutRounds(
        prev.leagueTable,
        prev.userTeamName,
        userStrength
      );

      const newStats = { ...prev.stats };
      rounds.forEach((r) => {
        const isHomeLeg1 = r.leg1.homeTeam === prev.userTeamName;
        const ug1 = isHomeLeg1 ? r.leg1.homeGoals : r.leg1.awayGoals;
        const og1 = isHomeLeg1 ? r.leg1.awayGoals : r.leg1.homeGoals;
        newStats.goalsScored += ug1;
        newStats.goalsConceded += og1;
        if (ug1 > og1) newStats.wins++;
        else if (ug1 < og1) newStats.losses++;
        else newStats.draws++;

        if (r.leg2) {
          const isHomeLeg2 = r.leg2.homeTeam === prev.userTeamName;
          const ug2 = isHomeLeg2 ? r.leg2.homeGoals : r.leg2.awayGoals;
          const og2 = isHomeLeg2 ? r.leg2.awayGoals : r.leg2.homeGoals;
          newStats.goalsScored += ug2;
          newStats.goalsConceded += og2;
          if (ug2 > og2) newStats.wins++;
          else if (ug2 < og2) newStats.losses++;
          else newStats.draws++;
        }
      });

      const lastRound = rounds[rounds.length - 1];
      const isChampion =
        lastRound?.round === 'Final' && lastRound?.userAdvanced;

      return {
        ...prev,
        phase: 'knockout' as GamePhase,
        knockoutRounds: rounds,
        stats: newStats,
        isChampion,
      };
    });
  }, []);

  const setPhase = useCallback((p: GamePhase) => {
    setState((prev) => ({ ...prev, phase: p }));
  }, []);

  const resetGame = useCallback(() => {
    setState({ ...initialState, userTeamName: TRANSLATIONS[lang].your_team });
  }, [lang]);

  return (
    <GameContext.Provider
      value={{
        ...state,
        setFormation,
        setGameMode,
        assignPlayerToSlot,
        drawNextTeam,
        startLeaguePhase,
        startKnockoutPhase,
        setPhase,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx)
    throw new Error('useGame must be used within a GameProvider');
  return ctx;
}