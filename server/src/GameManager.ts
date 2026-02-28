import { PlayerManager } from "./PlayerManager.ts";
import { GameSession } from "./GameSession.ts";
import { Player, Question } from "./types/index.ts";

export class GameManager {
  private games: Map<string, GameSession>;
  private playerManager: PlayerManager;

  constructor(playerManager: PlayerManager) {
    this.games = new Map();
    this.playerManager = playerManager;
  }

  public startGame(gameSessionId: string, questions: Question[]): boolean {
    const gameSession = this.getGameSessionById(gameSessionId);
    if (!gameSession || gameSession.getStatus() !== "lobby") return false;

    if (gameSession.loadQuestions(questions)) {
      gameSession.setStatus("ongoing");
      return true;
    };

    return false;
  }

  public createGame(playerId: string): GameSession | undefined {
    const player = this.playerManager.getPlayerById(playerId);
    if (!player || player.status === "in-game") return;

    const newGame = new GameSession(player);
    this.games.set(newGame.id, newGame);
    this.joinGame(playerId, newGame.id);

    console.log(`player: ${player.name} hosted game!`);
    return newGame;
  }

  public deleteGame(playerId: string): GameSession | undefined {
    const player = this.playerManager.getPlayerById(playerId);
    if (!player || player.status === "online") return undefined;

    // making sure gameSession exists and player is the leader
    const gameSession = this.getGameSessionById(player.gameId);

    if (!gameSession) return undefined;
    if (gameSession.getLeader() !== player.id) return undefined;

    this.games.delete(gameSession.id);

    const players = gameSession.getPlayers().map(playerId => this.playerManager.getPlayerById(playerId));

    for (let player of players) {
      if (!player) continue;
      this.playerManager.setPlayerGameId(player, "");
      this.playerManager.setPlayerStatus(player, "online");
    }

    return gameSession;
  }

  // lobby only
  public joinGame(playerId: string, gameId: string): GameSession | null {
    const gameSession = this.getGameSessionById(gameId);
    const player = this.playerManager.getPlayerById(playerId);

    if (
      !gameSession ||
      gameSession.getStatus() !== "lobby" ||
      !player ||
      player.status === "in-game"
    )
      return null;

    console.log(`player: ${player.name} is trying to join ${gameId}`);

    if (gameSession.addPlayer(playerId)) {
      console.log(`player: ${player.name} joined ${gameId}`);
      this.playerManager.setPlayerGameId(player, gameId);
      this.playerManager.setPlayerStatus(player, "lobby");
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
