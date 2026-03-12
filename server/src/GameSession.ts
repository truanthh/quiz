import { Question, Track, Player, GameStatus } from "./types/game.ts";
import trackData from "./tracks.json";

export class GameSession {
  public readonly id: string;
  public readonly createdBy: string;
  private status: GameStatus;
  private players: (string | undefined)[];
  private leader: string;
  private screen: string;
  private admin: string;
  private questions: any;
  private currentQuestionId: number;
  private selectedPlayerId: number;

  private static LOBBY_SIZE = 10;

  constructor(player: Player) {
    this.id = player.name;
    this.createdBy = player.id;
    this.players = new Array(GameSession.LOBBY_SIZE).fill(undefined);
    this.leader = player.id;
    this.screen = player.id;
    this.admin = player.id;
    this.questions = trackData.tracks;
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

  public getQuestions(): Question[] {
    return this.questions;
  }

  public getStatus(): GameStatus {
    return this.status;
  }

  public setStatus(value: GameStatus): void {
    this.status = value;
  }

  public getPlayers() {
    return this.players.filter((id) => id !== undefined);
  }

  public getPlayersActive(): string[] {
    return this.players.filter((id): id is string => id === undefined && id !== this.admin && id !== this.screen);
  }

  public getSlots(): (string | undefined)[] {
    return this.players;
  }

  public getScreen(): string {
    return this.screen;
  }

  public getAdmin(): string {
    return this.admin;
  }

  public getLeader(): string {
    return this.leader;
  }

  public addPlayer(playerId: string): number {
    const emptySlotIndex = this.players.findIndex((el) => !el);

    if (emptySlotIndex === -1) return -1;

    this.players[emptySlotIndex] = playerId;

    return emptySlotIndex;
  }

  public clearSlot(id: number): boolean {
    if (id >= this.players.length || id < 0) return false;

    this.players[id] = undefined;

    return true;
  }

  public startGame(): void {
    this.setStatus("ongoing");
  }

  // get clientData() {
  //   return {
  //     id: this.id,
  //     createdBy: this.createdBy,
  //     status: this.status,
  //     players: this.players,
  //     leader: this.leader,
  //     screen: this.screen,
  //     // questions: Question[],
  //     // currentQuestionId: number,
  //     // selectedPlayerId: number,
  //   }
  // }

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
  //   if (!this.players.length) return null;
  //   return this.players.filter((player) => player.hasPressedReady);
  //   return null;
  // }

  // public setPlayerReady(playerToken: string): true | false {
  //   const player = this.players.find((p) => p.token === playerToken);
  //   if (!player || player.hasPressedReady) return false;
  //
  //   player.hasPressedReady = true;
  //   return false;
  // }

  // public resetPlayersReady(): void {
  //   this.players.forEach((player) => {
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
