<script setup>
import { ref, onBeforeMount, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { mainStore } from "../stores/mainStore";

const router = useRouter();

const store = mainStore();
const userName = ref("");
const role = ref("player");

const isAdmin = computed(() => {
  return role.value !== "player";
});

onMounted(async () => {
  await store.waitForLogin();
  if (store.isAuth) {
    router.push(`/main`);
  }
});

const handleLogin = async () => {
  const notValidMsg = "Придумайте никнейм получше";

  if (role.value === "player" && !isLoginDataValid(userName.value)) {
    error.value = notValidMsg;
    return;
  }

  store.login({ userName: userName.value, role: role.value });

  await store.waitForLogin();

  if (store.isAuth) {
    router.push(`/main`);
  }
};

function isLoginDataValid(userName) {
  if (userName.length > 10) return false;
  if (userName.length < 2) return false;
  if (userName === "" || userName === "screen") return false;

  return true;
}
</script>
<template>
  <div class="login__container">
    <span class="error">{{ store.isAuth }} </span>
    
    <div class="login__form">
      <h1>Аудиоквиз</h1>
      <!-- <button @click="">debug</button> -->
      <input
        class="login__form__input"
        v-model="userName"
        placeholder="Никнейм"
        type="text"
        :disabled="isAdmin"
      />
      <button class="elegant-btn-minimal" @click="handleLogin">Войти</button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.error {
  color: red;
}
.login {
  &__container {
    margin-top: 100px;
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
