<script setup>
import { getAvatar } from "@/utils/avatars";

const props = defineProps({
  items: {
    type: Array,
    default: [{ name: "blank", hasPressedReady: false, avatar: 0 }],
  },
});
</script>

<template>
  <div class="slider-container">
    <div class="slider-track" :style="{ width: `${items.length * 100}%` }">
      <div
        v-for="(item, index) in items"
        :key="item.name"
        class="slide"
        :style="{
          width: `${100 / items.length}%`,
          transform: `translateX(${-index * 100}%)`,
        }"
      >
        <img :src="item.src" :alt="image.alt" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.slider-container {
  width: 100%;
  height: 300px;
  overflow: hidden;
  position: relative;
}

.slider-track {
  display: flex;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide {
  height: 100%;
  flex-shrink: 0;
  transition: all 0.4s ease;
  opacity: 0.9;
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Fade эффект при появлении/исчезновении */
.slide {
  opacity: 0;
  transform: translateX(20px);
}

.slide.active {
  opacity: 1;
  transform: translateX(0);
}
</style>
