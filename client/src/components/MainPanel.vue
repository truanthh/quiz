<script setup>
import "spoilerjs/spoiler-span";
import ImageSkeleton from "../components/ImageSkeleton.vue";
import pocoyo1 from "../../assets/gifs/pocoyo1.gif";

const props = defineProps({
  isPosterShown: {
    type: Boolean,
    default: false,
  },
  posterExists: {
    type: Boolean,
    default: false,
  },
  isTrackNameShown: {
    type: Boolean,
    default: false,
  },
  isArtistNameShown: {
    type: Boolean,
    default: false,
  },
  countdown: {
    type: Number,
    default: 0,
  },
  state: {
    type: Object,
    default: {
      questions: [],
      currentQuestion: {},
      currentQuestionId: 0,
      players: [],
      playerTokens: [],
      playersReadyToAnswer: [
        { name: "blankstore", hasPressedReady: false, avatar: 0 },
      ],
      selectedPlayerId: 0,
      audioPlayer: {
        currentTrack: { posterImg: "" },
        currentTrackId: 0,
        isPlaying: false,
        currentTimeSeconds: 0,
        currentTimeString: "00:00",
      },
    },
  },
});
</script>

<template>
  <div class="mainPanel__container">
    <div class="poster__container">
      <div class="poster">
        <img
          class="poster__img"
          :src="`${state.audioPlayer.currentTrack.posterImg}`"
          v-if="isPosterShown && posterExists"
        />
        <img v-else class="poster__gif" :src="pocoyo1" />
      </div>
    </div>
    <div class="trackInfo">
      <div class="trackInfo__currentTime">
        {{ state.audioPlayer.currentTimeString }}
      </div>
      <div class="trackInfo__artistName">
        <Transition name="fade">
          <span v-if="isArtistNameShown">
            {{ state.audioPlayer.currentTrack.artist }}
          </span>
          <spoiler-span
            class="spoiler"
            v-else
            :key="state.audioPlayer.currentTrack.artist"
          >
            {{ state.audioPlayer.currentTrack.artist }}
          </spoiler-span>
        </Transition>
      </div>
      <div class="trackInfo__trackName">
        <Transition name="fade">
          <span v-if="isTrackNameShown" class="spoiler">
            {{ state.audioPlayer.currentTrack.name }}
          </span>
          <spoiler-span
            class="spoiler"
            v-else
            :key="state.audioPlayer.currentTrack.name"
          >
            {{ state.audioPlayer.currentTrack.name }}
          </spoiler-span>
        </Transition>
      </div>
    </div>
    <span class="countdown" v-if="countdown !== 0"> {{ countdown }}</span>
    <span class="countdown" v-else> ~ </span>
  </div>
</template>

<style lang="scss" scoped>
.countdown {
  font-size: 33px;
  color: white;
}

.mainPanel {
  &__container {
    display: flex;
    margin-top: 2%;
    width: 100%;
    height: 30%;
    // background-color: khaki;
    justify-content: center;
    gap: 2%;
  }
}
.emptySpace {
  display: flex;
  width: 120px;
}

.trackInfo {
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
    // background-color: orange;
    width: 100%;
    height: 100%;
    padding-top: 60px;
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
    padding-top: 20px;
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
    padding-bottom: 50px;
  }
}

.poster {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80%;
  width: 80%;
  &__container {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
  }
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

.fade-enter-active {
  transition: opacity 2s ease;
}

.fade-enter-from {
  opacity: 0;
}

.spoiler {
  color: white;
}
</style>
