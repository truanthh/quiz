<script setup lang="ts">
import { CLIP_DURATION_MS } from "@quiz/shared";
import { computed, ref } from "vue";

const props = defineProps<{
  /** Full length of the track, ms. */
  durationMs: number;
  /** Current clip start, ms (v-model). */
  modelValue: number;
  /** Where to read audio from for the "listen" button - a blob: URL for a
   * not-yet-uploaded File, or the track's real URL once it's in the library. */
  previewUrl?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [number] }>();

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// The window is always exactly CLIP_DURATION_MS wide - dragging either edge
// moves the whole window, it never resizes.
const maxStart = computed(() => Math.max(0, props.durationMs - CLIP_DURATION_MS));

const start = computed({
  get: () => clamp(props.modelValue, 0, maxStart.value),
  set: (value: number) => emit("update:modelValue", clamp(value, 0, maxStart.value)),
});
const end = computed({
  get: () => Math.min(start.value + CLIP_DURATION_MS, props.durationMs),
  set: (value: number) => emit("update:modelValue", clamp(value - CLIP_DURATION_MS, 0, maxStart.value)),
});

const startPercent = computed(() => (props.durationMs > 0 ? (start.value / props.durationMs) * 100 : 0));
const windowPercent = computed(() =>
  props.durationMs > 0 ? (CLIP_DURATION_MS / props.durationMs) * 100 : 100,
);

function formatTime(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const audioEl = ref<HTMLAudioElement | null>(null);
const previewing = ref(false);

function togglePreview() {
  const audio = audioEl.value;
  if (!audio || !props.previewUrl) return;
  if (previewing.value) {
    audio.pause();
    return;
  }
  if (audio.src !== props.previewUrl) audio.src = props.previewUrl;
  audio.currentTime = start.value / 1000;
  audio.play().catch((e) => console.error("preview playback blocked:", e));
  previewing.value = true;
}

function onTimeUpdate() {
  const audio = audioEl.value;
  if (audio && audio.currentTime * 1000 >= end.value) audio.pause();
}
</script>

<template>
  <div class="clip-picker">
    <div class="clip-track">
      <div class="clip-window" :style="{ left: startPercent + '%', width: windowPercent + '%' }"></div>
      <input type="range" class="clip-range" :min="0" :max="durationMs" :step="100" v-model.number="start" />
      <input type="range" class="clip-range" :min="0" :max="durationMs" :step="100" v-model.number="end" />
    </div>
    <div class="clip-footer">
      <button
        type="button"
        class="preview-toggle"
        :class="{ playing: previewing }"
        :disabled="!previewUrl"
        :aria-label="previewing ? 'Стоп' : 'Прослушать отрезок'"
        @click="togglePreview"
      >
        {{ previewing ? "⏸" : "▶" }}
      </button>
      <div class="clip-labels">
        <span class="clip-range-time">{{ formatTime(start) }}–{{ formatTime(end) }}</span>
        <span class="clip-duration">14с</span>
        <span class="clip-total">из {{ formatTime(durationMs) }}</span>
      </div>
    </div>
    <audio ref="audioEl" @timeupdate="onTimeUpdate" @pause="previewing = false" @ended="previewing = false"></audio>
  </div>
</template>

<style scoped>
.clip-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.clip-track {
  position: relative;
  height: 36px;
}
.clip-track::before {
  content: "";
  position: absolute;
  top: 16px;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 2px;
  background: #30324a;
}
.clip-window {
  position: absolute;
  top: 16px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #5865f2, #7b5cf5);
}
.clip-range {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}
.clip-range::-webkit-slider-runnable-track {
  background: transparent;
}
.clip-range::-webkit-slider-thumb {
  pointer-events: auto;
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  border: 3px solid #5865f2;
  cursor: pointer;
  margin-top: 7px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
.clip-range::-moz-range-track {
  background: transparent;
  border: none;
}
.clip-range::-moz-range-thumb {
  pointer-events: auto;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  border: 3px solid #5865f2;
  cursor: pointer;
}
.clip-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}
.preview-toggle {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  color: white;
  background: linear-gradient(135deg, #5865f2, #7b5cf5);
  box-shadow: 0 2px 10px rgba(88, 101, 242, 0.4);
  cursor: pointer;
  transition: transform 0.1s ease, background-color 0.15s ease;
}
.preview-toggle:active {
  transform: scale(0.94);
}
.preview-toggle.playing {
  background: #3ddc84;
  box-shadow: 0 2px 10px rgba(61, 220, 132, 0.4);
}
.preview-toggle:disabled {
  background: #30324a;
  box-shadow: none;
  cursor: not-allowed;
}
.clip-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: #9aa0ad;
}
.clip-range-time {
  font-weight: 600;
  color: #e4e6f5;
}
.clip-duration {
  color: #3ddc84;
  font-weight: bold;
  font-size: 11px;
}
</style>
