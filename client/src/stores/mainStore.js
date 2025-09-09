import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const mainStore = defineStore("mainStore", () => {
  const isAuth = ref(false);

  const connectionInfo = ref({});

  return { count, doubleCount, increment };
});
