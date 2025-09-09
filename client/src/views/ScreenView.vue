<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  // manifestUrl: {
  //   type: String,
  //   required: true,
  // },
  licenseServer: {
    type: String,
    required: true,
  },
  posterUrl: {
    type: String,
    required: false,
    default: "",
  },
});

const videoContainer = ref(null);
const videoPlayer = ref(null);
let player = null;
let ui = null;

const mediaUrl = ref("C:/Users/user/Desktop/bla/quiz/client/public/zvezda.mp3");

const onError = (error) => {
  console.error("Error code", error.code, "object", error);
};

const initializePlayer = async () => {
  try {
    // Динамический импорт Shaka Player
    const shaka = await import("shaka-player/dist/shaka-player.ui.js");

    if (!videoPlayer.value) return;

    player = new shaka.Player(videoPlayer.value);
    ui = new shaka.ui.Overlay(player, videoContainer.value, videoPlayer.value);
    ui.getControls();

    player.configure({
      drm: {
        servers: { "com.widevine.alpha": props.licenseServer },
      },
    });

    await player.load(mediaUrl.value);
    console.log("The video has now been loaded!");
  } catch (error) {
    onError(error);
  }
};

const cleanupPlayer = () => {
  if (player) {
    player.destroy();
    player = null;
  }
  if (ui) {
    ui.destroy();
    ui = null;
  }
};

// Инициализация при монтировании компонента
onMounted(() => {
  initializePlayer();
});

// Очистка при размонтировании компонента
onUnmounted(() => {
  cleanupPlayer();
});

// Обновление при изменении пропсов
watch(
  () => [props.manifestUrl, props.licenseServer],
  () => {
    cleanupPlayer();
    initializePlayer();
  },
);
</script>

<template>
  <div ref="videoContainer" class="shadow-lg mx-auto max-w-full size">
    <video
      id="video"
      ref="videoPlayer"
      class="w-full h-full"
      :poster="posterUrl"
    ></video>
  </div>
</template>

<style>
@import "../../node_modules/shaka-player/dist/controls.css"; /* Shaka player CSS import */

.size {
  width: 800px;
}
</style>
