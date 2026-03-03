<script setup>
import { ref, onMounted } from "vue";
import { mainStore } from "../stores/mainStore";
import Lobby from "../components/Lobby.vue";
import { useRouter } from "vue-router";

const isWindowActiveJoinGame = ref(false);
const gameId = ref("");

const store = mainStore();
const router = useRouter();

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

onMounted(() => {
  store.socket.on("game-started", () => {
    router.push(`/${store.player.role}`);
  });
});
</script>

<template>
  <div class="mainMenu__container">
    <div class="title" :style="{ 'font-size': '14px' }">
      {{ store.player }}
      <!-- {{ store.player.gameId }} -->
    </div>
    <div class="mainMenu">
      <div class="bar" :style="{ 'font-size': '20px', 'font-weight': 'bold' }">
        {{ store.player.name }}
      </div>
      <div
        class="buttons"
        v-if="!store.player.gameId && !isWindowActiveJoinGame"
      >
        <button class="buttons_default" @click="handleCreateGame">
          CREATE GAME
        </button>
        <button class="buttons_default" @click="toggleJoinGame">
          JOIN GAME
        </button>
      </div>
      <div
        class="buttons"
        v-if="!store.player.gameId && isWindowActiveJoinGame"
      >
        <input class="buttons_default" v-model="gameId" />
        <button class="buttons_default" @click="handleJoinGame">JOIN</button>
        <button class="buttons_default" @click="toggleJoinGame">BACK</button>
      </div>
      <Lobby v-if="store.player.gameId" />
      <div class="player">
        <!-- <span v-if="!store.isMobile">{{ -->
        <!--   store.player.gameSession?.players -->
        <!-- }}</span> -->
        <ul class="list">
          Список игроков:
          <li v-for="(player, i) of store.players" :key="i">
            {{ player.name }} :
            <span style="color: green">{{ player.status }}</span>
            <span style="color: red" v-if="player.gameId">
              {{ ` ${player.gameId}` }}</span
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../styles/variables" as *;
@use "../styles/mixins" as *;

.list {
  margin-top: 20px;
}

// .joinGameWindow {
// display: flex;
// flex-direction: column;
// background-color: orange;
// gap: 2px;
// width: 80%;
// height: 80%;
// }

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
  display: flex;
  flex-direction: column;
  // background-color: orange;
  align-items: center;
  // width: 50%;
  // padding-top: 20px;
  // gap: 20px;
  height: 100px;

  &_default {
    height: 100%;
    width: 100%;
    cursor: pointer;
  }
}

.mainMenu {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100%;

  @include lg {
    width: 600px;
  }

  &__container {
    display: flex;
    overflow: auto;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, #1a001a 2.5%, #690069 76%, #bd00bd);
  }
}
</style>
