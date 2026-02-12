import { ref, reactive } from "vue";
import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const mainStore = defineStore("mainStore", () => {
  const isMobile = ref(
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ),
  );

  const socket = ref(null);
  const isAuth = ref(false);

  const player = ref({ isReady: false });

  // all connected players
  const players = ref(false);

  const lobby = ref(null);

  // THIS DATA IS ONLY FOR DISPLAY
  const gameState = reactive({});

  const initSocket = () => {
    socket.value = io(import.meta.env.VITE_SERVER_ADDRESS, {
      auth: { token: localStorage.getItem("token"), role: player.value.role },
    });

    socket.value.on("update-client-players", (data) => {
      players.value = [...data];
    });

    socket.value.on("update-lobby", (data) => {
      lobby.value = { ...data };
    });

    socket.value.on("update-client-player-state", (state) => {
      player.value = { ...state };
    });

    socket.value.on("update-client-game-state", (state) => {
      gameState = { ...state };
    });
  };

  function waitForLogin() {
    return new Promise((res, rej) => {
      const timer = setTimeout(() => {
        rej(new Error("login timeout"));
      }, 5000);

      const handleLogin = (payload) => {
        // console.log(payload.audioPlayer);
        clearTimeout(timer);
        localStorage.setItem("token", payload.token);
        player.value = { ...payload };
        isAuth.value = true;
        res();
      };

      socket.value.once("login-successful", handleLogin);
    });
  }

  const login = (payload) => {
    socket.value.emit("login", payload);
  };

  // const isQuestionActive = ref(false);
  return {
    // data
    gameState,
    player,
    players,
    lobby,

    // socket
    socket,
    initSocket,

    // auth
    login,
    waitForLogin,
    isAuth,

    // misc
    isMobile,
  };
});
