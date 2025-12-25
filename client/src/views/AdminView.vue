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

function showScoreboard() {
  store.socket.emit("request-show-scoreboard");
}

function showArtistName() {
  store.socket.emit("request-show-artist");
}

function showTrackName() {
  store.socket.emit("request-show-trackname");
}

function showPoster() {
  store.socket.emit("request-show-poster");
}

function handlePlay() {
  store.socket.emit("request-play-track", store.user);
}

function handlePause() {
  store.socket.emit("request-pause-track", store.user);
}

function nextQuestion() {
  store.socket.emit("next-question");
}

function prevQuestion() {
  store.socket.emit("prev-question");
}

function artistNameCorrect() {
  showArtistName();
  store.socket.emit("artist-name-correct");
}

function artistNameWrong() {
  store.socket.emit("artist-name-wrong");
}

function trackNameCorrect() {
  showTrackName();
  store.socket.emit("track-name-correct");
}

function trackNameWrong() {
  store.socket.emit("track-name-wrong");
}

function prevPlayer() {
  store.socket.emit("request-select-prev-player");
}

function nextPlayer() {
  store.socket.emit("request-select-next-player");
}

onMounted(() => {
  store.socket.on("update-audioplayer-client-state", (newState) => {
    currentTrack.value = newState.currentTrack;
    isPlayingAudioPlayer.value = newState.isPlaying;
  });

  store.socket.emit("admin-loaded", store.user.token);
});
</script>
<template>
  <div class="admin__container">
    <div class="admin__buttonsRow_controls">
      <div class="admin__buttonsRow">
        <button class="admin__button_default" @click="handlePause">
          <span
            style="
              display: inline-block;
              font-size: 18px;
              color: #000000;
              border-radius: 6px;
              padding: 10px 20px;
            "
            >❚❚</span
          >
        </button>
        <button class="admin__button_default" @click="prevQuestion">
          <span
            style="
              display: inline-block;
              font-size: 30px;
              color: #000000;
              border-radius: 6px;
              padding: 10px 20px;
            "
            >⏮</span
          >
        </button>
      </div>
      <div class="admin__buttonsRow">
        <button class="admin__button_default" @click="nextQuestion">
          <span
            style="
              display: inline-block;
              font-size: 30px;
              color: #000000;
              border-radius: 6px;
              padding: 10px 20px;
            "
            >⏭</span
          >
        </button>
        <button class="admin__button_default" @click="handlePlay">
          <span
            style="
              display: inline-block;
              font-size: 34px;
              color: #000000;
              border-radius: 6px;
              padding: 10px 20px;
            "
            >▶</span
          >
        </button>
      </div>
    </div>
    <div class="admin__trackInfo">
      <div class="admin__trackInfo__artist">{{ currentTrack.artist }}</div>
      <div class="admin__trackInfo__trackName">{{ currentTrack.name }}</div>
    </div>
    <div class="admin__buttonsRow">
      <button class="admin__button_default" @click="prevPlayer">
        prevPlayer
      </button>
      <button class="admin__button_default" @click="nextPlayer">
        nextPlayer
      </button>
    </div>
    <div class="admin__buttonsRow">
      <button class="admin__button_red" @click="artistNameWrong">
        artist name
      </button>
      <button class="admin__button_green" @click="artistNameCorrect">
        artist name
      </button>
    </div>
    <div class="admin__buttonsRow">
      <button class="admin__button_red" @click="trackNameWrong">
        track name
      </button>
      <button class="admin__button_green" @click="trackNameCorrect">
        track name
      </button>
    </div>
    <br />
    <br />
    <div class="admin__buttonsRow">
      <button class="admin__button_default" @click="showArtistName">
        show artist name
      </button>
      <button class="admin__button_default" @click="showTrackName">
        show track name
      </button>
    </div>
    <div class="admin__buttonsRow">
      <button class="admin__button_default" @click="showPoster">
        show poster
      </button>
      <button class="admin__button_default" @click="showScoreboard">
        show scoreboard
      </button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.admin {
  &__container {
    display: flex;
    height: 100vh;
    width: 100vw;
    flex-direction: column;
    // background-color: orange;
  }
  &__buttonsRow {
    display: flex;
    width: 100%;
    height: 80px;
    &_controls {
      display: flex;
      width: 100%;
      height: 80px;
      margin-top: 0px;
      margin-bottom: 30px;
    }
  }
  &__button {
    &_default,
    &_green,
    &_red {
      display: flex;
      width: 50%;
      height: 100px;
      outline: none;
      border: 1px solid gray;
      border-radius: 2px;
      align-items: center;
      justify-content: center;
      transition: transform 0.1s ease;

      &:active {
        transform: scale(0.95);
      }
    }

    &_green {
      background-color: green;
    }

    &_red {
      background-color: #e55353;
    }
  }
  &__trackInfo {
    margin-bottom: 10px;
    &__artist {
      font-size: 18px;
    }
    &__trackName {
      font-size: 18px;
    }
  }
}
</style>
