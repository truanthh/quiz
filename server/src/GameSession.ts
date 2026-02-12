import { Question, Track, Player } from "./types/game.ts";

export class GameSession {
  public readonly id: string;
  public readonly createdBy: Player;
  public players: Player[];
  public leader: Player;
  public screen: Player;
  public questions: Question[];
  public currentQuestionId: number;
  public selectedPlayerId: number;
  public status: string;

  constructor(player: Player) {
    this.id = "game-" + player.name;
    this.createdBy = player;
    this.players = [player];
    this.leader = player;
    this.screen = player;
    this.questions = [];
    this.currentQuestionId = 0;
    this.selectedPlayerId = 0;
    this.status = "lobby";
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
