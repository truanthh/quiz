<script setup>
import { ref, onMounted, computed } from "vue";
import { mainStore } from "../stores/mainStore";

const store = mainStore();
const users = [];
const usersReadyToAnswer = ref([]);

const usersSorted = computed(() => {
  return users.toSorted((a, b) => b.points - a.points);
});

const isPlayingAudioPlayer = ref(false);
const currentTrack = ref({});

function showArtist() {
  store.socket.emit("request-show-artist");
}

function showArtist() {
  store.socket.emit("request-show-trackname");
}

function handlePlay() {
  store.socket.emit("play-track", store.user);
}

function handlePause() {
  store.socket.emit("pause-track", store.user);
}

function nextQuestion() {
  store.socket.emit("next-question");
}

function prevQuestion() {
  store.socket.emit("prev-question", currentTrack);
}

function countArtistAnswerCorrect(user) {
  store.socket.emit(
    "count-artist-answer-correct",
    currentUserAnswering.value.token,
  );
}

function countArtistAnswerWrong(user) {
  store.socket.emit(
    "count-artist-answer-wrong",
    currentUserAnswering.value.token,
  );
}

function countTrackAnswerCorrect(user) {
  store.socket.emit(
    "count-track-answer-correct",
    currentUserAnswering.value.token,
  );
}

function countTrackAnswerWrong(user) {
  store.socket.emit(
    "count-track-answer-wrong",
    currentUserAnswering.value.token,
  );
}
onMounted(() => {
  store.socket.on("update-admin-track-data", (trackData) => {
    currentTrack.value = trackData;
  });
  store.socket.on("track-is-playing", () => {
    isPlayingAudioPlayer.value = true;
    console.log("PLAYING");
  });
  store.socket.on("track-is-paused-by-player", () => {
    isPlayingAudioPlayer.value = false;
  });

  store.socket.emit("admin-loaded", user.token);
});
</script>
<template>
  <div class="admin__container">
    <div class="debugInfo">{{ currentTrack.artist }}</div>
    <div class="debugInfo">{{ currentTrack.name }}</div>
    <div class="admin__buttonsRow">
      <button class="admin__button_default" @click="handlePause">PAUSE</button>
      <button class="admin__button_default" @click="handlePlay">PLAY</button>
    </div>
    <div class="admin__buttonsRow">
      <button class="admin__button_default" @click="showArtist">
        show artist
      </button>
      <button class="admin__button_default" @click="showTrackName">
        show trackname
      </button>
    </div>
    <div class="admin__buttonsRow">
      <button class="admin__button_default" @click="countTrackAnswerWrong">
        - track
      </button>
      <button class="admin__button_default" @click="countTrackAnswerCorrect">
        + track
      </button>
    </div>
    <div class="admin__buttonsRow">
      <button class="admin__button_default" @click="showArtist">
        show artist
      </button>
      <button class="admin__button_default" @click="showName">show name</button>
    </div>
    <div class="admin__buttonsRow">
      <button class="admin__button_default" @click="prevQuestion">prev</button>
      <button class="admin__button_default" @click="nextQuestion">next</button>
    </div>
  </div>
  <div class="admin__artist">{{ currentTrack.artist }}</div>
  <div class="admin__trackName">{{ currentTrack.name }}</div>
</template>
<style lang="scss">
.admin {
  &__buttonsRow {
    display: flex;
    width: 100%;
    height: 80px;
    justify-content: center;
    align-items: center;
  &__artist {
    font-size: 20px;
    font-weight: bold;
  }
  &__trackName {
    font-size: 20px;
    font-weight: bold;
  }
  &__container {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    // background-color: orange;
  }
  &__button {
    &_default {
      display: flex;
      width: 50%;
      height: 100px;
      outline: none;
      border-radius: 2px;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
