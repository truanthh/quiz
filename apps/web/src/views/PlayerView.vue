<script setup lang="ts">
import type { GameSession } from "@quiz/shared";
import { computed, onUnmounted, ref } from "vue";
import { createSocket } from "../lib/socket";

const AVATARS = ["🐵", "🐱", "🐸", "🦊", "🐼", "🐧"];

const roomCode = ref("");
const nickname = ref("");
const avatarId = ref(AVATARS[0]);
const joined = ref(false);
const joinError = ref("");
const gameError = ref("");
const playerId = ref("");
const session = ref<GameSession | null>(null);
const answerText = ref("");
const wagerAmount = ref(0);

const socket = createSocket();

const me = computed(() => (session.value && playerId.value ? session.value.players[playerId.value] : null));
const isActiveAnswerer = computed(() => session.value?.activeAnswererId === playerId.value);
const isLockedOut = computed(() => session.value?.lockedOutIds.includes(playerId.value) ?? false);
const activeAnswererNickname = computed(() => {
  const id = session.value?.activeAnswererId;
  return id ? session.value?.players[id]?.nickname ?? id : null;
});
const sortedByScore = computed(() =>
  session.value ? Object.values(session.value.players).sort((a, b) => b.score - a.score) : [],
);

function join() {
  if (!roomCode.value.trim() || !nickname.value.trim()) return;
  joinError.value = "";
  socket.connect();
  socket.on("state", (s) => (session.value = s));
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

function buzz() {
  socket.emit("buzz");
}

function submitAnswer() {
  if (!answerText.value.trim()) return;
  socket.emit("submitAnswer", { text: answerText.value.trim() });
  answerText.value = "";
}

function submitWager() {
  socket.emit("submitWager", { amount: Number(wagerAmount.value) });
}

onUnmounted(() => {
  socket.disconnect();
});
</script>

<template>
  <main class="wrap">
    <template v-if="!joined">
      <h1>Join a game</h1>
      <form @submit.prevent="join">
        <label>
          Room code
          <input v-model="roomCode" placeholder="ABCDE" maxlength="5" required />
        </label>
        <label>
          Nickname
          <input v-model="nickname" required />
        </label>
        <label>
          Avatar
          <select v-model="avatarId">
            <option v-for="a in AVATARS" :key="a" :value="a">{{ a }}</option>
          </select>
        </label>
        <p v-if="joinError" class="error">{{ joinError }}</p>
        <button type="submit">Join</button>
      </form>
    </template>

    <template v-else-if="session">
      <h1>{{ avatarId }} {{ nickname }} — {{ me?.score ?? 0 }}pts</h1>
      <p v-if="gameError" class="error">{{ gameError }}</p>
      <p class="phase">Phase: <strong>{{ session.phase }}</strong></p>

      <section v-if="session.phase === 'lobby' || session.phase === 'countdown_to_start'">
        <p class="hint">Get ready…</p>
      </section>

      <section v-if="session.phase === 'question_playing'">
        <button v-if="!isLockedOut" class="buzz" @click="buzz">BUZZ</button>
        <p v-else class="hint">You already missed this one — someone else's turn.</p>
      </section>

      <section v-if="session.phase === 'answer_window'">
        <template v-if="isActiveAnswerer">
          <form @submit.prevent="submitAnswer" class="row">
            <input v-model="answerText" placeholder="Track title or artist" autofocus />
            <button type="submit">Submit</button>
          </form>
        </template>
        <p v-else class="hint">{{ activeAnswererNickname }} is answering…</p>
      </section>

      <section v-if="session.phase === 'reveal' || session.phase === 'leaderboard'">
        <h2>Leaderboard</h2>
        <ol>
          <li v-for="p in sortedByScore" :key="p.id" :class="{ me: p.id === playerId }">
            {{ p.nickname }} — {{ p.score }}
          </li>
        </ol>
      </section>

      <section v-if="session.phase === 'wager_input'">
        <form @submit.prevent="submitWager" class="row" v-if="!(playerId in session.wagers)">
          <label>
            Wager (max {{ me?.score ?? 0 }})
            <input v-model.number="wagerAmount" type="number" min="0" :max="me?.score ?? 0" />
          </label>
          <button type="submit">Lock in wager</button>
        </form>
        <p v-else class="hint">Wager locked in. Waiting for everyone else…</p>
      </section>

      <section v-if="session.phase === 'finished'">
        <h2>Final scores</h2>
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
.buzz {
  font-size: 28px;
  padding: 24px;
  border-radius: 50%;
  width: 160px;
  height: 160px;
  background: #ff5a5a;
  margin: 0 auto;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
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
.error {
  color: #ff6b6b;
}
</style>
