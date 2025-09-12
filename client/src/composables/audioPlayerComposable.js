import { ref, computed, onMounted, onUnmounted } from "vue";

export function audioPlayerComposable() {
  const isPlaying = ref(false);
  const currentTrackIndex = ref(0);
  const volume = ref(2.0);
  const tracks = ref([]);
  const currentTime = ref("00:00");
  const duration = ref(0);

  const audioElementRef = ref(null);
  const audioContextRef = ref(null);
  const gainNodeRef = ref(null);

  const currentTrack = computed(() => tracks.value[currentTrackIndex.value]);

  // not a state
  function initializeAudioPlayer() {
    // tracks.value = tracksRef;
    onMounted(async () => {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      console.log(audioContext);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume.value;

      const audioElement = window.document.getElementById("audioPlayer");

      // Подключение аудио графа
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      audioElementRef.value = audioElement;
      audioContextRef.value = audioContext;
      gainNodeRef.value = gainNode;
      audioElement.addEventListener("ended", nextTrack);
      audioElement.addEventListener("timeupdate", trackTime);
    });

    onUnmounted(() => {
      if (audioContextRef.value) {
        audioContextRef.value.close();
      }

      audioElement.removeEventListener("ended", nextTrack);
      audioElement.removeEventListener("timeupdate", trackTime);
    });
  }

  // function delay(time) {
  //   return new Promise((res) => {
  //     setTimeout(() => {
  //       res(new (window.AudioContext || window.webkitAudioContext())());
  //     }, time);
  //   });
  // }

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
    tracks.value = newTracks;
  }

  // // Загрузка и воспроизведение трека
  // function loadAndPlayTrack() {
  //   if (!audioPlayer.value) return;
  //
  //   const wasPlaying = isPlaying.value;
  //
  //   // Пауза текущего трека
  //   audioPlayer.value.pause();
  //   isPlaying.value = false;
  //
  //   // Загрузка нового трека
  //   audioPlayer.value.src = tracks.value[currentTrackIndex.value].src;
  //
  //   // Переподключение аудио узлов
  //   setupAudioNode();
  //
  //   // Воспроизведение если был играющим
  //   if (wasPlaying) {
  //     setTimeout(() => playPause(), 100);
  //   }
  // }

  function trackTime() {
    currentTime.value = formatTime(Math.trunc(audioPlayer.value.currentTime));
    duration.value = audioPlayer.value.duration;
  }

  function formatTime(seconds) {
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
    currentTime,

    // Actions
    play,
    pause,
    playPause,
    setVolume,
    changeTrack,
    nextTrack,
    previousTrack,
    setTracks,
    initializeAudioPlayer,
  };
}
