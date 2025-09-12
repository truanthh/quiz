import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const mainStore = defineStore("mainStore", () => {
  const socket = ref(null);

  const connectionInfo = ref({});
  // const connectionStatus = ref("Не подключено");

  const isAuth = ref(false);
  const playerInfo = ref({});

  const initSocket = () => {
    socket.value = io(import.meta.env.VITE_SERVER_ADDRESS);

    socket.value.on("connection-established", (data) => {
      connectionInfo.value = data;
    });

    socket.value.on("connect", () => {
      console.log("Подключено к серверу");
    });

    socket.value.on("disconnect", () => {
      connectionInfo.value.status = "Отключено от сервера";
      console.log("Отключено от сервера");
    });

    socket.value.on("login-successful", (data) => {
      // console.log("login success");
      playerInfo.value.id = data.id;
      playerInfo.value.playerName = data.playerName;
    });

    socket.value.on("pause-track-confirm", () => {
      pauseTrack();
    });
  };

  const login = (playerName) => {
    socket.value.emit("login", { playerName: playerName });
  };

  const pauseTrack = () => {
    console.log("pausing track!");
  };

  return { socket, initSocket, login, isAuth, connectionInfo, playerInfo };
});
