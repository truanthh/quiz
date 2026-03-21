import { PlayerManager } from "./PlayerManager.ts";
import { GameSession } from "./GameSession.ts";
import { Player, Question, PlayerStatus } from "./types/index.ts";

export class GameManager {
  private games: Map<string, GameSession>;
  private playerManager: PlayerManager;

  constructor(playerManager: PlayerManager) {
    this.games = new Map();
    this.playerManager = playerManager;
  }

  public startGame(gameSessionId: string): boolean {
    const gameSession = this.getGameSessionById(gameSessionId);
    if (!gameSession || gameSession.getStatus() !== "lobby") return false;

    gameSession.startGame();

    return true;
  }

  public createGame(playerId: string): GameSession | undefined {
    const player = this.playerManager.getPlayerById(playerId);
    if (!player || player.status === "in-game") return;

    const newGame = new GameSession(player, this.playerManager);
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
    if (!player.isLeader) return undefined;

    this.games.delete(gameSession.id);

    const players = gameSession.getPlayers()

    for (let player of players) {
      if (!player) continue;
      this.playerManager.setPlayerGameId(player.id, "");
      this.playerManager.setPlayerStatus(player.id, "online");
      this.playerManager.setPlayerRole(player.id, "init");
    }

    return gameSession;
  }

  // lobby only
  public joinGame(playerId: string, gameId: string): GameSession | undefined {
    const gameSession = this.getGameSessionById(gameId);
    const player = this.playerManager.getPlayerById(playerId);

    if (
      !gameSession ||
      gameSession.getStatus() !== "lobby" ||
      !player ||
      player.status === "in-game"
    )
      return undefined;

    gameSession.addPlayer(playerId);

    return gameSession;
  }

  // public setScreen(gameId: string, oldScreenId: Player, slot: number) {
  //   const gameSession = this.getGameSessionById(gameId);
  //   if (!gameSession) return;
  //
  //   console.log(`pinging slot ${slot}`);
  // }

  public setScreen(payload: any) {
    const gameSession = this.getGameSessionById(payload.gameId);
    if (!gameSession) return;

    // const oldScreen = this.playerManager.getPlayerById(gameSession.getScreen().id);

    // const newScreen = this.playerManager.getPlayerById(newScreenId);

    // gameSession.setScreen(newScreen);
  }

  // public addGame(game: GameSession) {
  //   this.games.set(game.id, game);
  // }

  public getGameSessionById(gameSessionId: string): GameSession | undefined {
    return this.games.get(gameSessionId);
  }
}
