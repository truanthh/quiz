<script setup>
import { ref, onBeforeMount, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { mainStore } from "../stores/mainStore";
import { io } from "socket.io-client";

const router = useRouter();
const store = mainStore();

const userName = ref("");
const role = ref("player");
// const password = ref("");
const error = ref("");
const error2 = ref("");

const isAdmin = computed(() => {
  return role.value !== "player";
});

onMounted(async () => {
  await store.waitForLogin();
  if (store.isAuth) {
    router.push(`/${store.user.role}`);
  }
});

// watch(store.isAuth, (isAuthenticated) => {
//   if (isAuthenticated) {
//     router.replace(`/${store.user.role}`);
//     error2.value = store.user;
//   }
// });

const handleLogin = async () => {
  const notValidMsg = "Придумайте никнейм получше";

  if (!isLoginDataValid(userName)) {
    error.value = notValidMsg;
    return;
  }

  store.login({ userName: userName.value, role: role.value });

  await store.waitForLogin();

  if (store.isAuth) {
    router.push(`/${store.user.role}`);
  }
};

const userRolePinia = ref("NOROLE");

function isLoginDataValid(userName) {
  // uncomment on prod
  if (userName.length < 2 || userName.length > 10) return false;

  return true;
}
</script>
<template>
  <div class="login__container">
    <div class="login__form">
      <h1>Home quiz</h1>
      <p class="error">is auth? {{ store.isAuth }}</p>
      <p class="error">user role pinia? {{ userRolePinia }}</p>
      <button @click="handleDebug">debug</button>
      <select class="login__form__input" v-model="role" id="roleSelect">
        <option value="player" selected>player</option>
        <option value="screen">screen</option>
        <option value="admin">admin</option>
      </select>
      <input
        class="login__form__input"
        v-model="userName"
        placeholder="Никнейм"
        type="text"
        :disabled="isAdmin"
      />
      <!-- <input -->
      <!--   class="login__form__input" -->
      <!--   @keyup.enter="handleLogin(userName, password)" -->
      <!--   v-model="password" -->
      <!--   placeholder="Пароль" -->
      <!--   type="password" -->
      <!-- /> -->
      <button class="elegant-btn-minimal" @click="handleLogin">Войти</button>
      <div class="debugInfo">{{ store.connectionInfo.message }}</div>
      <div class="debugInfo">{{ store.connectionInfo.connectedAt }}</div>
      <div class="debugInfo">{{ store.user.socketId }}</div>
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
