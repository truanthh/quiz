<script setup>
import { ref } from "vue";
import { mainStore } from "../stores/mainStore.js";

const store = mainStore();
const debugLog = ref("");
const counter = ref(0);

function handleClick() {
  debugLog.value = `CLICKING! ${counter.value++}`;
  store.pauseTrack();
}
</script>
<template>
  <div class="playerView__container">
    <h3>Ваш никнейм: {{ store.playerInfo.playerName }}</h3>
    <div class="debugInfo">{{ debugLog }}</div>
    <div class="debugInfo">{{ store.connectionInfo.message }}</div>
    <div class="debugInfo">{{ store.connectionInfo.connectedAt }}</div>
    <div class="debugInfo">{{ store.playerInfo.id }}</div>
    <button class="playerView__mainButton" @click="handleClick">CLICK!</button>
  </div>
</template>
<style lang="scss" scoped>
.playerView {
  &__container {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }
  &__title {
    font-size: 32px;
  }
  &__mainButton {
    display: flex;
    height: 200px;
    width: 200px;
    cursor: pointer;
    background: #2c3e50;
    color: white;
  }
}
</style>
