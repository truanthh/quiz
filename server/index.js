import express from "express";
import { createServer } from "http";
import { Server as socketIo } from "socket.io";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { convertTime, generateAvatarNumber } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new socketIo(server, {
  cors: {
    origin: "*", // Для разработки
    methods: ["GET", "POST"],
  },
});

app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// middleware
app.use(cors());
app.use(express.json());

const players = new Map();
const playerTokens = new Map();
const availableAvatars = new Set([1, 2, 3, 4, 5, 6, 7, 8]);

let admin = {
  socketId: undefined,
  token: undefined,
  role: "admin",
  name: "admin",
};
let screen = {
  socketId: undefined,
  token: undefined,
  role: "screen",
  name: "screen",
};

// const tracks = [{ name: "blank", artist: "blank" }];

const game = {
  questions: [],
  currentQuestion: {},
  currentQuestionId: 0,
  players: [],
  playerTokens: [],
  playersReadyToAnswer: [{ name: "blank", hasPressedReady: false, avatar: 0 }],
  selectedPlayerId: 0,
  audioPlayer: {
    currentTrack: "",
    currentTrackId: 0,
    isPlaying: false,
    currentTimeSeconds: 0,
    currentTimeString: "00:00",
  },
};

function updateClientGameState() {
  io.emit("update-client-game-state", game);
}

// need this to see players on pre-game screen
function updateClientPlayers() {
  io.emit("update-client-players", getPlayers());
}

function getPlayers() {
  if (players.size) {
    return Array.from(players.values());
  }

  return [];
}

function getSelectedPlayer() {
  if (game.playersReadyToAnswer.length === 0) {
    console.log("error getting selected player!");
    return {};
  }

  return game.playersReadyToAnswer[game.selectedPlayerId];
}

function getPlayersCurrentGame() {
  if (game.players.size) {
    return Array.from(game.players.values());
  }

  return [];
}

function setAudioPlayerState(newState) {
  game.audioPlayer.currentTrack = newState.currentTrack;
  game.audioPlayer.currentTrackId = newState.currentTrackIndex; // xd
  game.audioPlayer.isPlaying = newState.isPlaying;
  game.audioPlayer.currentTimeSeconds = newState.currentTimeSeconds;
  game.audioPlayer.currentTimeString = convertTime(
    game.audioPlayer.currentTimeSeconds,
  );
}

// to init game we need tracks, players, and audioplayer data
function initGame(apState) {
  game.players = players;
  game.playerTokens = playerTokens;
  if (apState.tracks.length === 0) {
    console.log("error getting tracks!");
  }
  apState.tracks.forEach((track) => {
    game.questions.push({
      track,
      state: "",
      isArtistNameRevealed: false,
      isTrackNameRevealed: false,
    });
  });
  game.currentQuestion = game.questions[game.currentQuestionId];
  // console.log(game.questions);
  if (game.questions.length !== 0) {
    console.log("questions loaded successfully!");
  }
  setAudioPlayerState(apState);
}

function setPlayerReady(player) {
  player.hasPressedReady = true;
  game.playersReadyToAnswer.push(player);
  updateClientGameState();
}

function resetPlayers() {
  const players = getPlayersCurrentGame();
  if (players.length === 0) {
    console.log("error getting players array! mb no players?");
    return;
  }
  for (let player of players) {
    player.hasPressedReady = false;
  }
  game.playersReadyToAnswer.length = 0;
  updateClientGameState();
}

function changeCurrentQuestionState(state) {
  game.currentQuestion.state = state;
}

// RECONNECT
io.on("connection", (socket) => {
  socket.emit("connection-established", {
    message: "Подключение успешно",
    socketId: socket.id,
    connectedAt: new Date().toLocaleString(),
  });

  let token = socket.handshake.auth.token;
  let oldSocketIdPlayer = playerTokens.get(token);

  if (token) {
    if (token === admin.token) {
      admin.socketId = socket.id;
      socket.emit("login-successful", admin);
    }
    //
    else if (token === screen.token) {
      screen.socketId = socket.id;
      updateClientGameState();

      // getting players, playersReady and tracks data
      socket.emit("login-successful", screen);
    }
    //
    else if (oldSocketIdPlayer) {
      const playerOld = players.get(oldSocketIdPlayer);
      players.delete(oldSocketIdPlayer);
      playerOld.socketId = socket.id;
      players.set(socket.id, playerOld);
      playerTokens.set(token, socket.id);
      updateClientPlayers();
      // console.log(`got user, logging in... `);
      socket.emit("login-successful", playerOld);
    } else {
      // console.log("token is irrelevant, log in normally");
    }
  }

  // NEW USER
  socket.on("login", (payload) => {
    const newToken = uuidv4();

    // generating new token and creating new user
    if (payload.role === "screen") {
      const newScreen = {
        socketId: socket.id,
        token: newToken,
        role: "screen",
      };
      screen = newScreen;
      socket.emit("login-successful", screen);
    }
    //
    else if (payload.role === "player") {
      const player = {
        socketId: socket.id,
        token: newToken,
        name: payload.userName,
        points: 0,
        hasPressedReady: false,
        avatar: generateAvatarNumber(availableAvatars),
        role: payload.role,
      };
      players.set(socket.id, player);
      playerTokens.set(newToken, socket.id);
      socket.emit("login-successful", player);
      updateClientPlayers();
    }
    //
    else if (payload.role === "admin") {
      const newAdmin = {
        socketId: socket.id,
        token: newToken,
        role: "admin",
      };
      admin = newAdmin;
      socket.emit("login-successful", admin);
    }
    //
    // console.log(
    //   `
    //   ---------------------------
    //   registered new user:\n role: ${users[token].role}\n name: ${users[token].name}\n token: ${token}\n socketId: ${users[token].socketId}
    //   ---------------------------
    //   `,
    // );
    // console.log(`logging in...`);
  });

  socket.on("start-game", (apState) => {
    initGame(apState);
  });

  // this IS ONLY SENT by SCREEN
  // and needs to be sent to everyone else to update clients
  // I NEED TO NOT LET THIS EVENT FIRE BEFORE INITIALIZING GAME
  socket.on("audioplayer-state-change", (newState) => {
    console.log("AP STATE CHANGE");
    setAudioPlayerState(newState);
    updateClientGameState();
  });

  // track can only be played by admin
  // so we need to send event to everyone but the sender
  socket.on("request-play-track", () => {
    if (!audioPlayer.isPlaying) {
      io.to(screen.socketId).emit(
        "play-track",
        game.audioPlayer.currentTimeSeconds,
      );
    }
    if (currentQuestion.state === "") {
      changeCurrentQuestionState("open");
      updateClientGameState();
    }
  });

  socket.on("request-pause-track", () => {
    if (!audioPlayer.isPlaying) {
      io.to(screen.socketId).emit(
        "play-track",
        game.audioPlayer.currentTimeSeconds,
      );
    }
    if (
      currentQuestion.state === "open" ||
      currentQuestion.state === "pending"
    ) {
      changeCurrentQuestionState("");
      updateClientGameState();
    }
  });

  socket.on("request-select-prev-player", () => {
    const prevPlayerId = game.selectedPlayerId - 1;
    if (prevPlayerId >= 0) {
      game.selectedPlayerId = prevPlayerId;
      io.to(screen.socketId).emit(
        "select-prev-player",
        game.playersReadyToAnswer.slice(game.selectedPlayerId),
      );
    }
  });

  socket.on("request-select-next-player", () => {
    const nextPlayerId = game.selectedPlayerId + 1;
    if (nextPlayerId < game.playersReadyToAnswer.length) {
      game.selectedPlayerId = nextPlayerId;
      io.to(screen.socketId).emit(
        "select-next-player",
        game.playersReadyToAnswer.slice(game.selectedPlayerId),
      );
    }
  });

  socket.on("next-question", () => {
    if (game.currentQuestionId === game.questions.length - 1) {
      return;
    }
    resetPlayers();
    currentQuestionId++;
    currentQuestion = questions[currentQuestionId];
    updateClientGameState();
  });

  socket.on("prev-question", () => {
    if (game.currentQuestionId === 0) {
      return;
    }
    resetPlayers();
    currentQuestionId--;
    currentQuestion = questions[currentQuestionId];
    updateClientGameState();
  });

  socket.on("button-pressed-player", (sender) => {
    const player = game.players.get(game.playerTokens.get(sender.token));

    // question states - no state(empty string), open, countdown, pending, closed

    if (game.currentQuestion.state === "open" && !player.hasPressedReady) {
      io.to(screen.socketId).emit("pause-track");
      setPlayerReady(player);
      // countdown is also a question state
      // pause track. count down.
      changeCurrentQuestionState("countdown");
      updateClientGameState();
      let seconds = 5;
      let id = setInterval(() => {
        io.emit("countdown", seconds);
        seconds--;
        if (seconds === 0) {
          clearInterval(id);
          changeCurrentQuestionState("pending");
          updateClientGameState();
        }
      }, 1000);
    } else if (
      game.currentQuestion.state === "countdown" &&
      !player.hasPressedReady
    ) {
      setPlayerReady(player);
    }
  });

  // THESE ONLY SENT BY ADMIN
  socket.on("artist-name-correct", () => {
    if (game.currentQuestion.isArtistNameRevealed) {
      console.log("artist name is already revealed for this question!");
      return;
    }
    getSelectedPlayer().points += 69;
    game.currentQuestion.isArtistNameRevealed = false;
    updateClientGameState();
  });

  socket.on("artist-name-wrong", () => {
    if (currentQuestion.isArtistNameRevealed) {
      console.log("artist name is already revealed for this question!");
      return;
    }
    getSelectedPlayer().points -= 33;
    updateClientGameState();
  });

  socket.on("track-name-correct", () => {
    if (currentQuestion.isTrackNameRevealed) {
      console.log("track name is already revealed for this question!");
      return;
    }
    getSelectedPlayer().points += 111;
    game.currentQuestion.isTrackNameRevealed = false;
    updateClientGameState();
  });

  socket.on("track-name-wrong", () => {
    if (currentQuestion.isTrackNameRevealed) {
      console.log("track name is already revealed for this question!");
      return;
    }
    getSelectedPlayer().points -= 22;
    updateClientGameState();
  });

  socket.on("request-show-artist", () => {
    io.to(screen.socketId).emit("show-artist");
  });

  socket.on("request-show-trackname", () => {
    io.to(screen.socketId).emit("show-trackname");
  });

  socket.on("request-show-poster", () => {
    io.to(screen.socketId).emit("show-poster");
  });

  socket.on("request-show-scoreboard", () => {
    io.to(screen.socketId).emit("show-scoreboard");
  });

  socket.on("disconnect", () => {
    console.log(
      `Отключился: ${
        players.get(socket.id)?.name || admin.socketId === socket.id
          ? "admin"
          : "screen"
      }`,
    );
  });
});

server.listen(3000, "0.0.0.0", () => {
  // console.log("Сервер запущен на порту 3000");
});
