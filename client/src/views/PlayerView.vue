<script setup>
import { ref, onMounted } from "vue";
// import { storeToRefs } from "pinia";
import { mainStore } from "../stores/mainStore.js";

const store = mainStore();
// const debugLog = ref("");
// const counter = ref(0);

const currentTime = ref("00:00");
const isPlaying = ref(false);
const isPlayerReady = ref(false);
const currentQuestionState = ref("");

function handleClick() {
  store.socket.emit("button-pressed-player", store.user);
}

onMounted(() => {
  store.socket.on("update-audioplayer-client-state", (newState) => {
    isPlaying.value = newState.isPlaying;
    // currentTime.value = store.formatTime(newState.currentTime);
  });

  store.socket.on("question-state-changed", (newState) => {
    currentQuestionState.value = newState;
  });

  store.socket.on("you-are-ready", () => {
    isPlayerReady.value = true;
  });

  store.socket.on("reset-players", () => {
    isPlayerReady.value = false;
  });
});
</script>
<template>
  <div class="playerView__container">
    <div class="playerView__infoPanel">
      <div class="debugInfoo">{{ store.user.name }}</div>
      <!-- <div class="debugInfoo">{{ currentTime }}</div> -->
      <div class="debugInfoo" style="font-size: 24px">
        {{ currentQuestionState }}
      </div>
      <div class="debugInfoo" style="font-size: 24px" v-if="isPlayerReady">
        READY
      </div>
      <div
        class="debugInfoo"
        style="font-size: 24px"
        v-else-if="!isPlayerReady"
      >
        NOT READY
      </div>
    </div>
    <button
      :class="
        !isPlayerReady && /open|countdown/gi.test(currentQuestionState)
          ? 'playerView__mainButton_glowing'
          : 'playerView__mainButton'
      "
      @touchstart="handleClick"
    ></button>
    <!-- <div class="debugInfo">{{ debugLog }}</div> -->
    <!-- <div class="debugInfo">{{ store.connectionInfo.message }}</div> -->
    <!-- <div class="debugInfo">{{ store.connectionInfo.connectedAt }}</div> -->
    <!-- <div class="debugInfo">{{ store.user.token }}</div> -->
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
