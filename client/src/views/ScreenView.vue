<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";
import { mainStore } from "../stores/mainStore";
// import BaseTable from "../components/Table/BaseTable.vue";
// import TableRow from "../components/Table/TableRow.vue";
// import TableColumn from "../components/Table/TableColumn.vue";
import tracksData from "../../tracks.json";
import PlayerBoardBars from "../components/PlayerBoardBars.vue";
import ItemsBar from "../components/ItemsBar.vue";
import MainPanel from "../components/MainPanel.vue";

const store = mainStore();
const { players, playersReadyToAnswer, receivedAudioPlayerState } =
  storeToRefs(store);

const audioPlayer = useAudioPlayerStore();
const audioPlayerElement = ref(null);

const isScoreboardShown = ref(false);

const playersSortedByPoints = computed(() => {
  return players.value.sort((a, b) => b.points - a.points);
});

const isDebugPanelShown = ref(false);

function toggleDebugPanel() {
  isDebugPanelShown.value = !isDebugPanelShown.value;
}

const isArtistNameShown = ref(false);
const isTrackNameShown = ref(false);
const isPosterShown = ref(true);

const currentQuestionState = ref("");
const countdown = ref(0);

const posterExists = computed(() => {
  return !audioPlayer.currentTrack.posterImg.endsWith("default.jpg");
});

audioPlayer.setTracks(tracksData.tracks);

// we sending audioplayer state to server every second while track is playing
// and receiving state from the server to display data
// why is it being sent by screen and not audioPlayer?
// maybe because audioplayer is only existing in screen component
const {
  currentTimeSeconds,
  currentTrackIndex,
  currentTrack,
  isPlaying,
  tracks,
} = storeToRefs(audioPlayer);

// const currentTimeString = ref("00:00");

// state that we send to server
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

  store.socket.on("select-next-player", (players) => {
    playersReadyToAnswer.value = players;
  });

  store.socket.on("select-prev-player", (players) => {
    playersReadyToAnswer.value = players;
  });

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
    {{ playersSortedByPoints }}
  </div>
  <div class="screenView__container">
    <!-- AUDIO AND SCOREBOARD -->
    <div
      :class="
        isScoreboardShown
          ? 'screenView__scoreboard'
          : 'screenView__scoreboard_hidden'
      "
    >
      <div class="screenView__scoreboard__line" v-for="player of players">
        <div class="screenView__scoreboard__line__playerName">
          {{ player.name }}
        </div>
        -----------
        <div class="screenView__scoreboard__line__playerPoints">
          {{ player.points }}
        </div>
      </div>
    </div>
    <audio
      :src="audioPlayer.currentTrack.src"
      ref="audioPlayerElement"
      preload="auto"
    ></audio>
    <!-- ---------------------- -->
    <div class="screenView">
      <MainPanel
        :state="receivedAudioPlayerState"
        :countdown
        :isPosterShown
        :posterExists
        :isArtistNameShown
        :isTrackNameShown
      />
      <ItemsBar :items="playersReadyToAnswer" />
      <PlayerBoardBars :items="players" />
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
