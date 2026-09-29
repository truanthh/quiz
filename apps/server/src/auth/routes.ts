import { Router, type Response } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db/prisma.js";
import { requireAuth, SESSION_COOKIE } from "./middleware.js";
import { hashPassword, verifyPassword } from "./password.js";
import { signSessionToken } from "./session.js";

const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function setSessionCookie(res: Response, userId: string): void {
  const token = signSessionToken({ userId }, config.jwtSecret);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "invalid input" });
    return;
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  setSessionCookie(res, user.id);
  res.status(201).json({ id: user.id, email: user.email });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid input" });
    return;
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    res.status(401).json({ error: "invalid email or password" });
    return;
  }

  setSessionCookie(res, user.id);
  res.json({ id: user.id, email: user.email });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "user not found" });
    return;
  }
  res.json({ id: user.id, email: user.email });
});
