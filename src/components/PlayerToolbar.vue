<template>
  <div class="player-toolbar">
    <!-- Play / Pause Button -->
    <button class="play-btn" @click="togglePlay" title="运行/暂停动画">
      <Pause v-if="isPlaying" class="w-5 h-5 fill-current" />
      <Play v-else class="w-5 h-5 fill-current ml-0.5" />
    </button>

    <!-- Stop / Reset Button -->
    <button class="toolbar-btn" @click="$emit('stop')" title="重置回到起点">
      <Square class="w-4 h-4 text-slate-300" />
    </button>

    <!-- Timeline Scrubber -->
    <div class="scrubber-wrapper">
      <span class="time-display">{{ currentTimeFormatted }}</span>
      <input
        type="range"
        class="timeline-slider"
        :value="progress * 100"
        @input="onScrub"
        min="0"
        max="100"
        step="0.1"
      />
      <span class="time-display text-slate-400">{{ totalDurationFormatted }}</span>
    </div>

    <!-- Speed Multiplier Buttons -->
    <div class="speed-selector">
      <button
        v-for="s in speeds"
        :key="s"
        class="speed-btn"
        :class="{ active: speed === s }"
        @click="animConfig.speed = s"
      >
        {{ s }}x
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Play, Pause, Square } from 'lucide-vue-next'
import { AnimationConfig } from '../types/route'

const props = defineProps<{
  isPlaying: boolean
  isPaused: boolean
  progress: number
  animConfig: AnimationConfig
}>()

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'stop'): void
  (e: 'seek', val: number): void
}>()

const speeds = [0.5, 1, 1.5, 2]

const togglePlay = () => {
  if (props.isPlaying) {
    emit('pause')
  } else {
    emit('play')
  }
}

const speed = computed(() => props.animConfig.speed)

const currentTimeFormatted = computed(() => {
  const currentSec = (props.progress * props.animConfig.duration).toFixed(1)
  return `${currentSec}s`
})

const totalDurationFormatted = computed(() => {
  return `${props.animConfig.duration.toFixed(1)}s`
})

const onScrub = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value) / 100
  emit('seek', val)
}
</script>

<style scoped>
.player-toolbar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 8px 16px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  z-index: 80;
  user-select: none;
}

.play-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.4);
  transition: all 0.2s;
}

.play-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.6);
}

.toolbar-btn {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #334155;
}

.scrubber-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 280px;
}

.time-display {
  font-size: 12px;
  font-family: 'Fira Code', monospace;
  font-weight: 600;
  color: #38bdf8;
  min-width: 36px;
}

.timeline-slider {
  flex: 1;
  accent-color: #38bdf8;
  cursor: pointer;
}

.speed-selector {
  display: flex;
  background: #1e293b;
  padding: 3px;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.speed-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.2s;
}

.speed-btn.active {
  background: #38bdf8;
  color: #0f172a;
}
</style>
