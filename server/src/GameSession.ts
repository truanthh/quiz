import { Question, Track, Player } from "./types/game.ts";

export class GameSession {
  public readonly id: string;
  public readonly createdBy: string;
  public readonly status: string;
  private players: (string | undefined)[];
  private leader: string;
  private screen: string;
  private questions: Question[];
  private currentQuestionId: number;
  private selectedPlayerId: number;

  constructor(player: Player) {
    this.id = player.name;
    this.createdBy = player.id;
    this.players = new Array(8).fill(undefined);

    this.leader = player.id;
    this.screen = player.id;
    this.questions = [];
    this.currentQuestionId = 0;
    this.selectedPlayerId = 0;
    this.status = "lobby";
  }

  public getPlayers(): string[] {
    return this.players.filter((p) => p !== undefined);
  }

  public getSlots(): (string | undefined)[] {
    return this.players;
  }

  public getLeader(): string {
    return this.leader;
  }

  public getScreen(): string {
    return this.screen;
  }

  public addPlayer(playerId: string): boolean {
    const emptySlotIndex = this.players.findIndex((el) => !el);

    if (emptySlotIndex === -1) return false;

    this.players[emptySlotIndex] = playerId;

    return true;
  }

  public clearSlot(id: number): boolean {
    if (id >= this.players.length || id < 0) return false;

    this.players[id] = undefined;

    return true
  }

  get clientData() {
    return {
      id: this.id,
      createdBy: this.createdBy,
      status: this.status,
      players: this.players,
      leader: this.leader,
      screen: this.screen,
      // questions: Question[],
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
