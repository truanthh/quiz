<script setup>
import { storeToRefs } from "pinia";
import { ref, onMounted, computed } from "vue";
import { mainStore } from "../stores/mainStore";

const store = mainStore();
const { users } = storeToRefs(store);
const usersReadyToAnswer = ref([]);

const isPlayingAudioPlayer = ref(false);
const currentTrack = ref({});

function showArtist(params) {
  store.socket.emit("request-show-artist-answer");
}

function showTrackName(params) {
  store.socket.emit("request-show-trackname-answer");
}

// store.user is admin
function handlePlay() {
  store.socket.emit("play-track", store.user);
}

// store.user is admin
function handlePause() {
  store.socket.emit("pause-track", store.user);
}

function nextQuestion() {
  store.socket.emit("next-question", currentTrack);
}

function prevQuestion() {
  store.socket.emit("prev-question", currentTrack);
}

function countArtistAnswerCorrect(user) {
  // currentUserAnswering.value.points += 100;
  store.socket.emit(
    "count-artist-answer-correct",
    currentUserAnswering.value.token,
  );
}

function countArtistAnswerWrong(user) {
  // currentUserAnswering.value.points -= 100;
  store.socket.emit(
    "count-artist-answer-wrong",
    currentUserAnswering.value.token,
  );
}

function countSongAnswerCorrect(user) {
  // currentUserAnswering.value.points += 200;
  store.socket.emit(
    "count-song-answer-correct",
    currentUserAnswering.value.token,
  );
}

function countSongAnswerWrong(user) {
  // currentUserAnswering.value.points -= 200;
  store.socket.emit("admin-loaded", store.user.token);
}
onMounted(() => {
  store.socket.on("bla", (newTrack) => {
    console.log(newTrack);
    currentTrack.value = newTrack;
  });
  store.socket.on("track-is-playing", () => {
    isPlayingAudioPlayer.value = true;
    console.log("PLAYING");
  });
  store.socket.on("track-is-paused-by-player", () => {
    isPlayingAudioPlayer.value = false;
  });

  store.socket.emit("admin-loaded", store.user.token);
});
</script>
<template>
  <div class="admin__container">
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
      <button class="admin__button_default" @click="countSongAnswerWrong">
        - song
      </button>
      <button class="admin__button_default" @click="songAnswerIsCorrect">
        + song
      </button>
    </div>
  </div>
  <div class="admin__artist">{{ currentTrack.artist }}</div>
  <div class="admin__trackName">{{ currentTrack.name }}</div>
</template>
<style lang="scss">
.admin {
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
  &__buttonsRow {
    display: flex;
    width: 100%;
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
