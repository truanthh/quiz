<script setup>
import { ref } from "vue";
import { mainStore } from "../stores/mainStore";
import { storeToRefs } from "pinia";

const store = mainStore();
const gameId = ref("");

// const props = defineProps({
// gameSession: {
//   type: Object,
//   required: true,
// }
// players: {
//   type: Array,
//   required: true,
// }
// });

function handleStartGame() {
  store.socket.emit("start-game");
}

function handleCancelGame() {
  store.socket.emit("cancel-game");
}
</script>

<template>
  <div class="lobby__container">
    <div
      class="lobby__slot"
      v-for="player of store.gameSession.players"
      :key="player?.name"
    >
      {{ player ? player.name : "open" }}
      <button
        @click="handleKickPlayer"
        v-if="
          store.isLeader &&
          (player ? player.token !== store.player.token : true)
        "
        class="button__kick"
      >
        KICK
      </button>
    </div>
    <div class="controlButtons">
      <button @click="handleCancelGame" class="button__cancel">Cancel</button>
      <button @click="handleStartGame" class="button__start">Start</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.controlButtons {
  display: flex;
  margin-top: 10px;
  width: 100%;
  justify-content: space-evenly;
}

.lobby {
  &__container {
    display: flex;
    flex-direction: column;
    background-color: orange;
    gap: 2px;
    width: 100%;
    height: 100%;
    padding: 20px;
  }

  &__slot {
    display: flex;
    justify-content: space-between;
    border: solid 2px black;
    border-radius: 4px;
    background-color: khaki;
    // width: 100%;
    // height: 100%;
    font-size: 30px;
    color: black;
    padding-left: 10px;
  }
}

.button {
  &__kick {
    width: 10%;
  }
  &__start,
  &__cancel {
    width: 20%;
    height: 40px;
  }
}
</style>
