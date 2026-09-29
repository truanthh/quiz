import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { verifySessionToken } from "./session.js";

export const SESSION_COOKIE = "session";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  const session = typeof token === "string" ? verifySessionToken(token, config.jwtSecret) : null;
  if (!session) {
    res.status(401).json({ error: "not authenticated" });
    return;
  }
  req.userId = session.userId;
  next();
}
