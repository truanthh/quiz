<script setup>
import { computed } from "vue";

const props = defineProps({
  items: {
    type: Array,
    default: [],
  },
  // size: {
  //   type: String,
  //   default:
  // }
});

const chess = computed(() => {
  function isEvenRow(i, rowLength) {
    const rowIndex = Math.floor(i / rowLength);
    return rowIndex % 2 === 0;
  }

  const chessBoard = [];

  for (let i = 0; i < props.items.length; i++) {
    if (isEvenRow(i, 4)) {
      chessBoard.push(0);
      chessBoard.push(props.items[i]);
    } else {
      chessBoard.push(props.items[i]);
      chessBoard.push(0);
    }
  }

  return chessBoard;
});
</script>

<template>
  <!-- <div>{{ chess.map((el) => el.name).join(" ") }}</div> -->
  <div class="flexGrid">
    <!-- <div v-for="(player, i) of chess" :key="i"> -->
    <!--   <div class="player flexGrid__cell" v-if="player"> -->
    <!--     <img class="player__avatar" :src="`/avatars/${player.avatar}.png`" /> -->
    <!--     <div class="player__name"> -->
    <!--       {{ player.name.toUpperCase() }} -->
    <!--     </div> -->
    <!--   </div> -->
    <!--   <div class="flexGrid__cell_hidden" v-else>0</div> -->
    <!-- </div> -->
    <div class="flexGrid__row">
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
    </div>
    <div class="flexGrid__row">
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
      <div class="flexGrid__cell">1</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.flexGrid {
  // display: grid;
  // grid-template-columns: repeat(8, 1fr);
  // grid-template-rows: repeat(2, 1fr);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  aspect-ratio: 4 / 1;
  background-color: orange;
  &__row {
    display: flex;
    height: 100%;
    width: 100%;
    aspect-ratio: 8 / 1;
    border: 1px solid black;
  }
  &__cell {
    display: flex;
    aspect-ratio: 0.8;
    height: 100%;
    width: 100%;
    border: 2px solid green;
    &_hidden {
      display: flex;
      aspect-ratio: 0.8;
      visibility: hidden;
      height: 100%;
      width: 100%;
    }
  }
}

.player {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  // background-color: aquamarine;
  &__avatar {
    height: 80%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    border: 2px solid yellow;
  }
  &__name {
    display: flex;
    height: 20%;
    justify-content: center;
    font-size: 22px;
    font-weight: bold;
    color: #ffffe6;
    font-family: Montserrat;
  }
}

// .playerBoard {
//   &__container {
//     display: flex;
//     flex-direction: column;
//     width: 100%;
//     height: 100%;
//   }
//   &__row1 {
//     display: grid;
//     width: 100%;
//     height: 50%;
//     grid-template-columns: repeat(8, 1fr);
//     grid-template-rows: 1fr;
//     gap: 4px 12px;
//   }
//   &__row2 {
//     display: grid;
//     width: 100%;
//     height: 50%;
//     grid-template-columns: repeat(8, 1fr);
//     grid-template-rows: 1fr;
//     gap: 4px 12px;
//   }
// }
//
</style>
