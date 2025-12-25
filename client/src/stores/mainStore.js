import { ref, reactive } from "vue";
import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const mainStore = defineStore("mainStore", () => {
  const isMobile = ref(
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ),
  );
  const connectionInfo = ref({});

  const socket = ref(null);
  const user = ref({});
  const isAuth = ref(false);

  const players = ref(false);

  // THIS DATA IS ONLY FOR DISPLAY
  const gameState = reactive({
    questions: [],
    currentQuestion: {},
    currentQuestionId: 0,
    players: [
      { name: "blankplayer1", hasPressedReady: false, avatar: 0, points: 1 },
      { name: "blankplayer2", hasPressedReady: false, avatar: 0, points: 0 },
    ],
    playerTokens: [],
    playersReadyToAnswer: [
      { name: "blankstore", hasPressedReady: false, avatar: 0 },
    ],
    selectedPlayerId: 0,
    audioPlayer: {
      currentTrack: { posterImg: "", artist: "", name: "" },
      currentTrackId: 0,
      isPlaying: false,
      currentTimeSeconds: 0,
      currentTimeString: "00:00",
    },
  });

  const initSocket = () => {
    socket.value = io(import.meta.env.VITE_SERVER_ADDRESS, {
      auth: { token: localStorage.getItem("token"), role: user.value.role },
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

    socket.value.on("update-client-players", (data) => {
      players.value = data;
    });

    socket.value.on("update-client-game-state", (newState) => {
      // AP
      gameState.audioPlayer.currentTrack = newState.audioPlayer.currentTrack;
      gameState.audioPlayer.currentTimeSeconds =
        newState.audioPlayer.currentTimeSeconds;
      gameState.audioPlayer.currentTimeString =
        newState.audioPlayer.currentTimeString;

      // questions
      gameState.questions = newState.questions;
      gameState.currentQuestion = newState.currentQuestion;

      // players
      gameState.players = newState.players;
      gameState.playerTokens = newState.playerTokens;
      gameState.playersReadyToAnswer = newState.playersReadyToAnswer;
      gameState.selectedPlayerId = newState.selectedPlayerId;
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
        user.value.token = payload.token;
        localStorage.setItem("token", payload.token);
        user.value.name = payload.name;
        user.value.role = payload.role;
        isAuth.value = true;
        res();
      };

      socket.value.once("login-successful", handleLogin);
    });
  }

  const login = (payload) => {
    // const data = { ...payload, tracksData };
    socket.value.emit("login", payload);
  };

  // const isQuestionActive = ref(false);
  return {
    isMobile,
    connectionInfo,
    login,
    waitForLogin,
    isAuth,
    user,
    socket,
    initSocket,
    gameState,
    // players,
  };
});
