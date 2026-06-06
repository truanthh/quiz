import { PlayerManager } from "./PlayerManager.ts";
import { GameSession } from "./GameSession.ts";
import { Player, Question, PlayerStatus, OperationResult } from "./types/index.ts";

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

    gameSession.setStatus("ongoing");

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

  public deleteGame(playerId: string): OperationResult<{
    sessionId: string;
    affectedPlayerIds: string[]
  }> {

    const player = this.playerManager.getPlayerById(playerId);
    if (!player) {
      return { success: false, error: "Player not found!" };
    }

    // making sure gameSession exists and player is the leader
    const gameSession = this.getGameSessionById(player.gameId);
    if (!gameSession) return { success: false, error: "GameSession not found!" };

    if (!player.isLeader) return { success: false, error: "Player is not the leader!" };

    const affectedPlayerIds = gameSession.getPlayerIds();

    for (const playerId of affectedPlayerIds) {
      this.playerManager.setPlayerGameId(playerId!, "");
      this.playerManager.setPlayerStatus(playerId!, "online");
      this.playerManager.setPlayerRole(playerId!, "");
    }

    this.games.delete(gameSession.id);

    return {
      success: true,
      data: { sessionId: gameSession.id, affectedPlayerIds }
    }
  }

  // lobby only
  public joinGame(playerId: string, gameId: string): OperationResult<string> {
    const gameSession = this.getGameSessionById(gameId);
    const player = this.playerManager.getPlayerById(playerId);

    if (!gameSession) return { success: false, error: "gamesession is undefined" };
    if (gameSession.getStatus() !== "lobby") return { success: false, error: "gamesession status is wrong!" };

    if (!player) return { success: false, error: "player is undefined!" };
    if (player.status === "in-game") return { success: false, error: "player is already in game!" }

    const emptySlotIndex = gameSession.getSlots().findIndex((el) => !el);
    if (emptySlotIndex === -1) return { success: false, error: "lobby is full!" };

    this.playerManager.setPlayerGameId(playerId, gameSession.id);
    this.playerManager.setPlayerStatus(playerId, "lobby");
    gameSession.getSlots()[emptySlotIndex] = playerId;

    if (emptySlotIndex === 0) {
      this.playerManager.setPlayerLeader(playerId);
    }

    return { success: true, data: gameSession.id }
  }

  // public setScreen(gameId: string, oldScreenId: Player, slot: number) {
  //   const gameSession = this.getGameSessionById(gameId);
  //   if (!gameSession) return;
  //
  //   console.log(`pinging slot ${slot}`);
  // }

  // public setScreen(payload: any) {
  // }

  // public addGame(game: GameSession) {
  //   this.games.set(game.id, game);
  // }

  public getGameSessionById(gameSessionId: string): GameSession | undefined {
    return this.games.get(gameSessionId);
  }
}
