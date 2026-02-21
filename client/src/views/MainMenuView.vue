<script setup>
import { ref } from "vue";
import { mainStore } from "../stores/mainStore";
import { storeToRefs } from "pinia";
import Lobby from "../components/Lobby.vue"

const store = mainStore();

const isWindowActiveJoinGame = ref(false);
const gameId = ref("");

function toggleJoinGame() {
  isWindowActiveJoinGame.value = !isWindowActiveJoinGame.value;
}

function handleCreateGame() {
  store.socket.emit("create-game");
}

function handleJoinGame() {
  store.socket.emit("join-game", gameId.value);
}

let slots = [0, 1, 2, 3, 4, 5, 6, 7];
</script>

<template>
  <div class="mainMenu__container">
    <h1 class="title" v-if="!store.isMobile"> store.gameSessioin </h1>
    <div class="mainMenu">
      <div class="player">
        {{ store.gameSession?.players }}
        <ul class="list">
          Вы зашли как:
          <li>{{ store.player.name }}</li>
          <!-- <li>token: {{ store.user.token }}</li> -->
          <!-- <li>socketId: {{ store.user.socketId }}</li> -->
          Список игроков:
          <li v-for="(player, i) of store.players" :key="i">
            {{ player.name }} :
            <span style="color: green">{{ player.status }}</span>
          </li>
        </ul>
      </div>
      <div class="rightSideView">
        <div class="buttons" v-if="!store.player.gameId">
          <button class="buttons_default" @click="handleCreateGame">
            CREATE GAME
          </button>
          <div class="joinGameWindow" v-if="isWindowActiveJoinGame">
            ENTER GAME ID
            <input v-model="gameId" />
            <button @click="handleJoinGame">JOIN</button>
            <button @click="toggleJoinGame">BACK</button>
          </div>
          <button class="buttons_default" @click="toggleJoinGame" v-else>
            JOIN GAME
          </button>
        </div>
        <Lobby />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list {
  margin-top: 20px;
}

.rightSideView {
  display: flex;
  flex-direction: column;
  background-color: lightgray;
  align-items: center;
  justify-content: center;
  width: 50%;
  // padding-top: 20px;
  // gap: 20px;
}

.joinGameWindow {
  display: flex;
  flex-direction: column;
  // background-color: orange;
  gap: 2px;
  width: 80%;
  height: 80%;
}

.title {
  font-size: 48px;
  margin-bottom: 20px;
  font-family: "Montserrat";
}

.player {
  display: flex;
  flex-direction: column;
  background-color: black;
  width: 50%;
  padding-left: 20px;
}

.buttons {

  // display: flex;
  // flex-direction: column;
  // background-color: orange;
  // align-items: center;
  // width: 50%;
  // padding-top: 20px;
  // gap: 20px;
  &_default {
    height: 100%;
    width: 100%;
    cursor: pointer;
  }
}

.mainMenu {
  display: flex;
  width: 80%;
  height: 80%;

  &__container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, #1a001a 2.5%, #690069 76%, #bd00bd);
  }
}
</style>
