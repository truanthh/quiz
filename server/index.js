import express from "express";
import { createServer } from "http";
import { Server as socketIo } from "socket.io";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { convertTime, generateAvatarNumber, initAvatars } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVATARS_AMOUNT = 19;
const GIFS_AMOUNT = 6;

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

const availableAvatars = new Set();
const availableAltAvatars = new Set();

// XD
initAvatars(availableAvatars, AVATARS_AMOUNT);
initAvatars(availableAltAvatars, GIFS_AMOUNT);

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
  hasStarted: false,
  questions: [],
  currentQuestion: {},
  currentQuestionId: 0,
  players: [],
  playersReadyToAnswer: [{ name: "blank", hasPressedReady: false, avatar: 0 }],
  selectedPlayerId: 0,
  // this state is only for storing
  // the actual audio player is on screen page,
  // this is for syncing
  audioPlayer: {
    currentTrack: "",
    currentTrackId: 0,
    isPlaying: false,
    currentTimeSeconds: 0,
    currentTimeString: "00:00",
  },
};

function resetAltAvatars() {
  initAvatars(availableAltAvatars, GIFS_AMOUNT);

  game.players.forEach((player) => {
    player.altAvatar = generateAvatarNumber(availableAltAvatars);
  });
}

function updateClientUserState(user) {
  io.to(user.socketId).emit("update-client-user-state", user);
}

function updateResetPlayers() {
  io.to(getPlayers().map((player) => player.socketId)).emit(
    "update-client-user-state",
    { hasPressedReady: false },
  );
}

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

function setAudioPlayerState(newState) {
  // state sent by screen
  game.audioPlayer.currentTrackId = newState.currentTrackIndex; // xd
  game.audioPlayer.isPlaying = newState.isPlaying;
  game.audioPlayer.currentTimeSeconds = newState.currentTimeSeconds;

  // state calculated
  // game.questions[game.audioPlayer.currentTrackId].track;
  game.audioPlayer.currentTimeString = convertTime(
    game.audioPlayer.currentTimeSeconds,
  );
}

function setCurrentQuestionTime(seconds) {
  game.currentQuestion.currentTimeSeconds = seconds;
  game.currentQuestion.currentTimeString = convertTime(seconds);
}

function initGame(tracks) {
  if (tracks.length === 0) {
    console.log("error getting tracks!");
    return;
  }
  // saving players
  players.forEach((player) => {
    game.players.push(player);
  });
  resetPlayers();
  tracks.forEach((track) => {
    game.questions.push({
      track: track,
      state: "",
      currentTimeString: "00:00",
      currentTimeSeconds: 0,
      isArtistNameRevealed: false,
      isTrackNameRevealed: false,
      isPosterRevealed: false,
    });
  });
  game.currentQuestion = game.questions[game.currentQuestionId];
  if (game.questions.length !== 0) {
    console.log("questions loaded successfully!");
    // console.log(game.questions);
  }
  game.hasStarted = true;
  updateClientGameState();
}

function setPlayerReady(player) {
  player.hasPressedReady = true;
  game.playersReadyToAnswer.push(player);
  updateClientUserState(player);
  updateClientGameState();
}

function resetPlayers() {
  if (game.players.length === 0) {
    console.log("error resetting players array! mb no players?");
    return;
  }
  for (let player of game.players) {
    player.hasPressedReady = false;
  }
  game.playersReadyToAnswer.length = 0;
  updateResetPlayers();
}

function setCurrentQuestionState(state) {
  game.currentQuestion.state = state;
}

// and reveal poster
// question is closed when artist name and track named are guessed correct
function closeQuestion() {
  if (
    game.currentQuestion.isArtistNameRevealed &&
    game.currentQuestion.isTrackNameRevealed
  ) {
    game.currentQuestion.isPosterRevealed = true;
    setCurrentQuestionState("closed");
  }
  updateClientGameState();
  stopAllSounds();
}

function nextQuestion() {
  if (game.currentQuestionId === game.questions.length - 1) {
    return;
  }
  resetPlayers();
  game.currentQuestionId++;
  game.currentQuestion = game.questions[game.currentQuestionId];
  game.audioPlayer.isPlaying = false;
  game.selectedPlayerId = 0;
  resetAltAvatars();
  updateClientGameState();
  playSound("next");
}

function prevQuestion() {
  if (game.currentQuestionId === 0) {
    return;
  }
  resetPlayers();
  game.currentQuestionId--;
  game.currentQuestion = game.questions[game.currentQuestionId];
  game.audioPlayer.isPlaying = false;
  game.selectedPlayerId = 0;
  updateClientGameState();
  stopAllSounds();
}

function playSound(soundName) {
  stopAllSounds();
  io.to(screen.socketId).emit(`play-sound-${soundName}`);
}

function stopAllSounds() {
  io.to(screen.socketId).emit(`stop-sounds`);
}

function showPointsGained(points) {
  io.to(screen.socketId).emit("show-points-gained", points);
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
    // ADMIN
    if (token === admin.token) {
      admin.socketId = socket.id;

      updateClientPlayers();
      updateClientGameState();

      socket.emit("login-successful", admin);
    }
    // SCREEN
    else if (token === screen.token) {
      screen.socketId = socket.id;

      updateClientPlayers();
      updateClientGameState();

      // getting players, playersReady and tracks data
      socket.emit("login-successful", screen);
    }
    // PLAYER
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
        altAvatar: generateAvatarNumber(availableAltAvatars),
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
    setAudioPlayerState(newState);
    // ????
    if (newState.isPlaying) {
      setCurrentQuestionTime(newState.currentTimeSeconds);
    }
    updateClientGameState();
  });

  // track can only be played by admin
  // so we need to send event to everyone but the sender
  socket.on("request-play-track", () => {
    if (!game.audioPlayer.isPlaying) {
      io.to(screen.socketId).emit(
        "play-track",
        game.currentQuestion.currentTimeSeconds,
      );
    }
    if (game.currentQuestion.state === "") {
      setCurrentQuestionState("open");
      updateClientGameState();
    }
  });

  socket.on("request-pause-track", () => {
    io.to(screen.socketId).emit("pause-track");
    // if (game.audioPlayer.isPlaying) {
    // }
    // if (
    //   game.currentQuestion.state === "open" ||
    //   game.currentQuestion.state === "pending"
    // ) {
    //   setCurrentQuestionState("");
    //   updateClientGameState();
    // }
  });

  socket.on("request-select-prev-player", () => {
    const prevPlayerId = game.selectedPlayerId - 1;
    if (prevPlayerId >= 0) {
      game.selectedPlayerId = prevPlayerId;
      updateClientGameState();
    }
  });

  socket.on("request-select-next-player", () => {
    const nextPlayerId = game.selectedPlayerId + 1;
    if (nextPlayerId < game.playersReadyToAnswer.length) {
      game.selectedPlayerId = nextPlayerId;
      updateClientGameState();
    }
  });

  socket.on("next-question", () => {
    nextQuestion();
  });

  socket.on("prev-question", () => {
    prevQuestion();
  });

  socket.on("button-pressed-player", (sender) => {
    const player = players.get(playerTokens.get(sender.token));

    // question states - no state(empty string), open, countdown, pending, closed
    if (game.currentQuestion.state === "open" && !player.hasPressedReady) {
      io.to(screen.socketId).emit("pause-track");
      setPlayerReady(player);
      // countdown is also a question state
      // pause track. count down.
      setCurrentQuestionState("countdown");
      updateClientGameState();
      let seconds = 3;
      io.emit("countdown", seconds);
      playSound("countdown");
      let id = setInterval(() => {
        seconds--;
        io.emit("countdown", seconds);
        if (seconds === 0) {
          clearInterval(id);
          setCurrentQuestionState("pending");
          updateClientGameState();
          playSound("timeout");
        }
      }, 1000);
    } else if (
      game.currentQuestion.state === "countdown" &&
      !player.hasPressedReady
    ) {
      setPlayerReady(player);
    }
  });

  socket.on("request-stop-sounds", () => {
    stopAllSounds();
  });

  socket.on("request-play-sound-timeout", () => {
    playSound("timeout");
  });

  // THESE ONLY SENT BY ADMIN
  socket.on("artist-name-correct", () => {
    if (
      game.currentQuestion.isArtistNameRevealed ||
      game.currentQuestion.state !== "pending"
    ) {
      console.log("error revealing artist!");
      return;
    }
    // reveal artist
    game.currentQuestion.isArtistNameRevealed = true;
    const pointsGained =
      game.currentQuestion.track.artistNamePoints *
      game.currentQuestion.track.artistNameDifficulty;
    getSelectedPlayer().points += pointsGained;
    // try to close question if whole track is guessed
    // state also updates here
    closeQuestion();
    playSound("success");
    showPointsGained(pointsGained);
  });

  socket.on("artist-name-wrong", () => {
    if (
      game.currentQuestion.isArtistNameRevealed ||
      game.currentQuestion.state !== "pending"
    ) {
      console.log("error revealing artist!");
      return;
    }
    const pointsGained =
      game.currentQuestion.track.artistNamePoints *
      game.currentQuestion.track.artistNameDifficulty;
    getSelectedPlayer().points -= pointsGained;
    updateClientGameState();
    playSound("failure");
    showPointsGained(-pointsGained);
  });

  socket.on("track-name-correct", () => {
    if (
      game.currentQuestion.isTrackNameRevealed ||
      game.currentQuestion.state !== "pending"
    ) {
      console.log("error revealing track name!");
      return;
    }
    // reveal track name
    game.currentQuestion.isTrackNameRevealed = true;
    const pointsGained =
      game.currentQuestion.track.trackNamePoints *
      game.currentQuestion.track.trackNameDifficulty;
    getSelectedPlayer().points += pointsGained;
    closeQuestion();
    // try to close question if whole track is guessed
    // state also updates here
    playSound("success");
    showPointsGained(pointsGained);
  });

  socket.on("track-name-wrong", () => {
    if (
      game.currentQuestion.isTrackNameRevealed ||
      game.currentQuestion.state !== "pending"
    ) {
      console.log("error revealing track name!");
      return;
    }
    const pointsGained =
      game.currentQuestion.track.trackNamePoints *
      game.currentQuestion.track.trackNameDifficulty;
    getSelectedPlayer().points -= pointsGained;
    updateClientGameState();
    playSound("failure");
    showPointsGained(-pointsGained);
  });

  socket.on("request-show-poster", () => {
    game.currentQuestion.isPosterRevealed = true;
    updateClientGameState();
  });

  socket.on("request-show-artist", () => {
    game.currentQuestion.isArtistNameRevealed = true;
    updateClientGameState();
  });

  socket.on("request-show-trackname", () => {
    game.currentQuestion.isTrackNameRevealed = true;
    updateClientGameState();
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
