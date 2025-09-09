import { createRouter, createWebHistory } from "vue-router";
import { mainStore } from "../stores/mainStore";
import LoginView from "@/views/LoginView.vue";
import AdminView from "@/views/AdminView.vue";
import PlayerView from "@/views/PlayerView.vue";
import ScreenView from "@/views/ScreenView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Login",
      component: LoginView,
    },
    {
      path: "/player",
      name: "Player",
      component: PlayerView,
      meta: { requiresAuth: true },
    },
    {
      path: "/screen",
      name: "Screen",
      component: ScreenView,
      meta: { requiresAuth: true },
    },
    {
      path: "/admin",
      name: "Admin",
      component: AdminView,
      meta: { requiresAuth: true },
    },
  ],
});

// Глобальный guard для проверки аутентификации
router.beforeEach((to, from, next) => {
  const store = mainStore();

  if (to.meta.requiresAuth && !store.isAuth) {
    next("/"); // Перенаправляем на логин
  } else {
    next();
  }
});

export default router;
