import {
  Game,
  AudioPlayerState,
  Question,
  Track,
  Player,
} from "./types/game.ts";

export class GameSession {
  private currentGame: Game | null = null;
  private apState: AudioPlayerState;

  constructor() {
    this.apState = {
      tracks: [],
      currentTrackId: 0,
      isPlaying: false,
      currentTimeSeconds: 0,
    };
  }

  get game(): Game {
    if (!this.currentGame) {
      throw new Error("Game session is not active!");
    }
    return this.currentGame;
  }

  public getCurrentGameState(): Game {
    return this.game;
  }

  public getCurrentQuestion(): Question {
    return this.game.questions[this.game.currentQuestionId];
  }

  public nextQuestion(): boolean {
    if (this.game.currentQuestionId >= this.game.questions.length - 1) {
      return false;
    }

    // ?????
    // this.resetPlayersReady();
    // this.game.audioPlayer.isPlaying = false;
    // this.game.selectedPlayerId = 0;
    this.game.currentQuestionId++;
    return true;
  }

  public prevQuestion(): boolean {
    if (this.game.currentQuestionId <= 0) {
      return false;
    }

    // ?????
    // this.resetPlayersReady();
    // this.game.audioPlayer.isPlaying = false;
    // this.game.selectedPlayerId = 0;
    this.game.currentQuestionId--;
    return true;
  }

  public initGame(
    player: Player,
    screen: Player,
    tracks: Track[],
    players: Player[],
  ): void {
    // if (this.game.hasStarted) return;

    if (tracks.length === 0) {
      throw new Error("Cannot init game: no tracks provided");
    }

    const q = tracks.map(
      (track: Track) =>
        ({
          track: track,
          state: "",
          currentTimeString: "00:00",
          currentTimeSeconds: 0,
          isArtistNameRevealed: false,
          isTrackNameRevealed: false,
          isPosterRevealed: false,
        }) as Question,
    );

    const p = [...players];

    this.currentGame = {
      status: "lobby",
      host: player,
      screen: screen,
      questions: q,
      currentQuestionId: 0,
      players: p,
      selectedPlayerId: 0,
    };
  }

  public getPlayersReady(): Player[] | null {
    // if (!this.game.players.length) return null;
    // return this.game.players.filter((player) => player.hasPressedReady);
    return null;
  }

  public setPlayerReady(playerToken: string): true | false {
    // const player = this.game.players.find((p) => p.token === playerToken);
    // if (!player || player.hasPressedReady) return false;
    //
    // player.hasPressedReady = true;
    return false;
  }

  public resetPlayersReady(): void {
    // this.game.players.forEach((player) => {
    //   player.hasPressedReady = false;
    // });
  }

  public getSelectedPlayer(): Player | null {
    const p = this.getPlayersReady();
    if (!p) return null;

    return p[this.game.selectedPlayerId];
  }

  public getCurrentAudioPlayerState() {
    return this.apState;
  }

  public updateAudioPlayerState(newState: AudioPlayerState): void {
    this.apState = { ...newState };
  }
}
