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

const user = {
  socketId: "",
  connectedAt: "",
  // isAllowedToPause: true,
  points: 0,
};
const users = {};
const usersReadyToAnswer = [];

const tracks = [];
let currentQuestionId = 0;
let currentQuestion;

let screenSocketId;
let adminSocketId;
let playerTokenArray = [];

// audioPlayer state
const audioPlayer = {
  isPlaying: false,
  currentTrackIndex: 0,
  duration: 0,
  currentTime: 0,
  volume: 2.0,
  tracks: [],
};

function setRoleGroupSocketIds(token) {
  if (users[token].role === "screen") {
    screenSocketId = users[token].socketId;
  } else if (users[token].role === "admin") {
    adminSocketId = users[token].socketId;
    // users[token].isAllowedToPause = true;
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
      // users[token].isAllowedToPause = true;
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
    // users[token].isAllowedToPause = true;
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

  socket.on("admin-loaded", (adminToken) => {
    console.log(users[adminToken].socketId);
    console.log(currentQuestion);
    io.to(users[adminToken].socketId).emit("bla", currentQuestion);
  });

  socket.on("set-first-question", (trackData) => {
    console.log(
      `setting server track to ${trackData.artist},${trackData.name}`,
    );
    currentQuestion = trackData;
    socket.to(adminSocketId).emit("update-admin-track-data", trackData);
    // for (let user in users) {
    //   user.isAllowedToPause = true;
    // }
  });

  socket.on("next-question", (trackData) => {
    currentQuestion = trackData;
    socket.to(adminSocketId).emit("update-admin-track-data", trackData);
    // for (let user in users) {
    // user.isAllowedToPause = true;
    // }
  });

  socket.on("prev-question", (trackData) => {
    currentQuestion = trackData;
    socket.to(adminSocketId).emit("update-admin-track-data", trackData);
    // for (let user in users) {
    //   user.isAllowedToPause = true;
    // }
  });

  // track can only be paused by player or admin
  // added admin condition just in case
  socket.on("pause-track", (user) => {
    console.log(`${user.name} is trying to pause! (${user.role})`);
    // if (user.isAllowedToPause) {
    audioPlayer.isPlaying = false;
    if (user.role === "player") {
      // user.isAllowedToPause = false;
      usersReadyToAnswer.push(user);
      socket
        .to([screenSocketId, adminSocketId])
        .emit("track-is-paused-by-player", audioPlayer);
      // updating users data on all clients, maybe change this later
      let players = playerTokenArray.map((token) => users[token]);
      socket.broadcast.emit("update-users-data-all-clients", players);
    } else if (user.role === "admin") {
      socket.broadcast.emit("track-is-paused-by-admin", audioPlayer);
    }
    // }
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
    // console.log(`new time ${currentTime}`);
    audioPlayer.currentTime = currentTime;
    socket.broadcast.emit("update-client-time", audioPlayer.currentTime);
  });

  socket.on("request-show-artist-answer", () => {
    socket.to(screenSocketId).emit("show-artist-answer");
  });

  socket.on("request-show-trackname-answer", () => {
    socket.to(screenSocketId).emit("show-trackname-answer");
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
