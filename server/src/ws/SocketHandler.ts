// ws/SocketHandler.ts
import { Server, Socket } from "socket.io";
import { GameManager } from "../modules/GameManager.ts";
import { PlayerManager } from "../modules/PlayerManager.ts";
import { Track, ServerEvent, ClientEvent, AudioPlayerState } from "../types";
import { v4 as uuidv4 } from "uuid";
import tracksData from "../tracks.json";

export class SocketHandler {
  private gameManager: GameManager;

  private playerManager: PlayerManager;
  constructor(private io: Server) {
    console.log(tracksData);
    this.playerManager = new PlayerManager();
    this.gameManager = new GameManager(
      tracksData.tracks,
      this.playerManager.getAllPlayers(),
    );
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

  private emitToScreen(event: ServerEvent): void {
    const screen = this.playerManager.getScreen();
    if (screen.socketId) {
      if ("data" in event) {
        this.io.to(screen.socketId).emit(event.type, event.data);
      } else {
        this.io.to(screen.socketId).emit(event.type);
      }
    }
  }

  public handleConnection(socket: Socket): void {
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

  private handleReconnect(socket: Socket, token: string): void {
    const admin = this.playerManager.getAdmin();
    const screen = this.playerManager.getScreen();

    if (token === admin.token) {
      admin.socketId = socket.id;
      this.emitToSocket(socket.id, { type: "login-successful", data: admin });
      this.updateAllClients();
      return;
    }

    if (token === screen.token) {
      screen.socketId = socket.id;
      this.emitToSocket(socket.id, { type: "login-successful", data: screen });
      this.updateAllClients();
      return;
    }

    // Попытка реконнекта игрока
    const reconnectedPlayer = this.playerManager.reconnectPlayer(
      token,
      socket.id,
    );
    if (reconnectedPlayer) {
      this.emitToSocket(socket.id, {
        type: "login-successful",
        data: reconnectedPlayer,
      });
      this.updateAllClients();
    }
  }

  private updateAllClients(): void {
    // Обновляем состояние у всех клиентов
    this.emitToAll({
      type: "update-client-players",
      data: this.playerManager.getAllPlayers(),
    });

    this.emitToAll({
      type: "update-client-game-state",
      data: this.gameManager.getCurrentGameState(),
    });
  }

  private registerEventHandlers(socket: Socket): void {
    // Логин нового пользователя
    socket.on("login", (payload) => {
      this.handleLogin(socket, payload);
    });

    // Старт игры
    socket.on("start-game", (tracks: Track[]) => {
      this.handleStartGame(socket, tracks);
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

  private handlePlayTrack() {
    this.emitToScreen({
      type: "play-track",
      data: this.gameManager.getCurrentQuestion().currentTimeSeconds,
    });
    // if (game.currentQuestion.state === "") {
    //   setCurrentQuestionState("open");
    //   updateClientGameState();
    // }
  }

  private handlePauseTrack() {
    this.emitToScreen({
      type: "pause-track",
    });
  }

  private handleSelectPrevPlayer() {}
  private handleSelectNextPlayer() {}
  private handleNextQuestion() {}
  private handlePrevQuestion() {}
  private handleAnswerCorrect(type: string) {}
  private handleAnswerWrong(type: string) {}
  private handleShowArtist() {}
  private handleShowPoster() {}
  private handleShowTrackName() {}
  private handleShowScoreboard() {}

  private handleDisconnect(socket: Socket) {}

  private handleLogin(socket: Socket, payload: any): void {
    const newToken = uuidv4();
    let user: any;

    switch (payload.role) {
      case "player":
        if (!payload.userName) return;
        user = this.playerManager.registerPlayer(
          socket.id,
          payload.userName,
          newToken,
        );
        break;
      case "screen":
        user = this.playerManager.registerScreen(socket.id, newToken);
        break;
      case "admin":
        user = this.playerManager.registerAdmin(socket.id, newToken);
        break;
      default:
        return;
    }

    this.emitToSocket(socket.id, { type: "login-successful", data: user });
    this.updateAllClients();
  }

  private handleStartGame(socket: Socket, tracks: Track[]): void {
    try {
      this.gameManager.initGame(tracks, this.playerManager.getAllPlayers());
      this.updateAllClients();
    } catch (error) {
      console.error("Error starting game:", error);
      this.emitToScreen({ type: "error", data: "Failed to start game!" });
      // socket.emit("error", { message: "Failed to start game" });
    }
  }

  private handleAudioPlayerChange(state: AudioPlayerState): void {
    this.gameManager.updateAudioPlayerState(state);

    this.emitToAll({
      type: "update-client-game-state",
      data: this.gameManager.getCurrentGameState(),
    });
  }

  private handlePlayerButtonPress(token: string): void {
    const player = this.playerManager.getPlayerByToken(token);
    if (!player) return;

    const gameState = this.gameManager.getCurrentGameState();
    const currentQuestion = this.gameManager.getCurrentQuestion();

    if (currentQuestion.state === "open" && !player.hasPressedReady) {
      this.handlePauseTrack();

      const readyPlayer = this.gameManager.setPlayerReady(token);
      if (readyPlayer) {
        this.startCountdown();
      }
    }
  }

  private startCountdown(): void {
    this.gameManager.getCurrentQuestion().state = "countdown";

    let seconds = 3;
    this.emitToAll({ type: "countdown", data: seconds });
    this.playSound("countdown");

    const intervalId = setInterval(() => {
      seconds--;
      this.emitToAll({ type: "countdown", data: seconds });

      if (seconds === 0) {
        clearInterval(intervalId);
        this.gameManager.getCurrentQuestion().state = "pending";
        this.updateAllClients();
        this.playSound("timeout");
      }
    }, 1000);
  }

  private playSound(name: string) {
    this.emitToScreen({ type: "play-sound", data: name });
  }

  // ... остальные методы обработчиков
}
