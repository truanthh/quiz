<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const audioContext = ref(null);
const audioPlayer = ref(null);
const gainNode = ref(null);
const isPlaying = ref(false);
const currentTrackIndex = ref(0);

const currentTime = ref("00:00");
const duration = ref(0);

// Список треков
const tracks = ref([
  { name: "Трек 1", src: "/lucidity.mp3" },
  { name: "Трек 2", src: "/stk.mp3" },
  { name: "Трек 3", src: "/stop.mp3" },
]);

// Инициализация аудио контекста
onMounted(() => {
  audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
  gainNode.value = audioContext.value.createGain();
  gainNode.value.gain.value = 2.0;

  setupAudioNode();
});

// Настройка аудио узлов
function setupAudioNode() {
  if (!audioPlayer.value) return;

  const track = audioContext.value.createMediaElementSource(audioPlayer.value);
  track.connect(gainNode.value);
  gainNode.value.connect(audioContext.value.destination);
}

// Воспроизведение/пауза
async function playPause() {
  if (!audioPlayer.value || !audioContext.value) return;

  try {
    if (audioContext.value.state === "suspended") {
      await audioContext.value.resume();
    }

    if (isPlaying.value) {
      audioPlayer.value.pause();
    } else {
      await audioPlayer.value.play();
    }

    isPlaying.value = !isPlaying.value;
  } catch (error) {
    console.error("Audio error:", error);
  }
}

// Следующий трек
function nextTrack() {
  currentTrackIndex.value = (currentTrackIndex.value + 1) % tracks.value.length;
  loadAndPlayTrack();
}

// Предыдущий трек
function prevTrack() {
  currentTrackIndex.value =
    (currentTrackIndex.value - 1 + tracks.value.length) % tracks.value.length;
  loadAndPlayTrack();
}

// Загрузка и воспроизведение трека
function loadAndPlayTrack() {
  if (!audioPlayer.value) return;

  const wasPlaying = isPlaying.value;

  // Пауза текущего трека
  audioPlayer.value.pause();
  isPlaying.value = false;

  // Загрузка нового трека
  audioPlayer.value.src = tracks.value[currentTrackIndex.value].src;

  // Переподключение аудио узлов
  setupAudioNode();

  // Воспроизведение если был играющим
  if (wasPlaying) {
    setTimeout(() => playPause(), 100);
  }
}

// Увеличение громкости
function volumeUp() {
  if (gainNode.value) {
    gainNode.value.gain.value = Math.min(gainNode.value.gain.value + 0.5, 10.0);
  }
}

// Уменьшение громкости
function volumeDown() {
  if (gainNode.value) {
    gainNode.value.gain.value = Math.max(gainNode.value.gain.value - 0.5, 0.0);
  }
}

function trackTime() {
  currentTime.value = formatTime(Math.trunc(audioPlayer.value.currentTime));
  duration.value = audioPlayer.value.duration;
}

function formatTime(seconds) {
  let sec = seconds;
  let min = 0;

  if (seconds > 59) {
    min = Math.floor(seconds / 60);
    sec = sec % 60;
  }

  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// Автопереход к следующему треку
onMounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.addEventListener("ended", nextTrack);
    audioPlayer.value.addEventListener("timeupdate", trackTime);
  }
});

onBeforeUnmount(() => {
  audioPlayer.value.removeEventListener("ended", nextTrack);
  audioPlayer.value.removeEventListener("timeupdate", trackTime);
});
</script>

<template>
  <div class="audio-player">
    <div class="displayTime">{{ currentTime }}</div>
    <div class="track-info">
      Сейчас играет: {{ tracks[currentTrackIndex].name }}
    </div>

    <div class="controls">
      <button @click="prevTrack" class="control-btn">⏮</button>

      <button @click="playPause" class="control-btn play-pause">
        {{ isPlaying ? "⏸️" : "▶️" }}
      </button>

      <button @click="nextTrack" class="control-btn">⏭</button>
    </div>

    <div class="volume-controls">
      <button @click="volumeDown" class="volume-btn">🔉</button>
      <button @click="volumeUp" class="volume-btn">🔊</button>
    </div>

    <div class="track-list">
      <h3>Плейлист:</h3>
      <div
        v-for="(track, index) in tracks"
        :key="index"
        @click="
          currentTrackIndex = index;
          loadAndPlayTrack();
        "
        :class="['track-item', { active: index === currentTrackIndex }]"
      >
        {{ track.name }}
      </div>
    </div>

    <audio
      :src="tracks[currentTrackIndex].src"
      ref="audioPlayer"
      preload="auto"
    ></audio>
  </div>
</template>

<style scoped>
.audio-player {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.displayTime {
  font-weight: bold;
  font-size: 168px;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.7);
  /* background-color: #242424; */
}

.track-info {
  text-align: center;
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 18px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.control-btn {
  padding: 10px 15px;
  font-size: 20px;
  border: none;
  border-radius: 50%;
  background: #f0f0f0;
  cursor: pointer;
  transition: background 0.3s;
}

.control-btn:hover {
  background: #ddd;
}

.play-pause {
  background: #4caf50;
  color: white;
}

.volume-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.volume-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  background: #e0e0e0;
  cursor: pointer;
}

.track-list {
  margin-top: 20px;
}

.track-item {
  padding: 8px 12px;
  margin: 5px 0;
  background: #f5f5f5;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.track-item:hover {
  background: #e0e0e0;
}

.track-item.active {
  background: #4caf50;
  color: white;
  font-weight: bold;
}
</style>
