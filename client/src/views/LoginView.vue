<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { mainStore } from "../stores/mainStore";

const router = useRouter();
const password = ref("");
const error = ref("");
const store = mainStore();

const handleLogin = () => {
  if (password.value === "player") {
    store.isAuth = true;
    router.push("/player");
  } else if (password.value === "screen") {
    store.isAuth = true;
    router.push("/screen");
  } else if (password.value === "admin") {
    store.isAuth = true;
    router.push("/admin");
  } else {
    error.value = "Неверный пароль";
  }
};
</script>
<template>
  <div class="login">
    <h1>Подключиться к викторине</h1>
    <input
      @keyup.enter="handleLogin"
      v-model="password"
      placeholder="Введите пароль"
      type="password"
    />
    <button @click="handleLogin">Войти</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
