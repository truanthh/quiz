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

// Обработка подключений
io.on("connection", (socket) => {
  let token = socket.handshake.auth.token;
  console.log(`Подключился: socket: ${socket.id} token: ${token}`);

  if (token) {
    if (users[token]) {
      users[token].socketId = socket.id;
      if (users[token].role === "screen") {
        screenSocketId = socket.id;
      }
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
    if (payload.role === "screen") {
      screenSocketId = socket.id;
    }
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

  socket.on("pause-track", (user) => {
    // audioPlayer.isPlaying = false;
    // socket.to(screenSocketId).emit("pause-track-confirm");
    // const usersArray = Object.entries(users).map(([key, value]) => ({
    //   id: key,
    //   ...value
    // }));
    // const bla = usersArray.filter((user) => user.role === "player" && user.socketId !== screenSocketId).map((user) => user.socketId);
    // console.log(bla)
    // socket.to(bla)
    //   .emit("update-player-state", audioPlayer);
    // usersReadyToAnswer.push(user);
  });

  socket.on("play-track", (user) => {
    audioPlayer.isPlaying = true;
    socket.to(screenSocketId).emit("play-track-confirm");
    console.log("player is now playing!");
    // const usersArray = Object.entries(users).map(([key, value]) => ({
    //   id: key,
    //   ...value
    // }));
    // const bla = usersArray.filter((user) => user.role === "player" && user.socketId !== screenSocketId).map((user) => user.socketId);
    // console.log(bla)
    // socket.to(bla)
    //   .emit("update-player-state", audioPlayer);
    // usersReadyToAnswer.push(user);
  });

  socket.on("update-server-time", (currentTime) => {
    console.log(`new time ${currentTime}`);
    audioPlayer.currentTime = currentTime;
    //broadcasted to everyone but screen
    socket.broadcast.emit("update-client-time", currentTime);
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
