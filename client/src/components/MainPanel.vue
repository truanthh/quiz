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
    <div class="trackInfo">
      <div class="trackInfo__questionId">
        #{{ state.currentQuestionId + 1 }}
      </div>
      <div class="trackInfo__currentTime">
        {{ state.currentQuestion.currentTimeString }}
      </div>
      <div class="trackInfo__artistName">
        <Transition name="fade">
          <span v-if="state.currentQuestion?.isArtistNameRevealed">
            {{ state.currentQuestion?.track.artist }}
          </span>
          <spoiler-span
            class="spoiler"
            v-else
            :key="state.currentQuestion?.track.artist"
          >
            {{ state.currentQuestion?.track.artist }}
          </spoiler-span>
        </Transition>
      </div>
      <div class="trackInfo__trackName">
        <Transition name="fade">
          <span
            v-if="state.currentQuestion?.isTrackNameRevealed"
            class="spoiler"
          >
            {{ state.currentQuestion?.track.name }}
          </span>
          <spoiler-span
            class="spoiler"
            v-else
            :key="state.currentQuestion?.track.name"
          >
            {{ state.currentQuestion?.track.name }}
          </spoiler-span>
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
}

.mainPanel {
  &__container {
    display: flex;
    justify-content: start;
    margin-top: 2%;
    width: 50%;
    height: 30vh;
    // background-color: khaki;
    margin-left: 10%;
  }
}
.emptySpace {
  display: flex;
  width: 120px;
}

.trackInfo {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  justify-content: end;
  &__questionId {
    display: flex;
    font-size: 18px;
    color: white;
    width: 100%;
  }
  &__currentTime {
    display: flex;
    width: 100%;
    font-weight: bold;
    font-size: 40px;
    // padding-left: 15%;
    margin-bottom: 5%;
    color: white;
  }
  &__artistName {
    display: flex;
    width: 100%;
    font-size: 30px;
    font-weight: bold;
  }
  &__trackName {
    display: flex;
    width: 100%;
    font-size: 40px;
    font-weight: bold;
    margin-bottom: 5%;
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
