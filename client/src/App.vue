<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import LoginView from "@/views/LoginView.vue";
import { mainStore } from "./stores/mainStore.js";

const store = mainStore();

// const socket = inject('socket');

onMounted(() => {
  store.initSocket();
});

onUnmounted(() => {
  if (store.socket) {
    store.socket.disconnect();
  }
});
</script>

<template>
  <router-view></router-view>
</template>

<style lang="scss">
@use "./styles/global.scss";
.debugInfo {
  font-size: 16px;
  color: green;
  margin-top: 10px;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialised;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
}
.content {
  // width: 100%;
  max-width: 1700px;
  margin-left: calc(300px + 50px);
  // margin-right: 300px;
  padding: 30px;
  transition: 0.2s;
  overflow-y: auto;
  &_full {
    margin-left: 100px;
  }
  button {
    padding: 15px 30px;
    font-size: 18px;
    margin: 10px;
    cursor: pointer;
  }
  .connectionInfo {
    font-size: 16px;
    font-weight: bold;
  }
}
</style>
