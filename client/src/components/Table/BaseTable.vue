<script setup>
const emit = defineEmits(["headerClick"]);

const props = defineProps({
  headers: {
    type: Array,
    required: false,
  },
  columnsTemplate: {
    type: String,
    required: false,
  },
});

function headerClick(name) {
  emit("headerClick", name);
}
</script>

<template>
  <div class="table-wrapper">
    <div class="table">
      <div
        class="table-headers"
        :style="{ 'grid-template-columns': columnsTemplate }"
      >
        <div
          class="table-headers__name"
          v-for="(name, i) of headers"
          :key="i"
          @click="headerClick(name)"
        >
          {{ name }}
        </div>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table {
  background-color: #fff;
  width: 60%;
  &-wrapper {
    display: flex;
    justify-content: center;
  }
  &-headers {
    padding: 5px 16px;
    display: grid;
    column-gap: 40px;
    align-items: center;
    border-bottom: 2px solid #eeeff4;
    background: #fff;
    @media screen and (max-width: 767px) {
      display: none;
    }
    &__name {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      color: #999;
      cursor: pointer;
    }
  }
}
</style>
