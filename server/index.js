const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Раздаем статические файлы
app.use(express.static('public'));

// Запускаем сервер на порту 3000
server.listen(3000, '0.0.0.0', () => { // '0.0.0.0' - слушаем все интерфейсы
  console.log('Сервер запущен!');
  console.log('Подключайтесь по адресу: http://ВАШ_IP:3000');
});

io.on('connection', (socket) => {
    console.log('Новый пользователь подключился:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Пользователь отключился:', socket.id);
    });
});
