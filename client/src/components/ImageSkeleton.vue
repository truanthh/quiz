<script setup>
const props = defineProps({
  id: {
    type: String,
    default: "",
  },
  rounded: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    class="imageSkeleton__container"
    :style="{ 'border-radius': rounded ? '50%' : '2px' }"
  >
    <div class="imageSkeleton_idText" v-if="id">
      <h2>{{ id }}</h2>
    </div>
    <div class="imageSkeleton__iconContainer"></div>
  </div>
</template>

<style lang="scss" scoped>
.imageSkeleton {
  &__container {
    width: 100%;
    height: 100%;
    border: solid 2px #cccccc;
    background-color: #f2f2f2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  &__iconContainer {
    width: 40%;
    aspect-ratio: 1 / 1;
  }
  &__icon {
    width: 100%;
    height: 100%;
    // width: auto;
    // height: auto;
    color: #cccccc;
  }
}
</style>
