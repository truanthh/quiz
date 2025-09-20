<script setup>
const props = defineProps({
  columnsTemplate: {
    type: String,
    required: false,
  },
  bgRow: {
    type: String,
    required: false,
  },
});
</script>

<template>
  <div
    class="table-row"
    :style="{
      'grid-template-columns': columnsTemplate,
      'background-color': bgRow,
    }"
  >
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.table-row {
  border-bottom: 2px solid #eeeff4;
  position: relative;
  display: grid;
  column-gap: 40px;
  align-items: center;
  padding: 0 16px;
  font-weight: bold;
  font-size: 20px;
  // color: #363636;
  @media screen and (max-width: 767px) {
    display: block;
  }
  &:last-child {
    border-bottom: none;
  }
  &--items-center {
    justify-items: center;
  }
}
</style>
