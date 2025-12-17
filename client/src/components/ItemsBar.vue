<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: [{ name: "blank", hasPressedReady: false, avatar: 1 }],
  },
});
</script>

<template>
  <div class="itemsBar__container">
    <div class="item_selected__desc">
      {{ items[0].name }}
    </div>
    <Transition name="fade">
      <div
        v-for="(item, i) of items"
        :key="i"
        :class="{
          item: i !== 0,
          item_selected: i === 0,
        }"
      >
        <img class="item__picture" :src="`/avatars/${item.avatar}.png`" />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
slide-enter-active,
.slide-leave-active {
  transition: all 0.5s ease-in-out;
}

.itemsBar {
  &__container {
    display: flex;
    position: relative;
    align-items: end;
    width: 40%;
    height: 180px;
    margin-bottom: 20px;
  }
}

.item {
  display: flex;
  height: 40%;
  aspect-ratio: 1 / 1;
  justify-content: center;
  align-items: center;
  &_selected {
    height: 100%;
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
  }
  &__picture {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    border: 4px solid yellow;
  }
}
</style>
