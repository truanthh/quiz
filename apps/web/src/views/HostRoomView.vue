<script setup lang="ts">
import type { GameSession } from "@quiz/shared";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { createSocket } from "../lib/socket";

const props = defineProps<{ roomCode: string }>();

const session = ref<GameSession | null>(null);
const error = ref("");
const socket = createSocket();

const currentItem = computed(() =>
  session.value ? session.value.playlist[session.value.currentQuestionIndex] : null,
);
const players = computed(() => (session.value ? Object.values(session.value.players) : []));
const activeAnswererNickname = computed(() => {
  const id = session.value?.activeAnswererId;
  return id ? session.value?.players[id]?.nickname ?? id : null;
});
const sortedByScore = computed(() => [...players.value].sort((a, b) => b.score - a.score));
const wagersSubmitted = computed(() => (session.value ? Object.keys(session.value.wagers).length : 0));

onMounted(() => {
  socket.connect();
  socket.on("state", (s) => (session.value = s));
  socket.on("error", (message) => (error.value = message));
  socket.emit("hostJoin", { roomCode: props.roomCode }, (result) => {
    if (result.success) session.value = result.data;
    else error.value = result.error;
  });
});

onUnmounted(() => {
  socket.disconnect();
});
</script>

<template>
  <main class="wrap">
    <h1>Room <span class="code">{{ roomCode }}</span></h1>
    <p class="hint">Players join at /play with this code.</p>
    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="session">
      <p class="phase">Phase: <strong>{{ session.phase }}</strong></p>

      <section>
        <h2>Players</h2>
        <ul>
          <li v-for="p in players" :key="p.id" :class="{ dc: !p.connected }">
            {{ p.nickname }} — {{ p.score }}pts
            <span v-if="session.lockedOutIds.includes(p.id)">🔒</span>
            <span v-if="!p.connected">(disconnected)</span>
          </li>
          <li v-if="players.length === 0" class="hint">Waiting for players…</li>
        </ul>
      </section>

      <section class="controls">
        <button v-if="session.phase === 'lobby'" @click="socket.emit('startGame')">
          Start game
        </button>

        <button v-if="session.phase === 'countdown_to_start'" @click="socket.emit('beginQuestion')">
          Begin question {{ session.currentQuestionIndex + 1 }} ({{ currentItem?.basePoints }}pts)
        </button>

        <p v-if="session.phase === 'question_playing'" class="hint">Waiting for a buzz…</p>

        <template v-if="session.phase === 'answer_window'">
          <p>{{ activeAnswererNickname }} is answering…</p>
          <div v-if="session.pendingReview" class="row">
            <span>Ambiguous answer — accept?</span>
            <button @click="socket.emit('hostJudge', { contestantId: session.activeAnswererId!, correct: true })">
              Accept
            </button>
            <button @click="socket.emit('hostJudge', { contestantId: session.activeAnswererId!, correct: false })">
              Reject
            </button>
          </div>
        </template>

        <button v-if="session.phase === 'reveal'" @click="socket.emit('advance')">
          Reveal → continue
        </button>

        <button v-if="session.phase === 'leaderboard'" @click="socket.emit('advance')">
          Next question
        </button>

        <p v-if="session.phase === 'wager_input'" class="hint">
          Waiting for wagers: {{ wagersSubmitted }}/{{ players.length }}
        </p>

        <p v-if="session.phase === 'finished'" class="hint">Game finished!</p>
      </section>

      <section>
        <h2>Leaderboard</h2>
        <ol>
          <li v-for="p in sortedByScore" :key="p.id">{{ p.nickname }} — {{ p.score }}</li>
        </ol>
      </section>
    </template>
  </main>
</template>

<style scoped>
.wrap {
  max-width: 560px;
  margin: 40px auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.code {
  font-family: monospace;
  letter-spacing: 4px;
  background: #242637;
  padding: 2px 10px;
  border-radius: 6px;
}
ul,
ol {
  padding-left: 18px;
}
.dc {
  opacity: 0.5;
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
}
button {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: #5865f2;
  color: white;
  align-self: flex-start;
}
.hint {
  color: #9aa0ad;
  font-size: 13px;
}
.error {
  color: #ff6b6b;
}
</style>
