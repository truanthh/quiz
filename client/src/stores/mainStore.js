import { ref, reactive } from "vue";
import { defineStore } from "pinia";
import { io } from "socket.io-client";
import tracksData from "../../tracks.json";

export const mainStore = defineStore("mainStore", () => {
  const socket = ref(null);
  const connectionInfo = ref({});
  const user = ref({});
  const users = ref([]);
  const players = ref([]);
  const isAuth = ref(false);

  const playersReadyToAnswer = ref([
    { name: "blank", hasPressedReady: false, avatar: undefined },
  ]);

  const receivedAudioPlayerState = reactive({
    tracks: "tracks",
    currentTrack: "currentTrack",
    currentTrackIndex: 0,
    isPlaying: false,
    currentTimeSeconds: 0,
    currentTimeString: "00:00",
  });

  // presumably only connection stuff here
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

    socket.value.on("update-players", (data) => {
      players.value = data;
    });

    socket.value.on("update-user-data", (user) => {
      user.value = user;
    });

    socket.value.on("update-audioplayer-client-state", (newState) => {
      receivedAudioPlayerState.tracks = newState.tracks;
      receivedAudioPlayerState.currentTrack = newState.currentTrack;
      receivedAudioPlayerState.currentTimeString = newState.currentTimeString;
    });

    socket.value.on("update-players-ready-to-answer", (players) => {
      playersReadyToAnswer.value = players;
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
    const data = { ...payload, tracksData };
    socket.value.emit("login", data);
  };

  // const isQuestionActive = ref(false);
  return {
    login,
    socket,
    initSocket,
    isAuth,
    connectionInfo,
    user,
    users,
    players,
    playersReadyToAnswer,
    waitForLogin,
    receivedAudioPlayerState,
  };
});
