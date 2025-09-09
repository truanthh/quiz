import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const mainStore = defineStore("mainStore", () => {
  const isAuth = ref(false);
  const role = ref("");

  const connectionInfo = ref({});

  return { isAuth, connectionInfo, role };
});
