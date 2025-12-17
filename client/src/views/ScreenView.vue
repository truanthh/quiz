<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";
import { mainStore } from "../stores/mainStore";
// import BaseTable from "../components/Table/BaseTable.vue";
// import TableRow from "../components/Table/TableRow.vue";
// import TableColumn from "../components/Table/TableColumn.vue";
import tracksData from "../../tracks.json";
import PlayerBoard from "../components/PlayerBoard.vue";
import ItemsBar from "../components/ItemsBar.vue";
import MainPanel from "../components/MainPanel.vue";

const store = mainStore();
const { players } = storeToRefs(store);

const audioPlayer = useAudioPlayerStore();
const audioPlayerElement = ref(null);

const isScoreboardShown = ref(false);
// const playersSortedByPoints = computed(() => {
//   return players.value.sort((a, b) => b.points - a.points);
// });

// console.log(players.value);

const playersReadyToAnswer = ref([
  { name: "blank", hasPressedReady: false, avatar: undefined },
]);

const isArtistNameShown = ref(false);
const isTrackNameShown = ref(false);
const isPosterShown = ref(false);

const currentQuestionState = ref("");
const countdown = ref(0);

const posterExists = computed(() => {
  return !audioPlayer.currentTrack.posterImg.endsWith("default.jpg");
});

const {
  currentTimeSeconds,
  currentTimeString,
  currentTrackIndex,
  currentTrack,
  isPlaying,
  tracks,
} = storeToRefs(audioPlayer);

audioPlayer.setTracks(tracksData.tracks);

const audioPlayerState = ref({
  tracks,
  currentTrack,
  currentTrackIndex,
  isPlaying,
  currentTimeSeconds,
});

watch(
  audioPlayerState,
  (newState) => {
    store.socket.emit("audioplayer-state-change", newState);
  },
  { deep: true },
);

// emits on every second change
// watch(currentTimeSeconds, (newTime) => {
//   store.socket.emit("update-server-time", newTime);
// });

onMounted(() => {
  store.socket.on("play-track", audioPlayer.play);
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

  store.socket.on("update-players-ready-to-answer", (players) => {
    playersReadyToAnswer.value = players;
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

  // store.socket.on("select-next-player", (playerId) => {
  //   selectedPlayerId.value = playerId;
  // });
  //
  // store.socket.on("select-prev-player", (playerId) => {
  //   selectedPlayerId.value = playerId;
  // });

  store.socket.on("select-next-player", (players) => {
    playersReadyToAnswer.value = players;
  });

  store.socket.on("select-prev-player", (players) => {
    playersReadyToAnswer.value = players;
  });

  // store.socket.on("update-players-data", (playersData) => {
  //   players.value = [...playersData];
  // });

  audioPlayer.initialize(audioPlayerElement.value);

  audioPlayerElement.value.addEventListener("ended", audioPlayer.nextTrack);
  audioPlayerElement.value.addEventListener(
    "timeupdate",
    audioPlayer.updateTime,
  );

  store.socket.emit("screen-loaded", audioPlayer.tracks);
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
  <div class="screenView__container">
    <div
      :class="
        isScoreboardShown
          ? 'screenView__scoreboard'
          : 'screenView__scoreboard_hidden'
      "
    >
      <div
        class="screenView__scoreboard__line"
        v-for="player of playersSortedByPoints"
      >
        <div class="screenView__scoreboard__line__playerName"></div>
        <div class="screenView__scoreboard__line__playerPoints"></div>
        {{ player }}
      </div>
    </div>
    <audio
      :src="audioPlayer.currentTrack.src"
      ref="audioPlayerElement"
      preload="auto"
    ></audio>
    <div class="screenView">
      <ItemsBar :items="playersReadyToAnswer" />
      <PlayerBoard :items="players" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.screenView {
  display: flex;
  height: 100%;
  flex-direction: column;
  // background-color: #660066;
  background: linear-gradient(to bottom, #1a001a 2.5%, #690069 76%, #bd00bd);
  // justify-content: center;
  align-items: center;
  gap: 6%;
  &__scoreboard {
    display: flex;
    flex-direction: column;
    background-color: white;
    position: fixed;
    height: 90%;
    width: 90%;
    top: 5%;
    left: 5%;
    z-index: 100;
    border: 3px solid black;
    border-radius: 10px;
    font-size: 40px;
    font-weight: bold;
    // justify-content: center;
    align-items: center;
    &_hidden {
      display: none;
    }
    &__line {
      display: flex;
      width: 30%;
      background-color: khaki;
      justify-content: start;
    }
  }
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
