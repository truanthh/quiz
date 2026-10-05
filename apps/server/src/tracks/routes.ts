import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/prisma.js";
import { createUploadUrl, getObjectBuffer, publicUrlFor, uploadBuffer } from "../storage/presign.js";
import { extractTrackMetadata } from "./extractMetadata.js";

export const tracksRouter = Router();
tracksRouter.use(requireAuth);

const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

tracksRouter.post("/upload-url", async (req, res) => {
  const parsed = uploadUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid input" });
    return;
  }
  const { filename, contentType } = parsed.data;
  const storageKey = `tracks/${req.userId}/${randomUUID()}-${filename}`;
  const uploadUrl = await createUploadUrl(storageKey, contentType);
  res.json({ storageKey, uploadUrl });
});

const inspectSchema = z.object({
  storageKey: z.string().min(1),
});

// Reads ID3 tags off the just-uploaded object WITHOUT creating a Track -
// lets the UI show "here's what we found, edit before adding to the
// library" (see CLAUDE.md). Nothing is persisted here.
tracksRouter.post("/inspect", async (req, res) => {
  const parsed = inspectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid input" });
    return;
  }
  const fileBuffer = await getObjectBuffer(parsed.data.storageKey);
  const metadata = extractTrackMetadata(fileBuffer);
  res.json({ title: metadata.title, artist: metadata.artist });
});

const finalizeSchema = z.object({
  storageKey: z.string().min(1),
  durationMs: z.number().int().positive(),
  title: z.string().optional(),
  artist: z.string().optional(),
  clipStartMs: z.number().int().nonnegative().default(0),
});

tracksRouter.post("/finalize", async (req, res) => {
  const parsed = finalizeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid input" });
    return;
  }
  const { storageKey, durationMs, title, artist, clipStartMs } = parsed.data;

  const fileBuffer = await getObjectBuffer(storageKey);
  const metadata = extractTrackMetadata(fileBuffer);

  let posterUrl: string | undefined;
  if (metadata.poster) {
    const posterKey = `posters/${req.userId}/${randomUUID()}.jpg`;
    await uploadBuffer(posterKey, metadata.poster.buffer, metadata.poster.mimeType);
    posterUrl = publicUrlFor(posterKey);
  }

  const track = await prisma.track.create({
    data: {
      ownerId: req.userId!,
      storageKey,
      durationMs,
      title: title ?? metadata.title ?? "Untitled",
      artist: artist ?? metadata.artist ?? "Unknown artist",
      clipStartMs,
      posterUrl,
    },
  });
  res.status(201).json({ ...track, url: publicUrlFor(track.storageKey) });
});

tracksRouter.get("/", async (req, res) => {
  const tracks = await prisma.track.findMany({
    where: { ownerId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(tracks.map((t) => ({ ...t, url: publicUrlFor(t.storageKey) })));
});

tracksRouter.delete("/:id", async (req, res) => {
  const track = await prisma.track.findUnique({ where: { id: req.params.id } });
  if (!track || track.ownerId !== req.userId) {
    res.status(404).json({ error: "track not found" });
    return;
  }
  await prisma.track.delete({ where: { id: track.id } });
  res.status(204).end();
});
