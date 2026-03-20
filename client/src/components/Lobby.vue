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

function handleSetScreen(id){
  store.socket.emit("set-screen", {
    slotId: id,
    gameId: store.gameSession.id,
  });
}

function handleClearSlot(id) {
  // console.log(`trying to clear slot ${id}!`);
  store.socket.emit("clear-slot", id);
}
</script>

<template>
  <div class="lobby__container">
    <!-- <span> {{ store.gameSession.players.map(p => p ? [p.name, p.role, p.id] : null) }} </span> -->
    <!-- <span> {{ store.gameSession }} </span> -->
    <span> {{ store.player }} </span>
    <span> {{ store.players }}</span>
    <div
      class="lobby__slot"
      v-for="(player, id) of store.gameSession?.players"
      :key="player?.name"
    >
      {{ player ? `${player.name} ${player.role}` : "open" }}
      <div class="lobby__slot__buttons">
        <button
          @click="handleSetScreen(id)"
          v-if="store.player.isLeader && (player ? player.role !== 'screen' : true)"
          class="button__setscreen"
        >
          SCREEN
        </button>
        <button
          @click="handleClearSlot(id)"
          v-if="store.player.isLeader && (player ? player.id !== store.player.id : true)"
          class="button__kick"
        >
          KICK
        </button>
      </div>
    </div>
    <div class="controlButtons">
      <button
        @click="handleCancelGame"
        class="button__cancel"
        v-if="store.player.isLeader"
      >
        Cancel
      </button>
      <button
        @click="handleStartGame"
        class="button__start"
        v-if="store.player.isLeader"
      >
        Start
      </button>
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
    &__buttons {
      display: flex;
      width: 40%;
    }
  }
}

.button {
  &__kick, &__setscreen {
    width: 100%;
  }

  &__start,
  &__cancel {
    width: 20%;
    height: 40px;
  }
}
</style>
