import {
  type GameEvent,
  type GameSession,
  type GameSettings,
  type OperationResult,
  type PlaylistItem,
  err,
  ok,
} from "@quiz/shared";
import * as freeTextGame from "./freeTextGame.js";
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
  // Multiple screen sockets could in principle be open for one room (e.g. a
  // host who leaves an old /screen tab open); only drop to "disconnected"
  // once none are left, not on the first one to go.
  private screenSocketsByRoom = new Map<string, Set<string>>();

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
      audioPlaying: false,
      screenConnected: false,
      activePhaseIndex: null,
      activePhaseStartedAt: null,
      answersByQuestion: {},
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

    const nickname = player.nickname.trim();
    const taken = Object.values(session.players).some(
      (p) => p.nickname.toLowerCase() === nickname.toLowerCase(),
    );
    if (taken) return err("nickname already taken");

    const next: GameSession = {
      ...session,
      players: {
        ...session.players,
        [player.id]: { ...player, nickname, score: 0, connected: true },
      },
    };
    this.sessions.set(roomCode, next);
    return ok(next);
  }

  removePlayer(roomCode: string, playerId: string): OperationResult<GameSession> {
    const session = this.sessions.get(roomCode);
    if (!session) return err("room not found");
    if (session.phase !== "lobby") return err("can only remove a player before the game starts");
    if (!session.players[playerId]) return err("player not found");

    const players = { ...session.players };
    delete players[playerId];
    const next = { ...session, players };
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
    if (!result.success) return result;

    // Leaving question_playing (e.g. a BUZZ) always stops the clip, even if
    // the host's own "stop" message is slow or gets lost - belt and suspenders
    // alongside HostRoomView pausing its <audio> element locally.
    const next =
      result.data.phase === "question_playing" ? result.data : { ...result.data, audioPlaying: false };
    this.sessions.set(roomCode, next);
    return ok(next);
  }

  addScreen(roomCode: string, socketId: string): void {
    let sockets = this.screenSocketsByRoom.get(roomCode);
    if (!sockets) {
      sockets = new Set();
      this.screenSocketsByRoom.set(roomCode, sockets);
    }
    sockets.add(socketId);
    this.syncScreenConnected(roomCode);
  }

  removeScreen(roomCode: string, socketId: string): void {
    this.screenSocketsByRoom.get(roomCode)?.delete(socketId);
    this.syncScreenConnected(roomCode);
  }

  private syncScreenConnected(roomCode: string): void {
    const session = this.sessions.get(roomCode);
    if (!session) return;
    const connected = (this.screenSocketsByRoom.get(roomCode)?.size ?? 0) > 0;
    if (session.screenConnected !== connected) {
      this.sessions.set(roomCode, { ...session, screenConnected: connected });
    }
  }

  setAudioPlaying(roomCode: string, playing: boolean): void {
    const session = this.sessions.get(roomCode);
    if (!session) return;
    this.sessions.set(roomCode, { ...session, audioPlaying: playing });
  }

  setActivePhase(roomCode: string, index: number | null): void {
    const session = this.sessions.get(roomCode);
    if (!session) return;
    this.sessions.set(roomCode, freeTextGame.setActivePhase(session, index));
  }

  private applyFreeText(
    roomCode: string,
    fn: (session: GameSession) => OperationResult<GameSession>,
  ): OperationResult<GameSession> {
    const session = this.sessions.get(roomCode);
    if (!session) return err("room not found");
    const result = fn(session);
    if (result.success) this.sessions.set(roomCode, result.data);
    return result;
  }

  startFreeTextGame(roomCode: string): OperationResult<GameSession> {
    return this.applyFreeText(roomCode, freeTextGame.startGame);
  }

  gotoQuestion(roomCode: string, index: number): OperationResult<GameSession> {
    return this.applyFreeText(roomCode, (s) => freeTextGame.gotoQuestion(s, index));
  }

  submitFieldAnswer(
    roomCode: string,
    playerId: string,
    field: Parameters<typeof freeTextGame.submitFieldAnswer>[2],
    text: string,
  ): OperationResult<GameSession> {
    return this.applyFreeText(roomCode, (s) => freeTextGame.submitFieldAnswer(s, playerId, field, text));
  }

  judgeFieldAnswer(
    roomCode: string,
    playerId: string,
    field: Parameters<typeof freeTextGame.judgeFieldAnswer>[2],
    correct: boolean,
    points: number,
  ): OperationResult<GameSession> {
    return this.applyFreeText(roomCode, (s) =>
      freeTextGame.judgeFieldAnswer(s, playerId, field, correct, points),
    );
  }

  finishGame(roomCode: string): OperationResult<GameSession> {
    return this.applyFreeText(roomCode, freeTextGame.finishGame);
  }

  deleteSession(roomCode: string): void {
    this.sessions.delete(roomCode);
  }
}
