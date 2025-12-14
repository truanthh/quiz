<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";
import { mainStore } from "../stores/mainStore";
import "spoilerjs/spoiler-span";
// import BaseTable from "../components/Table/BaseTable.vue";
// import TableRow from "../components/Table/TableRow.vue";
// import TableColumn from "../components/Table/TableColumn.vue";
import ImageSkeleton from "../components/ImageSkeleton.vue";
import tracksData from "../../tracks.json";
import PlayerBoard from "../components/PlayerBoard.vue";

const store = mainStore();
// const { players } = storeToRefs(store);
const usersReadyToAnswer = ref([]);

const audioPlayer = useAudioPlayerStore();
const audioPlayerElement = ref(null);

const isScoreboardShown = ref(false);
// const playersSortedByPoints = computed(() => {
//   return players.value.sort((a, b) => b.points - a.points);
// });

// console.log(players.value);

const players = [
  {
    avatar: 1,
    hasPressedReady: false,
    name: "Габарджон",
    points: 0,
    role: "player",
    socketId: "IdVtnstlr0SNTpOwAAAh",
    token: "711584ad-6e5a-4add-a053-e1de2a2ef7f4",
  },
  {
    avatar: 2,
    hasPressedReady: false,
    name: "Keni4ek",
    points: 0,
    role: "player",
    socketId: "IdVtnstlr0SNTpOwAAAh",
    token: "711584ad-6e5a-4add-a053-e1de2a2ef7f4",
  },
  {
    avatar: 3,
    hasPressedReady: false,
    name: "Сибмама",
    points: 0,
    role: "player",
    socketId: "IdVtnstlr0SNTpOwAAAh",
    token: "711584ad-6e5a-4add-a053-e1de2a2ef7f4",
  },
  {
    avatar: 4,
    hasPressedReady: false,
    name: "Бубубусик",
    points: 0,
    role: "player",
    socketId: "IdVtnstlr0SNTpOwAAAh",
    token: "711584ad-6e5a-4add-a053-e1de2a2ef7f4",
  },
  {
    avatar: 5,
    hasPressedReady: false,
    name: "Xavier",
    points: 0,
    role: "player",
    socketId: "IdVtnstlr0SNTpOwAAAh",
    token: "711584ad-6e5a-4add-a053-e1de2a2ef7f4",
  },
  {
    avatar: 6,
    hasPressedReady: false,
    name: "Попался",
    points: 0,
    role: "player",
    socketId: "IdVtnstlr0SNTpOwAAAh",
    token: "711584ad-6e5a-4add-a053-e1de2a2ef7f4",
  },
  {
    avatar: 7,
    hasPressedReady: false,
    name: "Makaka",
    points: 0,
    role: "player",
    socketId: "IdVtnstlr0SNTpOwAAAh",
    token: "711584ad-6e5a-4add-a053-e1de2a2ef7f4",
  },
  {
    avatar: 8,
    hasPressedReady: false,
    name: "Lohpidr",
    points: 0,
    role: "player",
    socketId: "IdVtnstlr0SNTpOwAAAh",
    token: "711584ad-6e5a-4add-a053-e1de2a2ef7f4",
  },
];

// const usersSortedByPoints = computed(() => {
//   return users.sort((a, b) => b.points - a.points);
// });

// const trackArtist = ref("");
// const trackName = ref("");
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

  store.socket.on("update-users-ready-to-answer", (usersReadyToAnswerArr) => {
    usersReadyToAnswer.value = usersReadyToAnswerArr;
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
      <div class="screenView__mainPanel">
        <!-- <div class="screenView__mainPanel__status"> -->
        <!--   <div class="screenView__mainPanel__status__questionNumber"> -->
        <!--     <span class="text__questionNumber"> -->
        <!--       #{{ currentTrackIndex + 1 }}</span -->
        <!--     > -->
        <!--   </div> -->
        <!--   <div class="screenView__mainPanel__status__clock"> -->
        <!--     <span class="text__clock"> {{ currentTimeString }}</span> -->
        <!--   </div> -->
        <!--   <div class="screenView__mainPanel__status__pointsChange"> -->
        <!--     <span class="text__pointsChange"> +100 </span> -->
        <!--   </div> -->
        <!-- </div> -->
        <div class="screenView__mainPanel__posterContainer">
          <div class="screenView__mainPanel__posterContainer__poster">
            <img
              class="screenView__mainPanel__posterContainer__poster__img"
              :src="audioPlayer.currentTrack.posterImg"
              v-if="isPosterShown && posterExists"
            />
            <!-- <ImageSkeleton v-else /> -->
            <!-- <spoiler-span class="spoiler" v-else> -->
            <img
              class="screenView__mainPanel__posterContainer__poster__gif"
              :src="`/gifs/pocoyo1.gif`"
            />
            <!-- </spoiler-span> -->
          </div>
        </div>
        <!-- <span class="text__clock" v-if="countdown !== 0"> -->
        <!--   {{ countdown }}</span -->
        <!-- > -->
        <div class="screenView__mainPanel__trackInfo">
          <div class="screenView__mainPanel__trackInfo__currentTime">
            {{ currentTimeString }}
          </div>
          <div class="screenView__mainPanel__trackInfo__artistName">
            <Transition name="fade">
              <span v-if="isArtistNameShown"> {{ currentTrack.artist }} </span>
              <spoiler-span class="spoiler" v-else>
                {{ currentTrack.artist }}
              </spoiler-span>
            </Transition>
          </div>
          <div class="screenView__mainPanel__trackInfo__trackName">
            <Transition name="fade">
              <span v-if="isTrackNameShown" class="spoilerIn">
                {{ currentTrack.name }}
              </span>
              <spoiler-span class="spoiler" v-else>
                {{ currentTrack.name }}
              </spoiler-span>
            </Transition>
          </div>
        </div>
        <div class="screenView__mainPanel__emptySpace"></div>
      </div>
      <PlayerBoard :items="players" class="playerGrid" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.playerGrid {
  height: 250px;
  width: 1200px;
  // background-color: orange;
}

.fade-enter-active {
  transition: opacity 2s ease;
}

.fade-enter-from {
  opacity: 0;
}

.spoiler {
  color: white;
}

.screenView {
  display: flex;
  height: 100%;
  flex-direction: column;
  // background-color: #660066;
  background: linear-gradient(to bottom, #1a001a 2.5%, #690069 76%, #bd00bd);
  // justify-content: center;
  align-items: center;
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
  &__mainPanel {
    display: flex;
    margin-top: 5vh;
    width: 100%;
    height: 30vh;
    // background-color: orange;
    justify-content: center;
    &__posterContainer {
      display: flex;
      align-items: center;
      justify-content: center;
      // height: 400px;
      // width: 400px;
      &__poster {
        display: flex;
        justify-content: center;
        align-items: center;
        // height: 100%;
        // width: 100%;
        height: 30vh;
        width: 30vh;
        &__img {
          height: 100%;
          width: 100%;
          object-fit: cover;
        }
        &__gif {
          height: 100%;
          width: 100%;
          object-fit: cover;
        }
      }
    }
    &__trackInfo {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      // width: 30%;
      height: 100%;
      // background-color: lightgreen;
      &__currentTime {
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 50px;
        // background-color: white;
        width: 100%;
        height: 100%;
      }
      &__artistName {
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        font-size: 30px;
        font-weight: bold;
        word-break: break-all;
        // text-align: center;
        // background-color: aquamarine;
      }
      &__trackName {
        display: flex;
        // background-color: gray;
        width: 100%;
        height: 100%;
        font-size: 40px;
        font-weight: bold;
        justify-content: center;
        align-items: center;
        word-break: break-all;
        // text-align: center;
      }
    }
    &__emptySpace {
      display: flex;
      width: 120px;
    }
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
