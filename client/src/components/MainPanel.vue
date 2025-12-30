<script setup>
import "spoilerjs/spoiler-span";

const props = defineProps({
  state: {
    type: Object,
    default: {
      questions: [],
      currentQuestion: {
        track: { name: "trackname", artist: "artistname" },
        state: "",
        isArtistNameRevealed: false,
        isTrackNameRevealed: false,
        isPosterRevealed: false,
      },
      currentQuestionId: 0,
      players: [],
      playerTokens: [],
      playersReadyToAnswer: [
        { name: "blankstore", hasPressedReady: false, avatar: 0 },
      ],
      selectedPlayerId: 0,
    },
  },
});
</script>

<template>
  <div class="mainPanel__container">
    <div class="questionId">#{{ state.currentQuestionId + 1 }}</div>
    <div class="poster__container">
      <div class="poster">
        <Transition name="fade">
          <img
            v-if="state.currentQuestion?.isPosterRevealed"
            class="poster__img"
            :src="`${state.currentQuestion?.track.posterImg}`"
          />
          <div class="spoilerPoster" v-else>
            <!-- prettier-ignore -->
            <spoiler-span class="spanana">
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
              11111111111111111111111111111111
            </spoiler-span>
          </div>
        </Transition>
      </div>
    </div>
    <!-- <span class="countdown" v-else> ~ </span> -->
  </div>
</template>

<style lang="scss" scoped>
.spanana {
  font-size: 16px;
  word-break: break-all;
  overflow: hidden;
  line-height: 0.9;
}
.spoilerPoster {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  font-size: 2.3em;
  line-height: 80%;
  // text-align: center;
  // justify-content: center;
  // align-items: center;
}

.questionId {
  position: fixed;
  font-size: 33px;
  color: white;
  top: 0;
  left: 0;
}

.mainPanel {
  &__container {
    display: flex;
    margin-top: 2%;
    width: 100vw;
    height: 30vh;
    // background-color: khaki;
    justify-content: center;
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
    // align-items: center;
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
    // justify-content: center;
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
