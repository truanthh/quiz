export type GamePhase =
  | "lobby"
  | "countdown_to_start"
  | "question_playing"
  | "answer_window"
  | "reveal"
  | "leaderboard"
  | "wager_input"
  | "finished";

export interface Track {
  id: string;
  title: string;
  artist: string;
  storageKey: string;
  durationMs: number;
  posterUrl?: string;
}

export interface PlaylistItem {
  id: string;
  trackId: string;
  clipStartMs: number;
  clipEndMs: number;
  basePoints: number;
}

export interface Player {
  id: string;
  nickname: string;
  avatarId: string;
  teamId?: string;
  score: number;
  connected: boolean;
}

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface GameSettings {
  teamMode: boolean;
  wrongAnswerPenalty: number;
  questionWindowMs: number;
  finalWagerEnabled: boolean;
}

/**
 * A "contestant" is whoever is competing for points on a question: a player id
 * in solo mode, or a team id in team mode. Resolving which one applies for a
 * given socket/player happens outside the state machine (in GameManager), so
 * transition() stays pure and doesn't need to know about team membership rules.
 */
export interface GameSession {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  settings: GameSettings;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  playlist: PlaylistItem[];
  currentQuestionIndex: number;
  isFinalRound: boolean;
  activeAnswererId: string | null;
  pendingReview: boolean;
  questionStartedAt: number | null;
  buzzedAt: number | null;
  lockedOutIds: string[];
  wagers: Record<string, number>;
}

export type AnswerVerdict = "accept" | "review" | "reject";

export type GameEvent =
  | { type: "START_GAME"; at: number }
  | { type: "BEGIN_QUESTION"; at: number }
  | { type: "BUZZ"; contestantId: string; at: number }
  | { type: "SUBMIT_ANSWER"; contestantId: string; verdict: AnswerVerdict }
  | { type: "HOST_JUDGE"; contestantId: string; correct: boolean }
  | { type: "ADVANCE" }
  | { type: "SUBMIT_WAGER"; contestantId: string; amount: number };
