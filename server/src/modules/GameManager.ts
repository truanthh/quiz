import {
  GameState,
  AudioPlayerState,
  Question,
  Track,
  Player,
} from "../types/game.ts";

export class GameManager {
  private gameState: GameState;
  private apState: AudioPlayerState;

  constructor(tracks: any, players: Player[]) {
    this.gameState = this.initGame(tracks, players);
    this.apState = {
      tracks: [],
      currentTrackId: 0,
      isPlaying: false,
      currentTimeSeconds: 0,
    };
  }

  public getCurrentGameState(): GameState {
    return this.gameState;
  }

  public getCurrentQuestion(): Question {
    return this.gameState.questions[this.gameState.currentQuestionId];
  }

  public nextQuestion(): boolean {
    if (
      this.gameState.currentQuestionId >=
      this.gameState.questions.length - 1
    ) {
      return false;
    }

    // ?????
    // this.resetPlayersReady();
    // this.gameState.audioPlayer.isPlaying = false;
    // this.gameState.selectedPlayerId = 0;
    this.gameState.currentQuestionId++;
    return true;
  }

  public prevQuestion(): boolean {
    if (this.gameState.currentQuestionId <= 0) {
      return false;
    }

    // ?????
    // this.resetPlayersReady();
    // this.gameState.audioPlayer.isPlaying = false;
    // this.gameState.selectedPlayerId = 0;
    this.gameState.currentQuestionId--;
    return true;
  }

  public initGame(tracks: Track[], players: Player[]): GameState {
    // if (this.gameState.hasStarted) return;

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

    return {
      hasStarted: true,
      questions: q,
      currentQuestionId: 0,
      players: p,
      selectedPlayerId: 0,
    };
  }

  public getPlayersReady(): Player[] | null {
    if (!this.gameState.players.length) return null;
    return this.gameState.players.filter((player) => player.hasPressedReady);
  }

  public setPlayerReady(playerToken: string): true | false {
    const player = this.gameState.players.find((p) => p.token === playerToken);
    if (!player || player.hasPressedReady) return false;

    player.hasPressedReady = true;
    return true;
  }

  public resetPlayersReady(): void {
    this.gameState.players.forEach((player) => {
      player.hasPressedReady = false;
    });
  }

  public getSelectedPlayer(): Player | null {
    const p = this.getPlayersReady();
    if (!p) return null;

    return p[this.gameState.selectedPlayerId];
  }

  public getCurrentAudioPlayerState() {
    return this.apState;
  }

  public updateAudioPlayerState(newState: AudioPlayerState): void {
    this.apState = { ...newState };
  }
}
