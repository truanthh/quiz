import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const mainStore = defineStore("mainStore", () => {
  const socket = ref(null);

  // const connectionStatus = ref("Не подключено");
  const connectionInfo = ref({});

  const isAuth = ref(false);

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
  };

  // const handleLogin = (playerName, password) => {
  //   const notValidMsg = "Неверный логин/пароль";
  //
  //   if (!isLoginDataValid(playerName, password)) {
  //     error.value = notValidMsg;
  //     return;
  //   }
  //
  //   if (password === "player") {
  //     store.isAuth = true;
  //     router.push("/player");
  //   } else if (password === "screen") {
  //     store.isAuth = true;
  //     router.push("/screen");
  //     // } else if (password.value === "admin") {
  //   } else if (password === "") {
  //     store.isAuth = true;
  //     router.push("/admin");
  //   } else {
  //     error.value = notValidMsg;
  //   }
  // };
  //
  // function isLoginDataValid(playerName, password) {
  //   // uncomment on prod
  //   // if (playerName.length < 2) return false;
  //
  //   return true;
  // }

  return { socket, initSocket, connectionInfo, isAuth };
});
