<script setup lang="ts">
import type { PublicGameSession } from "@quiz/shared";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { createSocket } from "../lib/socket";

const AVATARS = ["🐵", "🐱", "🐸", "🦊", "🐼", "🐧", "🦁", "🐻", "🐨", "🐯"];
const STORAGE_KEY = "quiz:player";

interface SavedPlayerSession {
  roomCode: string;
  playerId: string;
  nickname: string;
  avatarId: string;
}

function loadSavedSession(): SavedPlayerSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPlayerSession) : null;
  } catch {
    return null;
  }
}

function saveSession(s: SavedPlayerSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // best-effort - e.g. private browsing can refuse storage
  }
}

function clearSavedSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const router = useRouter();

const roomCode = ref("");
const role = ref<"player" | "screen">("player");
const nickname = ref("");
const avatarId = ref(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
const joined = ref(false);
const reconnecting = ref(false);
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

function attachStateListeners() {
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
  socket.on("kicked", ({ playerId: kickedId }) => {
    if (kickedId !== playerId.value) return;
    clearSavedSession();
    joined.value = false;
    session.value = null;
    joinError.value = "Ведущий исключил тебя из комнаты.";
    socket.disconnect();
  });
}

function goToScreen() {
  const code = roomCode.value.trim().toUpperCase();
  if (!code) return;
  router.push(`/screen/${code}`);
}

function join() {
  if (!roomCode.value.trim() || !nickname.value.trim()) return;
  joinError.value = "";
  const code = roomCode.value.trim().toUpperCase();
  socket.connect();
  attachStateListeners();
  socket.emit("joinRoom", { roomCode: code, nickname: nickname.value.trim(), avatarId: avatarId.value }, (result) => {
    if (result.success) {
      playerId.value = result.data.playerId;
      joined.value = true;
      saveSession({
        roomCode: code,
        playerId: result.data.playerId,
        nickname: nickname.value.trim(),
        avatarId: avatarId.value,
      });
    } else {
      joinError.value = result.error;
      socket.disconnect();
    }
  });
}

// A page reload would otherwise land back on the join form and, if the
// player tried to join again, either create a duplicate Player or get
// refused outright once the game has started. Resume the existing one instead.
onMounted(() => {
  const saved = loadSavedSession();
  if (!saved) return;
  reconnecting.value = true;
  roomCode.value = saved.roomCode;
  nickname.value = saved.nickname;
  avatarId.value = saved.avatarId;
  playerId.value = saved.playerId;
  socket.connect();
  attachStateListeners();
  socket.emit("rejoinRoom", { roomCode: saved.roomCode, playerId: saved.playerId }, (result) => {
    reconnecting.value = false;
    if (result.success) {
      session.value = result.data.session;
      joined.value = true;
      // Restore the "already answered" lock across the reload - otherwise a
      // refresh would be a free do-over.
      if (result.data.myAnswers.artist) {
        artistGuess.value = result.data.myAnswers.artist.text;
        artistSubmitted.value = true;
      }
      if (result.data.myAnswers.title) {
        titleGuess.value = result.data.myAnswers.title.text;
        titleSubmitted.value = true;
      }
    } else {
      clearSavedSession();
      socket.disconnect();
    }
  });
});

function submitArtist() {
  if (artistSubmitted.value || !artistGuess.value.trim()) return;
  socket.emit("submitFieldAnswer", { field: "artist", text: artistGuess.value.trim() });
  artistSubmitted.value = true;
}

function submitTitle() {
  if (titleSubmitted.value || !titleGuess.value.trim()) return;
  socket.emit("submitFieldAnswer", { field: "title", text: titleGuess.value.trim() });
  titleSubmitted.value = true;
}

onUnmounted(() => {
  socket.disconnect();
});
</script>

<template>
  <main class="wrap">
    <template v-if="reconnecting">
      <p class="hint">Переподключение…</p>
    </template>

    <template v-else-if="!joined">
      <h1>Войти в игру</h1>
      <form @submit.prevent="role === 'player' ? join() : goToScreen()">
        <label>
          Код комнаты
          <input v-model="roomCode" placeholder="ABCDE" maxlength="5" required />
        </label>

        <label v-if="role === 'player'">
          Ник
          <input v-model="nickname" required />
        </label>

        <div class="role-radio">
          <label class="role-option">
            <input type="radio" value="player" v-model="role" />
            <span>🎮 Я игрок</span>
          </label>
          <label class="role-option">
            <input type="radio" value="screen" v-model="role" />
            <span>🖥️ Главный экран</span>
          </label>
        </div>

        <p v-if="role === 'screen'" class="hint">
          Экран откроется на этом устройстве — подключай телевизор/монитор заранее.
        </p>
        <p v-if="joinError" class="error">{{ joinError }}</p>
        <button type="submit">Войти</button>
      </form>

      <RouterLink class="link host-link" to="/host">Я ведущий — создать игру</RouterLink>
    </template>

    <template v-else-if="session">
      <h1>{{ avatarId }} {{ nickname }} — {{ me?.score ?? 0 }}pts</h1>
      <p v-if="gameError" class="error">{{ gameError }}</p>

      <section v-if="session.phase === 'lobby'">
        <p class="hint">Ждём начала игры…</p>
      </section>

      <section v-if="session.phase === 'question_active'" class="guesses">
        <p class="hint">Вопрос {{ session.currentQuestionIndex + 1 }}</p>

        <form v-if="!artistSubmitted" @submit.prevent="submitArtist" class="guess-row">
          <input v-model="artistGuess" placeholder="Артист" />
          <button type="submit">Отправить</button>
        </form>
        <p v-else class="locked-answer">Артист: <strong>{{ artistGuess }}</strong> ✓</p>

        <form v-if="!titleSubmitted" @submit.prevent="submitTitle" class="guess-row">
          <input v-model="titleGuess" placeholder="Название трека" />
          <button type="submit">Отправить</button>
        </form>
        <p v-else class="locked-answer">Название: <strong>{{ titleGuess }}</strong> ✓</p>

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
button:disabled {
  opacity: 0.4;
}
.role-radio {
  display: flex;
  gap: 4px;
  background: #1b1d2a;
  border: 1px solid #333653;
  border-radius: 12px;
  padding: 4px;
}
.role-option {
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  padding: 10px 8px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  color: #8d93ad;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}
.role-option input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}
.role-option:has(input:checked) {
  background: linear-gradient(135deg, #5865f2, #7b5cf5);
  color: white;
  box-shadow: 0 2px 10px rgba(88, 101, 242, 0.45);
}
.role-option:hover {
  color: #c7cae6;
}
.link {
  background: none;
  color: #9aa0ff;
  text-decoration: underline;
  padding: 4px;
}
.host-link {
  margin-top: 8px;
  font-size: 13px;
  color: #6b6f85;
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
.locked-answer {
  background: #242637;
  border-radius: 6px;
  padding: 8px 12px;
  color: #3ddc84;
}
.error {
  color: #ff6b6b;
}
</style>
