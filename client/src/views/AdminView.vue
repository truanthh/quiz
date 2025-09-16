<script setup>
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";
import { mainStore } from "../stores/mainStore";

const store = mainStore();

function handlePlay() {
  store.playTrack();
}

function handlePause() {
  store.pauseTrack();
}
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
  }
  &__buttonPlay {
    display: flex;
    width: 200px;
    height: 100px;
  }
}
</style>
