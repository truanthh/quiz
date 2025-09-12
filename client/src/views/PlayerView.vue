<script setup>
import { mainStore } from "../stores/mainStore.js";

const store = mainStore();

function handleClick() {
  console.log(store.connectionInfo.playerName);
  console.log(store.connectionInfo.id);
}
</script>
<template>
  <div class="playerView__container">
    <h3>Вы зашли как: {{ store.playerInfo.playerName }}</h3>
    <div>Player page</div>
    <div class="debugInfo">{{ store.connectionInfo }}</div>
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
