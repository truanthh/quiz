<script setup lang="ts">
import { CLIP_DURATION_MS } from "@quiz/shared";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/dist/plugins/regions.esm.js";

const props = defineProps<{
  /** Full length of the track, ms. */
  durationMs: number;
  /** Current clip start, ms (v-model). */
  modelValue: number;
  /** Where to read audio from for the waveform + "listen" button - a blob:
   * URL for a not-yet-uploaded File, or the track's real URL once it's in
   * the library. */
  previewUrl?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [number] }>();

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// The window is always exactly CLIP_DURATION_MS wide - dragging the region
// moves the whole window, it never resizes (resize is disabled below).
const maxStart = computed(() => Math.max(0, props.durationMs - CLIP_DURATION_MS));

const start = computed({
  get: () => clamp(props.modelValue, 0, maxStart.value),
  set: (value: number) => emit("update:modelValue", clamp(value, 0, maxStart.value)),
});
const end = computed(() => Math.min(start.value + CLIP_DURATION_MS, props.durationMs));

function formatTime(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const waveformEl = ref<HTMLDivElement | null>(null);
const previewing = ref(false);
const ready = ref(false);

let wavesurfer: WaveSurfer | null = null;
let regions: RegionsPlugin | null = null;
let clipRegion: Region | null = null;

function destroyWave() {
  ready.value = false;
  previewing.value = false;
  clipRegion = null;
  regions = null;
  wavesurfer?.destroy();
  wavesurfer = null;
}

function initWave(url: string) {
  destroyWave();
  const container = waveformEl.value;
  if (!container) return;

  wavesurfer = WaveSurfer.create({
    container,
    url,
    height: 72,
    waveColor: "#4a4d6a",
    progressColor: "#5865f2",
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    // The only thing draggable here is the clip region below - a seekable
    // cursor on top of it would be a second, confusingly independent drag
    // handle, so both the click/drag interaction and the cursor line
    // itself are switched off.
    interact: false,
    cursorWidth: 0,
  });
  regions = wavesurfer.registerPlugin(RegionsPlugin.create());

  wavesurfer.on("play", () => (previewing.value = true));
  wavesurfer.on("pause", () => (previewing.value = false));
  wavesurfer.on("finish", () => (previewing.value = false));

  wavesurfer.on("ready", () => {
    if (!regions) return;
    clipRegion = regions.addRegion({
      start: start.value / 1000,
      end: end.value / 1000,
      color: "rgba(88, 101, 242, 0.5)",
      drag: true,
      resize: false,
    });
    if (clipRegion.element) {
      clipRegion.element.style.border = "2px solid #8b93ff";
      clipRegion.element.style.boxShadow = "inset 0 0 0 1px rgba(255, 255, 255, 0.25)";
    }
    ready.value = true;
  });

  regions.on("region-update", (region) => {
    if (region !== clipRegion) return;
    start.value = region.start * 1000;
    // wavesurfer clamps each edge independently, so dragging past either
    // end of the track shrinks the region instead of stopping it - force
    // it back to our own (always-exactly-14s) start/end on every tick.
    const clampedStart = start.value / 1000;
    const clampedEnd = end.value / 1000;
    if (region.start !== clampedStart || region.end !== clampedEnd) {
      region.setOptions({ start: clampedStart, end: clampedEnd });
    }
  });
}

onMounted(() => {
  if (props.previewUrl) initWave(props.previewUrl);
});

watch(
  () => props.previewUrl,
  (url) => {
    if (url) initWave(url);
    else destroyWave();
  },
);

onBeforeUnmount(destroyWave);

function togglePreview() {
  if (!wavesurfer || !clipRegion) return;
  if (previewing.value) {
    wavesurfer.pause();
    return;
  }
  clipRegion.play(true);
}
</script>

<template>
  <div class="clip-picker">
    <div ref="waveformEl" class="waveform" :class="{ loading: !ready }"></div>
    <div class="clip-footer">
      <button
        type="button"
        class="preview-toggle"
        :class="{ playing: previewing }"
        :disabled="!ready"
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
  </div>
</template>

<style scoped>
.clip-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.waveform {
  border-radius: 8px;
  overflow: hidden;
  background: #20212e;
}
.waveform.loading {
  min-height: 72px;
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
