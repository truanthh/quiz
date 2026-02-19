import { Server, Socket } from "socket.io";
import { PlayerManager } from "./PlayerManager.ts";
import { GameManager } from "./GameManager.ts";
import { GameSession } from "./GameSession.ts";
import { AudioPlayerState, Track } from "./types";
import { v4 as uuidv4 } from "uuid";
import { ServerEvent } from "../../shared/events.ts";

export class SocketService {
  constructor(
    private io: Server,
    private playerManager: PlayerManager,
    private gameManager: GameManager,
  ) { }

  public initialize(): void {
    console.log("Initializing socket handlers...");

    this.io.on("connection", (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  public handleConnection(socket: Socket): void {
    console.log(`Подключился: ${socket.id}`);

    // Приветственное сообщение
    this.emitToSocket(socket.id, {
      type: "connection-established",
      data: {
        message: "Подключение успешно",
        socketId: socket.id,
        connectedAt: new Date().toLocaleString(),
      },
    });

    // Обработка реконнекта по токену
    const token = socket.handshake.auth.token;
    if (token) {
      this.handleReconnect(socket, token);
    }

    // Регистрация обработчиков событий
    this.registerEventHandlers(socket);
  }

  private emitToSocket(socketId: string, event: ServerEvent): void {
    if ("data" in event) {
      this.io.to(socketId).emit(event.type, event.data);
    } else {
      this.io.to(socketId).emit(event.type);
    }
  }

  private emitToAll(event: ServerEvent): void {
    if ("data" in event) {
      this.io.emit(event.type, event.data);
    } else {
      this.io.emit(event.type);
    }
  }

  private emitToGroup(arr: string[], event: ServerEvent): void {
    if ("data" in event) {
      this.io.to(arr).emit(event.type, event.data);
    } else {
      this.io.to(arr).emit(event.type);
    }
  }

  private handleReconnect(socket: Socket, token: string): void {
    // Попытка реконнекта игрока
    const reconnectedPlayer = this.playerManager.reconnectPlayer(
      token,
      socket.id,
    );
    if (reconnectedPlayer) {
      this.emitToSocket(socket.id, {
        type: "login-success",
        data: reconnectedPlayer,
      });
      this.updateAllClients(socket);
    }
  }

  private updateAllClients(socket: Socket): void {
    // shouldnt update all server players every time
    const player = this.playerManager.getPlayerBySocketId(socket.id);
    if (!player) return;

    this.emitToAll({
      type: "players-updated",
      data: this.playerManager.getAllPlayers(),
    });

    this.emitToSocket(player.socketId, {
      type: "player-updated",
      data: player,
    });

    const playerGameSession = this.gameManager.getGameSessionById(
      player?.gameId || "",
    );

    if (playerGameSession) {
      const socketIdsLobby = playerGameSession
        ?.getPlayers()
        .map((player) => player.socketId);

      this.emitToGroup(socketIdsLobby, {
        type: "player-lobby-updated",
        data: playerGameSession,
      });
    }
  }

  private registerEventHandlers(socket: Socket): void {
    // Логин нового пользователя
    socket.on("login", (payload) => {
      this.handleLogin(socket, payload);
    });

    socket.on("create-game", () => {
      this.handleCreateGame(socket);
    });

    socket.on("join-game", (gameId: string) => {
      this.handleJoinGame(socket, gameId);
    });

    // Старт игры
    socket.on("start-game", (tracks: Track[]) => {
      // this.handleStartGame(socket, tracks);
    });

    // Изменение состояния аудиоплеера
    socket.on("audioplayer-state-change", (state: AudioPlayerState) => {
      this.handleAudioPlayerChange(state);
    });

    // Управление воспроизведением
    socket.on("request-play-track", () => this.handlePlayTrack());
    socket.on("request-pause-track", () => this.handlePauseTrack());

    // Управление игроками
    socket.on("request-select-prev-player", () =>
      this.handleSelectPrevPlayer(),
    );
    socket.on("request-select-next-player", () =>
      this.handleSelectNextPlayer(),
    );

    // Управление вопросами
    socket.on("next-question", () => this.handleNextQuestion());
    socket.on("prev-question", () => this.handlePrevQuestion());

    // Нажатие кнопки игроком
    socket.on("button-pressed-player", (sender) => {
      this.handlePlayerButtonPress(sender.token);
    });

    // Проверка ответов (только админ)
    socket.on("artist-name-correct", () => this.handleAnswerCorrect("artist"));
    socket.on("artist-name-wrong", () => this.handleAnswerWrong("artist"));
    socket.on("track-name-correct", () => this.handleAnswerCorrect("track"));
    socket.on("track-name-wrong", () => this.handleAnswerWrong("track"));

    // Управление отображением
    socket.on("request-show-poster", () => this.handleShowPoster());
    socket.on("request-show-artist", () => this.handleShowArtist());
    socket.on("request-show-trackname", () => this.handleShowTrackName());
    socket.on("request-show-scoreboard", () => this.handleShowScoreboard());

    // Отключение
    socket.on("disconnect", () => {
      this.handleDisconnect(socket);
    });
  }

  private handleJoinGame(socket: Socket, gameId: string) {
    const player = this.playerManager.getPlayerBySocketId(socket.id);
    if (!player) return;

    this.gameManager.joinGame(player, gameId);

    this.updateAllClients(socket);
  }

  private handleCreateGame(socket: Socket) {
    const player = this.playerManager.getPlayerBySocketId(socket.id);
    if (!player) return;

    let game = this.gameManager.createGame(player);
    if (!game) return;

    // this.playerManager.createGame(player, game.id);
    this.updateAllClients(socket);
  }

  private handlePlayTrack() {
    // this.emitToScreen({
    //   type: "play-track",
    //   data: this.gameManager.getCurrentQuestion().currentTimeSeconds,
    // });
    // if (game.currentQuestion.state === "") {
    //   setCurrentQuestionState("open");
    //   updateClientGameState();
    // }
  }

  private handlePauseTrack() {
    // this.emitToScreen({
    //   type: "pause-track",
    // });
  }

  private handleSelectPrevPlayer() { }
  private handleSelectNextPlayer() { }
  private handleNextQuestion() { }
  private handlePrevQuestion() { }
  private handleAnswerCorrect(type: string) { }
  private handleAnswerWrong(type: string) { }
  private handleShowArtist() { }
  private handleShowPoster() { }
  private handleShowTrackName() { }
  private handleShowScoreboard() { }

  private handleDisconnect(socket: Socket) {
    console.log(`Отключился: ${socket.id}`);
  }

  private handleLogin(socket: Socket, payload: any): void {
    const newToken = uuidv4();
    let user: any;

    if (!payload.userName) return;
    user = this.playerManager.registerPlayer(
      socket.id,
      payload.userName,
      newToken,
    );

    this.emitToSocket(socket.id, {
      type: "login-success",
      data: { ...user, socketId: socket.id },
    });
    this.updateAllClients(socket);
  }

  // private handleStartGame(socket: Socket, tracks: Track[]): void {
  //   try {
  //     const player = this.playerManager.getPlayerBySocketId(socket.id);
  //     if (!player) {
  //       return;
  //     }
  //
  //     this.gameManager.createGame(player);
  //     this.updateAllClients();
  //   } catch (error) {
  //     console.error("Error starting game:", error);
  //     // this.emitToScreen({ type: "error", data: "Failed to start game!" });
  //     // socket.emit("error", { message: "Failed to start game" });
  //   }
  // }

  private handleAudioPlayerChange(state: AudioPlayerState): void {
    // this.gameManager.updateAudioPlayerState(state);
    //
    // this.emitToAll({
    //   type: "update-client-game-state",
    //   data: this.gameManager.getCurrentGameState(),
    // });
  }

  private handlePlayerButtonPress(token: string): void {
    // const player = this.playerManager.getPlayerByToken(token);
    // if (!player) return;
    //
    // const gameState = this.gameManager.getCurrentGameState();
    // const currentQuestion = this.gameManager.getCurrentQuestion();
    //
    // if (currentQuestion.state === "open" && !player.hasPressedReady) {
    //   this.handlePauseTrack();
    //
    //   const readyPlayer = this.gameManager.setPlayerReady(token);
    //   if (readyPlayer) {
    //     this.startCountdown();
    //   }
    // }
  }

  private startCountdown(): void {
    // this.gameManager.getCurrentQuestion().state = "countdown";
    //
    // let seconds = 3;
    // this.emitToAll({ type: "countdown", data: seconds });
    // this.playSound("countdown");
    //
    // const intervalId = setInterval(() => {
    //   seconds--;
    //   this.emitToAll({ type: "countdown", data: seconds });
    //
    //   if (seconds === 0) {
    //     clearInterval(intervalId);
    //     this.gameManager.getCurrentQuestion().state = "pending";
    //     this.updateAllClients();
    //     this.playSound("timeout");
    //   }
    // }, 1000);
  }

  private playSound(name: string) {
    // this.emitToScreen({ type: "play-sound", data: name });
  }

  // ... остальные методы обработчиков
}
