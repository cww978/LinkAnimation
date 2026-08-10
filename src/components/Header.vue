<script setup lang="ts">
import logoUrl from "../assets/logo.svg";
import { computed } from "vue";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Code2,
  Eye,
  Github,
} from "lucide-vue-next";
import { CanvasConfig } from "../types/route";

const props = defineProps<{
  canvasConfig: CanvasConfig;
  zoomScale: number;
  pointsCount: number;
}>();

const emit = defineEmits<{
  (e: "update-canvas", width: number, height: number): void;
  (e: "update:zoomScale", val: number): void;
  (e: "clear-points"): void;
  (e: "export-json"): void;
  (e: "import-json", content: string): void;
  (e: "open-code-modal"): void;
  (e: "open-preview-modal"): void;
}>();

const currentPreset = computed(() => {
  const key = `${props.canvasConfig.width}x${props.canvasConfig.height}`;
  if (
    ["960x540", "1280x720", "800x600", "1024x768", "1920x1080"].includes(key)
  ) {
    return key;
  }
  return "custom";
});

const onPresetChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value;
  if (val === "custom") return;
  const [w, h] = val.split("x").map(Number);
  emit("update-canvas", w, h);
};

const zoomIn = () => {
  emit("update:zoomScale", Math.min(2, props.zoomScale + 0.1));
};

const zoomOut = () => {
  emit("update:zoomScale", Math.max(0.5, props.zoomScale - 0.1));
};

const resetZoom = () => {
  emit("update:zoomScale", 1);
};

const onFileImport = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) emit("import-json", content);
    };
    reader.readAsText(file);
  }
};
</script>

<template>
  <header class="header-bar">
    <div class="brand">
      <div class="logo-icon">
        <img :src="logoUrl" alt="LinkAnimation Logo" class="logo-img" />
      </div>
      <div class="brand-text">
        <h1>LinkAnimation</h1>
        <span class="badge">路径动画编辑器</span>
      </div>

      <!-- GitHub Link on Left -->
      <a
        href="https://github.com/cww978/LinkAnimation"
        target="_blank"
        rel="noopener noreferrer"
        class="github-left-link"
        title="访问 GitHub 开源项目仓库"
      >
        <Github class="w-4 h-4" />
        <span>GitHub</span>
      </a>
    </div>

    <!-- Center Stage Controls -->
    <div class="center-controls">
      <!-- Preset Canvas Size -->
      <div class="preset-selector">
        <span class="label">画布规格:</span>
        <select :value="currentPreset" @change="onPresetChange">
          <option value="960x540">960 x 540 (16:9 标清)</option>
          <option value="1280x720">1280 x 720 (16:9 高清)</option>
          <option value="800x600">800 x 600 (4:3 传统)</option>
          <option value="1024x768">1024 x 768 (平板尺寸)</option>
          <option value="1920x1080">1920 x 1080 (FHD 全高清)</option>
          <option value="custom">自定义大小...</option>
        </select>
      </div>

      <!-- Stage Zoom -->
      <div class="zoom-controls">
        <button
          class="icon-btn"
          title="缩小画布"
          @click="zoomOut"
          :disabled="zoomScale <= 0.5"
        >
          <ZoomOut class="w-4 h-4" />
        </button>
        <span class="zoom-text">{{ Math.round(zoomScale * 100) }}%</span>
        <button
          class="icon-btn"
          title="放大画布"
          @click="zoomIn"
          :disabled="zoomScale >= 2"
        >
          <ZoomIn class="w-4 h-4" />
        </button>
        <button class="icon-btn" title="重置缩放" @click="resetZoom">
          <RotateCcw class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <!-- Quick Clear -->
      <button
        class="btn btn-secondary"
        title="清空路线点"
        @click="$emit('clear-points')"
        :disabled="pointsCount === 0"
      >
        <Trash2 class="w-4 h-4 text-red-400" />
        <span>清空点 ({{ pointsCount }})</span>
      </button>

      <!-- Import JSON -->
      <label class="btn btn-secondary cursor-pointer" title="导入 JSON 配置">
        <Upload class="w-4 h-4" />
        <span>导入配置</span>
        <input
          type="file"
          accept=".json"
          class="hidden"
          @change="onFileImport"
        />
      </label>

      <!-- Export JSON -->
      <button
        class="btn btn-secondary"
        title="导出 JSON 配置"
        @click="$emit('export-json')"
      >
        <Download class="w-4 h-4" />
        <span>导出 JSON</span>
      </button>

      <!-- Preview Mode -->
      <button
        class="btn btn-preview"
        title="进入 LinkAnimation 预览模式"
        @click="$emit('open-preview-modal')"
      >
        <Eye class="w-4 h-4" />
        <span>预览模式</span>
      </button>

      <!-- Export Code -->
      <button
        class="btn btn-primary"
        title="导出 CSS / JS 代码"
        @click="$emit('open-code-modal')"
      >
        <Code2 class="w-4 h-4" />
        <span>导出代码</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  height: 60px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: #f8fafc;
  z-index: 100;
  user-select: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.github-left-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.github-left-link:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.logo-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  padding: 5px;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-text h1 {
  font-family: "Outfit", sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin: 0;
  background: linear-gradient(to right, #ffffff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-text .badge {
  font-size: 10px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.center-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #0f172a;
  padding: 4px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.preset-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.preset-selector .label {
  color: #94a3b8;
}

.preset-selector select {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 12px;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  padding-left: 12px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-text {
  font-size: 12px;
  font-weight: 600;
  font-family: "Fira Code", monospace;
  color: #f8fafc;
  min-width: 40px;
  text-align: center;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-secondary {
  background: #1e293b;
  color: #cbd5e1;
  border-color: rgba(255, 255, 255, 0.08);
}

.github-btn {
  text-decoration: none;
}

.btn-secondary:hover:not(:disabled) {
  background: #334155;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-preview {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-preview:hover {
  background: linear-gradient(135deg, #10b981, #34d399);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.5);
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #38bdf8, #7dd3fc);
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.5);
  transform: translateY(-1px);
}

.hidden {
  display: none;
}
</style>
