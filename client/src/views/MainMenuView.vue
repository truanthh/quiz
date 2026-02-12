<script setup>
import { mainStore } from "../stores/mainStore";

const store = mainStore();

function handleCreateGame() {
  store.socket.emit("create-game");
}

let slots = [0, 1, 2, 3, 4, 5, 6, 7];
</script>

<template>
  <div class="mainMenu__container">
    <h1 class="title">Добро пожаловать в Аудиоквиз</h1>
    <div class="mainMenu">
      <div class="player">
        <ul class="list">
          Вы зашли как:
          <li>{{ store.player.name }}</li>
          <!-- <li>token: {{ store.user.token }}</li> -->
          <!-- <li>socketId: {{ store.user.socketId }}</li> -->
          Список игроков:
          <li v-for="(player, id) of store.players" :key="id">
            {{ player.name }} :
            <span style="color: green">{{ player.status }}</span>
          </li>
        </ul>
        {{ store.lobby?.players }}
      </div>
      <div class="rightSideView">
        <div class="buttons" v-if="!store.lobby">
          <button class="buttons_default" @click="handleCreateGame">
            CREATE GAME
          </button>
          <button class="buttons_default" @click="handleJoinGame">
            JOIN GAME
          </button>
        </div>
        <div class="lobby" v-else>
          <div class="slot" v-for="n of slots">
            {{ !store.lobby ? "bla" : store.lobby.players[n]?.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
.slot {
  display: flex;
  border: solid 2px black;
  border-radius: 4px;
  background-color: khaki;
  width: 100%;
  height: 100%;
  font-size: 30px;
  color: black;
  padding: 20px;
}

.lobby {
  display: flex;
  flex-direction: column;
  width: 90%;
  height: 90%;
}

.title {
  font-size: 48px;
  margin-bottom: 20px;
  font-family: "Montserrat";
}

.player {
  display: flex;
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
