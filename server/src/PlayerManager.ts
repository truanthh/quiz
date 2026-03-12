import { Player, PlayerStatus, PlayerRole } from "./types";
import { v4 as uuidv4 } from "uuid";
// modules/player/PlayerManager.ts
import { GameSession } from "./GameSession.ts";

export class PlayerManager {
  private players: Map<string, Player>;
  private socketToPlayerId: Map<string, string>;
  private tokenToPlayerId: Map<string, string>;
  private availableAvatars: Set<number>;
  private static AVATARS_AMOUNT = 19;

  constructor() {
    this.players = new Map();
    this.socketToPlayerId = new Map();
    this.tokenToPlayerId = new Map();
    this.availableAvatars = this.initAvatars(PlayerManager.AVATARS_AMOUNT);
  }

  public setPlayerStatus(player: Player | undefined, status: PlayerStatus) {
    if (!player) return;
    player.status = status;
  }

  public setPlayerRole(player: Player, role: PlayerRole) {
    player.role = role;
  }

  public setPlayerGameId(player: Player, gameId: string) {
    player.gameId = gameId;
  }

  public getPlayerById(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  public getPlayerBySocketId(socketId: string): Player | undefined {
    const playerId = this.socketToPlayerId.get(socketId);
    return playerId ? this.players.get(playerId) : undefined;
  }

  public getPlayerByToken(token: string): Player | undefined {
    const playerId = this.tokenToPlayerId.get(token);
    return playerId ? this.players.get(playerId) : undefined;
  }

  public registerPlayer(socketId: string, userName: string): Player {
    const id = `p_${Date.now()}_${Math.random().toString(36)}`;
    const token = uuidv4();

    const player: Player = {
      id,
      socketId,
      token,
      name: userName,
      status: "online",
      gameId: "",
      role: "init",
      avatarNumber: this.generateAvatarNumber(),
    };

    this.players.set(id, player);
    this.socketToPlayerId.set(socketId, id);
    this.tokenToPlayerId.set(token, id);

    return player;
  }

  public reconnectPlayer(
    token: string,
    newSocketId: string,
  ): Player | undefined {
    const playerId = this.tokenToPlayerId.get(token);
    if (!playerId) return undefined;

    const player = this.players.get(playerId);
    if (!player) return undefined;

    // const oldSocketId = player.socketId;
    // if (!oldSocketId) return undefined;

    if (player.socketId) {
      this.socketToPlayerId.delete(player.socketId);
    }

    player.socketId = newSocketId;
    this.socketToPlayerId.set(newSocketId, playerId);

    return player;
  }
  //blalb

  public removePlayer(socketId: string): boolean {
    const player = this.getPlayerBySocketId(socketId);
    if (!player) return false;

    this.tokenToPlayerId.delete(player.token);
    this.socketToPlayerId.delete(socketId);
    this.players.delete(socketId);

    return true;
  }

  public getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  private initAvatars(avatarsAmount: number): Set<number> {
    return new Set(
      Array.from({ length: avatarsAmount }, (_, i) => i + 1),
    );
  }

  private generateAvatarNumber(): number {
    if (this.availableAvatars.size === 0) {
      console.log("no avatars available!");
      return -1;
    }

    const avatarNumber =
      Array.from(this.availableAvatars)[
      Math.floor(Math.random() * this.availableAvatars.size)
      ];

    this.availableAvatars.delete(avatarNumber);

    return avatarNumber;
  }


  // private generateAvatarNumber(availableSet: Set<number>): number {
  //   if (availableSet.size === 0) {
  //     this.initAvatars(); // Reset if all avatars are used
  //   }
  //
  //   const avatarArray = Array.from(availableSet);
  //   const randomIndex = Math.floor(Math.random() * avatarArray.length);
  //   const avatarNumber = avatarArray[randomIndex];
  //
  //   availableSet.delete(avatarNumber);
  //   return avatarNumber;
  // }

  // resetAltAvatars(): void {
  //   this.availableAltAvatars = new Set(
  //     Array.from({ length: this.gifsAmount }, (_, i) => i + 1),
  //   );
  //   this.players.forEach((player) => {
  //     player.altAvatar = this.generateAvatarNumber(this.availableAltAvatars);
  //   });
  // }
}
