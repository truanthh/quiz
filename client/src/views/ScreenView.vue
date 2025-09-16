<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";

const audioPlayerElement = ref(null);
const audioPlayer = useAudioPlayerStore();

const tracks = ref([
  { name: "Трек 1", src: "/zvezda.mp3" },
  // { name: "Трек 2", src: "/stk.mp3" },
  // { name: "Трек 3", src: "/stop.mp3" },
]);

audioPlayer.setTracks(tracks.value);

onMounted(() => {
  audioPlayer.initialize(audioPlayerElement.value);

  audioPlayerElement.value.addEventListener("ended", audioPlayer.nextTrack);
  audioPlayerElement.value.addEventListener(
    "timeupdate",
    audioPlayer.trackTime,
  );
});

onUnmounted(() => {
  audioPlayer.destroyIfExists();

  audioPlayerElement.value.removeEventListener("ended", audioPlayer.nextTrack);
  audioPlayerElement.value.removeEventListener(
    "timeupdate",
    audioPlayer.trackTime,
  );
});
</script>

<template>
  <div class="audio-player">
    <div class="displayTime">{{ audioPlayer.currentTime }}</div>
    <!-- <div class="track-info"> -->
    <!--   Сейчас играет: {{ audioPlayer.tracks[currentTrackIndex].name }} -->
    <!-- </div> -->

    <div class="controls">
      <button @click="audioPlayer.prevTrack" class="control-btn">⏮</button>

      <button @click="audioPlayer.playPause" class="control-btn play-pause">
        {{ audioPlayer.isPlaying ? "⏸️" : "▶️" }}
      </button>

      <button @click="audioPlayer.nextTrack" class="control-btn">⏭</button>
    </div>

    <!-- <div class="track-list"> -->
    <!--   <h3>Плейлист:</h3> -->
    <!--   <div -->
    <!--     v-for="(track, index) in audioPlayer.tracks" -->
    <!--     :key="index" -->
    <!--     @click=" -->
    <!--       currentTrackIndex = index; -->
    <!--       loadAndPlayTrack(); -->
    <!--     " -->
    <!--     :class="['track-item', { active: index === currentTrackIndex }]" -->
    <!--   > -->
    <!--     {{ audioPlayer.track.name }} -->
    <!--   </div> -->
    <!-- </div> -->

    <audio
      :src="audioPlayer.currentTrack.src"
      ref="audioPlayerElement"
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
