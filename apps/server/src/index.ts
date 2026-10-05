import "dotenv/config";
import "express-async-errors";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type {
  ClientToServerEvents,
  GameSession,
  InterServerEvents,
  PlaylistItem,
  PublicGameSession,
  ServerToClientEvents,
  SocketData,
} from "@quiz/shared";
import { err, ok } from "@quiz/shared";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { Server } from "socket.io";
import { authRouter } from "./auth/routes.js";
import { requireAuth, SESSION_COOKIE } from "./auth/middleware.js";
import { verifySessionToken } from "./auth/session.js";
import { config } from "./config.js";
import { prisma } from "./db/prisma.js";
import { GameManager } from "./game/GameManager.js";
import { playlistsRouter } from "./playlists/routes.js";
import { publicUrlFor } from "./storage/presign.js";
import { matchTrackAnswer } from "./tracks/matchTrackAnswer.js";
import { tracksRouter } from "./tracks/routes.js";
import { z } from "zod";

const app = express();
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/tracks", tracksRouter);
app.use("/playlists", playlistsRouter);

const gameSettingsSchema = z.object({
  teamMode: z.boolean().optional(),
  wrongAnswerPenalty: z.number().int().nonnegative().optional(),
  questionWindowMs: z.number().int().positive().optional(),
  finalWagerEnabled: z.boolean().optional(),
});

const createRoomSchema = z.object({
  playlistId: z.string().min(1),
  settings: gameSettingsSchema.optional(),
});

app.post("/rooms", requireAuth, async (req, res) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid input" });
    return;
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: parsed.data.playlistId },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!playlist || playlist.ownerId !== req.userId) {
    res.status(404).json({ error: "playlist not found" });
    return;
  }
  if (playlist.items.length === 0) {
    res.status(400).json({ error: "playlist has no tracks" });
    return;
  }

  const playlistItems: PlaylistItem[] = playlist.items.map((item) => ({
    id: item.id,
    trackId: item.trackId,
    clipStartMs: item.clipStartMs,
    clipEndMs: item.clipEndMs,
    basePoints: item.basePoints,
  }));

  const session = gameManager.createSession(req.userId!, playlistItems, parsed.data.settings);
  res.status(201).json(session);
});

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  { cors: { origin: config.corsOrigin, credentials: true } },
);

const gameManager = new GameManager();

const HOST_ROOM = (roomCode: string) => `${roomCode}:host`;

function toPublicGameSession(session: GameSession): PublicGameSession {
  const { answersByQuestion, ...rest } = session;
  return rest;
}

// Everyone in the room (players, screen, host) gets the stripped session;
// only the host also gets the full one (with other players' free-text
// guesses) over a second, host-only Socket.IO room - so a player reading
// their own socket traffic never sees anyone else's answers.
function broadcastState(roomCode: string) {
  const session = gameManager.get(roomCode);
  if (!session) return;
  io.to(roomCode).emit("state", toPublicGameSession(session));
  io.to(HOST_ROOM(roomCode)).emit("hostState", session);
}

function readSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ roomCode, nickname, avatarId }, ack) => {
    const playerId = randomUUID();
    const result = gameManager.addPlayer(roomCode, { id: playerId, nickname, avatarId });
    if (!result.success) {
      ack(result);
      return;
    }
    socket.data.roomCode = roomCode;
    socket.data.playerId = playerId;
    socket.join(roomCode);
    ack({ success: true, data: { playerId } });
    broadcastState(roomCode);
  });

  // Hosts never go through joinRoom (that creates a Player). Instead they
  // authenticate with their existing login cookie and prove they own the
  // session, so the host-only events below can tell a host socket apart
  // from a player or screen socket (role !== "host").
  socket.on("hostJoin", ({ roomCode }, ack) => {
    const token = readSessionCookie(socket.handshake.headers.cookie);
    const session = token ? verifySessionToken(token, config.jwtSecret) : null;
    const gameSession = gameManager.get(roomCode);
    if (!session || !gameSession || gameSession.hostId !== session.userId) {
      ack({ success: false, error: "not authorized" });
      return;
    }
    socket.data.roomCode = roomCode;
    socket.data.role = "host";
    socket.join(roomCode);
    socket.join(HOST_ROOM(roomCode));
    ack({ success: true, data: gameSession });
  });

  // The shared big-screen view: no login, no Player, just the room code -
  // same trust level as a player joining by code (anyone physically in the
  // room who can see the screen). Never joins the host-only room, so it
  // never receives other players' free-text guesses.
  socket.on("screenJoin", ({ roomCode }, ack) => {
    const gameSession = gameManager.get(roomCode);
    if (!gameSession) {
      ack({ success: false, error: "room not found" });
      return;
    }
    socket.data.roomCode = roomCode;
    socket.data.role = "screen";
    socket.join(roomCode);
    ack({ success: true, data: toPublicGameSession(gameSession) });
  });

  // Host or screen only: resolves the current question's playable clip via
  // a private ack reply (never a room broadcast), so it can't reach players.
  socket.on("getCurrentClip", async (ack) => {
    const { roomCode, role } = socket.data;
    if (!roomCode || (role !== "host" && role !== "screen")) {
      ack(err("not authorized"));
      return;
    }
    const session = gameManager.get(roomCode);
    const item = session?.playlist[session.currentQuestionIndex];
    if (!item) {
      ack(err("no active question"));
      return;
    }
    const track = await prisma.track.findUnique({ where: { id: item.trackId } });
    if (!track) {
      ack(err("track not found"));
      return;
    }
    ack(
      ok({ url: publicUrlFor(track.storageKey), clipStartMs: item.clipStartMs, clipEndMs: item.clipEndMs }),
    );
  });

  socket.on("disconnect", () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    gameManager.setPlayerConnected(roomCode, playerId, false);
    broadcastState(roomCode);
  });

  socket.on("startGame", () => {
    const { roomCode, role } = socket.data;
    if (!roomCode || role !== "host") return;
    const result = gameManager.startFreeTextGame(roomCode);
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("gotoQuestion", ({ index }) => {
    const { roomCode, role } = socket.data;
    if (!roomCode || role !== "host") return;
    const result = gameManager.gotoQuestion(roomCode, index);
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("setActivePhase", ({ index }) => {
    const { roomCode, role } = socket.data;
    if (!roomCode || role !== "host") return;
    gameManager.setActivePhase(roomCode, index);
    broadcastState(roomCode);
  });

  socket.on("submitFieldAnswer", ({ field, text }) => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    const result = gameManager.submitFieldAnswer(roomCode, playerId, field, text);
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("judgeFieldAnswer", ({ playerId, field, correct, points }) => {
    const { roomCode, role } = socket.data;
    if (!roomCode || role !== "host") return;
    const result = gameManager.judgeFieldAnswer(roomCode, playerId, field, correct, points);
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("finishGame", () => {
    const { roomCode, role } = socket.data;
    if (!roomCode || role !== "host") return;
    const result = gameManager.finishGame(roomCode);
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("beginQuestion", () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || playerId) return;
    const result = gameManager.dispatch(roomCode, { type: "BEGIN_QUESTION", at: Date.now() });
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("buzz", () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    const result = gameManager.dispatch(roomCode, {
      type: "BUZZ",
      contestantId: playerId,
      at: Date.now(),
    });
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("submitAnswer", async ({ text }) => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    try {
      const session = gameManager.get(roomCode);
      const item = session?.playlist[session.currentQuestionIndex];
      if (!item) return;

      const track = await prisma.track.findUnique({ where: { id: item.trackId } });
      if (!track) return;

      const { verdict } = matchTrackAnswer(text, track);
      const result = gameManager.dispatch(roomCode, {
        type: "SUBMIT_ANSWER",
        contestantId: playerId,
        verdict,
      });
      if (!result.success) socket.emit("error", result.error);
      else broadcastState(roomCode);
    } catch (err) {
      console.error(err);
      socket.emit("error", "internal error");
    }
  });

  socket.on("hostJudge", ({ contestantId, correct }) => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || playerId) return;
    const result = gameManager.dispatch(roomCode, { type: "HOST_JUDGE", contestantId, correct });
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("advance", () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || playerId) return;
    const result = gameManager.dispatch(roomCode, { type: "ADVANCE" });
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("submitWager", ({ amount }) => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    const result = gameManager.dispatch(roomCode, {
      type: "SUBMIT_WAGER",
      contestantId: playerId,
      amount,
    });
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  // Screen-only: it's the one actually playing the clip now, this just
  // mirrors that playback state to everyone else's phones.
  socket.on("setAudioPlaying", ({ playing }) => {
    const { roomCode, role } = socket.data;
    if (!roomCode || role !== "screen") return;
    gameManager.setAudioPlaying(roomCode, playing);
    broadcastState(roomCode);
  });
});

httpServer.listen(config.port, () => {
  console.log(`server listening on :${config.port}`);
});
