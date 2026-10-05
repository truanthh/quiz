export type GamePhase =
  | "lobby"
  | "countdown_to_start"
  | "question_playing"
  | "answer_window"
  | "reveal"
  | "leaderboard"
  | "wager_input"
  | "finished"
  /**
   * The current primary round mode: free-text artist/title answers, judged
   * live by the host, no buzz/lockout. `countdown_to_start`/
   * `question_playing`/`answer_window`/`wager_input` belong to the older
   * buzz-based FSM (`game/transition.ts`), kept around for a possible future
   * "bonus question" mode rather than deleted - `question_active` does not
   * use them at all.
   */
  | "question_active";

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

export type AnswerField = "artist" | "title";

/** One player's answer to one field of the current question, judged by the host. */
export interface FieldAnswer {
  text: string;
  judged: "pending" | "correct" | "incorrect";
  /** What was actually added to the player's score for this field - tracked
   * so re-judging (the host changing their mind) can undo the old delta
   * before applying the new one. */
  awardedPoints: number;
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
  /**
   * Whether the *screen* (the shared big-screen view, `/screen/:roomCode` -
   * a separate client from the host's phone dashboard) is currently playing
   * the clip. Players never receive the track itself, only this flag, so
   * their phones can reflect playback without anything that would give the
   * track away.
   */
  audioPlaying: boolean;
  /**
   * Whether at least one `/screen/:roomCode` client is currently connected.
   * The whole game is built around the screen (that's what plays audio and
   * is what everyone in the room actually watches), so starting without one
   * connected is refused - the host dashboard shows this so they know why.
   */
  screenConnected: boolean;
  /**
   * Which of the (currently hardcoded, client-side) reveal phases the host
   * has selected for the current question - null when nothing is playing.
   * The screen watches this to know what to seek/play to; it's just an
   * index, not sensitive, so it's fine to broadcast to everyone.
   */
  activePhaseIndex: number | null;
  /**
   * Server timestamp of when `activePhaseIndex` was last set to a non-null
   * value - changes on *every* such call, even re-selecting the same phase.
   * Clients watch this (not activePhaseIndex alone) to know when to
   * (re)start playback, so the host can hit the same phase button as many
   * times as they want. Also lets any client (e.g. the host's phone, which
   * has no real audio) derive a wall-clock progress bar without needing
   * actual playback.
   */
  activePhaseStartedAt: number | null;
  /**
   * Free-text answers for the `question_active` round mode, keyed by
   * question index (not just "current", so the host can navigate back to an
   * earlier question and still see/re-judge what was submitted there) then
   * by player id. Host-only - stripped from the `state` broadcast players
   * and the screen receive (see `PublicGameSession` in events.ts) so players
   * can't see each other's guesses.
   */
  answersByQuestion: Record<number, Record<string, Partial<Record<AnswerField, FieldAnswer>>>>;
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
