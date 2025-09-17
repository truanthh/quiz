import { defineStore } from "pinia";
import { ref, computed, onMounted, onUnmounted } from "vue";

export const useAudioPlayerStore = defineStore("audioPlayer", () => {
  // state to sync
  const isPlaying = ref(false);
  const currentTrackIndex = ref(0);
  const volume = ref(2.0);
  const tracks = ref([]);
  const duration = ref(0);
  const currentTimeString = ref("00:00");
  const currentTimeSeconds = ref(0);

  // need tracks and id and we are good
  const currentTrack = computed(() => tracks.value[currentTrackIndex.value]);

  // state only on screen page
  const audioElementRef = ref(null);
  const audioContextRef = ref(null);
  const gainNodeRef = ref(null);

  function initialize(audioElement) {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume.value;

    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    setAudioRefs(audioElement, audioContext, gainNode);
  }

  function destroyIfExists() {
    if (audioContextRef.value) {
      audioContextRef.value.close();
    }
  }

  function setAudioRefs(element, context, gainNode) {
    audioElementRef.value = element;
    audioContextRef.value = context;
    gainNodeRef.value = gainNode;
  }

  async function play() {
    if (!audioElementRef.value) return;

    try {
      if (audioContextRef.value?.state === "suspended") {
        await audioContextRef.value.resume();
      }
      await audioElementRef.value.play();
      isPlaying.value = true;
    } catch (error) {
      console.error("Play error:", error);
    }
  }

  async function pause() {
    if (!audioElementRef.value) return;

    audioElementRef.value.pause();
    isPlaying.value = false;
  }

  async function playPause() {
    if (isPlaying.value) {
      await pause();
    } else {
      await play();
    }
  }

  function setVolume(newVolume) {
    volume.value = Math.max(0, Math.min(newVolume, 10));
    if (gainNodeRef.value) {
      gainNodeRef.value.gain.value = volume.value;
    }
  }

  function changeTrack(index) {
    if (index < 0 || index >= tracks.value.length) return;

    currentTrackIndex.value = index;
    if (audioElementRef.value) {
      const wasPlaying = isPlaying.value;
      pause();
      audioElementRef.value.src = tracks.value[index].src;

      if (wasPlaying) {
        setTimeout(() => play(), 100);
      }
    }
  }

  function nextTrack() {
    changeTrack((currentTrackIndex.value + 1) % tracks.value.length);
  }

  function previousTrack() {
    changeTrack(
      (currentTrackIndex.value - 1 + tracks.value.length) % tracks.value.length,
    );
  }

  function setTracks(newTracks) {
    // console.log(`settings tracks to ${JSON.stringify(newTracks)}`);
    tracks.value = newTracks;
  }

  function updateTime() {
    let timeSeconds = Math.trunc(audioElementRef.value.currentTime);

    currentTimeSeconds.value = timeSeconds;
    currentTimeString.value = secondsToString(timeSeconds);
  }

  function secondsToString(seconds) {
    let sec = seconds;
    let min = 0;

    if (seconds > 59) {
      min = Math.floor(seconds / 60);
      sec = sec % 60;
    }

    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  return {
    // State
    isPlaying,
    currentTrackIndex,
    volume,
    tracks,

    // Getters
    currentTrack,
    currentTimeString,
    currentTimeSeconds,

    // Actions
    initialize,
    destroyIfExists,
    setAudioRefs,
    play,
    pause,
    playPause,
    setVolume,
    changeTrack,
    nextTrack,
    previousTrack,
    setTracks,
    updateTime,
    secondsToString,
  };
});
