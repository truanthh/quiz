import { ref, watch } from "vue";
import { defineStore } from "pinia";
import { io } from "socket.io-client";
import { useAudioPlayerStore } from "./useAudioPlayerStore.js";

export const mainStore = defineStore("mainStore", () => {
  const socket = ref(null);
  const connectionInfo = ref({});
  const user = ref({});
  const isAuth = ref(false);

  const audioPlayer = useAudioPlayerStore();

  // presumably only connection stuff here
  const initSocket = () => {
    socket.value = io(import.meta.env.VITE_SERVER_ADDRESS, {
      auth: { token: localStorage.getItem("token") },
    });

    socket.value.on("connection-established", (data) => {
      connectionInfo.value = data;
    });

    socket.value.on("connect", (data) => {
      connectionInfo.value = data;
    });

    socket.value.on("disconnect", () => {
      connectionInfo.value.status = "Отключено от сервера";
    });

    // socket.value.on("login-successful", waitForLogin);

    // socket.value.on("update-player-state", (state) => {
    //   audioPlayer.isPlaying = state.isPlaying;
    //   audioPlayer.currentTime = state.currentTime;
    // });
  };

  function waitForLogin() {
    return new Promise((res, rej) => {
      const timer = setTimeout(() => {
        rej(new Error("login timeout"));
      }, 5000);

      const eventHandler = (payload) => {
        clearTimeout(timer);
        user.value.token = payload.token;
        localStorage.setItem("token", payload.token);
        user.value.name = payload.name;
        user.value.role = payload.role;
        isAuth.value = true;
        res();
      };

      socket.value.once("login-successful", eventHandler);
    });
  }

  const login = (payload) => {
    socket.value.emit("login", payload);
  };

  const pauseTrack = () => {
    // if (!isReadyToAnswer.value) {
    //   isReadyToAnswer.value = true;
    socket.value.emit("pause-track", user.value);
    // }
    audioPlayer.pause();
  };

  const isQuestionActive = ref(false);

  const isReadyToAnswer = ref(false);
  const debug = (el) => {};

  return {
    login,
    socket,
    initSocket,
    isAuth,
    connectionInfo,
    user,
    debug,
    pauseTrack,
    waitForLogin,
  };
});
