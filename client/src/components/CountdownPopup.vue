<script setup>
const props = defineProps({
  value: {
    type: Number,
    default: 3,
  },
});
</script>

<template>
  <div class="backgr"></div>
  <div class="countdown__container">
    <div class="countdown" v-if="value !== 0">
      {{ value }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.backgr {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 1900;
}
.countdown {
  &__container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    height: 400px;
    background-color: pink;
    border: 4px solid black;
    border-radius: 50%;
    z-index: 2000;
    color: black;
    font-size: 80px;
    font-weight: bold;
  }
}
</style>
