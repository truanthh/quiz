import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "./views/DashboardView.vue";
import HostRoomView from "./views/HostRoomView.vue";
import LoginView from "./views/LoginView.vue";
import PlayerView from "./views/PlayerView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginView },
    { path: "/", component: DashboardView },
    { path: "/host/:roomCode", component: HostRoomView, props: true },
    { path: "/play", component: PlayerView },
  ],
});
