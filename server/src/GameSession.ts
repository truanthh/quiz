import { Question, Track, Player, GameStatus } from "./types/game.ts";
import { PlayerManager } from "./PlayerManager.ts";
import trackData from "./tracks.json";

interface GameSessionClientData {
  id: string;
  status: string;
  players: (Player | undefined)[];
  createdBy: string;
  // admin: string;
  // screen: string;
  // leader: string;
  questions: Question[];
}

export class GameSession {
  public readonly id: string;
  public readonly createdBy: string;
  private status: GameStatus;
  private slots: (string | undefined)[];
  private questions: any;
  private currentQuestionId: number;
  private selectedPlayerId: number;
  private playerManager: PlayerManager;

  private static LOBBY_SIZE = 10;
  private isAdminSet: boolean = false;
  private isScreenSet: boolean = false;

  constructor(player: Player, playerManager: PlayerManager) {
    this.playerManager = playerManager;
    this.id = player.name;
    this.createdBy = player.id;
    this.slots = new Array(GameSession.LOBBY_SIZE).fill(undefined);
    this.questions = [];
    this.currentQuestionId = 0;
    this.selectedPlayerId = 0;
    this.status = "lobby";
    //asjla
  }

  public loadQuestions(data: Question[]): boolean {
    if (!data || data.length === 0) return false;

    this.questions = [...data];

    return true;
  }

  public getSlots(): (string | undefined)[] {
    return this.slots;
  }

  // get players means clients cuz every client can be a player
  // this is not client data
  public getPlayers(): (Player | undefined)[] {
    return this.slots.filter(playerId => playerId !== undefined).map(playerId => this.playerManager.getPlayerById(playerId))
  }

  public getAdmin(): Player | undefined {
    return this.getPlayers().find(player => player?.role === "admin");
  }

  public getScreen(): Player | undefined {
    return this.getPlayers().find(player => player?.role === "screen");
  }

  public getQuestions(): Question[] {
    return this.questions;
  }

  public getStatus(): GameStatus {
    return this.status;
  }

  public setStatus(value: GameStatus): void {
    this.status = value;
  }

  // public setScreen(slotId: number): void {
  //   if (slotId >= this.slots.length || slotId < 0) {
  //     console.log("wrong slotId!")
  //     return;
  //   }
  //
  //   const currentScreenId = this.slots.find(playerId => playerId ? this.playerManager.getPlayerById(playerId)?.role === "screen" : false);
  //   const newSreenId = this.slots[slotId];
  //
  //   if (!newSreenId) {
  //     console.log("no player on this slot!")
  //     return;
  //   }
  //
  //   if (currentScreenId) {
  //     this.playerManager.setPlayerRole(currentScreenId, "player")
  //   }
  //   this.playerManager.setPlayerRole(newSreenId, "screen");
  // }

  public addPlayer(playerId: string): number | undefined {
    const emptySlotIndex = this.slots.findIndex((el) => !el);
    if (emptySlotIndex === -1) return undefined;

    if (emptySlotIndex === 0 && !this.isScreenSet) {
      this.playerManager.setPlayerRole(playerId, "screen");
      this.playerManager.setPlayerLeader(playerId);
      this.isScreenSet = true;
    } else if (emptySlotIndex === 1 && !this.isAdminSet) {
      this.playerManager.setPlayerRole(playerId, "admin");
      this.isAdminSet = true;
    } else {
      this.playerManager.setPlayerRole(playerId, "player");
    }

    this.playerManager.setPlayerGameId(playerId, this.id);
    this.playerManager.setPlayerStatus(playerId, "lobby");

    this.slots[emptySlotIndex] = playerId;
    return emptySlotIndex;
  }

  public clearSlot(id: number): boolean {
    if (id >= this.slots.length || id < 0) return false;

    this.slots[id] = undefined;

    return true;
  }

  public startGame(): void {
    const playerIds = this.getSlots().filter(id => id !== undefined);

    for (const playerId of playerIds) {
      this.playerManager.setPlayerStatus(playerId, "in-game");
    }

    this.setStatus("ongoing");
  }

  public getClientData(): GameSessionClientData {
    let players = this.getSlots().map(playerId => playerId ? this.playerManager.getPlayerById(playerId) : undefined);

    if (this.status !== "lobby") {
      players = players.filter(player => player === undefined || player.role === "player");
    }

    return {
      id: this.id,
      // size: GameSession.LOBBY_SIZE,
      createdBy: this.createdBy,
      status: this.status,
      players,
      // leader: this.leader,
      // screen: this.screen,
      // admin: this.admin,
      questions: this.questions,
      // currentQuestionId: number,
      // selectedPlayerId: number,
    }
  }

  // public getCurrentQuestion(): Question | null {
  //   return this.questions[this.currentQuestionId];
  // }

  // public nextQuestion(): boolean {
  //   if (this.currentQuestionId >= this.questions.length - 1) {
  //     return false;
  //   }
  //
  //   // ?????
  //   // this.resetPlayersReady();
  //   // this.audioPlayer.isPlaying = false;
  //   // this.selectedPlayerId = 0;
  //   this.currentQuestionId++;
  //   return true;
  // }

  // public prevQuestion(): boolean {
  //   if (this.currentQuestionId <= 0) {
  //     return false;
  //   }
  //
  //   // ?????
  //   // this.resetPlayersReady();
  //   // this.audioPlayer.isPlaying = false;
  //   // this.selectedPlayerId = 0;
  //   this.currentQuestionId--;
  //   return true;
  // }

  // public getPlayersReady(): Player[] | null {
  //   if (!this.slots.length) return null;
  //   return this.slots.filter((player) => player.hasPressedReady);
  //   return null;
  // }

  // public setPlayerReady(playerToken: string): true | false {
  //   const player = this.slots.find((p) => p.token === playerToken);
  //   if (!player || player.hasPressedReady) return false;
  //
  //   player.hasPressedReady = true;
  //   return false;
  // }

  // public resetPlayersReady(): void {
  //   this.slots.forEach((player) => {
  //     player.hasPressedReady = false;
  //   });
  // }

  // public getSelectedPlayer(): Player | void {
  //   const p = this.getPlayersReady();
  //   if (!p) return null;
  //
  //   return p[this.selectedPlayerId];
  // }
}
