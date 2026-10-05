<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { ApiError, api, type Me, type PlaylistDetail, type PlaylistSummary, type TrackSummary } from "../lib/api";

const router = useRouter();
const me = ref<Me | null>(null);
const tracks = ref<TrackSummary[]>([]);
const playlists = ref<PlaylistSummary[]>([]);
const openPlaylist = ref<PlaylistDetail | null>(null);
const error = ref("");

const newPlaylistName = ref("");
const newItemTrackId = ref("");
const newItemClipStart = ref(0);
const newItemClipEnd = ref(15000);
const newItemPoints = ref(100);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

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
    router.push("/login");
  }
});

async function uploadFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  error.value = "";
  uploading.value = true;
  try {
    await api.uploadTrackFile(file);
    await refreshLists();
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "upload failed";
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function logout() {
  await api.logout();
  router.push("/login");
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
  openPlaylist.value = await api.playlist(id);
}

async function addItem() {
  if (!openPlaylist.value || !newItemTrackId.value) return;
  error.value = "";
  try {
    await api.addPlaylistItem(openPlaylist.value.id, {
      trackId: newItemTrackId.value,
      clipStartMs: Number(newItemClipStart.value),
      clipEndMs: Number(newItemClipEnd.value),
      basePoints: Number(newItemPoints.value),
    });
    await openDetail(openPlaylist.value.id);
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "failed to add track";
  }
}

async function deletePlaylist(id: string) {
  if (!confirm("Delete this playlist and all its tracks?")) return;
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
    <header>
      <h1>Guess the Melody — host dashboard</h1>
      <div>
        <span>{{ me.email }}</span>
        <button @click="logout">Log out</button>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <section>
      <h2>Tracks ({{ tracks.length }})</h2>
      <div class="row">
        <input ref="fileInput" type="file" accept="audio/*" @change="uploadFile" :disabled="uploading" />
        <span v-if="uploading" class="hint">Uploading…</span>
      </div>
      <ul>
        <li v-for="t in tracks" :key="t.id" class="track">
          <span>{{ t.title }} — {{ t.artist }} ({{ Math.round(t.durationMs / 1000) }}s)</span>
          <audio :src="t.url" controls preload="none"></audio>
        </li>
      </ul>
    </section>

    <section>
      <h2>Playlists</h2>
      <form @submit.prevent="createPlaylist" class="row">
        <input v-model="newPlaylistName" placeholder="New playlist name" />
        <button type="submit">Create</button>
      </form>

      <ul class="playlists">
        <li v-for="p in playlists" :key="p.id">
          <div class="row">
            <strong>{{ p.name }}</strong>
            <button @click="openDetail(p.id)">Edit</button>
            <button @click="createRoom(p.id)">Create room</button>
            <button class="danger" @click="deletePlaylist(p.id)">Delete</button>
          </div>

          <div v-if="openPlaylist?.id === p.id" class="detail">
            <ul>
              <li v-for="item in openPlaylist.items" :key="item.id" class="item-row">
                <span>
                  {{ item.track.title }} — {{ item.track.artist }} · {{ item.clipStartMs }}-{{ item.clipEndMs }}ms
                  · {{ item.basePoints }}pts
                </span>
                <button class="danger small" @click="removeItem(openPlaylist!.id, item.id)">Remove</button>
              </li>
              <li v-if="openPlaylist.items.length === 0" class="hint">No tracks yet.</li>
            </ul>

            <form @submit.prevent="addItem" class="row">
              <select v-model="newItemTrackId">
                <option v-for="t in tracks" :key="t.id" :value="t.id">{{ t.title }}</option>
              </select>
              <input v-model.number="newItemClipStart" type="number" title="clip start ms" />
              <input v-model.number="newItemClipEnd" type="number" title="clip end ms" />
              <input v-model.number="newItemPoints" type="number" title="base points" />
              <button type="submit" :disabled="tracks.length === 0">Add track</button>
            </form>
          </div>
        </li>
      </ul>
    </section>

    <RouterLink class="link" to="/play">Open player join screen →</RouterLink>
  </main>
</template>

<style scoped>
.wrap {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
header div {
  display: flex;
  gap: 8px;
  align-items: center;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
ul {
  list-style: none;
  padding: 0;
  margin: 8px 0;
}
.track {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.track audio {
  height: 32px;
}
.playlists > li {
  background: #242637;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.detail {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #3a3d52;
}
input,
select {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #1b1d2a;
  color: inherit;
}
input[type="number"] {
  width: 90px;
}
button {
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: #5865f2;
  color: white;
}
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.danger {
  background: #7d2f3a;
}
.danger.small {
  padding: 4px 8px;
  font-size: 12px;
}
.hint {
  color: #9aa0ad;
  font-size: 13px;
}
.error {
  color: #ff6b6b;
}
.link {
  color: #9aa0ff;
}
</style>
