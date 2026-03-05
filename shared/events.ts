import { Player } from "../server/src/types/game.ts";
// import { GameSession } from "../server/src/GameSession.ts";

export type ServerEvent =
  | { type: "connection-established"; data: any }
  | { type: "login-success"; data: Player }
  | { type: "player-updated"; data: any }
  | { type: "gamesession-updated"; data: any }
  | { type: "players-updated"; data: any }
  | { type: "play-track" }
  | { type: "game-started" };
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
