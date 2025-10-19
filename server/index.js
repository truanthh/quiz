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
const playersReadyToAnswer = [];

let screenSocketId;
let adminSocketId;
const playerTokenArray = [];

const questions = [];
let currentQuestionId = 0;
let currentQuestion = {};

// audioPlayer state
const audioPlayer = {
  tracks: "",
  currentTrack: "",
  isPlaying: false,
  currentTime: 0,
};

function getPlayers() {
  if (playerTokenArray.length > 0) {
    let bla = playerTokenArray.map(token => users[token]);
    console.log(bla[0]);
    return bla;
  }

  return 0;
}

function resetPlayers() {
  const players = getPlayers();
  if(players === 0){
    console.log("error getting players array!")
    return;
  }
  for (let player of players) {
    player.hasPressedReady = false;
  }
  playersReadyToAnswer.length = 0;
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
    if(payload.role === "player"){
      users[token].hasPressedReady = false;
    }
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
    tracks.forEach((track) => {
      track.state = "";
      questions.push(track);
    });
    console.log(questions[0]);
    currentQuestion = questions[currentQuestionId];
    if (questions.length !== 0) {
      console.log("questions loaded successfully!");
    }
  });

  socket.on("admin-loaded", () => {
    resetPlayers();
    io.to(adminSocketId).emit("update-admin-track-data", currentQuestion);
  });

  // this presumably only sent by screen
  // and needs to be sent to everyone else to update clients
  socket.on("audioplayer-state-change", (newState) => {
    // audioPlayer.tracks = newState.tracks;
    audioPlayer.currentTrack = newState.currentTrack;
    audioPlayer.isPlaying = newState.isPlaying;
    audioPlayer.currentTime = newState.currentTimeSeconds;
    socket.broadcast.emit("update-audioplayer-client-state", audioPlayer);
    // console.log(audioPlayer.currentTime);
    // socket.broadcast.emit("update-client-time", audioPlayer.currentTimeSeconds);
  })

  // track can only be played by admin
  // so we need to send event to everyone but the sender
  socket.on("request-play-track", () => {
    currentQuestion.state = "open";
    io.to(screenSocketId).emit("play-track");
  });

  socket.on("request-pause-track", () => {
    io.to(screenSocketId).emit("pause-track");
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

  socket.on("next-question", (trackData) => {
    if (currentQuestionId === questions.length - 1) {
      return;
    }
    resetPlayers();
    io.to(screenSocketId).emit(
      "update-users-ready-to-answer",
      playersReadyToAnswer,
    );
    currentQuestionId++;
    currentQuestion = questions[currentQuestionId];
    io.sockets.emit("update-question", currentQuestionId);
  });

  socket.on("prev-question", (trackData) => {
    if (currentQuestionId === 0) {
      return;
    }
    resetPlayers();
    io.to(screenSocketId).emit(
      "update-users-ready-to-answer",
      playersReadyToAnswer,
    );
    currentQuestionId--;
    currentQuestion = questions[currentQuestionId];
    io.sockets.emit("update-question", currentQuestionId);
  });

  socket.on("button-pressed-player", (sender) => {
    const user = users[sender.token];
    if (!user.hasPressedReady && currentQuestion.state === "open") {
      user.hasPressedReady = true;
      setTimeout(() => {
        io.to(screenSocketId).emit("pause-track");
        currentQuestion.state = "pending";
        [
          // screenSocketId,
          ...playerTokenArray.map((token) => users[token].socketId),
        ].forEach((socket) => {
          io.to(socket).emit("question-state-changed", currentQuestion.state);
        });
      }, 3000);
      playersReadyToAnswer.push(user);
      io.to(screenSocketId).emit(
        "update-users-ready-to-answer",
        playersReadyToAnswer,
      );
    }
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

  socket.on("disconnect", () => {
    console.log("Отключился:", socket.id);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Сервер запущен на порту 3000");
});
