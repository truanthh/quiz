<script setup lang="ts">
import type { AnswerField, GameSession } from "@quiz/shared";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { api, type TrackSummary } from "../lib/api";
import { createSocket } from "../lib/socket";

const props = defineProps<{ roomCode: string }>();

// Same hardcoded phases as ScreenView - see docs/plan.md about a real
// waveform editor replacing this later.
const PHASES = [
  { fromMs: 0, toMs: 1000, label: "1: 0–1с" },
  { fromMs: 1000, toMs: 4000, label: "2: 1–4с" },
  { fromMs: 4000, toMs: 14000, label: "3: 4–14с" },
] as const;

const TOTAL_MS = PHASES[PHASES.length - 1].toMs;

const session = ref<GameSession | null>(null);
const error = ref("");
const socket = createSocket();

const artistPoints = ref(50);
const titlePoints = ref(50);

// No audio here - the screen (a separate device) is the one that actually
// plays the clip. This just mirrors progress visually off the server
// timestamp, same math as ScreenView's audio-driven bar would produce.
const playheadMs = ref(0);
let rafHandle: number | null = null;
const tracksById = ref<Map<string, TrackSummary>>(new Map());

const currentItem = computed(() =>
  session.value ? session.value.playlist[session.value.currentQuestionIndex] : null,
);
const currentTrack = computed(() =>
  currentItem.value ? tracksById.value.get(currentItem.value.trackId) : null,
);
const players = computed(() => (session.value ? Object.values(session.value.players) : []));
const sortedByScore = computed(() => [...players.value].sort((a, b) => b.score - a.score));
const currentAnswers = computed(
  () => session.value?.answersByQuestion[session.value.currentQuestionIndex] ?? {},
);
const fillPercent = computed(() => Math.min(100, (playheadMs.value / TOTAL_MS) * 100));

function stopTicking() {
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
}

function tick() {
  const startedAt = session.value?.activePhaseStartedAt;
  const phaseIndex = session.value?.activePhaseIndex;
  if (startedAt == null || phaseIndex == null) {
    stopTicking();
    return;
  }
  const phase = PHASES[phaseIndex];
  const boundaryMs = phase.toMs;
  const elapsedMs = Math.min(boundaryMs, phase.fromMs + (Date.now() - startedAt));
  playheadMs.value = elapsedMs;
  if (elapsedMs >= boundaryMs) {
    stopTicking();
    return;
  }
  rafHandle = requestAnimationFrame(tick);
}

// Same key as ScreenView's watcher - activePhaseStartedAt changes on every
// click, even a repeat of the same phase, which is what makes replaying work.
watch(
  () => session.value?.activePhaseStartedAt,
  (startedAt) => {
    stopTicking();
    if (startedAt == null) {
      playheadMs.value = 0;
      return;
    }
    rafHandle = requestAnimationFrame(tick);
  },
);

// Default split of the question's points between the two fields, reset
// whenever the question changes - the host can still edit before judging.
watch(currentItem, (item) => {
  if (!item) return;
  artistPoints.value = Math.round(item.basePoints / 2);
  titlePoints.value = item.basePoints - artistPoints.value;
});

function judge(playerId: string, field: AnswerField, correct: boolean) {
  const points = field === "artist" ? artistPoints.value : titlePoints.value;
  socket.emit("judgeFieldAnswer", { playerId, field, correct, points });
}

onMounted(async () => {
  try {
    const tracks = await api.tracks();
    tracksById.value = new Map(tracks.map((t) => [t.id, t]));
  } catch (e) {
    console.error("failed to load tracks", e);
  }

  socket.connect();
  socket.on("hostState", (s) => (session.value = s));
  socket.on("error", (message) => (error.value = message));
  socket.emit("hostJoin", { roomCode: props.roomCode }, (result) => {
    if (result.success) session.value = result.data;
    else error.value = result.error;
  });
});

onUnmounted(() => {
  stopTicking();
  socket.disconnect();
});
</script>

<template>
  <main class="wrap">
    <h1>Комната <span class="code">{{ roomCode }}</span></h1>
    <p class="hint">
      Игроки и большой экран подключаются на сайте по коду {{ roomCode }} (экран там выбирается отдельной
      кнопкой).
    </p>
    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="session">
      <div class="row">
        <p class="screen-status" :class="{ connected: session.screenConnected }">
          {{ session.screenConnected ? "🟢 Экран подключён" : "🔴 Экран не подключён" }}
        </p>
        <button
          v-if="session.phase === 'lobby' && session.screenConnected"
          class="danger small"
          @click="socket.emit('kickScreen')"
        >
          Отключить
        </button>
      </div>

      <template v-if="session.phase === 'lobby'">
        <button class="big" :disabled="!session.screenConnected" @click="socket.emit('startGame')">
          Начать игру
        </button>
        <p v-if="!session.screenConnected" class="hint">
          На большом экране откройте сайт, введите код {{ roomCode }} и выберите «Это большой экран».
        </p>

        <section class="lobby-players">
          <h2>Игроки ({{ players.length }})</h2>
          <ul>
            <li v-for="p in players" :key="p.id" class="lobby-player">
              <span>{{ p.avatarId }} {{ p.nickname }}</span>
              <button class="danger small" @click="socket.emit('kickPlayer', { playerId: p.id })">
                Кикнуть
              </button>
            </li>
            <li v-if="players.length === 0" class="hint">Пока никто не зашёл…</li>
          </ul>
        </section>
      </template>

      <template v-if="session.phase === 'question_active'">
        <section class="nav">
          <button
            :disabled="session.currentQuestionIndex === 0"
            @click="socket.emit('gotoQuestion', { index: session.currentQuestionIndex - 1 })"
          >
            ← Пред.
          </button>
          <span>Вопрос {{ session.currentQuestionIndex + 1 }} / {{ session.playlist.length }}</span>
          <button
            :disabled="session.currentQuestionIndex >= session.playlist.length - 1"
            @click="socket.emit('gotoQuestion', { index: session.currentQuestionIndex + 1 })"
          >
            След. →
          </button>
        </section>

        <section class="phases">
          <button
            v-for="(p, i) in PHASES"
            :key="i"
            class="phase-btn"
            :class="{ active: session.activePhaseIndex === i }"
            @click="socket.emit('setActivePhase', { index: i })"
          >
            {{ p.label }}
          </button>
          <button class="phase-btn stop" @click="socket.emit('setActivePhase', { index: null })">⏸</button>
        </section>

        <div class="progress-bar">
          <div class="fill" :style="{ width: fillPercent + '%' }"></div>
          <div
            v-for="(p, i) in PHASES.slice(0, -1)"
            :key="i"
            class="tick"
            :style="{ left: (p.toMs / TOTAL_MS) * 100 + '%' }"
          ></div>
        </div>
        <p v-if="currentTrack" class="answer-key">{{ currentTrack.artist }} — {{ currentTrack.title }}</p>

        <section class="answers">
          <h2>Ответы</h2>
          <div class="points-row">
            <label>Очки за артиста <input v-model.number="artistPoints" type="number" /></label>
            <label>Очки за название <input v-model.number="titlePoints" type="number" /></label>
          </div>

          <div v-for="p in players" :key="p.id" class="answer-card">
            <div class="answer-name">{{ p.avatarId }} {{ p.nickname }} — {{ p.score }}pts</div>

            <div v-for="field in ['artist', 'title'] as const" :key="field" class="answer-field">
              <span class="field-label">{{ field === "artist" ? "Артист" : "Название" }}:</span>
              <span class="field-text">{{ currentAnswers[p.id]?.[field]?.text ?? "—" }}</span>
              <span
                v-if="currentAnswers[p.id]?.[field]"
                class="judged-badge"
                :class="currentAnswers[p.id]![field]!.judged"
              >
                {{
                  currentAnswers[p.id]![field]!.judged === "pending"
                    ? "…"
                    : currentAnswers[p.id]![field]!.judged === "correct"
                      ? "✓"
                      : "✗"
                }}
              </span>
              <button
                class="accept"
                :disabled="!currentAnswers[p.id]?.[field]"
                @click="judge(p.id, field, true)"
              >
                ✓
              </button>
              <button
                class="reject"
                :disabled="!currentAnswers[p.id]?.[field]"
                @click="judge(p.id, field, false)"
              >
                ✗
              </button>
            </div>
          </div>
        </section>

        <button class="finish" @click="socket.emit('finishGame')">Закончить игру</button>
      </template>

      <section v-if="session.phase === 'finished'">
        <h2>Итоги</h2>
      </section>

      <section class="leaderboard">
        <h2>Лидерборд</h2>
        <ol>
          <li v-for="p in sortedByScore" :key="p.id">{{ p.avatarId }} {{ p.nickname }} — {{ p.score }}</li>
        </ol>
      </section>
    </template>
  </main>
</template>

<style scoped>
.wrap {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.code {
  font-family: monospace;
  letter-spacing: 4px;
  background: #242637;
  padding: 2px 10px;
  border-radius: 6px;
}
.hint {
  color: #9aa0ad;
  font-size: 13px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.screen-status {
  font-size: 14px;
  color: #ff6b6b;
}
.screen-status.connected {
  color: #3ddc84;
}
.lobby-players ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lobby-player {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: #242637;
  border-radius: 6px;
  padding: 8px 12px;
}
.danger {
  background: #7d2f3a;
}
.danger.small {
  padding: 4px 10px;
  font-size: 13px;
}
.error {
  color: #ff6b6b;
}
button {
  padding: 10px 14px;
  border-radius: 6px;
  border: none;
  background: #5865f2;
  color: white;
  font-size: 15px;
}
button:disabled {
  opacity: 0.4;
}
.big {
  font-size: 18px;
  padding: 16px;
}
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.phases {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.phase-btn {
  flex: 1;
  background: #30324a;
  opacity: 0.8;
  font-size: 13px;
  padding: 10px 6px;
}
.phase-btn.active {
  background: #5865f2;
  opacity: 1;
}
.phase-btn.stop {
  flex: 0 0 48px;
}
.progress-bar {
  position: relative;
  height: 12px;
  border-radius: 6px;
  background: #30324a;
  overflow: hidden;
}
.progress-bar .fill {
  position: absolute;
  inset: 0;
  width: 0%;
  background: #3ddc84;
}
.progress-bar .tick {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #1b1d2a;
}
.answer-key {
  text-align: center;
  font-weight: bold;
  color: #3ddc84;
}
.answers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.points-row {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #9aa0ad;
}
.points-row input {
  width: 60px;
  margin-left: 4px;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #444;
  background: #1b1d2a;
  color: inherit;
}
.answer-card {
  background: #242637;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.answer-name {
  font-weight: bold;
}
.answer-field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.field-label {
  color: #9aa0ad;
  flex: 0 0 auto;
}
.field-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.judged-badge.correct {
  color: #3ddc84;
}
.judged-badge.incorrect {
  color: #ff6b6b;
}
.answer-field button {
  padding: 4px 10px;
  font-size: 14px;
}
.accept {
  background: #2f7d52;
}
.reject {
  background: #7d2f3a;
}
.finish {
  background: #30324a;
}
.leaderboard ol {
  padding-left: 18px;
}
</style>
