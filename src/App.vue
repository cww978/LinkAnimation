<template>
  <div class="app-container">
    <!-- Top Navbar Header -->
    <Header
      v-model:zoomScale="zoomScale"
      :canvasConfig="canvasConfig"
      :pointsCount="points.length"
      @update-canvas="onUpdateCanvas"
      @clear-points="clearPoints"
      @export-json="exportConfigJSON"
      @import-json="importConfigJSON"
      @open-code-modal="isCodeModalOpen = true"
      @open-preview-modal="isPreviewModalOpen = true"
    />

    <!-- Main Workspace (Canvas Stage + Right Control Panel) -->
    <main class="main-workspace">
      <!-- Interactive Stage Canvas -->
      <CanvasStage
        v-model:zoomScale="zoomScale"
        :points="points"
        :selectedPointId="selectedPointId"
        :hoveredSegment="hoveredSegment"
        :canvasConfig="canvasConfig"
        :subjectConfig="subjectConfig"
        :animConfig="animConfig"
        :currentPosition="currentPosition"
        :activeImageUrl="activeSubjectImageUrl"
        :curveType="animConfig.curveType"
        @add-point="onAddPoint"
        @insert-point="onInsertPoint"
        @update-point="updatePointPosition"
        @select-point="selectedPointId = $event"
        @delete-point="deletePoint"
        @mouse-move-stage="checkLineInsertion"
        @mouse-leave-stage="checkLineInsertion(-999, -999)"
      />

      <!-- Right Control Panel Sidebar -->
      <ControlPanel
        :canvasConfig="canvasConfig"
        :subjectConfig="subjectConfig"
        :animConfig="animConfig"
        :points="points"
        :selectedPointId="selectedPointId"
        @update-canvas="onUpdateCanvas"
        @update-point="updatePointPosition"
        @delete-point="deletePoint"
        @select-point="selectedPointId = $event"
        @upload-bg="handleBgImageUpload"
        @upload-subject="handleSubjectImageUpload"
        @set-default-subject-image="setDefaultSubjectImage"
        @remove-subject-image="removeSubjectImage"
      />
    </main>

    <!-- Floating Playback Toolbar -->
    <PlayerToolbar
      :isPlaying="isPlaying"
      :isPaused="isPaused"
      :progress="progress"
      :animConfig="animConfig"
      @play="play"
      @pause="pause"
      @stop="stop"
      @seek="seekTo"
    />

    <!-- Code Export Modal -->
    <ExportModal
      v-if="isCodeModalOpen"
      :points="points"
      :animConfig="animConfig"
      :subjectConfig="subjectConfig"
      @close="isCodeModalOpen = false"
    />

    <!-- Standalone LinkAnimation Class Preview Mode Modal -->
    <PreviewModal
      v-if="isPreviewModalOpen"
      :points="points"
      :canvasConfig="canvasConfig"
      :subjectConfig="subjectConfig"
      :animConfig="animConfig"
      @close="isPreviewModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Header from "./components/Header.vue";
import CanvasStage from "./components/CanvasStage.vue";
import ControlPanel from "./components/ControlPanel.vue";
import PlayerToolbar from "./components/PlayerToolbar.vue";
import ExportModal from "./components/ExportModal.vue";
import PreviewModal from "./components/PreviewModal.vue";

import { useRouteEditor } from "./composables/useRouteEditor";
import { useAnimationRunner } from "./composables/useAnimationRunner";

// Route & Stage Editor State
const {
  points,
  selectedPointId,
  hoveredSegment,
  canvasConfig,
  subjectConfig,
  animConfig,
  zoomScale,
  addPoint,
  insertPointAtSegment,
  updatePointPosition,
  deletePoint,
  clearPoints,
  checkLineInsertion,
  handleBgImageUpload,
  handleSubjectImageUpload,
  setDefaultSubjectImage,
  removeSubjectImage,
  exportConfigJSON,
  importConfigJSON,
} = useRouteEditor();

// Animation Player State (Supports active subject image switching during movement & point selection)
const {
  isPlaying,
  isPaused,
  progress,
  currentPosition,
  activeSubjectImageUrl,
  play,
  pause,
  stop,
  seekTo,
} = useAnimationRunner(points, animConfig, subjectConfig, selectedPointId);

const isCodeModalOpen = ref(false);
const isPreviewModalOpen = ref(false);

const onUpdateCanvas = (w: number, h: number) => {
  canvasConfig.width = Math.max(0, Math.min(3840, w));
  canvasConfig.height = Math.max(0, Math.min(2160, h));
};

const onAddPoint = (x: number, y: number) => {
  addPoint(x, y);
};

const onInsertPoint = (index: number, x: number, y: number) => {
  insertPointAtSegment(index, x, y);
};
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #090d16;
  position: relative;
  overflow: hidden;
}

.main-workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}
</style>
