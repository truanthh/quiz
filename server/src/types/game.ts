// types/game.ts
export type UserRole = "admin" | "screen" | "player";
export type QuestionState =
  | "init"
  | "open"
  | "countdown"
  | "pending"
  | "closed";
export type SoundName =
  | "countdown"
  | "timeout"
  | "success"
  | "failure"
  | "next";

export interface Track {
  artist: string;
  name: string;
  src: string;
  posterImg: string;
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
  id: string;
  socketId: string;
  token: string;
  name: string;
  status: string;
  gameId: string;
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

// export interface Game {
//   players: Player[];
//   leader: Player;
//   screen: Player;
//   questions: Question[];
//   currentQuestionId: number;
//   selectedPlayerId: number;
//   status: string;
// }
