<script setup>
import { computed } from "vue";

const props = defineProps({
  items: {
    type: Array,
    default: [
      { name: "cat", points: 2 },
      { name: "dog", points: 1 },
    ],
  },
  isShown: {
    type: Boolean,
    default: true,
  },
});

const itemsSorted = computed(() => {
  return props.items.sort((a, b) => b.points - a.points);
});
</script>

<template>
  <div :class="isShown ? 'leaderboard' : 'leaderboard_hidden'" :key="keyIsOp">
    <div class="leaderboard__header">
      <h1>Таблица лидеров</h1>
    </div>

    <div class="grid">
      <div class="grid__header-row">
        <div class="grid__cell">Место</div>
        <div class="grid__cell">Имя игрока</div>
        <div class="grid__cell">Очки</div>
      </div>

      <div
        v-for="(player, index) of itemsSorted"
        :key="index"
        class="grid__row"
        :class="{ 'grid__row--top': index < 3 }"
      >
        <div class="grid__cell grid__cell--position">
          <div class="position-badge">{{ index + 1 }}</div>
        </div>
        <div class="grid__cell grid__cell--name">{{ player.name }}</div>
        <div class="grid__cell grid__cell--points">{{ player.points }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.leaderboard {
  background: linear-gradient(to bottom, #ff80aa 2.5%, #ff9999 76%, #ffcccc);
  font-family: "Montserrat", sans-serif;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 90%;
  width: 90%;
  top: 5%;
  left: 5%;
  z-index: 100;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 32px;
  overflow: hidden;

  // &::before {
  //   content: "";
  //   position: absolute;
  //   top: 0;
  //   left: 0;
  //   right: 0;
  //   height: 4px;
  //   background: linear-gradient(90deg, #ffd700, #c0c0c0, #cd7f32);
  // }

  &_hidden {
    display: none;
  }

  &__header {
    text-align: center;
    margin-bottom: 40px;
    color: black;

    h1 {
      font-size: 48px;
      font-weight: 800;
      margin: 0;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      letter-spacing: 1px;
    }
  }
}

.grid {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 120px 0.5fr 180px;
  gap: 10px;
  // background: rgba(255, 255, 255, 0.1);
  // border-radius: 16px;
  // overflow: hidden;
  // box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  justify-content: center;

  &__header-row {
    display: contents;

    .grid__cell {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 24px 20px;
      font-size: 22px;
      font-weight: 700;
      color: black;
      text-transform: uppercase;
      letter-spacing: 1px;
      // border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      border-bottom: 4px solid black;
    }
  }

  &__row {
    display: contents;

    &--top {
      .grid__cell--position .position-badge {
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #8b6b00;
        transform: scale(1.1);
      }

      &:nth-child(2) .grid__cell--position .position-badge {
        background: linear-gradient(135deg, #c0c0c0, #e0e0e0);
        color: #5a5a5a;
      }

      &:nth-child(3) .grid__cell--position .position-badge {
        background: linear-gradient(135deg, #cd7f32, #e69c4e);
        color: #5a3a1a;
      }
    }
  }

  &__cell {
    display: flex;
    align-items: center;
    padding: 20px;
    font-size: 20px;
    font-weight: 600;
    color: black;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
    border: 2px solid black;

    &:nth-child(3n + 1) {
      justify-content: center;
    }

    &:nth-child(3n + 3) {
      justify-content: flex-end;
      padding-right: 30px;
    }

    &--position {
      .position-badge {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        font-weight: 800;
        font-size: 24px;
        color: black;
      }
    }

    &--name {
      padding-left: 30px;
      font-size: 22px;
      font-weight: 600;
      color: black;
    }

    &--points {
      font-size: 24px;
      font-weight: 700;
      // color: #ffd700;
      color: black;
    }
  }

  &__row:hover &__cell {
    background: rgba(255, 255, 255, 0.15);
  }
}
</style>
