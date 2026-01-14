import { UserRole, User, Player, GameState, AudioPlayerState } from "./game";

export interface ConnectionData {
  message: string;
  socketId: string;
  connectedAt: string;
}

export interface SocketAuth {
  token?: string;
}

export interface LoginPayload {
  role: UserRole;
  userName?: string;
}

// Все события сервера
export type ServerEvent =
  | { type: "connection-established"; data: ConnectionData }
  | { type: "login-successful"; data: User }
  | { type: "update-client-user-state"; data: Partial<Player> }
  | { type: "update-client-game-state"; data: GameState }
  | { type: "update-client-players"; data: Player[] }
  | { type: "countdown"; data: number }
  | { type: "show-points-gained"; data: number }
  | { type: "play-track"; data: number }
  | { type: "play-sound"; data: string }
  // | { type: "play-sound-countdown" }
  // | { type: "play-sound-timeout" }
  // | { type: "play-sound-success" }
  // | { type: "play-sound-failure" }
  // | { type: "play-sound-next" }
  | { type: "stop-sounds" }
  | { type: "pause-track" }
  | { type: "error"; data: string }
  | { type: "show-scoreboard" };

export type ClientEvent =
  // От любого клиента
  | { type: "login"; data: { role: string; userName?: string } }
  | { type: "disconnect" }

  // От игроков
  | { type: "button-pressed-player"; data: { token: string } }

  // От админа
  | { type: "start-game"; data: AudioPlayerState }
  | { type: "next-question" }
  | { type: "prev-question" }
  | { type: "artist-name-correct" }
  | { type: "artist-name-wrong" }
  | { type: "track-name-correct" }
  | { type: "track-name-wrong" }
  | { type: "request-play-track" }
  | { type: "request-pause-track" }
  | { type: "request-select-prev-player" }
  | { type: "request-select-next-player" }
  | { type: "request-show-poster" }
  | { type: "request-show-artist" }
  | { type: "request-show-trackname" }
  | { type: "request-show-scoreboard" }
  | { type: "request-stop-sounds" }
  | { type: "request-play-sound-timeout" }

  // От экрана
  | { type: "audioplayer-state-change"; data: AudioPlayerState };
