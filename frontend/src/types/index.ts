export type PositionCode =
  | "GOL" | "LD" | "ZAG" | "LE"
  | "VOL" | "MC" | "MEI"
  | "ME" | "MD"
  | "PE" | "PD" | "CA";

export type FormationType = "4-3-3" | "4-4-2" | "3-4-3" | "3-5-2" | "5-4-1" | "4-2-3-1";
export type GameMode = "classic" | "hardcore";
export type TacticType = "defensive" | "balanced" | "offensive";
export type DifficultyType = "easy" | "medium" | "impossible";

export interface Player {
  name: string;
  overall: number;
  positions: PositionCode[];
  nationality: string;
  teamName: string;
  teamKey: string;
}

export interface Manager {
  tecnico: string;
  clubeAno: string;
  nacionalidade: string;
  overall: number;
}

export interface FormationSlot {
  id: number;
  position: PositionCode;
  label: string;
  x: number;
  y: number;
  player?: Player;
}

export interface TeamData {
  key: string;
  name: string;
  players: Player[];
  continent: "american" | "european";
}

export interface MatchEvent {
  minute: number;
  player: string;
  team: "home" | "away";
  type: "goal" | "penalty_goal" | "penalty_miss";
}

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  events?: MatchEvent[];
  isPenalties?: boolean;
  homePenalties?: number;
  awayPenalties?: number;
  penaltyEvents?: MatchEvent[];
  stats?: {
    possession: [number, number];
    shots: [number, number];
  };
}

export interface LeagueTeam {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  isUser: boolean;
  avgOverall: number;
  players?: any[];
}

export interface KnockoutRound {
  round: string;
  userOpponent: string;
  leg1: MatchResult;
  leg2?: MatchResult;
  winner: string;
  userAdvanced: boolean;
  isUserMatch?: boolean;
}

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  goalsScored: number;
  goalsConceded: number;
}

export type GamePhase = "home" | "formation" | "draft" | "league" | "knockout" | "result";