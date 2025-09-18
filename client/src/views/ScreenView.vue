<script setup>
import { storeToRefs } from "pinia";
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useAudioPlayerStore } from "../stores/useAudioPlayerStore.js";
import { mainStore } from "../stores/mainStore";

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

const { currentTimeSeconds, isPlaying, tracks } = storeToRefs(audioPlayer);

const songs = ref([
  {
    artist: "КИНО",
    name: "Последний Герой",
    src: "/V._Coj_Kino_-_Poslednij_geroj_(TheMP3.Info).mp3",
  },
  {
    artist: "КИНО",
    name: "Закрой за мной дверь, я ухожу",
    src: "/Kino_-_Zakroj_za_mnoj_dver_(TheMP3.Info).mp3",
  },
  {
    artist: "КИНО",
    name: "Кончится лето",
    src: "/KINO_-_Konchitsya_leto_(TheMP3.Info).mp3",
  },
  {
    artist: "Queen",
    name: "Show must go on",
    src: "/Queen_-_The_Show_Must_Go_On_(TheMP3.Info).mp3",
  },
  {
    artist: "Кино",
    name: "Звезда по имени солнце",
    src: "/zvezda.mp3",
  },
  {
    artist: "Аквариум",
    name: "Сестра",
    src: "Aquarium_-_Sestra_(TheMP3.Info).mp3",
  },
  {
    artist: "Кукрыниксы",
    name: "Надежда",
    src: "/Kukryniksy_-_Nadezhda_(TheMP3.Info).mp3",
  },
  {
    artist: "Queen",
    name: "Another one bites the dust",
    src: "/asdasd.mp3",
  },
]);

audioPlayer.setTracks(songs.value);

// emits on every second change
watch(currentTimeSeconds, (newTime) => {
  store.socket.emit("update-server-time", newTime);
});

onMounted(() => {
  store.socket.on("track-is-playing", audioPlayer.play);
  store.socket.on("track-is-paused-by-player", audioPlayer.pause);
  store.socket.on("track-is-paused-by-admin", audioPlayer.pause);
  store.socket.on("show-song-answer", () => {
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

  store.socket.emit("set-first-question", audioPlayer.currentTrack);
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
  <div class="screen__container">
    <div class="screen__topPart"></div>
    <div class="screen__topPart__leftPart">
      <audio
        :src="audioPlayer.currentTrack.src"
        ref="audioPlayerElement"
        preload="auto"
      ></audio>
      <div class="screen__topPart__leftPart__displayTime">
        {{ audioPlayer.currentTimeString }}
      </div>
      <div class="screen__topPart__leftPart__userAnswering">
        {{ currentUserAnswering }}
      </div>
      <div class="screen__topPart__leftPart__controls">
        <!-- <button @click="" class="control-btn">⏮</button> -->

        <button @click="" class="">
          {{ isPlaying ? "⏸️" : "▶️" }}
        </button>
        <!-- <button @click="" class="control-btn">⏭</button> -->
      </div>
    </div>
    <div class="screen__topPart__rightPart">
      <div class="screen__topPart__rightPart__usersTable"></div>
    </div>
    <div class="screen__bottomPart">
      <div class="screen__bottomPart__trackInfo">
        <div
          v-if="isTrackArtistShown"
          class="screen__bottomPart__trackInfo__trackArtist"
        >
          {{ trackArtist }}
        </div>
        <div
          v-if="isTrackArtistShown"
          class="screen__bottomPart__trackInfo__trackName"
        >
          {{ trackName }}
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.screen {
  &__container {
    display: flex;
    width: 100%;
    height: 30%;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
    justify-content: space-between;
    &__topPart {
      display: flex;
      &__leftPart {
        display: flex;
        flex-direction: column;
        width: 50%;
        &__displayTime {
          font-weight: bold;
          font-size: 80px;
          font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          color: rgba(0, 0, 0, 0.7);
        }
        &__controls {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 15px;
          &__playPauseButton {
            background: #4caf50;
            color: white;
          }
        }
        &__userAnswering {
          display: flex;
          justify-content: center;
          font-size: 80px;
          font-weight: bold;
          color: green;
        }
      }
      &__rightPart {
        display: flex;
        flex-direction: column;
        width: 50%;
        &__usersTable {
          display: flex;
          width: 100%;
          height: 100%;
          font-size: 18px;
          font-weight: bold;
        }
      }
    }
    &__bottomPart {
      display: flex;
      width: 100%;
      flex-direction: column;
      &__trackInfo {
        display: flex;
        align-items: center;
        justify-content: center;
        &__trackArtist {
          font-size: 120px;
          font-weight: bold;
          text-align: center;
        }
        &__trackName {
          font-size: 120px;
          font-weight: bold;
          text-align: center;
        }
      }
    }
  }
}
</style>
