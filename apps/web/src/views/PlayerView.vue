<script setup lang="ts">
import type { PublicGameSession } from "@quiz/shared";
import { computed, onUnmounted, ref } from "vue";
import { createSocket } from "../lib/socket";

const AVATARS = ["🐵", "🐱", "🐸", "🦊", "🐼", "🐧", "🦁", "🐻", "🐨", "🐯"];

const roomCode = ref("");
const nickname = ref("");
const avatarId = ref(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
const joined = ref(false);
const joinError = ref("");
const gameError = ref("");
const playerId = ref("");
const session = ref<PublicGameSession | null>(null);
const artistGuess = ref("");
const titleGuess = ref("");
const artistSubmitted = ref(false);
const titleSubmitted = ref(false);

const socket = createSocket();

const me = computed(() => (session.value && playerId.value ? session.value.players[playerId.value] : null));
const sortedByScore = computed(() =>
  session.value ? Object.values(session.value.players).sort((a, b) => b.score - a.score) : [],
);

function join() {
  if (!roomCode.value.trim() || !nickname.value.trim()) return;
  joinError.value = "";
  socket.connect();
  socket.on("state", (s) => {
    // A new question means our own "submitted" flags (local-only - we don't
    // get told our own guess's judged status, see docs/plan.md) are stale.
    if (session.value && s.currentQuestionIndex !== session.value.currentQuestionIndex) {
      artistGuess.value = "";
      titleGuess.value = "";
      artistSubmitted.value = false;
      titleSubmitted.value = false;
    }
    session.value = s;
  });
  socket.on("error", (message) => (gameError.value = message));
  socket.emit(
    "joinRoom",
    { roomCode: roomCode.value.trim().toUpperCase(), nickname: nickname.value.trim(), avatarId: avatarId.value },
    (result) => {
      if (result.success) {
        playerId.value = result.data.playerId;
        joined.value = true;
      } else {
        joinError.value = result.error;
        socket.disconnect();
      }
    },
  );
}

function submitArtist() {
  if (!artistGuess.value.trim()) return;
  socket.emit("submitFieldAnswer", { field: "artist", text: artistGuess.value.trim() });
  artistSubmitted.value = true;
}

function submitTitle() {
  if (!titleGuess.value.trim()) return;
  socket.emit("submitFieldAnswer", { field: "title", text: titleGuess.value.trim() });
  titleSubmitted.value = true;
}

onUnmounted(() => {
  socket.disconnect();
});
</script>

<template>
  <main class="wrap">
    <template v-if="!joined">
      <h1>Войти в игру</h1>
      <form @submit.prevent="join">
        <label>
          Код комнаты
          <input v-model="roomCode" placeholder="ABCDE" maxlength="5" required />
        </label>
        <label>
          Ник
          <input v-model="nickname" required />
        </label>
        <p class="hint">Твой аватар: {{ avatarId }}</p>
        <p v-if="joinError" class="error">{{ joinError }}</p>
        <button type="submit">Войти</button>
      </form>
    </template>

    <template v-else-if="session">
      <h1>{{ avatarId }} {{ nickname }} — {{ me?.score ?? 0 }}pts</h1>
      <p v-if="gameError" class="error">{{ gameError }}</p>

      <section v-if="session.phase === 'lobby'">
        <p class="hint">Ждём начала игры…</p>
      </section>

      <section v-if="session.phase === 'question_active'" class="guesses">
        <p class="hint">Вопрос {{ session.currentQuestionIndex + 1 }}</p>

        <form @submit.prevent="submitArtist" class="guess-row">
          <input v-model="artistGuess" placeholder="Артист" />
          <button type="submit">{{ artistSubmitted ? "Изменить" : "Отправить" }}</button>
        </form>

        <form @submit.prevent="submitTitle" class="guess-row">
          <input v-model="titleGuess" placeholder="Название трека" />
          <button type="submit">{{ titleSubmitted ? "Изменить" : "Отправить" }}</button>
        </form>

        <p class="hint small">Ведущий проверяет ответы сам — следи за своим счётом выше.</p>
      </section>

      <section v-if="session.phase === 'finished'">
        <h2>Итоговый счёт</h2>
        <ol>
          <li v-for="p in sortedByScore" :key="p.id" :class="{ me: p.id === playerId }">
            {{ p.nickname }} — {{ p.score }}
          </li>
        </ol>
      </section>
    </template>
  </main>
</template>

<style scoped>
.wrap {
  max-width: 420px;
  margin: 10vh auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
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
  text-align: left;
}
input,
select {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #262838;
  color: inherit;
}
button {
  padding: 10px 14px;
  border-radius: 6px;
  border: none;
  background: #5865f2;
  color: white;
}
.guesses {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.guess-row {
  flex-direction: row;
}
.guess-row input {
  flex: 1;
}
ol {
  list-style: none;
  padding: 0;
}
.me {
  font-weight: bold;
  color: #9aa0ff;
}
.hint {
  color: #9aa0ad;
}
.hint.small {
  font-size: 12px;
}
.error {
  color: #ff6b6b;
}
</style>
