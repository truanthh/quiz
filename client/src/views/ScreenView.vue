<script setup>
import { ref, onMounted, useTemplateRef } from "vue";
import { audioPlayerComposable } from "../composables/audioPlayerComposable.js";
import { mainStore } from "../stores/mainStore";

const store = mainStore();

const {
  // State
  isPlaying,
  currentTrackIndex,
  volume,
  tracks,

  // Getters
  currentTrack,
  currentTime,

  // Actions
  setAudioRefs,
  play,
  pause,
  playPause,
  setVolume,
  changeTrack,
  nextTrack,
  previousTrack,
  setTracks,
  initializeAudioPlayer,
} = audioPlayerComposable();

// Список треков
const content = ref([
  { name: "Трек 1", src: "/lucidity.mp3" },
  { name: "Трек 2", src: "/stk.mp3" },
  { name: "Трек 3", src: "/stop.mp3" },
]);

initializeAudioPlayer();
</script>

<template>
  <div class="audio-player">
    <div class="displayTime">{{ currentTime }}</div>
    <!-- <div class="track-info"> -->
    <!--   Сейчас играет: {{ tracks[currentTrackIndex].name }} -->
    <!-- </div> -->

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

    <!-- <div class="track-list"> -->
    <!--   <h3>Плейлист:</h3> -->
    <!--   <div -->
    <!--     v-for="(track, index) in tracks" -->
    <!--     :key="index" -->
    <!--     @click=" -->
    <!--       currentTrackIndex = index; -->
    <!--       loadAndPlayTrack(); -->
    <!--     " -->
    <!--     :class="['track-item', { active: index === currentTrackIndex }]" -->
    <!--   > -->
    <!--     {{ track.name }} -->
    <!--   </div> -->
    <!-- </div> -->

    <audio
      :src="tracks[0]"
      ref="audioPlayer"
      preload="auto"
      id="audioPlayer"
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
