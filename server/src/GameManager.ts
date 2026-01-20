import { GameSession } from "./GameSession.ts";
import { Player } from "./types/index.ts";

export class GameManager {
  private games: Map<string, GameSession>;

  constructor(games: Map<string, GameSession>) {
    this.games = games;
  }

  public createLobby(player: Player | undefined) {
    if (!player) return;

    console.log("creating game lobby!");
  }
}
