import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type {
  ClientToServerEvents,
  InterServerEvents,
  PlaylistItem,
  ServerToClientEvents,
  SocketData,
} from "@quiz/shared";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { authRouter } from "./auth/routes.js";
import { requireAuth } from "./auth/middleware.js";
import { config } from "./config.js";
import { prisma } from "./db/prisma.js";
import { GameManager } from "./game/GameManager.js";
import { playlistsRouter } from "./playlists/routes.js";
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

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  { cors: { origin: config.corsOrigin, credentials: true } },
);

const gameManager = new GameManager();

function broadcastState(roomCode: string) {
  const session = gameManager.get(roomCode);
  if (session) io.to(roomCode).emit("state", session);
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

  socket.on("disconnect", () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    gameManager.setPlayerConnected(roomCode, playerId, false);
    broadcastState(roomCode);
  });

  socket.on("startGame", () => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const result = gameManager.dispatch(roomCode, { type: "START_GAME", at: Date.now() });
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("beginQuestion", () => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
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
  });

  socket.on("hostJudge", ({ contestantId, correct }) => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const result = gameManager.dispatch(roomCode, { type: "HOST_JUDGE", contestantId, correct });
    if (!result.success) socket.emit("error", result.error);
    else broadcastState(roomCode);
  });

  socket.on("advance", () => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
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
});

httpServer.listen(config.port, () => {
  console.log(`server listening on :${config.port}`);
});
