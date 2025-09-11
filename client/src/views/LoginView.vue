<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { mainStore } from "../stores/mainStore";

const router = useRouter();
const store = mainStore();

const nickname = ref("");
const password = ref("");
const error = ref("");

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
  <div class="login__container">
    <h1>Home quiz</h1>
    <input></input>
  </div>
</template>
<style scoped>
.login__container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
h1 {
  font-weight: bold;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 20px;
}
</style>
