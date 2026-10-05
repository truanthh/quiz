import type { AnswerVerdict, GameSession } from "./domain.js";
import type { OperationResult } from "./result.js";

/**
 * Client-visible projection of a GameSession. Kept as a distinct type (even
 * though it's currently a pass-through) so that once track answer text or
 * other host-only fields are added to the session shape, stripping them for
 * non-host clients has a single, typed place to happen.
 */
export type PublicGameSession = GameSession;

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

export interface ServerToClientEvents {
  state: (session: PublicGameSession) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (
    payload: JoinRoomPayload,
    ack: (result: OperationResult<{ playerId: string }>) => void,
  ) => void;
  hostJoin: (
    payload: { roomCode: string },
    ack: (result: OperationResult<PublicGameSession>) => void,
  ) => void;
  startGame: () => void;
  beginQuestion: () => void;
  buzz: () => void;
  submitAnswer: (payload: SubmitAnswerPayload) => void;
  hostJudge: (payload: HostJudgePayload) => void;
  advance: () => void;
  submitWager: (payload: SubmitWagerPayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  roomCode: string;
  playerId?: string;
}

export type { AnswerVerdict };
