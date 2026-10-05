<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { ApiError, api } from "../lib/api";

const router = useRouter();
const mode = ref<"login" | "register">("login");
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

async function submit() {
  error.value = "";
  busy.value = true;
  try {
    if (mode.value === "login") {
      await api.login(email.value, password.value);
    } else {
      await api.register(email.value, password.value);
    }
    router.push("/");
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "something went wrong";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="wrap">
    <h1>Guess the Melody — host login</h1>
    <form @submit.prevent="submit">
      <label>
        Email
        <input v-model="email" type="email" required />
      </label>
      <label>
        Password (min 8 chars)
        <input v-model="password" type="password" minlength="8" required />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="busy">
        {{ mode === "login" ? "Log in" : "Register" }}
      </button>
    </form>
    <button class="link" @click="mode = mode === 'login' ? 'register' : 'login'">
      {{ mode === "login" ? "Need an account? Register" : "Have an account? Log in" }}
    </button>
    <RouterLink class="link" to="/play">Join as a player instead →</RouterLink>
  </main>
</template>

<style scoped>
.wrap {
  max-width: 360px;
  margin: 10vh auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}
input {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #262838;
  color: inherit;
}
button {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: #5865f2;
  color: white;
}
.link {
  background: none;
  color: #9aa0ff;
  border: none;
  text-decoration: underline;
  text-align: left;
  padding: 0;
}
.error {
  color: #ff6b6b;
  margin: 0;
}
</style>
