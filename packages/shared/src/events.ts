import type { AnswerField, AnswerVerdict, FieldAnswer, GameSession } from "./domain.js";
import type { OperationResult } from "./result.js";

/**
 * Client-visible projection of a GameSession, with `answersByQuestion`
 * stripped - that field holds every player's free-text guesses, which only
 * the host should see (sent separately via `hostState`), never the room
 * broadcast the screen and players also receive.
 */
export type PublicGameSession = Omit<GameSession, "answersByQuestion">;

export interface JoinRoomPayload {
  roomCode: string;
  nickname: string;
  avatarId: string;
}

export interface HostJudgePayload {
  contestantId: string;
  correct: boolean;
}

export interface SubmitAnswerPayload {
  text: string;
}

export interface SubmitWagerPayload {
  amount: number;
}

export interface SubmitFieldAnswerPayload {
  field: AnswerField;
  text: string;
}

export interface JudgeFieldAnswerPayload {
  playerId: string;
  field: AnswerField;
  correct: boolean;
  points: number;
}

export interface ClipInfo {
  url: string;
  clipStartMs: number;
  clipEndMs: number;
}

export interface RejoinRoomResult {
  session: PublicGameSession;
  /** This player's own answers for the current question, if any were
   * already submitted before the reload - lets the client restore the
   * "already answered, can't change it" lock instead of re-prompting. */
  myAnswers: Partial<Record<AnswerField, FieldAnswer>>;
}

export interface ServerToClientEvents {
  state: (session: PublicGameSession) => void;
  /** Host-only: the full session, including other players' free-text answers. */
  hostState: (session: GameSession) => void;
  error: (message: string) => void;
  /** Broadcast to the room; each player's client checks if it's their own
   * id and, if so, clears its saved session and bails out to the join form. */
  kicked: (payload: { playerId: string }) => void;
}

export interface ClientToServerEvents {
  joinRoom: (
    payload: JoinRoomPayload,
    ack: (result: OperationResult<{ playerId: string }>) => void,
  ) => void;
  /** Resumes an existing player after a page reload/reconnect - unlike
   * joinRoom, doesn't create a new Player or check the nickname is free. */
  rejoinRoom: (
    payload: { roomCode: string; playerId: string },
    ack: (result: OperationResult<RejoinRoomResult>) => void,
  ) => void;
  hostJoin: (
    payload: { roomCode: string },
    ack: (result: OperationResult<GameSession>) => void,
  ) => void;
  /** Read-only big-screen client - no player, no auth, just the room code. */
  screenJoin: (
    payload: { roomCode: string },
    ack: (result: OperationResult<PublicGameSession>) => void,
  ) => void;
  /** Host or screen only: the current question's playable clip. Answered via
   * ack rather than broadcast, specifically so it never reaches players. */
  getCurrentClip: (ack: (result: OperationResult<ClipInfo>) => void) => void;

  startGame: () => void;
  /** Host-only, replaces one-way `advance` for the free-text round: jump to
   * any question index, forward or back. */
  gotoQuestion: (payload: { index: number }) => void;
  /** Host-only: which hardcoded reveal phase the screen should be playing. */
  setActivePhase: (payload: { index: number | null }) => void;
  /** Player-only: update this player's guess for one field of the current question. */
  submitFieldAnswer: (payload: SubmitFieldAnswerPayload) => void;
  /** Host-only: accept/reject one player's one field, awarding its points. */
  judgeFieldAnswer: (payload: JudgeFieldAnswerPayload) => void;
  finishGame: () => void;
  /** Host-only, lobby only: removes a player from the room and disconnects their socket. */
  kickPlayer: (payload: { playerId: string }) => void;
  /** Host-only, lobby only: disconnects whatever screen socket(s) are connected. */
  kickScreen: () => void;

  // Older buzz-based flow (see GamePhase.question_active's doc comment) -
  // kept wired to the old FSM for a possible future bonus-question mode, not
  // used by the current free-text round.
  beginQuestion: () => void;
  buzz: () => void;
  submitAnswer: (payload: SubmitAnswerPayload) => void;
  hostJudge: (payload: HostJudgePayload) => void;
  advance: () => void;
  submitWager: (payload: SubmitWagerPayload) => void;

  /** Screen-only: mirrors its real playback state to players' phones. */
  setAudioPlaying: (payload: { playing: boolean }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  roomCode: string;
  playerId?: string;
  role?: "host" | "screen";
}

export type { AnswerVerdict };
