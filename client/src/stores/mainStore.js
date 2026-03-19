import { ref, reactive, computed } from "vue";
import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const mainStore = defineStore("mainStore", () => {
  const isMobile = ref(
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ),
  );

  // login info
  const socket = ref(null);
  const isAuth = ref(false);

  // all players on the server
  const players = ref(false);

  // this player
  const player = ref({ isReady: false });

  // this player's gamesession
  // let gameSession = reactive({});
  const gameSession = ref({});

  const initSocket = () => {
    socket.value = io(import.meta.env.VITE_SERVER_ADDRESS, {
      auth: { token: localStorage.getItem("token"), role: player.value.role },
    });

    socket.value.on("player-updated", (playerData) => {
      player.value = { ...playerData };
    });

    socket.value.on("gamesession-updated", (gameSessionState) => {
      // console.log(gameSessionState);
      gameSession.value = { ...gameSessionState };
    });

    socket.value.on("players-updated", (playersData) => {
      players.value = [...playersData];
    });
  };

  function waitForLogin() {
    return new Promise((res, rej) => {
      const timer = setTimeout(() => {
        rej(new Error("login timeout"));
      }, 3000);

      const handleLogin = (payload) => {
        // console.log(payload.audioPlayer);
        clearTimeout(timer);
        localStorage.setItem("token", payload.token);
        player.value = { ...payload };
        isAuth.value = true;

        // if (resolvePlayerData) {
        //   resolvePlayerData(payload);
        //   resolvePlayerData = null;
        // }
        res();
      };

      socket.value.once("login-success", handleLogin);
    });
  }

  const login = (payload) => {
    socket.value.emit("login", payload);
  };

  // const isQuestionActive = ref(false);
  return {
    // data
    gameSession,
    player,

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
