// modules/player/PlayerManager.ts
import { Player, Admin, Screen, User } from "../types/game.ts";
// import { initAvatars } from "../utils/avatarManager.ts"

export class PlayerManager {
  private players: Map<string, Player> = new Map();
  private playerTokens: Map<string, string> = new Map();

  private admin: Admin = {
    socketId: "",
    token: "",
    role: "admin",
    name: "admin",
  };

  private screen: Screen = {
    socketId: "",
    token: "",
    role: "screen",
    name: "screen",
  };

  private availableAvatars: Set<number> = new Set();
  private availableAltAvatars: Set<number> = new Set();

  constructor(
    private avatarsAmount: number = 19,
    private gifsAmount: number = 6,
  ) {
    this.initAvatars();
  }

  registerPlayer(socketId: string, userName: string, token: string): Player {
    const player: Player = {
      socketId,
      token,
      name: userName,
      points: 0,
      hasPressedReady: false,
      avatar: this.generateAvatarNumber(this.availableAvatars),
      altAvatar: this.generateAvatarNumber(this.availableAltAvatars),
      role: "player",
    };

    this.players.set(socketId, player);
    this.playerTokens.set(token, socketId);

    return player;
  }

  private initAvatars(): void {
    this.availableAvatars = new Set(
      Array.from({ length: this.avatarsAmount }, (_, i) => i + 1),
    );
    this.availableAltAvatars = new Set(
      Array.from({ length: this.gifsAmount }, (_, i) => i + 1),
    );
  }

  // Генерация уникального аватара
  private generateAvatarNumber(availableSet: Set<number>): number {
    if (availableSet.size === 0) {
      this.initAvatars(); // Reset if all avatars are used
    }

    const avatarArray = Array.from(availableSet);
    const randomIndex = Math.floor(Math.random() * avatarArray.length);
    const avatarNumber = avatarArray[randomIndex];

    availableSet.delete(avatarNumber);
    return avatarNumber;
  }

  registerAdmin(socketId: string, token: string): Admin {
    this.admin = {
      socketId,
      token,
      role: "admin",
      name: "admin",
    };
    return this.admin;
  }

  registerScreen(socketId: string, token: string): Screen {
    this.screen = {
      socketId,
      token,
      role: "screen",
      name: "screen",
    };
    return this.screen;
  }

  // Восстановление подключения
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

  getAdmin(): Admin {
    return this.admin;
  }

  getScreen(): Screen {
    return this.screen;
  }

  removePlayer(socketId: string): boolean {
    const player = this.players.get(socketId);
    if (!player) return false;

    // Возвращаем аватары в доступные
    this.availableAvatars.add(player.avatar);
    this.availableAltAvatars.add(player.altAvatar);

    this.playerTokens.delete(player.token);
    this.players.delete(socketId);

    return true;
  }

  resetAltAvatars(): void {
    this.availableAltAvatars = new Set(
      Array.from({ length: this.gifsAmount }, (_, i) => i + 1),
    );
    this.players.forEach((player) => {
      player.altAvatar = this.generateAvatarNumber(this.availableAltAvatars);
    });
  }
}
