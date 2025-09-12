import express from "express";
import { createServer } from "http";
import { Server as socketIo } from "socket.io";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const id = uuidv4();

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

// Обработка подключений
io.on("connection", (socket) => {
  console.log("Подключился:", socket.id);

  socket.emit("connection-established", {
    message: "Подключение успешно",
    clientId: socket.id,
    connectedAt: new Date().toLocaleString(),
  });

  // Присоединение к игре
  // socket.on("join-game", (data) => {
  //   socket.join(data.gameId);
  //   socket.to(data.gameId).emit("player-joined", data.playerName);
  // });

  socket.on("pause-track", (data) => {
    // if(data.playerName = )
    socket.broadcast.emit("pause-track-confirm");
  });

  // Отправка ответа
  socket.on("send-msg", (data) => {
    // Сохраняем ответ и рассылаем остальным
    console.log(`${data.timestamp}: ${data.msg}`);
    // io.to(data.gameId).emit("new-answer", {
    //   player: data.playerName,
    //   answer: data.answer,
    // });
  });

  socket.on("login", (data) => {
    socket.emit("login-successful", { id: id, playerName: data.playerName });
  });

  // Запуск таймера
  socket.on("start-timer", (data) => {
    io.to(data.gameId).emit("timer-start", data.duration);
  });

  socket.on("disconnect", () => {
    console.log("Отключился:", socket.id);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Сервер запущен на порту 3000");
});
