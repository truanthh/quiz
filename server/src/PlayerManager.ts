// modules/player/PlayerManager.ts
import { Player } from "./types";
// import { initAvatars } from "../utils/avatarManager.ts"

export class PlayerManager {
  private players: Map<string, Player>;
  private playerTokens: Map<string, string>;

  constructor(players: Map<string, Player>) {
    this.playerTokens = new Map();
    this.players = players;
  }

  createLobby(player: Player) {
    player.status = "lobby";
  }

  registerPlayer(socketId: string, userName: string, token: string): Player {
    const player: Player = {
      socketId,
      token,
      name: userName,
      status: "online",
    };

    this.players.set(socketId, player);
    this.playerTokens.set(token, socketId);

    return player;
  }

  reconnectPlayer(token: string, newSocketId: string): Player | null {
    const oldSocketId = this.playerTokens.get(token);
    if (!oldSocketId) return null;

    const player = this.players.get(oldSocketId);
    if (!player) return null;

    // Обновляем socketId
    this.players.delete(oldSocketId);
    player.socketId = newSocketId;
    this.players.set(newSocketId, player);
    this.playerTokens.set(token, newSocketId);

    return player;
  }

  removePlayer(socketId: string): boolean {
    const player = this.players.get(socketId);
    if (!player) return false;

    this.playerTokens.delete(player.token);
    this.players.delete(socketId);

    return true;
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    return this.players.get(socketId);
  }

  getPlayerByToken(token: string): Player | undefined {
    const socketId = this.playerTokens.get(token);
    return socketId ? this.players.get(socketId) : undefined;
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  // private initAvatars(): void {
  //   this.availableAvatars = new Set(
  //     Array.from({ length: this.avatarsAmount }, (_, i) => i + 1),
  //   );
  //   this.availableAltAvatars = new Set(
  //     Array.from({ length: this.gifsAmount }, (_, i) => i + 1),
  //   );
  // }
  //
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
