import { ref } from "vue";
import { defineStore } from "pinia";
import { io } from "socket.io-client";
import { useAudioPlayerStore } from "./useAudioPlayerStore.js";

export const mainStore = defineStore("mainStore", () => {
  const audioPlayer = useAudioPlayerStore();
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
      console.log("pausing track is confirmed!");
      audioPlayer.playPause();
    });
  };

  const login = (playerName) => {
    socket.value.emit("login", { playerName: playerName });
  };

  const pauseTrack = (playerName) => {
    socket.value.emit("pause-track", { playerName: playerName });
  };

  const debug = (el) => {};

  return {
    socket,
    initSocket,
    login,
    isAuth,
    connectionInfo,
    playerInfo,
    debug,
    pauseTrack,
  };
});
