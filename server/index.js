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

// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
const users = {};
const usersReadyToAnswer = [];

let screenSocketId;
let adminSocketId;
let playerTokenArray = [];

let currentQuestionId = 0;
let currentQuestion = {};

// audioPlayer state
const audioPlayer = {
  isPlaying: false,
  currentTrackIndex: 0,
  duration: 0,
  currentTime: 0,
  volume: 2.0,
  tracks: [],
};

function getPlayers() {
  if (playerTokenArray.length > 0) {
    return playerTokenArray.map(token > users[token]);
  }
}

function resetUsers() {
  for (let user in users) {
    if (user.role === "player") {
      user.hasPressedReady = false;
    }
  }
  usersReadyToAnswer.length = 0;
}

function setRoleGroupSocketIds(token) {
  if (users[token].role === "screen") {
    screenSocketId = users[token].socketId;
  } else if (users[token].role === "admin") {
    adminSocketId = users[token].socketId;
  } else if (users[token].role === "player") {
    playerTokenArray.push(token);
  }
}

// Обработка подключений
io.on("connection", (socket) => {
  let token = socket.handshake.auth.token;
  console.log(`Подключился: socket: ${socket.id} token: ${token}`);

  if (token) {
    if (users[token]) {
      users[token].socketId = socket.id;
      setRoleGroupSocketIds(token);
      console.log(`got user, logging in... ${JSON.stringify(users[token])}`);
      socket.emit("login-successful", { ...users[token], token: token });
    } else {
      console.log("token is irrelevant, log in normally");
    }
  }

  // only new user
  socket.on("login", (payload) => {
    // generating new token and creating new user
    token = uuidv4();
    users[token] = {};
    users[token].role = payload.role;
    users[token].name = payload.userName;
    users[token].socketId = socket.id;
    users[token].connectedAt = socket.connectedAt;
    users[token].points = 0;
    users[token].hasPressedReady = false;
    setRoleGroupSocketIds(token);
    console.log(
      `
      ---------------------------
      registered new user:\n
      role: ${users[token].role}\n
      name: ${users[token].name}\n
      token: ${token}\n
      socketId: ${users[token].socketId}
      ---------------------------
      `,
    );
    console.log(`logging in...`);
    socket.emit("login-successful", { ...users[token], token: token });
  });

  socket.emit("connection-established", {
    message: "Подключение успешно",
    socketId: socket.id,
    connectedAt: new Date().toLocaleString(),
  });

  socket.on("screen-loaded", (tracks) => {
    audioPlayer.tracks = tracks;
    currentQuestion = audioPlayer.tracks[currentQuestionId];
    if (audioPlayer.tracks.length !== 0) {
      console.log("screen/tracks loaded successfully!");
    }
  });

  socket.on("admin-loaded", () => {
    resetUsers();
    io.to(adminSocketId).emit("update-admin-track-data", currentQuestion);
  });

  socket.on("next-question", (trackData) => {
    if (currentQuestionId === audioPlayer.tracks.length - 1) {
      return;
    }
    resetUsers();
    io.to(screenSocketId).emit(
      "update-users-ready-to-answer",
      usersReadyToAnswer,
    );
    currentQuestionId++;
    currentQuestion = audioPlayer.tracks[currentQuestionId];
    io.sockets.emit("update-question", currentQuestionId);
  });

  socket.on("prev-question", (trackData) => {
    if (currentQuestionId === 0) {
      return;
    }
    resetUsers();
    io.to(screenSocketId).emit(
      "update-users-ready-to-answer",
      usersReadyToAnswer,
    );
    currentQuestionId--;
    currentQuestion = audioPlayer.tracks[currentQuestionId];
    io.sockets.emit("update-question", currentQuestionId);
  });

  // track can only be paused by player or admin
  // added admin condition just in case
  socket.on("pause-track", (user) => {
    const player = users[user.token];
    if (audioPlayer.isPlaying) {
      audioPlayer.isPlaying = false;
      io.to(screenSocketId).emit("track-is-paused");
    }
    if (player.role === "player") {
      console.log(`${player.name} is ready to answer!`);
      if (!player.hasPressedReady) {
        player.hasPressedReady = true;
        usersReadyToAnswer.push(player);
        // io.to(user.socketId).emit("update-user-data", user);
        io.to(screenSocketId).emit(
          "update-users-ready-to-answer",
          usersReadyToAnswer,
        );
      } else {
        console.log(
          `${player.name} cannot pause anymore - hasPressedReady: ${player.hasPressedReady}`,
        );
      }
    }
  });

  // track can only be played by admin
  // so we need to send event to everyone but the sender
  socket.on("play-track", () => {
    audioPlayer.isPlaying = true;
    socket.broadcast.emit("track-is-playing", audioPlayer);
  });

  //broadcasted to everyone but screen
  socket.on("update-server-time", (currentTime) => {
    // console.log(`new time ${currentTime}`);
    audioPlayer.currentTime = currentTime;
    socket.broadcast.emit("update-client-time", audioPlayer.currentTime);
  });

  socket.on("request-show-artist", () => {
    io.to(screenSocketId).emit("show-artist");
  });

  socket.on("request-show-trackname", () => {
    io.to(screenSocketId).emit("show-trackname");
  });

  socket.on("request-show-poster", () => {
    io.to(screenSocketId).emit("show-poster");
  });

  // THESE ONLY SENT BY ADMIN
  socket.on("count-artist-answer-correct", (currentUserAnsweringToken) => {
    let user = users[currentUserAnsweringToken];
    user.points += 100;
    let players = playerTokenArray.map((token) => users[token]);
    socket.broadcast.emit("update-users-data-all-clients", players);
  });

  socket.on("count-artist-answer-wrong", (currentUserAnsweringToken) => {
    users[currentUserAnsweringToken].points -= 100;
    user.points -= 100;
    let players = playerTokenArray.map((token) => users[token]);
    socket.broadcast.emit("update-users-data-all-clients", players);
  });

  socket.on("count-song-answer-correct", (currentUserAnsweringToken) => {
    users[currentUserAnsweringToken].points += 200;
    user.points += 200;
    let players = playerTokenArray.map((token) => users[token]);
    socket.broadcast.emit("update-users-data-all-clients", players);
  });

  socket.on("count-song-answer-wrong", (currentUserAnsweringToken) => {
    users[currentUserAnsweringToken].points -= 200;
    user.points -= 200;
    let players = playerTokenArray.map((token) => users[token]);
    socket.broadcast.emit("update-users-data-all-clients", players);
  });

  // socket.on("play-pause-track", (user) => {
  //   console.log(`pressing play-pause, time: ${user.timePaused}`);
  //   socket.broadcast.emit("play-pause-track-confirm", {
  //     timePaused: user.timePaused,
  //   });
  // });

  // Запуск таймера
  // socket.on("start-timer", (data) => {
  //   io.to(data.gameId).emit("timer-start", data.duration);
  // });

  socket.on("disconnect", () => {
    console.log("Отключился:", socket.id);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Сервер запущен на порту 3000");
});
