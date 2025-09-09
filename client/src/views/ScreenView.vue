<script setup>
import { ref, useTemplateRef, onMounted } from "vue";

const audioContext = new AudioContext();
const audioPlayer = useTemplateRef("audioPlayer");

let track = ref(null);

function playPause() {
  console.log("trying to play audio!");
  console.log(audioContext);
  console.log(audioContext.state);
  if (audioContext.state === "suspended") {
    audioContext.resume();
    audioPlayer.play();
  }
}

onMounted(() => {
  track.value = audioContext.createMediaElementSource(audioPlayer.value);
  // audioPlayer.play();
  track.value.connect(audioContext.destination);
  // console.log(track.value);
});
</script>

<template>
  <div>play plsss</div>
  <button
    data-playing="false"
    role="switch"
    aria-checked="false"
    @click="playPause"
    @keyup.enter="playPause"
  >
    <span>Play/Pause</span>
  </button>
  <audio
    src="C:/Users/user/Desktop/bla/quiz/client/public/zvezda.mp3"
    ref="audioPlayer"
  ></audio>
</template>

<style>
/* sd */
</style>
