import type { ClientToServerEvents, ServerToClientEvents } from "@quiz/shared";
import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3001";

export function createSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(API_URL, { withCredentials: true, autoConnect: false });
}
