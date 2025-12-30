<script setup>
import { computed } from "vue";
import { getAvatar, getGif } from "@/utils/avatars";

const props = defineProps({
  items: {
    type: Array,
    default: [],
  },
});

const bla = computed(() => {
  return [...props.items];
});
</script>

<template>
  <div class="playerBoardBars__container">
    <div class="bar">
      <div class="cell" v-for="(player, i) of bla.slice(0, 4)" :key="i">
        <div class="player">
          <img
            class="player__avatar"
            :src="getAvatar(player.avatar)"
            v-if="!player.hasPressedReady"
          />
          <img
            class="player__altAvatar"
            :src="getGif(player.altAvatar)"
            v-else
          />
          <div class="player__name" v-if="!player.hasPressedReady">
            {{ player ? player.name.toUpperCase() : 0 }}
          </div>
        </div>
      </div>
    </div>
    <div class="bar">
      <div class="cell" v-for="(player, i) of bla.slice(4)" :key="i">
        <div class="player">
          <img
            class="player__avatar"
            :src="getAvatar(player.avatar)"
            v-if="!player.hasPressedReady"
          />
          <img
            class="player__altAvatar"
            :src="getGif(player.altAvatar)"
            v-else
          />
          <div class="player__name" v-if="!player.hasPressedReady">
            {{ player ? player.name.toUpperCase() : 0 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.playerBoardBars {
  &__container {
    z-index: 90;
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    background-color: transparent;
    pointer-events: none;
    justify-content: space-between;
  }
}

.bar {
  display: flex;
  flex-direction: column;
  width: 15%;
}

.cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1 / 1;
  height: 25%;
  width: 100%;
  // border: 2px solid orange;
}

.player {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80%;
  width: 60%;
  &__avatar {
    height: 80%;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 1%;
    border: 4px solid yellow;
  }
  &__altAvatar {
    height: 80%;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 80%;
    padding-top: 25px;
    // border: 4px solid yellow;
  }
  &__name {
    display: flex;
    height: 20%;
    justify-content: center;
    font-size: 22px;
    font-weight: bold;
    color: #ffffe6;
    font-family: Montserrat;
    font-size: 18px;
  }
}
</style>
