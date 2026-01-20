// types/game.ts
export type UserRole = "admin" | "screen" | "player";
export type QuestionState = "" | "open" | "countdown" | "pending" | "closed";
export type SoundName =
  | "countdown"
  | "timeout"
  | "success"
  | "failure"
  | "next";

export interface Track {
  id: string;
  name: string;
  artist: string;
  audioUrl?: string;
  posterUrl?: string;
}

export interface Question {
  track: Track;
  state: QuestionState;
  currentTimeString: string;
  currentTimeSeconds: number;
  isArtistNameRevealed: boolean;
  isTrackNameRevealed: boolean;
  isPosterRevealed: boolean;
}

export type Player = {
  socketId: string;
  token: string;
  name: string;
  status: string;
};

export interface Admin {
  socketId: string;
  token: string;
  role: "admin";
  name: string;
}

export interface Screen {
  socketId: string;
  token: string;
  role: "screen";
  name: string;
}

export type User = Player | Admin | Screen;

export interface AudioPlayerState {
  tracks: any;
  currentTrackId: number;
  isPlaying: boolean;
  currentTimeSeconds: number;
}

export interface Game {
  players: Player[];
  host: Player;
  screen: Player;
  questions: Question[];
  currentQuestionId: number;
  selectedPlayerId: number;
  status: string;
}
