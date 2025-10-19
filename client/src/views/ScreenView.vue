<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";
import { mainStore } from "../stores/mainStore";
import BaseTable from "../components/Table/BaseTable.vue";
import TableRow from "../components/Table/TableRow.vue";
import TableColumn from "../components/Table/TableColumn.vue";
import ImageSkeleton from "../components/ImageSkeleton.vue";
import tracksData from "../../tracks.json";

const store = mainStore();

const audioPlayerElement = ref(null);
const audioPlayer = useAudioPlayerStore();

const usersReadyToAnswer = ref([]);

const usersSortedByPoints = computed(() => {
  return users.sort((a, b) => b.points - a.points);
});

const trackArtist = ref("");
const trackName = ref("");
const isArtistShown = ref(false);
const isTrackNameShown = ref(false);

const isPosterShown = ref(false);

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
})

watch(audioPlayerState, (newState) => {
  store.socket.emit("audioplayer-state-change", newState);
}, { deep: true })

// emits on every second change
// watch(currentTimeSeconds, (newTime) => {
//   store.socket.emit("update-server-time", newTime);
// });

onMounted(() => {
  store.socket.on("play-track", audioPlayer.play);
  store.socket.on("pause-track", audioPlayer.pause);

  store.socket.on("update-question", (currQuestionId) => {
    audioPlayer.changeTrack(currQuestionId);
    isTrackNameShown.value = false;
    isArtistShown.value = false;
    isPosterShown.value = false;
  });

  store.socket.on("update-users-ready-to-answer", (usersReadyToAnswerArr) => {
    usersReadyToAnswer.value = usersReadyToAnswerArr;
  });

  store.socket.on("show-trackname", () => {
    isTrackNameShown.value = true;
  });

  store.socket.on("show-artist", () => {
    isArtistShown.value = true;
  });

  store.socket.on("show-poster", () => {
    isPosterShown.value = true;
  });

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
    <audio
      :src="audioPlayer.currentTrack.src"
      ref="audioPlayerElement"
      preload="auto"
    ></audio>
    <div class="screenView__left"></div>
    <div class="screenView__mid">
      <div class="screenView__mid__empty"></div>
      <div class="screenView__mid__main">
        <div class="screenView__mid__main__status">
          <div class="screenView__mid__main__status__questionNumber">
            <span class="text__questionNumber">
              #{{ currentTrackIndex + 1 }}</span
            >
          </div>
          <div class="screenView__mid__main__status__clock">
            <span class="text__clock"> {{ currentTimeString }}</span>
          </div>
          <div class="screenView__mid__main__status__pointsChange">
            <span class="text__pointsChange"> +100 </span>
          </div>
        </div>
        <div class="screenView__mid__main__trackInfo">
          <div class="screenView__mid__main__trackInfo__posterContainer">
            <div
              class="screenView__mid__main__trackInfo__posterContainer__poster"
            >
              <img
                class="screenView__mid__main__trackInfo__posterContainer__poster__img"
                :src="audioPlayer.currentTrack.posterImg"
                v-if="isPosterShown && posterExists"
              />
              <ImageSkeleton v-else />
            </div>
          </div>

          <div class="screenView__mid__main__trackInfo__artistAndTrackNameText">
            <div
              class="screenView__mid__main__trackInfo__artistAndTrackNameText__artist"
            >
              <span v-if="isArtistShown"> {{ currentTrack.artist }} </span>
            </div>
            <div
              class="screenView__mid__main__trackInfo__artistAndTrackNameText__trackName"
            >
              <span v-if="isTrackNameShown"> {{ currentTrack.name }} </span>
            </div>
          </div>
        </div>
      </div>
      <div class="screenView__mid__main__usersReadyToAnswer">
        <base-table>
          <table-row v-for="user in usersReadyToAnswer" :key="user.token">
            <table-column>
              {{ user.name }}
            </table-column>
          </table-row>
        </base-table>
      </div>
    </div>
    <div class="screenView__right"></div>
  </div>
</template>
<style lang="scss" scoped>
.screenView {
  &__container {
    display: flex;
    height: 100%;
  }
  &__left {
    display: flex;
    height: 100%;
    width: 18%;
    // background-color: pink;
  }
  &__mid {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 64%;
    // background-color: gray;
    &__empty {
      width: 100%;
      height: 2%;
    }
    &__main {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      height: 50%;
      &__status {
        display: flex;
        position: relative;
        &__questionNumber {
          display: flex;
          justify-content: center;
          align-items: center;
          // background-color: lightgray;
          width: 20%;
        }
        &__clock {
          display: flex;
          width: 50%;
          justify-content: center;
          // background-color: orange;
        }
        &__pointsChange {
          display: flex;
          width: 30%;
          justify-content: center;
          align-items: center;
          // background-color: khaki;
          padding-right: 4%;
        }
      }
      &__trackInfo {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 300px;
        // background-color: green;
        &__posterContainer {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40%;
          // background-color: green;
          padding-left: 50px;
          &__poster {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
            width: 200px;
            &__img {
              height: 100%;
              width: 100%;
              object-fit: cover;
            }
          }
        }
        &__artistAndTrackNameText {
          display: flex;
          height: 100%;
          width: 60%;
          // background-color: orange;
          flex-direction: column;
          &__artist {
            display: flex;
            width: 100%;
            height: 100%;
            flex-direction: column;
            font-size: 30px;
            font-weight: bold;
            justify-content: center;
            align-items: center;
            padding-right: 40px;
            // background-color: yellow;
            padding-top: 10%;
            word-break: break-all;
            text-align: center;
          }
          &__trackName {
            display: flex;
            width: 100%;
            height: 100%;
            flex-direction: column;
            font-size: 40px;
            font-weight: bold;
            justify-content: center;
            align-items: center;
            padding-right: 38px;
            // background-color: orange;
            padding-bottom: 12%;
            word-break: break-all;
            text-align: center;
          }
        }
      }
      &__usersReadyToAnswer {
        display: flex;
        flex-direction: column;
        margin-top: 50px;
        width: 100%;
        height: 300px;
        background-color: khaki;
        color: green;
        font-size: 60px;
        &:first-child {
          font-size: 40px;
          font-weight: bold;
        }
      }
    }
  }
  &__right {
    display: flex;
    height: 100%;
    width: 18%;
    // background-color: pink;
  }
}

.text {
  &__questionNumber {
    font-size: 70px;
    font-weight: bold;
  }
  &__clock {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-weight: bold;
    font-size: 90px;
  }
  &__pointsChange {
    font-size: 90px;
    font-weight: bold;
  }
}
</style>
