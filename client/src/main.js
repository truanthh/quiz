import { createApp } from "vue";
import { createPinia } from "pinia";
// import Vue from "vue";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");

// Vue.config.errorHandler = (err, vm, info) => {
//   console.error("Vue error:", err);
//   console.info("Component:", vm);
//   console.info("Info:", info);
// };
