<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { mainStore } from "../stores/mainStore.js";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";

const store = mainStore();
const audioPlayer = useAudioPlayerStore();
const debugLog = ref("");
const counter = ref(0);

const { isPlaying } = storeToRefs(audioPlayer);

function handleClick() {
  debugLog.value = `CLICKING! ${counter.value++}`;
  if(!audioPlayer.isPlaying){
    store.playTrack();
  }else{
    store.pauseTrack();
  }
}

const isp = ref(false);
</script>
<template>
  <div class="playerView__container">
    <div class="playerView__nickname">{{ store.user.name }}</div>
    <div class="playerView__nickname">{{ isPlaying }}</div>
    <div class="playerView__nickname">{{ isp }}</div>
    <div class="playerView__nickname">{{ audioPlayer.currentTime }}</div>
    <button
      :class="
        !isPlaying ? 'playerView__mainButton' : 'playerView__mainButton_glowing'
      "
      @click="handleClick"
    >
      STOP!
    </button>
    <div class="debugInfo">{{ debugLog }}</div>
    <div class="debugInfo">{{ store.connectionInfo.message }}</div>
    <div class="debugInfo">{{ store.connectionInfo.connectedAt }}</div>
    <div class="debugInfo">{{ store.user.token }}</div>
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
    gap: 15px;
  }
  &__nickname {
    font-size: 26px;
    margin-bottom: 60px;
  }
  // &__mainButton {
  //   display: flex;
  //   height: 230px;
  //   width: 230px;
  //   cursor: pointer;
  //   color: white;
  //   background: red;
  //   border-radius: 50%;
  //   border: 1px solid black;
  // }
  &__mainButton {
    width: 170px;
    height: 170px;
    border-radius: 50%;
    background: #90ee90;
    border: none;
    color: black;
    font-size: 20px;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
    transform: scale(1.05);
    &_glowing {
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
