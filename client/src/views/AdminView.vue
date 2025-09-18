<script setup>
import { storeToRefs } from "pinia";
import { ref, onMounted, computed } from "vue";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";
import { mainStore } from "../stores/mainStore";

const store = mainStore();
const audioPlayer = useAudioPlayerStore();
const { currentTrack } = storeToRefs(audioPlayer);
const { users } = storeToRefs(store);

const isPlayingAudioPlayer = ref(false);

const currentSong = currentTrack;
const usersReadyToAnswer = ref([]);

// const songs = ref([]);
// const currentSongId = ref([]);
// const currentSong = computed(() => {
//   return songs[currentSongId];
// });

// store.user is admin
function handlePlay() {
  store.socket.emit("play-track", store.user);
}

// store.user is admin
function handlePause() {
  store.socket.emit("pause-track", store.user);
}

function nextQuestion() {
  audioPlayer.nextTrack();
  store.socket.emit("next-question", currentTrack);
}

function prevQuestion() {
  audioPlayer.prevTrack();
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
  store.socket.emit(
    "count-song-answer-wrong",
    currentUserAnswering.value.token,
  );
}

onMounted(() => {
  store.socket.on("track-is-playing", () => {
    isPlayingAudioPlayer.value = true;
  });
  store.socket.on("track-is-paused-by-player", () => {
    isPlayingAudioPlayer.value = false;
  });
});
</script>
<template>
  <div class="admin__container">
    <div class="debug"></div>
    <div class="admin__buttonsRow1">
      <button class="admin__button_default" @click="handlePause">PAUSE</button>
      <button class="admin__button_default" @click="handlePlay">PLAY</button>
    </div>
    <div class="admin__buttonsRow2">
      <button class="admin__button_default" @click="countArtistAnswerCorrect">
        - artist
      </button>
      <button class="admin__button_default" @click="countArtistAnswerWrong">
        + artist
      </button>
    </div>
    <div class="admin__buttonsRow3">
      <button class="admin__button_default" @click="songAnswerIsWrong">
        - song
      </button>
      <button class="admin__button_default" @click="songAnswerIsCorrect">
        + song
      </button>
    </div>
  </div>
</template>
<style lang="scss">
.admin {
  &__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  &__button {
    &_default {
      display: flex;
      width: 200px;
      height: 100px;
    }
  }
}
</style>
