import jwt from "jsonwebtoken";

export interface SessionPayload {
  userId: string;
}

const EXPIRES_IN = "30d";

export function signSessionToken(payload: SessionPayload, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: EXPIRES_IN });
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string" || typeof decoded.userId !== "string") return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}
