<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import LoginView from "/views/LoginView";

const msg = ref("");
// const socket = inject('socket');

const status = ref("Не подключено");
const socket = ref(null);

const connectionInfo = ref(null);

function handleClick() {
  if (socket.value && socket.value.connected) {
    socket.value.emit("send-msg", {
      msg: msg.value,
      timestamp: new Date().toLocaleTimeString(),
    });
    console.log("Сообщение отправлено");
  } else {
    console.log("Нет подключения к серверу");
  }
  msg.value = "";
}

onMounted(() => {
  socket.value = io(VITE_SERVER_ADDRESS);

  socket.value.on("connect", () => {
    status.value = "Подключено к серверу";
    console.log("Подключено к серверу");
  });

  socket.value.on("disconnect", () => {
    status.value = "Отключено от сервера";
    console.log("Отключено от сервера");
  });

  socket.value.on("connection-established", (data) => {
    connectionInfo.value = data;
  });
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});
</script>

<template>
  <LoginView v-if="mainStore.isAuth()" />
</template>

<style scoped>
.app {
  text-align: center;
  padding: 20px;
  font-family: Arial, sans-serif;
}
button {
  padding: 15px 30px;
  font-size: 18px;
  margin: 10px;
  cursor: pointer;
}
.connectionInfo {
  font-size: 16px;
  font-weight: bold;
}
</style>
