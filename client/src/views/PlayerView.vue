<script setup>
import { ref, onMounted } from "vue";
import { mainStore } from "../stores/mainStore.js";
import { storeToRefs } from "pinia";

const store = mainStore();
const { gameState, user } = storeToRefs(store);

function handleClick() {
  store.socket.emit("button-pressed-player", store.user);
}

onMounted(() => {});
</script>
<template>
  <div class="playerView__container">
    <div class="playerView__infoPanel">
      <div class="debugInfoo" style="font-size: 24px">
        {{ currentQuestionState }}
      </div>
    </div>
    <button
      :class="
        !user.isReady &&
        /open|countdown/gi.test(gameState.currentQuestion.state)
          ? 'playerView__mainButton_glowing'
          : 'playerView__mainButton'
      "
      v-on="
        store.isMobile ? { touchstart: handleClick } : { click: handleClick }
      "
    ></button>
  </div>
</template>
<style lang="scss" scoped>
.debugInfoo {
  font-size: 14px;
  color: green;
}
.playerView {
  &__container {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
  }
  &__infoPanel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-bottom: 20px;
  }
  &__nickname {
    font-size: 26px;
    margin-bottom: 60px;
  }
  &__mainButton {
    display: flex;
    height: 200px;
    width: 200px;
    cursor: pointer;
    color: white;
    background: pink;
    border-radius: 50%;
    border: 1px solid black;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    outline: none;
  }
  &__mainButton_glowing {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: #90ee90;
    border: none;
    color: black;
    font-size: 20px;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
    transform: scale(1.05);
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    outline: none;
    &::after {
      content: "";
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      border-radius: 50%;
      // background: rgba(255, 0, 0, 0.3);
      background: #90ee90;
      animation: smoke-pulse 3s infinite ease-in-out;
      z-index: -1;
    }

    &:hover::after {
      animation: smoke-pulse 1s infinite ease-in-out;
    }
  }

  @keyframes smoke-pulse {
    0% {
      box-shadow: 0 0 15px 8px rgba(255, 0, 0, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 25px 12px rgba(255, 0, 0, 0.6);
      transform: scale(1.1);
    }
    100% {
      box-shadow: 0 0 15px 8px rgba(255, 0, 0, 0.4);
      transform: scale(1);
    }
  }
}
</style>
