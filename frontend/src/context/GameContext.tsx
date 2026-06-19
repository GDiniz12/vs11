'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { FormationType, FormationSlot, Player, TeamData, GamePhase, LeagueTeam, MatchResult, KnockoutRound, GameStats, GameMode, TacticType, DifficultyType, Manager, TournamentMode, CopaGroup, BrasileiraoRound } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/constants';
import { getFormationSlots } from '@/utils/formations';
import { getRandomTeam, getAllTeams, getBrazilianTeams, shuffleArray, calculateTeamChemistry, getManagerBonus } from '@/utils/helpers';
import { calculateTeamStrength } from '@/utils/simulation';
import { generateLeaguePhase, generateKnockoutRounds, generateCopaGroups, generateBrasileirao } from '@/utils/tournament';
import { americans, europeans, nationalTeams, managersData } from '@/data/data';

interface GameState {
  phase: GamePhase;
  formation: FormationType | null;
  gameMode: GameMode;
  tournamentMode: TournamentMode;
  tactic: TacticType;
  difficulty: DifficultyType;
  isRanked: boolean;
  slots: FormationSlot[];
  draftRound: number;
  currentDraftTeam: TeamData | null;
  currentDraftManagers: Manager[];
  manager: Manager | null;
  leagueTable: LeagueTeam[];
  userMatches: MatchResult[];
  knockoutRounds: KnockoutRound[];
  copaGroups: CopaGroup[];
  brasilRounds: BrasileiraoRound[];
  isChampion: boolean;
  stats: GameStats;
  userTeamName: string;
}

interface GameContextType extends GameState {
  setFormation: (f: FormationType) => void;
  setGameMode: (m: GameMode) => void;
  setTournamentMode: (m: TournamentMode) => void;
  setIsRanked: (v: boolean) => void;
  startCopaGroupStage: () => void;
  startBrasileirao: () => void;
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
  swapPlayers: (slotId1: number, slotId2: number) => void;
  undoPick: () => void;
  canUndo: boolean;
  clearSave: () => void;
}

const initialStats: GameStats = { wins: 0, losses: 0, draws: 0, goalsScored: 0, goalsConceded: 0 };

const initialState: GameState = {
  phase: 'home',
  formation: null,
  gameMode: 'classic',
  tournamentMode: 'super-mundial',
  tactic: 'balanced',
  difficulty: 'medium',
  isRanked: false,
  slots: [],
  draftRound: 0,
  currentDraftTeam: null,
  currentDraftManagers: [],
  manager: null,
  leagueTable: [],
  userMatches: [],
  knockoutRounds: [],
  copaGroups: [],
  brasilRounds: [],
  isChampion: false,
  stats: { ...initialStats },
  userTeamName: '',
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [state, setState] = useState<GameState>({ ...initialState, userTeamName: TRANSLATIONS[lang].your_team });
  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('16a0_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phase !== 'result') {
          setState(parsed);
        }
      } catch (e) { console.error('Failed to parse save', e); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      if (state.phase === 'home') localStorage.removeItem('16a0_save');
      else localStorage.setItem('16a0_save', JSON.stringify(state));
    }
  }, [state, isLoaded]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.phase !== 'home' && state.phase !== 'result') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.phase]);

  const clearSave = useCallback(() => {
    localStorage.removeItem('16a0_save');
    setState({ ...initialState, userTeamName: TRANSLATIONS[lang].your_team });
    setUndoStack([]);
  }, [lang]);

  const undoPick = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const prevState = newStack.pop()!;
      setState(prevState);
      return newStack;
    });
  }, []);

  const setFormation = useCallback((f: FormationType) => setState((prev) => ({ ...prev, formation: f, slots: getFormationSlots(f) })), []);
  const setGameMode = useCallback((m: GameMode) => setState((prev) => ({ ...prev, gameMode: m })), []);
  const setTournamentMode = useCallback((m: TournamentMode) => setState((prev) => ({ ...prev, tournamentMode: m })), []);
  const setIsRanked = useCallback((v: boolean) => setState((prev) => ({ ...prev, isRanked: v })), []);
  const setTactic = useCallback((t: TacticType) => setState((prev) => ({ ...prev, tactic: t })), []);
  const setDifficulty = useCallback((d: DifficultyType) => setState((prev) => ({ ...prev, difficulty: d })), []);
  
  const getTeamPoolForMode = (mode: TournamentMode): TeamData => {
    if (mode === 'copa-do-mundo') {
      const pool = getAllTeams({} as any, {} as any, nationalTeams);
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (mode === 'brasileirao') {
      const pool = getBrazilianTeams(americans);
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return getRandomTeam(americans, europeans, nationalTeams);
  };

  const getManagerPoolForMode = (mode: TournamentMode) => {
    if (mode === 'copa-do-mundo') {
      const nationalKeys = new Set(Object.keys(nationalTeams));
      return managersData.filter((m) => nationalKeys.has(m.clubeAno));
    }
    if (mode === 'brasileirao') {
      const brazilianKeys = new Set(getBrazilianTeams(americans).map((t) => t.key));
      return managersData.filter((m) => brazilianKeys.has(m.clubeAno));
    }
    return managersData;
  };

  const drawNextTeam = useCallback(() => {
    setState((prev) => {
      if (prev.draftRound < 11) {
        return { ...prev, currentDraftTeam: getTeamPoolForMode(prev.tournamentMode) };
      } else if (prev.draftRound === 11) {
        const pool = getManagerPoolForMode(prev.tournamentMode);
        return { ...prev, currentDraftManagers: shuffleArray(pool).slice(0, 5), currentDraftTeam: null };
      }
      return prev;
    });
  }, []);

  const assignPlayerToSlot = useCallback((player: Player, slotId: number) => {
    setState((prev) => {
      setUndoStack(s => [...s, prev]);
      const newSlots = prev.slots.map((slot) => slot.id === slotId ? { ...slot, player } : slot);
      const newRound = prev.draftRound + 1;
      let nextTeam: TeamData | null = null;
      let nextManagers: Manager[] = [];

      if (newRound < 11) {
        nextTeam = getTeamPoolForMode(prev.tournamentMode);
      } else if (newRound === 11) {
        const pool = getManagerPoolForMode(prev.tournamentMode);
        nextManagers = shuffleArray(pool).slice(0, 5);
      }

      return { ...prev, slots: newSlots, draftRound: newRound, currentDraftTeam: nextTeam, currentDraftManagers: nextManagers };
    });
  }, []);

  const assignManager = useCallback((manager: Manager) => {
    setState((prev) => {
      setUndoStack(s => [...s, prev]);
      return { ...prev, manager, draftRound: prev.draftRound + 1, currentDraftManagers: [] };
    });
  }, []);

  const swapPlayers = useCallback((slotId1: number, slotId2: number) => {
    setState((prev) => {
      const s1 = prev.slots.find(s => s.id === slotId1);
      const s2 = prev.slots.find(s => s.id === slotId2);
      if (!s1 || !s2) return prev;
      
      const newSlots = prev.slots.map(s => {
        if (s.id === slotId1) return { ...s, player: s2.player };
        if (s.id === slotId2) return { ...s, player: s1.player };
        return s;
      });
      return { ...prev, slots: newSlots };
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

      // No modo guerra, mostra TODOS os confrontos para todos os jogadores
      const relevantMatches = data.mode === 'guerra' ? ko : ko.filter((r: any) => r.leg1.homeTeam === nickname || r.leg1.awayTeam === nickname);

      const koWithUserContext = relevantMatches.map((r: any) => {
        const isUserInMatch = r.leg1.homeTeam === nickname || r.leg1.awayTeam === nickname;
        const isLeg1Home = r.leg1.homeTeam === nickname;
        const myOpponent = isUserInMatch 
          ? (isLeg1Home ? r.leg1.awayTeam : r.leg1.homeTeam)
          : r.leg1.awayTeam;

        // Só contabiliza stats de partidas que o jogador participou
        if (isUserInMatch) {
          const ug1 = isLeg1Home ? r.leg1.homeGoals : r.leg1.awayGoals;
          const og1 = isLeg1Home ? r.leg1.awayGoals : r.leg1.homeGoals;
          newStats.goalsScored += ug1; newStats.goalsConceded += og1;
          if (ug1 > og1) newStats.wins++; else if (ug1 < og1) newStats.losses++; else newStats.draws++;

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
          isUserMatch: isUserInMatch,
          userAdvanced: isUserInMatch ? r.winner === nickname : false,
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
        isRanked: !!data.isRanked,
        stats: newStats // <- A mágica final para a página de resultados!
      };
    });
  }, []);

  const startLeaguePhase = useCallback(() => {
    setState((prev) => {
      const userPlayers = prev.slots.filter((s) => s.player).map((s) => {
        const p = { ...s.player! };
        // Aplica penalidade se escalado fora de posição (exceto goleiros na zaga para não crashar, mas com penalidade)
        if (!p.positions.includes(s.position)) {
          p.overall = Math.max(40, p.overall - 12);
          p.name = p.name + " ⚠️"; // Indicador visual na narração
        }
        return p;
      });
      const userStrength = calculateTeamStrength(userPlayers, prev.manager);
      const userTeamName = TRANSLATIONS[lang].your_team;
      const userChemistry = calculateTeamChemistry(prev.slots, prev.formation, prev.manager);

      const allDataTeams = getAllTeams(americans, europeans, nationalTeams);
      const teamEntries = allDataTeams.map((t) => ({ name: t.name, strength: t.players.reduce((sum, p) => sum + p.overall, 0) / t.players.length, players: t.players }));

      const botCap = prev.tournamentMode === 'louco' ? 31 : 35;
      const shuffled = shuffleArray(teamEntries).slice(0, botCap);
      const allTeams = [{ name: userTeamName, strength: userStrength, players: userPlayers }, ...shuffled];

      const { userMatches, table } = generateLeaguePhase(userTeamName, userStrength, allTeams, prev.tactic, prev.difficulty, userChemistry, getManagerBonus(prev.manager));

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

  const startCopaGroupStage = useCallback(() => {
    setState((prev) => {
      const userPlayers = prev.slots.filter((s) => s.player).map((s) => {
        const p = { ...s.player! };
        if (!p.positions.includes(s.position)) {
          p.overall = Math.max(40, p.overall - 12);
          p.name = p.name + ' ⚠️';
        }
        return p;
      });
      const userStrength = calculateTeamStrength(userPlayers, prev.manager);
      const userTeamName = TRANSLATIONS[lang].your_team;
      const userChemistry = calculateTeamChemistry(prev.slots, prev.formation, prev.manager);

      const allNationalData = getAllTeams({} as any, {} as any, nationalTeams);
      const botTeams = shuffleArray(allNationalData)
        .slice(0, 31)
        .map((t) => ({ name: t.name, strength: t.players.reduce((s: number, p: any) => s + p.overall, 0) / t.players.length, players: t.players }));

      const allTeams = shuffleArray([
        { name: userTeamName, strength: userStrength, players: userPlayers },
        ...botTeams,
      ]);

      const { groups, qualifiedTeams, userGroupMatches } = generateCopaGroups(
        userTeamName, allTeams, prev.tactic, prev.difficulty, userChemistry, getManagerBonus(prev.manager)
      );

      const stats: GameStats = { ...initialStats };
      userGroupMatches.forEach((m) => {
        const isHome = m.homeTeam === userTeamName;
        const ug = isHome ? m.homeGoals : m.awayGoals;
        const og = isHome ? m.awayGoals : m.homeGoals;
        stats.goalsScored += ug;
        stats.goalsConceded += og;
        if (ug > og) stats.wins++;
        else if (ug < og) stats.losses++;
        else stats.draws++;
      });

      return {
        ...prev,
        phase: 'copa-group-stage' as GamePhase,
        copaGroups: groups,
        leagueTable: qualifiedTeams,
        userMatches: userGroupMatches,
        stats,
        userTeamName,
      };
    });
  }, [lang]);

  const startBrasileirao = useCallback(() => {
    setState((prev) => {
      const userPlayers = prev.slots.filter((s) => s.player).map((s) => {
        const p = { ...s.player! };
        if (!p.positions.includes(s.position)) {
          p.overall = Math.max(40, p.overall - 12);
          p.name = p.name + ' ⚠️';
        }
        return p;
      });
      const userStrength = calculateTeamStrength(userPlayers, prev.manager);
      const userTeamName = TRANSLATIONS[lang].your_team;
      const userChemistry = calculateTeamChemistry(prev.slots, prev.formation, prev.manager);

      const brazilianPool = getBrazilianTeams(americans);
      const botTeams = shuffleArray(brazilianPool)
        .slice(0, 19)
        .map((t) => ({
          name: t.name,
          strength: t.players.reduce((s: number, p: any) => s + p.overall, 0) / t.players.length,
          players: t.players,
        }));

      const allTeams = shuffleArray([
        { name: userTeamName, strength: userStrength, players: userPlayers },
        ...botTeams,
      ]);

      const { rounds, finalTable } = generateBrasileirao(
        userTeamName, allTeams, prev.tactic, prev.difficulty, userChemistry, getManagerBonus(prev.manager)
      );

      const stats: GameStats = { ...initialStats };
      rounds.forEach((r) => {
        const m = r.userMatch;
        if (!m) return;
        const isHome = m.homeTeam === userTeamName;
        const ug = isHome ? m.homeGoals : m.awayGoals;
        const og = isHome ? m.awayGoals : m.homeGoals;
        stats.goalsScored += ug; stats.goalsConceded += og;
        if (ug > og) stats.wins++; else if (ug < og) stats.losses++; else stats.draws++;
      });

      return {
        ...prev,
        phase: 'brasileirao' as GamePhase,
        brasilRounds: rounds,
        leagueTable: finalTable,
        stats,
        userTeamName,
      };
    });
  }, [lang]);

  const startKnockoutPhase = useCallback(() => {
    setState((prev) => {
      const userPlayers = prev.slots.filter((s) => s.player).map((s) => s.player!);
      const userStrength = calculateTeamStrength(userPlayers, prev.manager);
      const userChemistry = calculateTeamChemistry(prev.slots, prev.formation, prev.manager);

      const singleLeg = prev.tournamentMode === 'copa-do-mundo';
      const rounds = generateKnockoutRounds(prev.leagueTable, prev.userTeamName, userStrength, prev.tactic, prev.difficulty, userChemistry, getManagerBonus(prev.manager), singleLeg);

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
    <GameContext.Provider value={{ ...state, setFormation, setGameMode, setTournamentMode, setIsRanked, setTactic, setDifficulty, assignPlayerToSlot, assignManager, drawNextTeam, startLeaguePhase, startCopaGroupStage, startBrasileirao, startKnockoutPhase, setPhase, setOnlineTournamentState, resetGame, swapPlayers, undoPick, canUndo: undoStack.length > 0, clearSave }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}