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
  <div class="grid">
    <div
      :class="player ? 'grid__cell' : 'grid__cell_hidden'"
      v-for="(player, i) of chess"
      :key="i"
    >
      <div class="player">
        <img class="player__avatar" :src="`/avatars/${player.avatar}.png`" />
        <div class="player__name">
          {{ player ? player.name.toUpperCase() : 0 }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(auto, 12.5%));
  grid-template-rows: repeat(2, minmax(auto, 50%));
  background-color: orange;
  // gap: 10px;
  &__cell {
    display: flex;
    border: 1px solid black;
    width: 100%;
    max-width: 100%;
    &_hidden {
      display: flex;
      visibility: hidden;
    }
  }
}

.player {
  &__avatar {
    height: 80%;
    width: 100%;
    max-width: 100%;
    object-fit: cover;
    // max-height: 80%;
  }
  &__name {
    height: 20%;
    font-size: 18px;
  }
}
</style>
