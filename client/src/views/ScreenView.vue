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

const { currentUserAnswering } = storeToRefs(store);

const usersSortedByPoints = computed(() => {
  return users.sort((a, b) => b.points - a.points);
});

const trackArtist = ref("");
const trackName = ref("");
const isTrackArtistShown = ref(false);
const isTrackNameShown = ref(false);

const {
  currentTimeSeconds,
  currentTimeString,
  currentTrackIndex,
  currentTrack,
  isPlaying,
  tracks,
} = storeToRefs(audioPlayer);

audioPlayer.setTracks(tracksData.tracks);

// emits on every second change
watch(currentTimeSeconds, (newTime) => {
  store.socket.emit("update-server-time", newTime);
});

onMounted(() => {
  store.socket.on("track-is-playing", audioPlayer.play);
  store.socket.on("track-is-paused-by-player", audioPlayer.pause);
  store.socket.on("track-is-paused-by-admin", audioPlayer.pause);
  store.socket.on("show-trackname-answer", () => {
    isTrackNameShown.value = true;
  });
  store.socket.on("show-artist-answer", () => {
    isTrackArtistShown.value = true;
  });

  audioPlayer.initialize(audioPlayerElement.value);

  audioPlayerElement.value.addEventListener("ended", audioPlayer.nextTrack);
  audioPlayerElement.value.addEventListener(
    "timeupdate",
    audioPlayer.updateTime,
  );

  store.socket.emit("set-tracks", audioPlayer.tracks);
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
            <ImageSkeleton
              class="screenView__mid__main__trackInfo__posterContainer__poster"
            />
          </div>

          <div class="screenView__mid__main__trackInfo__artistAndTrackNameText">
            <div
              class="screenView__mid__main__trackInfo__artistAndTrackNameText__artist"
            >
              <span v-if="isTrackArtistShown"> {{ currentTrack.artist }} </span>
            </div>
            <div
              class="screenView__mid__main__trackInfo__artistAndTrackNameText__trackName"
            >
              <span v-if="isTrackNameShown"> {{ currentTrack.name }} </span>
            </div>
          </div>
        </div>
      </div>
      <!-- <div class="screenView__mid__usersTable"> -->
      <base-table :headers :columnsTemplate>
      <!--     <table-row -->
      <!--       v-for="user in usersSorted" -->
      <!--       :key="user.token" -->
      <!--       :columnsTemplate -->
      <!--     > -->
      <!--       <table-column> -->
      <!--         {{ user.name }} -->
      <!--       </table-column> -->
      <!--       <table-column> -->
      <!--         {{ user.points }} -->
      <!--       </table-column> -->
      <!--     </table-row> -->
      <!--   </base-table> -->
      <!-- </div> -->
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
      height: 10%;
    }
    &__main {
      display: flex;
      flex-direction: column;
      gap: 100px;
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
            height: 250px;
            width: 300px;
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
            font-size: 50px;
            font-weight: bold;
            justify-content: center;
            align-items: center;
            padding-right: 40px;
            // background-color: yellow;
          }
          &__trackName {
            display: flex;
            width: 100%;
            height: 100%;
            flex-direction: column;
            font-size: 60px;
            font-weight: bold;
            justify-content: center;
            align-items: center;
            padding-right: 40px;
            // background-color: orange;
          }
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
