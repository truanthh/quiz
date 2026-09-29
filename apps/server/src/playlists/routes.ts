import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/prisma.js";

export const playlistsRouter = Router();
playlistsRouter.use(requireAuth);

playlistsRouter.post("/", async (req, res) => {
  const parsed = z.object({ name: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid input" });
    return;
  }
  const playlist = await prisma.playlist.create({
    data: { ownerId: req.userId!, name: parsed.data.name },
  });
  res.status(201).json(playlist);
});

playlistsRouter.get("/", async (req, res) => {
  const playlists = await prisma.playlist.findMany({
    where: { ownerId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(playlists);
});

playlistsRouter.get("/:id", async (req, res) => {
  const playlist = await prisma.playlist.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { track: true }, orderBy: { order: "asc" } } },
  });
  if (!playlist || playlist.ownerId !== req.userId) {
    res.status(404).json({ error: "playlist not found" });
    return;
  }
  res.json(playlist);
});

const addItemSchema = z.object({
  trackId: z.string().min(1),
  clipStartMs: z.number().int().nonnegative(),
  clipEndMs: z.number().int().positive(),
  basePoints: z.number().int().positive().default(100),
});

playlistsRouter.post("/:id/items", async (req, res) => {
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid input" });
    return;
  }
  if (parsed.data.clipEndMs <= parsed.data.clipStartMs) {
    res.status(400).json({ error: "clipEndMs must be after clipStartMs" });
    return;
  }

  const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
  if (!playlist || playlist.ownerId !== req.userId) {
    res.status(404).json({ error: "playlist not found" });
    return;
  }
  const track = await prisma.track.findUnique({ where: { id: parsed.data.trackId } });
  if (!track || track.ownerId !== req.userId) {
    res.status(404).json({ error: "track not found" });
    return;
  }

  const itemCount = await prisma.playlistItem.count({ where: { playlistId: playlist.id } });
  const item = await prisma.playlistItem.create({
    data: { ...parsed.data, playlistId: playlist.id, order: itemCount },
  });
  res.status(201).json(item);
});

playlistsRouter.delete("/:playlistId/items/:itemId", async (req, res) => {
  const item = await prisma.playlistItem.findUnique({
    where: { id: req.params.itemId },
    include: { playlist: true },
  });
  if (!item || item.playlistId !== req.params.playlistId || item.playlist.ownerId !== req.userId) {
    res.status(404).json({ error: "item not found" });
    return;
  }
  await prisma.playlistItem.delete({ where: { id: item.id } });
  res.status(204).end();
});
