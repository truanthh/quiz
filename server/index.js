import express from "express";
import { createServer } from "http";
import { Server as socketIo } from "socket.io";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarsDir = path.join(__dirname, "/public/avatars");

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
const tokens = new Map();

let admin = {};
let screen = {};

// ????
// const tokens = new Map();

let screenSocketId;
let adminSocketId;

const playersReadyToAnswer = [];
// const playerTokenArray = [];

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

const availableAvatars = new Set([1, 2, 3, 4, 5, 6, 7, 8]);

function generateAvatarNumber() {
  if (availableAvatars.size === 0) {
    console.log("no avatars available!");
    return;
  }

  const avatarNumber =
    Array.from(availableAvatars)[
      Math.floor(Math.random() * availableAvatars.size)
    ];

  availableAvatars.delete(avatarNumber);

  return avatarNumber;
}

// function getPlayers() {
//   if (users.length > 0) {
//     let bla = playerTokenArray.map((token) => users[token]);
//     console.log(bla[0]);
//     return bla;
//   }
//
//   return 0;
// }

// function setRoleGroupSocketIds(token) {
//   if (users[token].role === "screen") {
//     screenSocketId = users[token].socketId;
//   } else if (users[token].role === "admin") {
//     adminSocketId = users[token].socketId;
//   } else if (users[token].role === "player") {
//     playerTokenArray.push(token);
//     // updating cuz user joined. should probably move this logic
//     updatePlayersClient();
//   }
// }

function changeCurrentQuestionStateAndUpdateClient(state) {
  currentQuestion.state = state;
  [screenSocketId, ...getPlayers().map((player) => player.socketId)].forEach(
    (socketId) => {
      io.to(socketId).emit("question-state-changed", currentQuestion.state);
    },
  );
}

function getPlayers() {
  return Array.from(players.values());
}

function updatePlayersClient() {
  io.to(screenSocketId).emit("update-players-data", getPlayers());
  // console.log(`updated players screen with ${players[0]}s ome  data`);
}

function userReadyToAnswerAndUpdate(user) {
  user.hasPressedReady = true;
  playersReadyToAnswer.push(user);
  io.to(user.socketId).emit("you-are-ready");
  io.to(screenSocketId).emit(
    "update-users-ready-to-answer",
    playersReadyToAnswer,
  );
}

function resetPlayers() {
  const players = getPlayers();
  if (players === 0) {
    console.log("error getting players array!");
    return;
  }
  for (let player of players) {
    player.hasPressedReady = false;
  }
  playersReadyToAnswer.length = 0;
  io.to(players.map((player) => player.socketId)).emit("reset-players");
}

// Обработка подключений
io.on("connection", (socket) => {
  let token = socket.handshake.auth.token;
  console.log(`Подключился: socket: ${socket.id} token: ${token}`);
  let oldSocketId = tokens.get(token);

  if (token) {
    if (token === admin.token) {
      admin.socketId = socket.id;
      socket.emit("login-successful", admin);
    } else if (token === screen.token) {
      screen.socketId = socket.id;
      socket.emit("login-successful", screen);
    } else if (oldSocketId) {
      const playerOld = players.get(oldSocketId).player;
      players.delete(playerOld);
      const playerUpdated = players.set(socket.id, playerOld);
      // updatePlayersClient();
      console.log(`got user, logging in... `);
      socket.emit("login-successful", playerUpdated);
    } else {
      console.log("token is irrelevant, log in normally");
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
      tokens.set(newToken, socket.id);
      // updatePlayersClient();
      socket.emit("login-successful", player);
    } else if (payload.role === "admin") {
      // adminSocketId = payload.socket.id;
      const newAdmin = {
        socketId: socket.id,
        token: newToken,
        role: "admin",
      };
      admin = newAdmin;
      socket.emit("login-successful", admin);
    } else if (payload.role === "screen") {
      // screenSocketId = payload.socket.id;
      const newScreen = {
        socketId: socket.id,
        token: newToken,
        role: "screen",
      };
      screen = newScreen;
      socket.emit("login-successful", screen);
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

  socket.on("screen-loaded", (tracks) => {
    tracks.forEach((track) => {
      questions.push({ track, state: "" });
    });
    console.log("first question is: ");
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
  });

  // track can only be played by admin
  // so we need to send event to everyone but the sender
  socket.on("request-play-track", () => {
    if (currentQuestion.state === "") {
      changeCurrentQuestionStateAndUpdateClient("open");
    }
    io.to(screenSocketId).emit("play-track");
  });

  socket.on("request-pause-track", () => {
    if (
      currentQuestion.state === "open" ||
      currentQuestion.state === "pending"
    ) {
      changeCurrentQuestionStateAndUpdateClient("");
    }
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
    io.sockets.emit("change-current-question", currentQuestionId);
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
    io.sockets.emit("change-current-question", currentQuestionId);
  });

  socket.on("button-pressed-player", (sender) => {
    const user = users[sender.token];

    // question states - no state(empty string), open, countdown, pending, closed

    if (currentQuestion.state === "open" && !user.hasPressedReady) {
      userReadyToAnswerAndUpdate(user);
      // countdown is also a question state
      // pause track. count down.
      io.to(screenSocketId).emit("pause-track");
      changeCurrentQuestionStateAndUpdateClient("countdown");
      let seconds = 3;
      let id = setInterval(() => {
        seconds--;
        io.to([
          screenSocketId,
          getPlayers().map((player) => player.socketId),
        ]).emit("countdown", seconds);
        if (seconds === 0) {
          clearInterval(id);
          changeCurrentQuestionStateAndUpdateClient("pending");
        }
      }, 1000);
    } else if (currentQuestion.state === "countdown" && !user.hasPressedReady) {
      userReadyToAnswerAndUpdate(user);
    }
  });

  // THESE ONLY SENT BY ADMIN
  // socket.on("count-artist-answer-correct", (currentUserAnsweringToken) => {
  //   let user = users[currentUserAnsweringToken];
  //   user.points += 100;
  //   let players = playerTokenArray.map((token) => users[token]);
  //   socket.broadcast.emit("update-users-data-all-clients", players);
  // });
  //
  // socket.on("count-artist-answer-wrong", (currentUserAnsweringToken) => {
  //   users[currentUserAnsweringToken].points -= 100;
  //   user.points -= 100;
  //   let players = playerTokenArray.map((token) => users[token]);
  //   socket.broadcast.emit("update-users-data-all-clients", players);
  // });
  //
  // socket.on("count-song-answer-correct", (currentUserAnsweringToken) => {
  //   users[currentUserAnsweringToken].points += 200;
  //   user.points += 200;
  //   let players = playerTokenArray.map((token) => users[token]);
  //   socket.broadcast.emit("update-users-data-all-clients", players);
  // });
  //
  // socket.on("count-song-answer-wrong", (currentUserAnsweringToken) => {
  //   users[currentUserAnsweringToken].points -= 200;
  //   user.points -= 200;
  //   let players = playerTokenArray.map((token) => users[token]);
  //   socket.broadcast.emit("update-users-data-all-clients", players);
  // });

  socket.on("disconnect", () => {
    console.log("Отключился:", socket.id);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Сервер запущен на порту 3000");
});
