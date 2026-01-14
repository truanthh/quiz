// index.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { SocketHandler } from "./ws/SocketHandler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// Инициализация Socket.io
const socketHandler = new SocketHandler(io);
io.on("connection", (socket) => {
  socketHandler.handleConnection(socket);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT as number, HOST, () => {
  console.log(`🚀 Сервер запущен на ${HOST}:${PORT}`);
  console.log(`📡 WebSocket подключения активны`);
});

// Обработка graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔄 Получен SIGTERM, завершаем работу...");
  server.close(() => {
    console.log("👋 Сервер остановлен");
    process.exit(0);
  });
});
