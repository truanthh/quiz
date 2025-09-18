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

// Middleware
app.use(cors());
app.use(express.json());
// app.use(express.static("public"));

const user = { socketId: "", connectedAt: "" };
const users = {};
const usersReadyToAnswer = [];

// audioPlayer state
const audioPlayer = {
  isPlaying: false,
  currentTrackIndex: 0,
  duration: 0,
  currentTime: 0,
  volume: 2.0,
  tracks: [],
};

let screenSocketId;
let adminSocketId;
let playersSocketIds = [];

function setRoleGroupSocketIds(token) {
  if (users[token].role === "screen") {
    screenSocketId = users[token].socketId;
  } else if (users[token].role === "admin") {
    adminSocketId = users[token].socketId;
  } else if (users[token].role === "player") {
    playersSocketIds.push(users[token].socketId);
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

  // track can only be paused by player or admin
  // added admin condition just in case
  socket.on("pause-track", (user) => {
    console.log(`track is paused by ${user.role}`);
    audioPlayer.isPlaying = false;
    if (user.role === "player") {
      socket
        .to([screenSocketId, adminSocketId])
        .emit("track-is-paused-by-player", audioPlayer);
    } else if (user.role === "admin") {
      socket.broadcast.emit("track-is-paused-by-admin", audioPlayer);
    }
  });

  // if track is being played, either screen sent it, or admin,
  // players can not set track to play
  // so we need to send event to everyone but the sender
  socket.on("play-track", (user) => {
    console.log(`track is set to play by ${user.role}`);
    audioPlayer.isPlaying = true;
    socket.broadcast.emit("track-is-playing", audioPlayer);
  });

  //broadcasted to everyone but screen
  socket.on("update-server-time", (currentTime) => {
    console.log(`new time ${currentTime}`);
    audioPlayer.currentTime = currentTime;
    socket.broadcast.emit("update-client-time", audioPlayer.currentTime);
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
