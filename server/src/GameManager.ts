import { GameSession } from "./GameSession.ts";
import { Player } from "./types/index.ts";

export class GameManager {
  private games: Map<string, GameSession>;

  constructor() {
    this.games = new Map();
  }

  public createGame(player: Player | undefined): GameSession | undefined {
    if (!player || player.status === "in-game") return;
    const newGame = new GameSession(player);
    console.log(`player: ${player.name} hosted game!`);
    this.games.set(newGame.id, newGame);
    return newGame;
  }

  public joinGame(player: Player | undefined, gameId: string) {
    if (!player || player.status === "in-game") return;
    console.log(`player: ${player.name} is trying to join ${gameId}`);
  }

  // public transferLeader(gameId: string, currentLeader: Player, newLeader: Player) {
  //
  // }

  // public addGame(game: GameSession) {
  //   this.games.set(game.id, game);
  // }

  public getGameSessionById(gameSessionId: string): GameSession | undefined {
    return this.games.get(gameSessionId);
  }
}
