import { defineStore } from "pinia";
import { ref, computed, onMounted, onUnmounted } from "vue";

export const useAudioPlayerStore = defineStore("audioPlayer", () => {
  //
  //
  // -------- AUDIOPLAYER STATE ------------------------
  // const duration = ref(0);
  const isPlaying = ref(false);
  const currentTrackIndex = ref(0);
  const volume = ref(0.5);
  const tracks = ref([]);
  const currentTimeSeconds = ref(0);
  const currentTrack = computed(() => tracks.value[currentTrackIndex.value]);

  // component context
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

  async function play(time) {
    if (!audioElementRef.value) return;

    try {
      if (audioContextRef.value?.state === "suspended") {
        await audioContextRef.value.resume();
      }
      if (time) {
        audioElementRef.value.currentTime = time;
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
      pause();
      audioElementRef.value.src = tracks.value[index].src;
      // currentTimeString.value = "00:00";
    }
  }

  // function playSoundAndRestoreState(src) {
  //   const prevSrc = audioElementRef.value.src;
  // }

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

  // THIS IS USED IN MAIN COMPONENT
  // do i need this here?
  function updateTime() {
    let timeSeconds = Math.trunc(audioElementRef.value.currentTime);

    currentTimeSeconds.value = timeSeconds;
  }

  function getTracks() {
    return tracks.value;
  }

  return {
    // State
    isPlaying,
    currentTrackIndex,
    volume,
    tracks,

    // Getters
    currentTrack,
    currentTimeSeconds,
    getTracks,

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
  };
});
