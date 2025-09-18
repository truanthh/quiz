<script setup>
import { ref, onMounted } from "vue";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";
import { mainStore } from "../stores/mainStore";

const store = mainStore();

const isPlaying = false;

function handlePlay() {
  store.socket.emit("play-track", store.user);
}

function handlePause() {
  store.socket.emit("pause-track", store.user);
}

onMounted(() => {
  store.socket.on("track-is-playing", () => {
    isPlaying = true;
  });
  store.socket.on("track-is-paused-by-player", () => {
    isPlaying = false;
  });
});
</script>
<template>
  <div class="admin__container">
    <div class="debug"></div>
    <button class="admin__buttonPlay" @click="handlePlay">PLAY</button>
    <button class="admin__buttonPause" @click="handlePause">PAUSE</button>
  </div>
</template>
<style lang="scss">
.admin {
  &__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  &__buttonPlay {
    display: flex;
    width: 200px;
    height: 100px;
  }
  &__buttonPause {
    display: flex;
    width: 200px;
    height: 100px;
  }
}
</style>
