import { Question, Track, Player, GameStatus } from "./types/game.ts";
import { PlayerManager } from "./PlayerManager.ts";
import trackData from "./tracks.json";

export class GameSession {
  public readonly id: string;
  public readonly createdBy: string;
  private status: GameStatus;
  private slots: (string | undefined)[];
  private questions: any;
  private currentQuestionId: number;
  private selectedPlayerId: number;

  private static LOBBY_SIZE = 10;
  private isAdminSet: boolean = false;
  private isScreenSet: boolean = false;

  constructor(player: Player, playerManager: PlayerManager) {
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

  public getPlayerIds(): string[] {
    return this.slots.filter((id): id is string => id !== undefined);
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

  public clearSlot(id: number): boolean {
    if (id >= this.slots.length || id < 0) return false;

    this.slots[id] = undefined;

    return true;
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
