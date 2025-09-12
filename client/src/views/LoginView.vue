<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { mainStore } from "../stores/mainStore";
import { io } from "socket.io-client";

const router = useRouter();
const store = mainStore();

const playerName = ref("screen");
const password = ref("screen");
// const error = ref("");

// const handleLogin(playerName, password){
//
// }
const handleLogin = (playerName, password) => {
  const notValidMsg = "Неверный логин/пароль";

  if (!isLoginDataValid(playerName, password)) {
    error.value = notValidMsg;
    return;
  }

  if (password === "player") {
    store.login(playerName);
    store.isAuth = true;
    router.push("/player");
  } else if (playerName === "screen" && password === "screen") {
    store.isAuth = true;
    router.push("/screen");
    // } else if (password.value === "admin") {
  } else if (playerName === "" && password === "") {
    store.isAuth = true;
    router.push("/admin");
  } else {
    error.value = notValidMsg;
  }
};

function isLoginDataValid(playerName, password) {
  // uncomment on prod
  if (playerName.length < 2 || playerName.length > 10) return false;

  return true;
}
</script>
<template>
  <div class="login__container">
    <div class="login__form">
      <h1>Home quiz</h1>
      <input
        class="login__form__input"
        v-model="playerName"
        placeholder="Никнейм"
        type="text"
      />
      <input
        class="login__form__input"
        @keyup.enter="handleLogin(playerName, password)"
        v-model="password"
        placeholder="Пароль"
        type="password"
      />
      <button
        class="elegant-btn-minimal"
        @click="handleLogin(playerName, password)"
      >
        Войти
      </button>
      <!-- <p v-if="error" class="error">{{ error }}</p> -->
      <div class="debugInfo">{{ store.connectionInfo.message }}</div>
      <div class="debugInfo">{{ store.connectionInfo.clientId }}</div>
      <div class="debugInfo">{{ store.connectionInfo.connectedAt }}</div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.error {
  color: red;
}
.login {
  &__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  &__form {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 250px;
    gap: 8px;
    &__input {
      width: 100%;
      height: 40px;
      border: 1px solid #000000;
      border-radius: 6px;
      outline: none;
      padding-left: 8px;
      &:focus {
        border: 2px solid #2c3e50;
      }
    }
  }
}
h1 {
  font-weight: bold;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 20px;
}
.elegant-btn-minimal {
  width: 100%;
  padding: 14px 28px;
  background: transparent;
  color: #2c3e50;
  border: 2px solid #2c3e50;
  border-radius: 6px;
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
}

.elegant-btn-minimal:hover {
  background: #2c3e50;
  color: white;
  transform: translateY(-1px);
}

.elegant-btn-minimal:active {
  transform: translateY(0);
}
</style>
