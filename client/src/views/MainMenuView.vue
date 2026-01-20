<script setup>
import { mainStore } from "../stores/mainStore";

const store = mainStore();
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
            {{ player.name }}
          </li>
        </ul>
      </div>
      <div class="buttons">
        <button class="buttons_default">HOST GAME</button>
        <button class="buttons_default">JOIN GAME</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
  display: flex;
  flex-direction: column;
  background-color: orange;
  align-items: center;
  width: 50%;
  padding-top: 20px;
  gap: 20px;
  &_default {
    height: 30%;
    width: 80%;
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
