<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";
import { mainStore } from "../stores/mainStore";
import tracksData from "../../tracks.json";
import ItemsBar from "../components/ItemsBar.vue";
import MainPanel from "../components/MainPanel.vue";
import PlayerBoardBars from "@/components/PlayerBoardBars.vue";
import Leaderboard from "@/components/Leaderboard.vue";
import PlayerBoardChess from "@/components/PlayerBoardChess.vue";

const store = mainStore();
const { gameState, players } = storeToRefs(store);

// const playersSortedByPoints = computed(() => {
//   return gameState.players.sort((a, b) => b.points - a.points);
// });

const playersSortedByPoints = [];

// initializing audioPlayer
const audioPlayer = useAudioPlayerStore();
const audioPlayerElement = ref(null);
audioPlayer.setTracks(tracksData.tracks);

const isScoreboardShown = ref(false);
const isDebugPanelShown = ref(false);

const countdown = ref(0);

function toggleDebugPanel() {
  isDebugPanelShown.value = !isDebugPanelShown.value;
}

// we sending audioplayer state to server every second while track is playing
// and receiving state from the server to display data
// why is it being sent by screen and not audioPlayer?
// maybe because audioplayer is only existing in screen component
const { currentTimeSeconds, isPlaying, currentTrackIndex } =
  storeToRefs(audioPlayer);

watch(
  () => gameState.value.currentQuestionId,
  (newId) => {
    audioPlayer.changeTrack(newId);
  },
  // { deep: true },
);

watch(
  [currentTimeSeconds, isPlaying, currentTrackIndex],
  () => {
    store.socket.emit("audioplayer-state-change", {
      currentTimeSeconds: currentTimeSeconds.value,
      isPlaying: isPlaying.value,
      currentTrackIndex: currentTrackIndex.value,
    });
  },
  // { deep: true },
);

// const questionId = computed(() => {
//   return gameState.currentTrackIndex;
// });

function startGame() {
  store.socket.emit("start-game", tracksData.tracks);
}

onMounted(() => {
  store.socket.on("play-track", (time) => {
    audioPlayer.play(time);
  });

  store.socket.on("pause-track", audioPlayer.pause);

  store.socket.on("countdown", (seconds) => {
    countdown.value = seconds;
  });

  store.socket.on("show-scoreboard", () => {
    isScoreboardShown.value = !isScoreboardShown.value;
  });

  // store.socket.on("update-client-game-state", (newState) => {
  //   if (newState.currentQuestionId !== gameState.currentQuestionId) {
  //     audioPlayer.changeTrack(newState.currentQuestionId);
  //   }
  // });

  // store.socket.on("select-next-player", (players) => {
  //   playersReadyToAnswer.value = players;
  // });
  //
  // store.socket.on("select-prev-player", (players) => {
  //   playersReadyToAnswer.value = players;
  // });

  // store.socket.on("show-trackname", () => {
  //   isTrackNameShown.value = true;
  // });
  //
  // store.socket.on("show-artist", () => {
  //   isArtistNameShown.value = true;
  // });
  //
  // store.socket.on("show-poster", () => {
  //   isPosterShown.value = true;
  // });

  audioPlayer.initialize(audioPlayerElement.value);

  audioPlayerElement.value.addEventListener("ended", audioPlayer.nextTrack);
  audioPlayerElement.value.addEventListener(
    "timeupdate",
    audioPlayer.updateTime,
  );
});

onUnmounted(() => {
  audioPlayer.destroyIfExists();

  audioPlayerElement.value.removeEventListener("ended", audioPlayer.nextTrack);
  audioPlayerElement.value.removeEventListener(
    "timeupdate",
    audioPlayer.updateTime,
  );
});
</script>

<template>
  <div :class="isDebugPanelShown ? 'debugPanel' : 'debugPanel__hidden'">
    <button class="debugPanel__button" @click="toggleDebugPanel"></button>
    {{ gameState }}
  </div>
  <div class="screenView__container">
    <button
      @click="startGame"
      v-if="!gameState.hasStarted"
      class="startGameButton"
    >
      START GAME
    </button>
    <!-- AUDIO AND SCOREBOARD -->
    <Leaderboard :items="playersSortedByPoints" :isShown="isScoreboardShown" />
    <audio
      :src="audioPlayer.currentTrack.src"
      ref="audioPlayerElement"
      preload="auto"
    ></audio>
    <!-- ---------------------- -->
    <div class="screenView">
      <MainPanel class="bla" :state="gameState" :countdown />
      <ItemsBar :items="gameState.playersReadyToAnswer" />
      <PlayerBoardBars :items="gameState.players" v-if="gameState.hasStarted" />
      <PlayerBoardChess :items="players" v-else class="pregame__players" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.startGameButton {
  position: fixed;
  top: 0;
  right: 50vw;
}
.pregame__players {
  height: 250px;
  width: 800px;
  // background-color: orange;
}

.debugPanel {
  opacity: 0.5;
  width: 700px;
  height: 300px;
  border: 2px solid black;
  padding: 20px;
  background-color: lightgray;
  position: fixed;
  color: black;
  top: 0;
  right: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: bold;
  &__hidden {
    opacity: 0.5;
    width: 100px;
    height: 20px;
    border: 2px solid black;
    padding: 20px;
    background-color: lightgray;
    position: fixed;
    color: black;
    top: 0;
    right: 0;
    overflow: hidden;
    font-size: 12px;
    font-weight: bold;
  }
  &__button {
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 20px;
  }
}

.screenView {
  display: flex;
  height: 100%;
  flex-direction: column;
  // background-color: #660066;
  background: linear-gradient(to bottom, #1a001a 2.5%, #690069 76%, #bd00bd);
  // justify-content: center;
  align-items: center;
  gap: 6%;
  &__container {
    height: 100%;
    position: relative;
  }
}

.text {
  &__questionNumber {
    font-size: 60px;
    font-weight: bold;
  }
  &__pointsChange {
    font-size: 60px;
    font-weight: bold;
  }
}
</style>
