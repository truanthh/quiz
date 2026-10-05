const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3001";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface Me {
  id: string;
  email: string;
}

export interface TrackSummary {
  id: string;
  title: string;
  artist: string;
  durationMs: number;
  clipStartMs: number;
  url: string;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  createdAt: string;
}

export interface PlaylistItemSummary {
  id: string;
  trackId: string;
  basePoints: number;
}

export interface PlaylistDetail extends PlaylistSummary {
  items: (PlaylistItemSummary & { track: TrackSummary })[];
}

export function readAudioDurationMs(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration * 1000));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not read audio duration"));
    };
    audio.src = url;
  });
}

export const api = {
  register: (email: string, password: string) =>
    request<Me>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<Me>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<Me>("/auth/me"),

  tracks: () => request<TrackSummary[]>("/tracks"),
  requestUploadUrl: (filename: string, contentType: string) =>
    request<{ storageKey: string; uploadUrl: string }>("/tracks/upload-url", {
      method: "POST",
      body: JSON.stringify({ filename, contentType }),
    }),
  uploadToStorage: async (uploadUrl: string, file: File): Promise<void> => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "audio/mpeg" },
    });
    if (!res.ok) throw new ApiError(res.status, "upload to storage failed");
  },
  /** Reads ID3 tags off the uploaded object without creating a Track yet -
   * lets the UI show "here's what we found" before the user confirms. */
  inspectTrack: (storageKey: string) =>
    request<{ title?: string; artist?: string }>("/tracks/inspect", {
      method: "POST",
      body: JSON.stringify({ storageKey }),
    }),
  finalizeTrack: (data: { storageKey: string; durationMs: number; title: string; artist: string; clipStartMs: number }) =>
    request<TrackSummary>("/tracks/finalize", { method: "POST", body: JSON.stringify(data) }),
  deleteTrack: (id: string) => request<void>(`/tracks/${id}`, { method: "DELETE" }),

  playlists: () => request<PlaylistSummary[]>("/playlists"),
  playlist: (id: string) => request<PlaylistDetail>(`/playlists/${id}`),
  createPlaylist: (name: string) =>
    request<PlaylistSummary>("/playlists", { method: "POST", body: JSON.stringify({ name }) }),
  // No clip range here - it's fixed per-track at library-add time now, not
  // re-chosen per playlist (see CLAUDE.md).
  addPlaylistItem: (playlistId: string, item: { trackId: string; basePoints: number }) =>
    request<PlaylistItemSummary>(`/playlists/${playlistId}/items`, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  deletePlaylist: (id: string) => request<void>(`/playlists/${id}`, { method: "DELETE" }),
  deletePlaylistItem: (playlistId: string, itemId: string) =>
    request<void>(`/playlists/${playlistId}/items/${itemId}`, { method: "DELETE" }),

  createRoom: (playlistId: string) =>
    request<{ roomCode: string }>("/rooms", {
      method: "POST",
      body: JSON.stringify({ playlistId }),
    }),
};
