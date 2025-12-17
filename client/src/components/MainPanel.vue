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
  poster: {
    type: String,
    default: "",
  },
  time: {
    type: String,
    default: "00:00",
  },
  artistName: {
    type: String,
    default: "Darude",
  },
  trackName: {
    type: String,
    default: "Sandstorm",
  },
});
</script>

<template>
  <div class="mainPanel__container">
    <!-- <div class="screenView__mainPanel__status"> -->
    <!--   <div class="screenView__mainPanel__status__questionNumber"> -->
    <!--     <span class="text__questionNumber"> -->
    <!--       #{{ currentTrackIndex + 1 }}</span -->
    <!--     > -->
    <!--   </div> -->
    <!--   <div class="screenView__mainPanel__status__pointsChange"> -->
    <!--     <span class="text__pointsChange"> +100 </span> -->
    <!--   </div> -->
    <!-- </div> -->
    <div class="poster__container">
      <div class="poster">
        <img
          class="poster__img"
          :src="poster"
          v-if="isPosterShown && posterExists"
        />
        <!-- <ImageSkeleton v-else /> -->
        <!-- <spoiler-span class="spoiler" v-else> -->
        <img v-else class="poster__gif" :src="pocoyo1" />
        <!-- </spoiler-span> -->
      </div>
    </div>
    <!-- <span class="text__clock" v-if="countdown !== 0"> -->
    <!--   {{ countdown }}</span -->
    <!-- > -->
    <div class="trackInfo">
      <div class="trackInfo__currentTime">
        {{ time }}
      </div>
      <div class="trackInfo__artistName">
        <Transition name="fade">
          <span v-if="isArtistNameShown"> {{ artistName }} </span>
          <spoiler-span class="spoiler" v-else>
            {{ artistName }}
          </spoiler-span>
        </Transition>
      </div>
      <div class="trackInfo__trackName">
        <Transition name="fade">
          <span v-if="isTrackNameShown" class="spoiler">
            {{ trackName }}
          </span>
          <spoiler-span class="spoiler" v-else>
            {{ trackName }}
          </spoiler-span>
        </Transition>
      </div>
    </div>
    <div class="emptySpace"></div>
  </div>
</template>

<style lang="scss" scoped>
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
    // background-color: white;
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
