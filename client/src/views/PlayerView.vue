<script setup>
import { mainStore } from "../stores/mainStore.js";

const store = mainStore();
</script>
<template>
  <div class="playerView__container">
    <div class="debugInfo">PLAYER PAGE</div>
    <button class="playerView__mainButton">CLICK!</button>
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
