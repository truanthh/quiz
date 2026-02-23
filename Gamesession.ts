import { Question, Track, Player } from "./types/game.ts";

export class Gamesession {
  public readonly id: string;
  public readonly createdBy: string;
  public readonly status: string;
  private players: Player[];
  private leader: string;
  private screen: string;
  private questions: Question[];
  private currentQuestionId: number;
  private selectedPlayerId: number;

  constructor(player: Player) {
    this.id = player.name;
    this.createdBy = player.token;
    this.players = new Array(8).fill(null);

    this.leader = player.token;
    this.screen = player.token;
    this.questions = [];
    this.currentQuestionId = 0;
    this.selectedPlayerId = 0;
    this.status = "lobby";
  }

  public getPlayers(): Player[] {
    return this.players.filter((p) => p !== null);
  }

  public getLeader(): string {
    return this.leader;
  }

  public addPlayer(player: Player): boolean {
    const emptySlotIndex = this.players.findIndex((el) => !el);

    if (emptySlotIndex === -1) return false;

    this.players[emptySlotIndex] = player;

    return true;
  }

  public getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionId];
  }

  public nextQuestion(): boolean {
    if (this.currentQuestionId >= this.questions.length - 1) {
      return false;
    }

    // ?????
    // this.resetPlayersReady();
    // this.audioPlayer.isPlaying = false;
    // this.selectedPlayerId = 0;
    this.currentQuestionId++;
    return true;
  }

  public prevQuestion(): boolean {
    if (this.currentQuestionId <= 0) {
      return false;
    }

    // ?????
    // this.resetPlayersReady();
    // this.audioPlayer.isPlaying = false;
    // this.selectedPlayerId = 0;
    this.currentQuestionId--;
    return true;
  }

  public getPlayersReady(): Player[] | null {
    // if (!this.players.length) return null;
    // return this.players.filter((player) => player.hasPressedReady);
    return null;
  }

  public setPlayerReady(playerToken: string): true | false {
    // const player = this.players.find((p) => p.token === playerToken);
    // if (!player || player.hasPressedReady) return false;
    //
    // player.hasPressedReady = true;
    return false;
  }

  public resetPlayersReady(): void {
    // this.players.forEach((player) => {
    //   player.hasPressedReady = false;
    // });
  }

  public getSelectedPlayer(): Player | void {
    // const p = this.getPlayersReady();
    // if (!p) return null;
    //
    // return p[this.selectedPlayerId];
  }
}
