<script setup>
import avatar0 from "../../assets/avatars/0.png";
import avatar1 from "../../assets/avatars/1.png";
import avatar2 from "../../assets/avatars/2.png";
import avatar3 from "../../assets/avatars/3.png";
import avatar4 from "../../assets/avatars/4.png";
import avatar5 from "../../assets/avatars/5.png";
import avatar6 from "../../assets/avatars/6.png";
import avatar7 from "../../assets/avatars/7.png";
import avatar8 from "../../assets/avatars/8.png";
import dog1 from "../../assets/gifs/dog1.gif";

const avatarMap = {
  0: avatar0,
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
  7: avatar7,
  8: avatar8,
};

const props = defineProps({
  items: {
    type: Array,
    default: [{ name: "blank", hasPressedReady: false, avatar: 0 }],
  },
});
</script>

<template>
  <div class="itemsBar__container">
    <div class="item_selected__desc">
      {{ items[0]?.name }}
    </div>

    <TransitionGroup name="slide" tag="div" class="itemsWrapper">
      <div
        v-for="(item, i) of items"
        :key="item.avatar"
        :class="{
          item: i !== 0,
          item_selected: i === 0,
        }"
      >
        <img class="item__picture" :src="avatarMap[item.avatar]" />
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.itemsBar {
  &__container {
    display: flex;
    position: relative;
    align-items: end;
    width: 40%;
    height: 180px;
    margin-bottom: 20px;
    overflow: hidden;
  }
}

.itemsWrapper {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: end;
}

.item {
  display: flex;
  height: 40%;
  aspect-ratio: 1 / 1;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;

  &_selected {
    height: 100%;
    transition: all 0.3s ease;
  }

  &__desc {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 14%;
    left: 35%;
    font-size: 34px;
    font-weight: bold;
    font-family: Montserrat;
    color: white;
  }

  &__picture {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    border: 4px solid yellow;
    transition: all 0.3s ease;
  }
}

/* Анимации для TransitionGroup */
.slide-move, /* применяем transition для перемещаемых элементов */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Убираем элемент из потока при анимации исчезновения */
.slide-leave-active {
  position: absolute;
}
</style>
