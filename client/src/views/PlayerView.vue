<script setup>
import { ref, onMounted } from "vue";
// import { storeToRefs } from "pinia";
import { mainStore } from "../stores/mainStore.js";

const store = mainStore();
const debugLog = ref("");
const counter = ref(0);

const currentTime = ref("00:00");
const isPlaying = ref(false);
const currentQuestionState = ref(false);

function updateClientTime(seconds) {
  console.log(`current time is ${seconds}`);
  currentTime.value = formatTime(seconds);
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

function handleClick() {
  isPlaying.value = false;
  store.socket.emit("pause-track", store.user);
}

onMounted(() => {
  store.socket.on("update-client-time", updateClientTime);
  store.socket.on("track-is-paused-by-player", (audioPlayerState) => {
    isPlaying.value = audioPlayerState.isPlaying;
  });
  store.socket.on("track-is-paused-by-admin", (audioPlayerState) => {
    isPlaying.value = audioPlayerState.isPlaying;
  });
  store.socket.on("track-is-playing", (audioPlayerState) => {
    isPlaying.value = audioPlayerState.isPlaying;
  });
  store.socket.on("question-state-changed", (currentQuestionState) => {
    currentQuestionState.value = currentQuestionState;
  });
});
</script>
<template>
  <div class="playerView__container">
    <div class="debugInfoo">{{ store.user.name }} {{ currentTime }}</div>
    <button
      :class="
        !isPlaying && currentQuestionState !== `open`
          ? 'playerView__mainButton'
          : 'playerView__mainButton_glowing'
      "
      @click="handleClick"
    ></button>
    <div class="debugInfo">{{ debugLog }}</div>
    <div class="debugInfo">{{ store.connectionInfo.message }}</div>
    <div class="debugInfo">{{ store.connectionInfo.connectedAt }}</div>
    <div class="debugInfo">{{ store.user.token }}</div>
  </div>
</template>
<style lang="scss" scoped>
.debugInfoo {
  font-size: 14px;
  color: green;
  margin-top: 10px;
  margin-bottom: 20px;
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
