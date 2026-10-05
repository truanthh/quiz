import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "./views/DashboardView.vue";
import HostRoomView from "./views/HostRoomView.vue";
import LoginView from "./views/LoginView.vue";
import PlayerView from "./views/PlayerView.vue";
import ScreenView from "./views/ScreenView.vue";

// "/" is the end-user entry point: room code + nickname, play. Everything a
// host needs (login, library/playlist management, live room control) lives
// under /host - a separate, logged-in area a regular player never sees.
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: PlayerView },
    { path: "/screen/:roomCode", component: ScreenView, props: true },
    { path: "/host/login", component: LoginView },
    { path: "/host", component: DashboardView },
    { path: "/host/:roomCode", component: HostRoomView, props: true },
  ],
});
