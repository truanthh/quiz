<script setup>
import { getAvatar } from "@/utils/avatars";
import { ref } from "vue";
import { Roller } from "vue-roller";
import "vue-roller/dist/style.css";

const props = defineProps({
  items: {
    type: Array,
    default: [{ name: "blank", hasPressedReady: false, avatar: 0 }],
  },
});

const isPointsVisible = ref(false);
const points = ref("1337");
let timeoutId = null;

function showPoints() {
  isPointsVisible.value = true;

  timeoutId = setTimeout(() => {
    isPointsVisible.value = false;
    timeoutId = null;
  }, 10000);
}
</script>

<template>
  <div class="bar__container">
    <TransitionGroup name="slide" tag="div" class="bar__items">
      <div
        v-for="(item, i) of items"
        :key="item.avatar"
        :class="{
          item: i !== 0,
          item_selected: i === 0,
        }"
      >
        <img class="item__picture" :src="getAvatar(item.avatar)" />
      </div>
    </TransitionGroup>
    <div class="misc">
      <button @click="showPoints">blabla</button>
      <div class="misc__playerName">
        {{ items[0]?.name }}
      </div>
      <div class="misc__pointsDisplay">
        <Roller
          :value="points"
          default-value="0000"
          :duration="2000"
          v-if="isPointsVisible"
        >
        </Roller>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bar {
  &__container {
    display: flex;
    height: 100%;
    width: 50%;
    margin-bottom: 20px;
    overflow: hidden;
    // background-color: gray;
  }
  &__items {
    display: flex;
    flex-direction: column;
    width: 20%;
    height: 100%;
    gap: 2%;
    // background-color: orange;
    margin-left: 13%;
  }
}

.misc {
  display: flex;
  flex-direction: column;
  width: 40%;
  &__playerName {
    padding-left: 8%;
    font-size: 34px;
    font-weight: bold;
    font-family: Montserrat;
    color: white;
    // background-color: orange;
  }
  &__pointsDisplay {
    font-size: 48px;
    font-weight: bold;
    font-family: Montserrat;
    color: white;
    height: 23%;
    display: flex;
    justify-content: center;
    align-items: center;
    // background-color: khaki;
  }
}

.item {
  display: flex;
  width: 50%;
  aspect-ratio: 1 / 1;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;

  &_selected {
    width: 100%;
    transition: all 0.3s ease;
  }

  &__picture {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 1%;
    border: 4px solid yellow;
    transition: all 0.3s ease;
  }
}

/* Анимации для TransitionGroup - без задержки */
.slide-move {
  transition: transform 0.3s ease;
}

.slide-enter-active {
  transition: all 0.3s ease;
}

.slide-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 50%;
  z-index: -1000;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
