import { createRouter, createWebHistory } from "vue-router";
import { mainStore } from "../stores/mainStore";

const store = mainStore();

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
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next("/"); // Перенаправляем на логин
  } else {
    next();
  }
});

export default router;
