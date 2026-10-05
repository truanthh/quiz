<script setup lang="ts">
import type { ClipInfo, OperationResult, PublicGameSession } from "@quiz/shared";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { createSocket } from "../lib/socket";

const props = defineProps<{ roomCode: string }>();

// Same hardcoded reveal phases as the host's control panel, offsets from
// clipStartMs ("пусть это пока будет" - see docs/plan.md for a real
// waveform editor later). This is the one client that actually owns real
// playback - the host's phone only ever sends `setActivePhase`.
const PHASES = [
  { fromMs: 0, toMs: 1000 },
  { fromMs: 1000, toMs: 4000 },
  { fromMs: 4000, toMs: 14000 },
] as const;
const TOTAL_MS = PHASES[PHASES.length - 1].toMs;

const session = ref<PublicGameSession | null>(null);
const error = ref("");
const socket = createSocket();
const audioEl = ref<HTMLAudioElement | null>(null);
const audioUnlocked = ref(false);
const playheadMs = ref(0);
const clip = ref<{ url: string; clipStartMs: number; clipEndMs: number; forQuestion: number } | null>(null);

let rafHandle: number | null = null;

const players = computed(() => (session.value ? Object.values(session.value.players) : []));
const sortedByScore = computed(() => [...players.value].sort((a, b) => b.score - a.score));
const fillPercent = computed(() => Math.min(100, (playheadMs.value / TOTAL_MS) * 100));
const activePhaseIndex = computed(() => session.value?.activePhaseIndex ?? null);

function stopTicking() {
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
}

function tick() {
  const audio = audioEl.value;
  const c = clip.value;
  const phaseIndex = activePhaseIndex.value;
  if (!audio || !c || phaseIndex === null) {
    stopTicking();
    return;
  }
  const elapsed = Math.max(0, audio.currentTime * 1000 - c.clipStartMs);
  const boundaryMs = PHASES[phaseIndex].toMs;
  if (elapsed >= boundaryMs) {
    playheadMs.value = boundaryMs; // snap exactly to the tick mark, no overshoot
    audio.pause();
    stopTicking();
    return;
  }
  playheadMs.value = elapsed;
  rafHandle = requestAnimationFrame(tick);
}

async function loadClipForCurrentQuestion(): Promise<typeof clip.value> {
  const qIndex = session.value?.currentQuestionIndex;
  if (qIndex === undefined) return null;
  if (clip.value && clip.value.forQuestion === qIndex) return clip.value;
  const result = await new Promise<OperationResult<ClipInfo>>((resolve) =>
    socket.emit("getCurrentClip", resolve),
  );
  if (!result.success) {
    error.value = result.error;
    return null;
  }
  clip.value = { ...result.data, forQuestion: qIndex };
  return clip.value;
}

async function activatePhase(index: number | null) {
  stopTicking();
  const audio = audioEl.value;
  if (!audio) return;
  if (index === null) {
    audio.pause();
    return;
  }
  const c = await loadClipForCurrentQuestion();
  if (!c) return;
  if (audio.src !== c.url) audio.src = c.url;
  audio.currentTime = (c.clipStartMs + PHASES[index].fromMs) / 1000;
  audio.play().catch((e) => console.error("playback blocked:", e));
}

// Keying off activePhaseStartedAt (not just activePhaseIndex) matters: the
// host can click the same phase button repeatedly, and each click must
// replay it - but Vue's watch only fires on an actual value change, and
// activePhaseIndex alone wouldn't change on a repeat click.
watch(
  () => session.value?.activePhaseStartedAt,
  () => activatePhase(activePhaseIndex.value),
);

function onAudioPlaying() {
  socket.emit("setAudioPlaying", { playing: true });
  stopTicking();
  rafHandle = requestAnimationFrame(tick);
}

function onAudioStopped() {
  socket.emit("setAudioPlaying", { playing: false });
  stopTicking();
}

function unlockAudio() {
  const audio = audioEl.value;
  if (!audio) return;
  // A real screen/TV needs one tap before any later, remotely-triggered
  // play() calls are allowed to produce sound - browsers only grant that to
  // a page after a direct user gesture on it, which a socket message from
  // the host's phone can never provide by itself.
  audio
    .play()
    .then(() => audio.pause())
    .catch(() => {})
    .finally(() => {
      audioUnlocked.value = true;
    });
}

onMounted(() => {
  socket.connect();
  socket.on("state", (s) => (session.value = s));
  socket.on("error", (message) => (error.value = message));
  socket.emit("screenJoin", { roomCode: props.roomCode }, (result) => {
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
    <button v-if="!audioUnlocked" class="unlock" @click="unlockAudio">Нажмите, чтобы включить звук</button>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="session">
      <h1 class="code">{{ roomCode }}</h1>

      <audio ref="audioEl" @playing="onAudioPlaying" @pause="onAudioStopped" @ended="onAudioStopped"></audio>

      <section v-if="session.phase === 'question_active'" class="question">
        <p class="qnum">Вопрос {{ session.currentQuestionIndex + 1 }} из {{ session.playlist.length }}</p>
        <div class="progress-bar">
          <div class="fill" :style="{ width: fillPercent + '%' }"></div>
          <div
            v-for="(p, i) in PHASES.slice(0, -1)"
            :key="i"
            class="tick"
            :style="{ left: (p.toMs / TOTAL_MS) * 100 + '%' }"
          ></div>
        </div>
      </section>

      <section v-if="session.phase === 'lobby'" class="hint-big">Ожидаем начала игры…</section>
      <section v-if="session.phase === 'finished'" class="hint-big">Игра завершена!</section>

      <section class="leaderboard">
        <ol>
          <li v-for="p in sortedByScore" :key="p.id">
            <span>{{ p.avatarId }} {{ p.nickname }}</span>
            <span>{{ p.score }}</span>
          </li>
        </ol>
      </section>
    </template>
  </main>
</template>

<style scoped>
.wrap {
  min-height: 100vh;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}
.unlock {
  padding: 16px 24px;
  font-size: 18px;
  border-radius: 8px;
  border: none;
  background: #5865f2;
  color: white;
}
.code {
  font-family: monospace;
  letter-spacing: 10px;
  font-size: 48px;
  margin: 0;
}
audio {
  display: none;
}
.question {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.qnum {
  font-size: 20px;
  color: #9aa0ad;
}
.progress-bar {
  position: relative;
  width: 100%;
  height: 24px;
  border-radius: 12px;
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
  width: 3px;
  background: #1b1d2a;
}
.hint-big {
  font-size: 28px;
  color: #9aa0ad;
}
.leaderboard ol {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 22px;
}
.leaderboard li {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  min-width: 320px;
}
.error {
  color: #ff6b6b;
}
</style>
