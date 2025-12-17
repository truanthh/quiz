<script setup>
import avatar1 from "../../assets/avatars/1.png";
import avatar2 from "../../assets/avatars/2.png";
import avatar3 from "../../assets/avatars/3.png";
import avatar4 from "../../assets/avatars/4.png";
import avatar5 from "../../assets/avatars/5.png";
import avatar6 from "../../assets/avatars/6.png";
import avatar7 from "../../assets/avatars/7.png";
import avatar8 from "../../assets/avatars/8.png";
import dog1 from "../../assets/gifs/dog1.gif";

const avatarMap = {
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
  7: avatar7,
  8: avatar8,
};

const props = defineProps({
  items: {
    type: Array,
    default: [],
  },
});
</script>

<template>
  <div class="playerBoardBars__container">
    <div class="bar">
      <div class="cell" v-for="(player, i) of items.slice(0, 4)" :key="i">
        <div class="player">
          <img
            class="player__avatar"
            :src="avatarMap[player.avatar]"
            v-if="!player.hasPressedReady"
          />
          <img class="player__altAvatar" :src="dog1" v-else />
          <div class="player__name">
            {{ player ? player.name.toUpperCase() : 0 }}
          </div>
        </div>
      </div>
    </div>
    <div class="bar">
      <div class="cell" v-for="(player, i) of items.slice(4)" :key="i">
        <div class="player">
          <img
            class="player__avatar"
            :src="avatarMap[player.avatar]"
            v-if="!player.hasPressedReady"
          />
          <img class="player__altAvatar" :src="dog1" v-else />
          <div class="player__name">
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
    border-radius: 50%;
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
