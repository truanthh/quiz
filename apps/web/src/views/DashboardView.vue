<script setup lang="ts">
import { CLIP_DURATION_MS } from "@quiz/shared";
import { onMounted, onUnmounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import {
  ApiError,
  api,
  readAudioDurationMs,
  type Me,
  type PlaylistDetail,
  type PlaylistSummary,
  type TrackSummary,
} from "../lib/api";
import ClipPicker from "../components/ClipPicker.vue";

const router = useRouter();
const me = ref<Me | null>(null);
const tracks = ref<TrackSummary[]>([]);
const playlists = ref<PlaylistSummary[]>([]);
const openPlaylist = ref<PlaylistDetail | null>(null);
const error = ref("");

const newPlaylistName = ref("");
const newItemTrackId = ref("");
const newItemPoints = ref(100);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// A track that's been uploaded + ID3-inspected but not yet added to the
// library - the user can still fix the tags/pick the clip before it
// becomes a real Track row (see CLAUDE.md on why finalize is a separate step).
interface PendingTrack {
  storageKey: string;
  durationMs: number;
  title: string;
  artist: string;
  clipStartMs: number;
  previewUrl: string;
}
const pendingTrack = ref<PendingTrack | null>(null);
const savingTrack = ref(false);

// Only one library track plays at a time, through one shared <audio>
// element rather than a native player per row.
const libraryAudio = ref<HTMLAudioElement | null>(null);
const playingTrackId = ref<string | null>(null);

function togglePlay(track: TrackSummary) {
  const audio = libraryAudio.value;
  if (!audio) return;
  if (playingTrackId.value === track.id) {
    audio.pause();
    return;
  }
  if (audio.src !== track.url) audio.src = track.url;
  audio.play().catch((e) => console.error("playback blocked:", e));
  playingTrackId.value = track.id;
}

function stopLibraryAudio() {
  playingTrackId.value = null;
}

async function refreshLists() {
  tracks.value = await api.tracks();
  playlists.value = await api.playlists();
}

onMounted(async () => {
  try {
    me.value = await api.me();
    await refreshLists();
    if (tracks.value.length > 0) newItemTrackId.value = tracks.value[0].id;
  } catch {
    router.push("/host/login");
  }
});

onUnmounted(() => {
  if (pendingTrack.value) URL.revokeObjectURL(pendingTrack.value.previewUrl);
});

async function uploadFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  error.value = "";
  uploading.value = true;
  try {
    const { storageKey, uploadUrl } = await api.requestUploadUrl(file.name, file.type || "audio/mpeg");
    await api.uploadToStorage(uploadUrl, file);
    const [durationMs, tags] = await Promise.all([readAudioDurationMs(file), api.inspectTrack(storageKey)]);
    pendingTrack.value = {
      storageKey,
      durationMs,
      title: tags.title ?? file.name.replace(/\.[^.]+$/, ""),
      artist: tags.artist ?? "",
      clipStartMs: 0,
      previewUrl: URL.createObjectURL(file),
    };
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "upload failed";
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function confirmPendingTrack() {
  if (!pendingTrack.value) return;
  error.value = "";
  savingTrack.value = true;
  try {
    const { storageKey, durationMs, title, artist, clipStartMs } = pendingTrack.value;
    await api.finalizeTrack({ storageKey, durationMs, title: title.trim() || "Untitled", artist: artist.trim() || "Unknown artist", clipStartMs });
    URL.revokeObjectURL(pendingTrack.value.previewUrl);
    pendingTrack.value = null;
    await refreshLists();
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "failed to save track";
  } finally {
    savingTrack.value = false;
  }
}

function cancelPendingTrack() {
  if (pendingTrack.value) URL.revokeObjectURL(pendingTrack.value.previewUrl);
  pendingTrack.value = null;
}

async function deleteTrack(id: string) {
  if (!confirm("Удалить трек? Он пропадёт и из всех плейлистов, где использовался.")) return;
  error.value = "";
  try {
    if (playingTrackId.value === id) libraryAudio.value?.pause();
    await api.deleteTrack(id);
    await refreshLists();
    if (openPlaylist.value) openPlaylist.value = await api.playlist(openPlaylist.value.id);
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "failed to delete track";
  }
}

async function logout() {
  await api.logout();
  router.push("/host/login");
}

async function createPlaylist() {
  if (!newPlaylistName.value.trim()) return;
  error.value = "";
  try {
    await api.createPlaylist(newPlaylistName.value.trim());
    newPlaylistName.value = "";
    await refreshLists();
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "failed to create playlist";
  }
}

async function openDetail(id: string) {
  if (openPlaylist.value?.id === id) {
    openPlaylist.value = null;
    return;
  }
  openPlaylist.value = await api.playlist(id);
}

async function addItem() {
  if (!openPlaylist.value || !newItemTrackId.value) return;
  error.value = "";
  try {
    await api.addPlaylistItem(openPlaylist.value.id, {
      trackId: newItemTrackId.value,
      basePoints: Number(newItemPoints.value),
    });
    await openDetail(openPlaylist.value.id);
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "failed to add track";
  }
}

async function deletePlaylist(id: string) {
  if (!confirm("Удалить плейлист вместе со всеми его треками?")) return;
  error.value = "";
  try {
    await api.deletePlaylist(id);
    if (openPlaylist.value?.id === id) openPlaylist.value = null;
    await refreshLists();
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "failed to delete playlist";
  }
}

async function removeItem(playlistId: string, itemId: string) {
  error.value = "";
  try {
    await api.deletePlaylistItem(playlistId, itemId);
    await openDetail(playlistId);
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "failed to remove track";
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatClipRange(clipStartMs: number): string {
  return `${formatTime(clipStartMs)}–${formatTime(clipStartMs + CLIP_DURATION_MS)}`;
}

async function createRoom(playlistId: string) {
  error.value = "";
  try {
    const { roomCode } = await api.createRoom(playlistId);
    router.push(`/host/${roomCode}`);
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "failed to create room";
  }
}
</script>

<template>
  <main class="wrap" v-if="me">
    <header class="page-header">
      <div class="brand">
        <span class="brand-badge">🎵</span>
        <h1>Панель ведущего</h1>
      </div>
      <div class="account">
        <span class="account-email">{{ me.email }}</span>
        <button class="chip-btn" @click="logout">Выйти</button>
      </div>
    </header>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <section class="card">
      <div class="card-header">
        <h2>Треки <span class="count-badge">{{ tracks.length }}</span></h2>
      </div>

      <label class="upload-dropzone" :class="{ disabled: uploading || !!pendingTrack }">
        <input ref="fileInput" type="file" accept="audio/*" @change="uploadFile" :disabled="uploading || !!pendingTrack" />
        <span class="upload-icon">⬆️</span>
        <span>{{ uploading ? "Загрузка…" : "Загрузить mp3" }}</span>
      </label>

      <div v-if="pendingTrack" class="pending-track">
        <h3>Новый трек — проверь перед добавлением</h3>
        <div class="field-row">
          <label>
            Исполнитель
            <input v-model="pendingTrack.artist" />
          </label>
          <label>
            Название
            <input v-model="pendingTrack.title" />
          </label>
        </div>
        <ClipPicker
          v-model="pendingTrack.clipStartMs"
          :duration-ms="pendingTrack.durationMs"
          :preview-url="pendingTrack.previewUrl"
        />
        <div class="pending-actions">
          <button type="button" class="btn-primary" :disabled="savingTrack" @click="confirmPendingTrack">
            Добавить в библиотеку
          </button>
          <button type="button" class="btn-secondary" :disabled="savingTrack" @click="cancelPendingTrack">
            Отмена
          </button>
        </div>
      </div>

      <audio ref="libraryAudio" @pause="stopLibraryAudio" @ended="stopLibraryAudio"></audio>
      <ul class="track-list">
        <li v-for="t in tracks" :key="t.id" class="track-row">
          <button
            class="icon-btn play-btn"
            :class="{ playing: playingTrackId === t.id }"
            :aria-label="playingTrackId === t.id ? 'Остановить' : 'Слушать'"
            @click="togglePlay(t)"
          >
            {{ playingTrackId === t.id ? "⏸" : "▶" }}
          </button>
          <div class="track-meta">
            <span class="track-title">{{ t.title }}</span>
            <span class="track-sub">{{ t.artist }} · {{ formatClipRange(t.clipStartMs) }}</span>
          </div>
          <button class="icon-btn danger-btn" aria-label="Удалить" @click="deleteTrack(t.id)">🗑</button>
        </li>
        <li v-if="tracks.length === 0" class="empty-hint">Треков пока нет — загрузи первый выше.</li>
      </ul>
    </section>

    <section class="card">
      <div class="card-header">
        <h2>Плейлисты <span class="count-badge">{{ playlists.length }}</span></h2>
      </div>

      <form @submit.prevent="createPlaylist" class="inline-form">
        <input v-model="newPlaylistName" placeholder="Название плейлиста" />
        <button type="submit" class="btn-primary">Создать</button>
      </form>

      <ul class="playlist-list">
        <li v-for="p in playlists" :key="p.id" class="playlist-card">
          <div class="playlist-header">
            <strong>{{ p.name }}</strong>
            <div class="playlist-actions">
              <button class="chip-btn" @click="openDetail(p.id)">
                {{ openPlaylist?.id === p.id ? "Скрыть" : "Изменить" }}
              </button>
              <button class="chip-btn primary" @click="createRoom(p.id)">Создать комнату</button>
              <button class="icon-btn danger-btn small" aria-label="Удалить плейлист" @click="deletePlaylist(p.id)">
                🗑
              </button>
            </div>
          </div>

          <div v-if="openPlaylist?.id === p.id" class="playlist-detail">
            <ul class="playlist-items">
              <li v-for="item in openPlaylist.items" :key="item.id" class="playlist-item-row">
                <div class="track-meta">
                  <span class="track-title">{{ item.track.title }}</span>
                  <span class="track-sub">
                    {{ item.track.artist }} · {{ formatClipRange(item.track.clipStartMs) }} ·
                    {{ item.basePoints }}pts
                  </span>
                </div>
                <button class="icon-btn danger-btn small" aria-label="Убрать" @click="removeItem(openPlaylist!.id, item.id)">
                  ✕
                </button>
              </li>
              <li v-if="openPlaylist.items.length === 0" class="empty-hint">Треков пока нет.</li>
            </ul>

            <form @submit.prevent="addItem" class="inline-form">
              <select v-model="newItemTrackId">
                <option v-for="t in tracks" :key="t.id" :value="t.id">{{ t.title }}</option>
              </select>
              <input v-model.number="newItemPoints" type="number" title="очки" />
              <button type="submit" class="btn-primary" :disabled="tracks.length === 0">Добавить</button>
            </form>
          </div>
        </li>
        <li v-if="playlists.length === 0" class="empty-hint">Плейлистов пока нет.</li>
      </ul>
    </section>

    <RouterLink class="footer-link" to="/">Открыть вход для игрока →</RouterLink>
  </main>
</template>

<style scoped>
.wrap {
  --accent: #5865f2;
  --accent-2: #7b5cf5;
  --accent-soft: rgba(88, 101, 242, 0.16);
  --danger: #ff6b6b;
  --danger-bg: #7d2f3a;
  --success: #3ddc84;
  --surface: #20222f;
  --surface-2: #262838;
  --border: #353856;
  --text-muted: #9aa0ad;

  max-width: 640px;
  margin: 0 auto;
  padding: 16px 16px 48px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.brand-badge {
  font-size: 22px;
}
.page-header h1 {
  font-size: 17px;
  margin: 0;
}
.account {
  display: flex;
  align-items: center;
  gap: 10px;
}
.account-email {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-muted);
}

.error-banner {
  background: rgba(255, 107, 107, 0.12);
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.card-header h2 {
  font-size: 15px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.count-badge {
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 12px;
  padding: 2px 9px;
  border-radius: 999px;
  font-weight: 600;
}

/* Custom file "browse" button - hides the ugly native control entirely,
   the whole dashed zone is one big tap target (mobile-first). */
.upload-dropzone {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 18px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
}
.upload-dropzone:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}
.upload-dropzone.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.upload-dropzone input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}
.upload-icon {
  font-size: 18px;
}

.pending-track {
  background: var(--surface-2);
  border: 1px solid var(--accent);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pending-track h3 {
  margin: 0;
  font-size: 14px;
}
.field-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.field-row label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}
.pending-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.track-list,
.playlist-list,
.playlist-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.track-row,
.playlist-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface-2);
  border-radius: 12px;
  padding: 8px 10px;
}
.track-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.track-title {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.track-sub {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-btn {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #30324a;
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.1s ease, background-color 0.15s ease, color 0.15s ease;
}
.icon-btn:active {
  transform: scale(0.92);
}
.icon-btn.small {
  width: 30px;
  height: 30px;
  font-size: 12px;
}
.play-btn {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: white;
}
.play-btn.playing {
  background: var(--success);
}
.danger-btn {
  background: rgba(255, 107, 107, 0.14);
  color: var(--danger);
}
.danger-btn:hover {
  background: var(--danger-bg);
  color: white;
}

.inline-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.inline-form input,
.inline-form select {
  flex: 1;
  min-width: 110px;
}

.playlist-card {
  background: var(--surface-2);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.playlist-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.playlist-detail {
  padding-top: 10px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input,
select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #1b1d2a;
  color: inherit;
  font-size: 14px;
}
input[type="number"] {
  flex: 0 0 auto;
  width: 72px;
}

button {
  font-family: inherit;
}
.btn-primary {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: #30324a;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
}
.chip-btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  background: #30324a;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
}
.chip-btn.primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: white;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
  padding: 10px 0;
}
.footer-link {
  text-align: center;
  color: var(--accent-2);
  font-size: 13px;
  text-decoration: underline;
  padding-top: 4px;
}

@media (min-width: 480px) {
  .field-row {
    flex-direction: row;
  }
}
@media (min-width: 640px) {
  .wrap {
    padding: 32px 16px 56px;
  }
}
</style>
