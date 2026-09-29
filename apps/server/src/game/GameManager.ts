import {
  type GameEvent,
  type GameSession,
  type GameSettings,
  type OperationResult,
  type PlaylistItem,
  err,
  ok,
} from "@quiz/shared";
import { transition } from "./transition.js";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateRoomCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

const DEFAULT_SETTINGS: GameSettings = {
  teamMode: false,
  wrongAnswerPenalty: 50,
  questionWindowMs: 15000,
  finalWagerEnabled: true,
};

/**
 * Holds every in-progress game for this server process, keyed by room code.
 * One process can run many independent rooms at once; there is no
 * cross-process sharing yet (see plan: add @socket.io/redis-adapter + move
 * this state to Redis if the server ever needs to scale beyond one instance).
 */
export class GameManager {
  private sessions = new Map<string, GameSession>();

  createSession(
    hostId: string,
    playlist: PlaylistItem[],
    settings: Partial<GameSettings> = {},
  ): GameSession {
    let roomCode = generateRoomCode();
    while (this.sessions.has(roomCode)) roomCode = generateRoomCode();

    const session: GameSession = {
      roomCode,
      hostId,
      phase: "lobby",
      settings: { ...DEFAULT_SETTINGS, ...settings },
      players: {},
      teams: {},
      playlist,
      currentQuestionIndex: 0,
      isFinalRound: false,
      activeAnswererId: null,
      pendingReview: false,
      questionStartedAt: null,
      buzzedAt: null,
      lockedOutIds: [],
      wagers: {},
    };
    this.sessions.set(roomCode, session);
    return session;
  }

  get(roomCode: string): GameSession | undefined {
    return this.sessions.get(roomCode);
  }

  addPlayer(
    roomCode: string,
    player: { id: string; nickname: string; avatarId: string },
  ): OperationResult<GameSession> {
    const session = this.sessions.get(roomCode);
    if (!session) return err("room not found");
    if (session.phase !== "lobby") return err("game has already started");

    const next: GameSession = {
      ...session,
      players: {
        ...session.players,
        [player.id]: { ...player, score: 0, connected: true },
      },
    };
    this.sessions.set(roomCode, next);
    return ok(next);
  }

  setPlayerConnected(roomCode: string, playerId: string, connected: boolean): void {
    const session = this.sessions.get(roomCode);
    const player = session?.players[playerId];
    if (!session || !player) return;
    this.sessions.set(roomCode, {
      ...session,
      players: { ...session.players, [playerId]: { ...player, connected } },
    });
  }

  dispatch(roomCode: string, event: GameEvent): OperationResult<GameSession> {
    const session = this.sessions.get(roomCode);
    if (!session) return err("room not found");

    const result = transition(session, event);
    if (result.success) this.sessions.set(roomCode, result.data);
    return result;
  }

  deleteSession(roomCode: string): void {
    this.sessions.delete(roomCode);
  }
}
