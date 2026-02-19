import { Player } from "../server/src/types/game.ts";
import { GameSession } from "../server/src/GameSession.ts";

// export enum ServerEventType {
//   CONNECTION_ESTABLISHED = "connection-established",
//   LOGIN_SUCCESS = "login-success",
//   // sync all players
//   PLAYERS_UPDATED = "players-updated",
//   PLAYER_UPDATED = "player-updated",
//   PLAYER_LOBBY_UPDATED = "player-lobby-updated",
//   COUNTDOWN = "countdown",
//   PLAY_TRACK = "play-track",
// "play-track"
// "show-points-gained"
// "play-sound"
// "stop-sounds"
// "pause-track"
// "error"
// "show-scoreboard"
// "update-lobby"
// | { type: "play-sound-countdown" }
// | { type: "play-sound-timeout" }
// | { type: "play-sound-success" }
// | { type: "play-sound-failure" }
// | { type: "play-sound-next" }
// }

export type ServerEvent =
  | { type: "connection-established"; data: any }
  | { type: "login-success"; data: Player }
  | { type: "players-updated"; data: any }
  | { type: "player-updated"; data: Player }
  | { type: "player-gamesession-updated"; data: GameSession }
  | { type: "play-track" };

// | { type: "server:connection-established"; data: any }
// | { type: "login-successful"; data: User }
// | { type: "update-client-user-state"; data: Partial<Player> }
// | { type: "update-client-game-state"; data: any }
// | { type: "update-client-players"; data: Player[] }
// | { type: "countdown"; data: number }
// | { type: "show-points-gained"; data: number }
// | { type: "play-track"; data: number }
// | { type: "play-sound"; data: string }
// | { type: "update-client-player"; data: Player }
// | { type: "stop-sounds" }
// | { type: "pause-track" }
// | { type: "error"; data: string }
// | { type: "show-scoreboard" }
// | { type: "update-lobby"; data: any };
