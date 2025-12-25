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

const store = mainStore();
const { gameState } = storeToRefs(store);

// const playersSortedByPoints = computed(() => {
//   return gameState.players.sort((a, b) => b.points - a.points);
// });

const playersSortedByPoints = [];

// initializing audioPlayer
const audioPlayer = useAudioPlayerStore();
const audioPlayerElement = ref(null);
audioPlayer.setTracks(tracksData.tracks);

const isArtistNameShown = ref(false);
const isTrackNameShown = ref(false);
const isPosterShown = ref(true);
const isScoreboardShown = ref(false);
const isDebugPanelShown = ref(false);

const currentQuestionState = ref("");
const countdown = ref(0);

function toggleDebugPanel() {
  isDebugPanelShown.value = !isDebugPanelShown.value;
}

const posterExists = computed(() => {
  return !audioPlayer.currentTrack.posterImg.endsWith("default.jpg");
});

// we sending audioplayer state to server every second while track is playing
// and receiving state from the server to display data
// why is it being sent by screen and not audioPlayer?
// maybe because audioplayer is only existing in screen component
const { currentTimeSeconds, currentTrackIndex, currentTrack, isPlaying } =
  storeToRefs(audioPlayer);

//
// state that we send to server

function startGame() {
  console.log(audioPlayer.tracks);

  store.socket.emit("start-game", {
    tracks: tracksData.tracks,
    currentTimeSeconds: currentTimeSeconds.value,
    currentTrackIndex: currentTrackIndex.value,
    currentTrack: currentTrack.value,
    isPlaying: isPlaying.value,
  });

  console.log("PIDARASKA");
}

watch([currentTrack, currentTrackIndex, isPlaying, currentTimeSeconds], () => {
  store.socket.emit("audioplayer-state-change", {
    currentTrack: currentTrack.value,
    currentTrackIndex: currentTrackIndex.value,
    isPlaying: isPlaying.value,
    currentTimeSeconds: currentTimeSeconds.value,
  });
});

onMounted(() => {
  store.socket.on("play-track", (time) => {
    audioPlayer.play(time);
  });
  store.socket.on("pause-track", audioPlayer.pause);
  store.socket.on("countdown", (seconds) => {
    countdown.value = seconds;
  });

  store.socket.on("change-current-question", (currQuestionId) => {
    audioPlayer.changeTrack(currQuestionId);
    isTrackNameShown.value = false;
    isArtistNameShown.value = false;
    isPosterShown.value = false;
  });

  store.socket.on("current-question-state-changed", (state) => {
    currentQuestionState.value = state;
  });

  store.socket.on("show-trackname", () => {
    isTrackNameShown.value = true;
  });

  store.socket.on("show-artist", () => {
    isArtistNameShown.value = true;
  });

  store.socket.on("show-poster", () => {
    isPosterShown.value = true;
  });

  store.socket.on("show-scoreboard", () => {
    isScoreboardShown.value = !isScoreboardShown.value;
  });

  // store.socket.on("select-next-player", (players) => {
  //   playersReadyToAnswer.value = players;
  // });
  //
  // store.socket.on("select-prev-player", (players) => {
  //   playersReadyToAnswer.value = players;
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
  <div @click="startGame">START GAME</div>
  <div :class="isDebugPanelShown ? 'debugPanel' : 'debugPanel__hidden'">
    <button class="debugPanel__button" @click="toggleDebugPanel"></button>
    {{ isScoreboardShown }}
  </div>
  <div class="screenView__container">
    <!-- AUDIO AND SCOREBOARD -->
    <Leaderboard :items="playersSortedByPoints" :isShown="isScoreboardShown" />
    <audio
      :src="audioPlayer.currentTrack.src"
      ref="audioPlayerElement"
      preload="auto"
    ></audio>
    <!-- ---------------------- -->
    <div class="screenView">
      <MainPanel
        :state="gameState"
        :countdown
        :isPosterShown
        :posterExists
        :isArtistNameShown
        :isTrackNameShown
      />
      <ItemsBar :items="gameState.playersReadyToAnswer" />
      <PlayerBoardBars :items="gameState.players" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
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
