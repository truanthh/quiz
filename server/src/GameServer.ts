// src/core/GameServer.ts
import { Server as SocketServer } from "socket.io";
import { GameManager } from "./GameManager.ts";
import { PlayerManager } from "./PlayerManager";
import { SocketService } from "./SocketService";
import { Player } from "./types";
import { GameSession } from "./GameSession.ts";

export class GameServer {
  private io: SocketServer;
  private socketService: SocketService;
  private playerManager: PlayerManager;
  private gameManager: GameManager;

  private players: Map<string, Player> = new Map();
  private games: Map<string, GameSession> = new Map();

  constructor(io: SocketServer) {
    this.io = io;
    this.playerManager = new PlayerManager(this.players);
    this.gameManager = new GameManager(this.games);

    this.socketService = new SocketService(
      this.io,
      this.playerManager,
      this.gameManager,
    );
  }

  public run() {
    this.socketService.initialize();
  }
}
