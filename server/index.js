import express from "express";
import { createServer } from "http";
import { Server as socketIo } from "socket.io";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

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

const playersReadyToAnswer = [
  { name: "blank", hasPressedReady: false, avatar: 0 },
];
let selectedPlayerId = 0;

const questions = [];
let currentQuestionId = 0;
let currentQuestion = {};

// audioPlayer state
const audioPlayer = {
  tracks: "",
  currentTrack: "",
  isPlaying: false,
  currentTimeSeconds: 0,
  currentTimeString: "00:00",
};

function initQuestions() {
  audioPlayer.tracks.forEach((track) => {
    questions.push({
      track,
      state: "",
      artistNameIsOpen: true,
      trackNameIsOpen: true,
    });
  });
  currentQuestion = questions[currentQuestionId];
  if (questions.length !== 0) {
    console.log("questions loaded successfully!");
  }
}

const availableAvatars = new Set([1, 2, 3, 4, 5, 6, 7, 8]);

function generateAvatarNumber() {
  if (availableAvatars.size === 0) {
    // console.log("no avatars available!");
    return;
  }

  const avatarNumber =
    Array.from(availableAvatars)[
      Math.floor(Math.random() * availableAvatars.size)
    ];

  availableAvatars.delete(avatarNumber);

  return avatarNumber;
}

function secondsToString(seconds) {
  let sec = seconds;
  let min = 0;

  if (seconds > 59) {
    min = Math.floor(seconds / 60);
    sec = sec % 60;
  }

  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// i need this to restore state for screen after reconnecting
function updateAudioPlayerStateAllClients() {
  io.to(screen.socketId).emit("update-audioplayer-client-state", audioPlayer);
}

// same shit here
function setStateScreen() {
  // console.log("trying to send data to screen!");
  updateAudioPlayerStateAllClients();
  updatePlayersClient();
  io.to(screen.socketId).emit(
    "update-players-ready-to-answer",
    playersReadyToAnswer.slice(selectedPlayerId),
  );
}

function changeCurrentQuestionStateAndUpdateClient(state) {
  currentQuestion.state = state;
  [screen.socketId, ...getPlayers().map((player) => player.socketId)].forEach(
    (socketId) => {
      io.to(socketId).emit("question-state-changed", currentQuestion.state);
    },
  );
}

function getPlayers() {
  if (players.size) {
    return Array.from(players.values());
  }

  return [];
}

function updatePlayersClient() {
  io.emit("update-players", getPlayers());
  // console.log(`updated players screen with ${players[0]}s ome  data`);
}

function setPlayerReadyAndUpdateClient(player) {
  player.hasPressedReady = true;
  playersReadyToAnswer.push(player);
  io.to(player.socketId).emit("you-are-ready");
  io.to(screen.socketId).emit(
    "update-players-ready-to-answer",
    playersReadyToAnswer,
  );
}

function resetPlayers() {
  const players = getPlayers();
  if (players.length === 0) {
    // console.log("error getting players array! mb no players?");
    return;
  }
  for (let player of players) {
    player.hasPressedReady = false;
  }
  playersReadyToAnswer.length = 0;
  io.to(getPlayers().map((player) => player.socketId)).emit("reset-players");
}

// Обработка подключений
io.on("connection", (socket) => {
  // user reconnects
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
      setStateScreen();

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
      updatePlayersClient();
      // console.log(`got user, logging in... `);
      socket.emit("login-successful", playerOld);
    } else {
      // console.log("token is irrelevant, log in normally");
    }
  }

  // only new user
  socket.on("login", (payload) => {
    const newToken = uuidv4();

    // generating new token and creating new user
    if (payload.role === "player") {
      const player = {
        socketId: socket.id,
        token: newToken,
        name: payload.userName,
        points: 0,
        hasPressedReady: false,
        avatar: generateAvatarNumber(),
        role: payload.role,
        // connectedAt = socket.connectedAt,
      };
      players.set(socket.id, player);
      playerTokens.set(newToken, socket.id);
      socket.emit("login-successful", player);
      updatePlayersClient();
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
    else if (payload.role === "screen") {
      const newScreen = {
        socketId: socket.id,
        token: newToken,
        role: "screen",
      };
      screen = newScreen;
      // console.log(payload.tracksData.tracks);
      audioPlayer.tracks = payload.tracksData.tracks;
      if (audioPlayer.tracks.length > 0) {
        audioPlayer.currentTrack = audioPlayer.tracks[0];
      }
      resetPlayers();
      initQuestions();
      setStateScreen();
      socket.emit("login-successful", { ...screen, audioPlayer });
    }
    // console.log(
    //   `
    //   ---------------------------
    //   registered new user:\n role: ${users[token].role}\n name: ${users[token].name}\n token: ${token}\n socketId: ${users[token].socketId}
    //   ---------------------------
    //   `,
    // );
    // console.log(`logging in...`);
  });

  socket.emit("connection-established", {
    message: "Подключение успешно",
    socketId: socket.id,
    connectedAt: new Date().toLocaleString(),
  });

  socket.on("admin-loaded", () => {
    io.to(admin.socketId).emit("update-admin-track-data", currentQuestion);
  });

  // this presumably only sent by screen
  // and needs to be sent to everyone else to update clients
  socket.on("audioplayer-state-change", (newState) => {
    // audioPlayer.tracks = newState.tracks;
    audioPlayer.currentTrack = newState.currentTrack;
    audioPlayer.isPlaying = newState.isPlaying;
    audioPlayer.currentTimeSeconds = newState.currentTimeSeconds;
    audioPlayer.currentTimeString = secondsToString(
      audioPlayer.currentTimeSeconds,
    );
    updateAudioPlayerStateAllClients();
  });

  // track can only be played by admin
  // so we need to send event to everyone but the sender
  socket.on("request-play-track", () => {
    if (currentQuestion.state === "") {
      changeCurrentQuestionStateAndUpdateClient("open");
      playersReadyToAnswer.length = 0;
    }
    io.to(screen.socketId).emit("play-track", audioPlayer.currentTimeSeconds);
  });

  socket.on("request-pause-track", () => {
    if (
      currentQuestion.state === "open" ||
      currentQuestion.state === "pending"
    ) {
      changeCurrentQuestionStateAndUpdateClient("");
    }
    io.to(screen.socketId).emit("pause-track");
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

  socket.on("request-select-prev-player", () => {
    const prevPlayerId = selectedPlayerId - 1;
    if (prevPlayerId >= 0) {
      // console.log(`selecting player ${prevPlayerId}`);
      selectedPlayerId = prevPlayerId;
      io.to(screen.socketId).emit(
        "select-prev-player",
        playersReadyToAnswer.slice(selectedPlayerId),
      );
    }
  });

  socket.on("request-select-next-player", () => {
    const nextPlayerId = selectedPlayerId + 1;
    if (nextPlayerId < playersReadyToAnswer.length) {
      // console.log(`selecting player ${nextPlayerId}`);
      selectedPlayerId = nextPlayerId;
      io.to(screen.socketId).emit(
        "select-next-player",
        playersReadyToAnswer.slice(selectedPlayerId),
      );
    }
  });

  socket.on("next-question", (trackData) => {
    if (currentQuestionId === questions.length - 1) {
      return;
    }
    // resetPlayers();
    io.to(screen.socketId).emit(
      "update-users-ready-to-answer",
      playersReadyToAnswer,
    );
    currentQuestionId++;
    currentQuestion = questions[currentQuestionId];
    io.sockets.emit("change-current-question", currentQuestionId);
  });

  socket.on("prev-question", (trackData) => {
    if (currentQuestionId === 0) {
      return;
    }
    // resetPlayers();
    io.to(screen.socketId).emit(
      "update-users-ready-to-answer",
      playersReadyToAnswer,
    );
    currentQuestionId--;
    currentQuestion = questions[currentQuestionId];
    io.sockets.emit("change-current-question", currentQuestionId);
  });

  socket.on("button-pressed-player", (sender) => {
    const player = players.get(playerTokens.get(sender.token));

    // question states - no state(empty string), open, countdown, pending, closed

    if (currentQuestion.state === "open" && !player.hasPressedReady) {
      io.to(screen.socketId).emit("pause-track");
      setPlayerReadyAndUpdateClient(player);
      // countdown is also a question state
      // pause track. count down.
      changeCurrentQuestionStateAndUpdateClient("countdown");
      let seconds = 10;
      let id = setInterval(() => {
        seconds--;
        io.to([
          screen.socketId,
          getPlayers().map((player) => player.socketId),
        ]).emit("countdown", seconds);
        if (seconds === 0) {
          clearInterval(id);
          changeCurrentQuestionStateAndUpdateClient("pending");
        }
      }, 1000);
    } else if (
      currentQuestion.state === "countdown" &&
      !player.hasPressedReady
    ) {
      setPlayerReadyAndUpdateClient(player);
    }
  });

  // THESE ONLY SENT BY ADMIN
  socket.on("artist-name-correct", () => {
    if (!currentQuestion.artistNameIsOpen) {
      console.log("artist name is already closed for this question!");
      return;
    }
    playersReadyToAnswer[selectedPlayerId].points += 69;
    currentQuestion.artistNameIsOpen = false;
    updatePlayersClient();
  });

  socket.on("artist-name-wrong", () => {
    if (!currentQuestion.artistNameIsOpen) {
      console.log("artist name is already closed for this question!");
      return;
    }
    playersReadyToAnswer[selectedPlayerId].points -= 33;
    updatePlayersClient();
  });

  socket.on("track-name-correct", () => {
    if (!currentQuestion.trackNameIsOpen) {
      console.log("track name is already closed for this question!");
      return;
    }
    playersReadyToAnswer[selectedPlayerId].points += 111;
    updatePlayersClient();
  });

  socket.on("track-name-wrong", () => {
    if (!currentQuestion.artistNameIsOpen) {
      console.log("track name is already closed for this question!");
      return;
    }
    playersReadyToAnswer[selectedPlayerId].points -= 22;
    updatePlayersClient();
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
