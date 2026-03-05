import { createRouter, createWebHistory } from "vue-router";
import { mainStore } from "../stores/mainStore";
import LoginView from "@/views/LoginView.vue";
import AdminView from "@/views/AdminView.vue";
import PlayerView from "@/views/PlayerView.vue";
import ScreenView from "@/views/ScreenView.vue";
import MainMenuView from "@/views/MainMenuView.vue";
import NotFoundView from "@/views/NotFoundView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
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
    {
      path: "/main",
      name: "MainMenu",
      component: MainMenuView,
      meta: { requiresAuth: true },
    },
    {
      path: "/:pathMatch(.*)*", // Matches all paths
      name: "NotFound",
      component: NotFoundView,
    },
  ],
});

router.beforeEach(async (to, from) => {
  const store = mainStore();

  if (!store.isAuth && to.path !== "/login") {
    return "/login";
  }

  return;
});

export default router;
