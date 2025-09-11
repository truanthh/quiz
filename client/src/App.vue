<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import LoginView from "@/views/LoginView.vue";

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
  socket.value = io(import.meta.env.VITE_SERVER_ADDRESS);

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
  <router-view></router-view>
</template>

<style lang="scss">
@use "./styles/global.scss";

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialised;
  -moz-osx-font-smoothing: grayscale;
}
.content {
  // width: 100%;
  max-width: 1700px;
  margin-left: calc(300px + 50px);
  // margin-right: 300px;
  padding: 30px;
  transition: 0.2s;
  overflow-y: auto;
  &_full {
    margin-left: 100px;
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
}
</style>
