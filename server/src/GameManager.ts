import { PlayerManager } from "./PlayerManager.ts";
import { Player } from "./types/index.ts";
import { GameSession } from "./GameSession.ts";

export class GameManager {
  private games: Map<string, GameSession>;
  private playerManager: PlayerManager;

  constructor(playerManager: PlayerManager) {
    this.games = new Map();
    this.playerManager = playerManager;
  }

  public createGame(player: Player | undefined): GameSession | undefined {
    if (!player || player.status === "in-game") return;

    const newGame = new GameSession(player);
    this.games.set(newGame.id, newGame);

    this.joinGame(player, newGame.id);

    console.log(`player: ${player.name} hosted game!`);
    return newGame;
  }

  public deleteGame(player: Player | undefined): GameSession | null {
    if (!player || player.status === "online") return null;

    // making sure gameSession exists and player is the leader
    const gameSession = this.getGameSessionById(player.gameId);

    if (!gameSession) return null;
    if (gameSession.getLeader() !== player.token) return null;

    this.games.delete(gameSession.id);

    const players = gameSession.getPlayers();

    for (let player of players) {
      this.playerManager.setPlayerGameId(player, "");
      this.playerManager.setPlayerStatus(player, "online");
      console.log("lasjdkf");
    }

    return gameSession;
  }

  public joinGame(player: Player, gameId: string): GameSession | null {
    const gameSession = this.getGameSessionById(gameId);
    if (
      !gameSession ||
      gameSession.status !== "lobby" ||
      !player ||
      player.status === "in-game"
    )
      return null;

    console.log(`player: ${player.name} is trying to join ${gameId}`);

    if (gameSession.addPlayer(player)) {
      console.log(`player: ${player.name} joined ${gameId}`);
      this.playerManager.setPlayerGameId(player, gameId);
      this.playerManager.setPlayerStatus(player, "in-game");
      return gameSession;
    }

    return null;
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
