import { GameSession } from "./GameSession.ts";
import { Player } from "./types/index.ts";

export class GameManager {
  private games: Map<string, GameSession>;

  constructor(games: Map<string, GameSession>) {
    this.games = games;
  }

  public createLobby(player: Player | undefined) {
    if (!player) return;

    const newGame = new GameSession(player);

    console.log(`player: ${player.name} hosted game!`);

    this.addGame(newGame);
  }

  public transferLeader(gameId: string, currentLeader: Player) {}

  public addGame(game: GameSession) {
    this.games.set(game.id, game);
  }
}
