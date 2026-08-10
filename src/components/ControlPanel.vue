<template>
  <aside class="control-panel">
    <!-- Panel Header Tabs -->
    <div class="panel-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab 1: Canvas & Background -->
    <div v-if="activeTab === 'canvas'" class="tab-content">
      <div class="section-title">画布尺寸与外边距</div>

      <div class="input-grid">
        <div class="form-group">
          <label>宽度 (Width px)</label>
          <input
            type="number"
            :value="canvasConfig.width"
            @input="onWidthInput"
            min="300"
            max="3840"
            step="10"
          />
        </div>
        <div class="form-group">
          <label>高度 (Height px)</label>
          <input
            type="number"
            :value="canvasConfig.height"
            @input="onHeightInput"
            min="200"
            max="2160"
            step="10"
          />
        </div>
      </div>

      <div class="divider"></div>
      <div class="section-title">背景图设置</div>

      <!-- Upload Background Image -->
      <div class="upload-box">
        <div v-if="canvasConfig.bgImage" class="bg-preview">
          <img :src="canvasConfig.bgImage" alt="Background Preview" />
          <button class="remove-btn" title="移除背景图" @click="canvasConfig.bgImage = null">
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
        <label v-else class="upload-dropzone">
          <Image class="w-8 h-8 text-sky-400 mb-1" />
          <span class="text-sm text-slate-200 font-medium">点击上传背景图</span>
          <span class="text-xs text-slate-400 mt-1">支持 PNG, JPG, WEBP, SVG</span>
          <input type="file" accept="image/*" class="hidden" @change="onBgFileChange" />
        </label>
      </div>

      <div v-if="canvasConfig.bgImage" class="checkbox-group mt-3 mb-1">
        <label class="checkbox-label">
          <input type="checkbox" v-model="canvasConfig.bgVisible" />
          <span>显示背景图 (Visible)</span>
        </label>
      </div>

      <template v-if="canvasConfig.bgImage && (canvasConfig.bgVisible ?? true)">
        <div class="form-group-row">
          <label class="row-label">适配模式 (Fit)</label>
          <div class="row-control">
            <select v-model="canvasConfig.bgFit">
              <option value="cover">Cover (等比缩放覆盖)</option>
              <option value="contain">Contain (等比缩放包含)</option>
              <option value="fill">Fill (拉伸填满)</option>
            </select>
          </div>
        </div>

        <div class="form-group-row">
          <label class="row-label">背景图透明度</label>
          <div class="row-control range-control">
            <input
              type="range"
              v-model.number="canvasConfig.bgOpacity"
              min="0.1"
              max="1"
              step="0.05"
              :style="getSliderStyle(canvasConfig.bgOpacity, 0.1, 1)"
            />
            <span class="val-badge">{{ Math.round(canvasConfig.bgOpacity * 100) }}%</span>
          </div>
        </div>
      </template>

      <div class="divider"></div>
      <div class="section-title">网格与对齐</div>

      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="canvasConfig.gridVisible" />
          <span>显示辅助网格</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="canvasConfig.snapToGrid" />
          <span>网格磁吸对齐</span>
        </label>
      </div>

      <div v-if="canvasConfig.gridVisible" class="form-group-row">
        <label class="row-label">网格大小</label>
        <div class="row-control range-control">
          <input
            type="range"
            v-model.number="canvasConfig.gridSize"
            min="10"
            max="100"
            step="5"
            :style="getSliderStyle(canvasConfig.gridSize, 10, 100)"
          />
          <span class="val-badge">{{ canvasConfig.gridSize }}px</span>
        </div>
      </div>
    </div>

    <!-- Tab 2: Moving Subject & Image Gallery -->
    <div v-if="activeTab === 'subject'" class="tab-content">
      <!-- Multiple Image Library Management -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <div class="section-title mb-0">主体图片库 (可添加多张并设默认)</div>
          <label class="btn-add-img cursor-pointer">
            <Plus class="w-3.5 h-3.5" />
            <span>添加图片</span>
            <input type="file" accept="image/*" class="hidden" @change="onSubjectFileChange" />
          </label>
        </div>

        <!-- Image Management List -->
        <div v-if="subjectConfig.images.length > 0" class="image-gallery">
          <div
            v-for="img in subjectConfig.images"
            :key="img.id"
            class="gallery-item"
            :class="{ 'is-default': img.isDefault || img.id === subjectConfig.defaultImageId }"
          >
            <img :src="img.url" :alt="img.name" class="thumb" />
            <div class="img-info">
              <input type="text" v-model="img.name" class="img-name-input" />
              <div class="img-actions">
                <span v-if="img.isDefault || img.id === subjectConfig.defaultImageId" class="badge-default">
                  ★ 默认图片
                </span>
                <button
                  v-else
                  class="btn-set-default"
                  @click="$emit('set-default-subject-image', img.id)"
                >
                  设为默认
                </button>
              </div>
            </div>
            <button
              class="btn-delete-point"
              title="删除此图片"
              @click="$emit('remove-subject-image', img.id)"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>

        <label v-else class="upload-dropzone">
          <Upload class="w-7 h-7 text-sky-400 mb-1" />
          <span class="text-sm text-slate-200 font-medium">点击上传主体图片</span>
          <span class="text-xs text-slate-400 mt-1">支持上传多张图片，在路径点灵活切换</span>
          <input type="file" accept="image/*" class="hidden" @change="onSubjectFileChange" />
        </label>
      </div>

      <div class="divider"></div>
      <div class="section-title">主体尺寸与样式</div>

      <div class="input-grid">
        <div class="form-group">
          <label>宽度 (Width px)</label>
          <input type="number" v-model.number="subjectConfig.width" min="10" max="500" />
        </div>
        <div class="form-group">
          <label>高度 (Height px)</label>
          <input type="number" v-model.number="subjectConfig.height" min="10" max="500" />
        </div>
      </div>

      <!-- Interactive Drag-to-Set Pivot Center Point -->
      <div class="pivot-section mt-3">
        <div class="flex items-center justify-between mb-2">
          <label class="row-label font-semibold text-sky-400">🎯 中心点 (Pivot / Anchor Point)</label>
          <span class="val-badge font-mono">X: {{ subjectConfig.originX ?? 50 }}% | Y: {{ subjectConfig.originY ?? 50 }}%</span>
        </div>

        <div class="pivot-box-container">
          <!-- 2D Drag Canvas Box -->
          <div
            class="pivot-canvas-box"
            ref="pivotBoxRef"
            @mousedown="onPivotMouseDown"
          >
            <div class="pivot-grid-lines">
              <div class="cross-line-h"></div>
              <div class="cross-line-v"></div>
            </div>

            <!-- Subject Outline Thumbnail -->
            <div class="subject-preview-rect">
              <img v-if="currentSubjectImageSrc" :src="currentSubjectImageSrc" class="thumb-img" />
              <span v-else>⛵</span>
            </div>

            <!-- Draggable Pivot Target Handle (🎯) -->
            <div
              class="pivot-target-handle"
              :style="{
                left: `${subjectConfig.originX ?? 50}%`,
                top: `${subjectConfig.originY ?? 50}%`
              }"
              title="按住鼠标拖拽调整中心点"
            >
              <div class="target-ring"></div>
              <div class="target-dot"></div>
            </div>
          </div>

          <!-- Quick Preset Anchor Buttons -->
          <div class="pivot-presets">
            <button class="preset-btn" :class="{ active: (subjectConfig.originX === 0 && subjectConfig.originY === 0) }" @click="setPivot(0, 0)">左上 (0,0)</button>
            <button class="preset-btn" :class="{ active: (subjectConfig.originX === 50 && subjectConfig.originY === 0) }" @click="setPivot(50, 0)">正顶 (50,0)</button>
            <button class="preset-btn" :class="{ active: (subjectConfig.originX === 100 && subjectConfig.originY === 0) }" @click="setPivot(100, 0)">右上 (100,0)</button>
            <button class="preset-btn" :class="{ active: (subjectConfig.originX === 0 && subjectConfig.originY === 50) }" @click="setPivot(0, 50)">正左 (0,50)</button>
            <button class="preset-btn" :class="{ active: (subjectConfig.originX === 50 && subjectConfig.originY === 50) }" @click="setPivot(50, 50)">正中 (50,50)</button>
            <button class="preset-btn" :class="{ active: (subjectConfig.originX === 100 && subjectConfig.originY === 50) }" @click="setPivot(100, 50)">正右 (100,50)</button>
            <button class="preset-btn" :class="{ active: (subjectConfig.originX === 0 && subjectConfig.originY === 100) }" @click="setPivot(0, 100)">左下 (0,100)</button>
            <button class="preset-btn" :class="{ active: (subjectConfig.originX === 50 && subjectConfig.originY === 100) }" @click="setPivot(50, 100)">正底 (50,100)</button>
            <button class="preset-btn" :class="{ active: (subjectConfig.originX === 100 && subjectConfig.originY === 100) }" @click="setPivot(100, 100)">右下 (100,100)</button>
          </div>
        </div>
      </div>

      <div class="divider"></div>
      <div class="section-title">旋转朝向设置</div>

      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="subjectConfig.autoRotate" />
          <span>沿路径切线自动旋转朝向 (Z轴)</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="subjectConfig.shadow" />
          <span>显示阴影效果</span>
        </label>
      </div>

      <div v-if="subjectConfig.autoRotate" class="form-group-row">
        <label class="row-label">角度偏移修正</label>
        <div class="row-control range-control">
          <input
            type="range"
            v-model.number="subjectConfig.angleOffset"
            min="-180"
            max="180"
            step="5"
            :style="getSliderStyle(subjectConfig.angleOffset, -180, 180)"
          />
          <span class="val-badge">{{ subjectConfig.angleOffset }}°</span>
        </div>
      </div>
    </div>

    <!-- Tab 3: Route Points List (Stretches 100% Height) -->
    <div v-if="activeTab === 'points'" class="tab-content flex-col-full">
      <div class="flex items-center justify-between mb-2">
        <div class="section-title mb-0">路径点坐标列表 (Left / Top)</div>
        <span class="text-xs text-sky-400 font-semibold font-mono bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-800/40">
          共 {{ points.length }} 个路径点
        </span>
      </div>

      <p class="text-xs text-slate-400 mb-3">
        坐标基于背景图绝对定位 (<code class="text-sky-300">left</code>, <code class="text-sky-300">top</code>)，定位与运动全以绝对像素计算。
      </p>

      <div class="points-list-full">
        <div
          v-for="(point, idx) in points"
          :key="point.id"
          class="point-item"
          :class="{ active: selectedPointId === point.id }"
          @click="$emit('select-point', point.id)"
        >
          <div class="point-header">
            <span class="point-badge" :class="idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : ''">
              P{{ idx }}
            </span>
            <input type="text" v-model="point.name" class="point-name-input" />
            <button
              class="btn-delete-point"
              title="删除此点"
              @click.stop="$emit('delete-point', point.id)"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>

          <!-- Position Coordinates -->
          <div class="point-coords">
            <div class="coord-field">
              <span class="coord-label">left:</span>
              <input
                type="number"
                :value="point.x"
                @input="(e) => updateCoord(point.id, Number((e.target as HTMLInputElement).value), point.y)"
                min="0"
                :max="canvasConfig.width"
              />
              <span class="unit">px</span>
            </div>
            <div class="coord-field">
              <span class="coord-label">top:</span>
              <input
                type="number"
                :value="point.y"
                @input="(e) => updateCoord(point.id, point.x, Number((e.target as HTMLInputElement).value))"
                min="0"
                :max="canvasConfig.height"
              />
              <span class="unit">px</span>
            </div>
          </div>

          <!-- Waypoint Image Switch Setting -->
          <div v-if="subjectConfig.images.length > 0" class="switch-image-group">
            <label class="switch-label">🖼️ 到达此点切换图片:</label>
            <select
              :value="point.switchImageId || ''"
              @change="(e) => point.switchImageId = (e.target as HTMLSelectElement).value || null"
              class="switch-select"
            >
              <option value="">不切换 (保持当前图片)</option>
              <option
                v-for="img in subjectConfig.images"
                :key="img.id"
                :value="img.id"
              >
                {{ img.name }} {{ (img.isDefault || img.id === subjectConfig.defaultImageId) ? '(默认)' : '' }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 4: Animation Settings & X/Y/Z Rotation Locking -->
    <div v-if="activeTab === 'anim'" class="tab-content">
      <div class="section-title">动画播放参数</div>

      <div class="form-group-row">
        <label class="row-label">动画总时长</label>
        <div class="row-control range-control">
          <input
            type="range"
            v-model.number="animConfig.duration"
            min="0.5"
            max="20"
            step="0.5"
            :style="getSliderStyle(animConfig.duration, 0.5, 20)"
          />
          <span class="val-badge">{{ animConfig.duration }}s</span>
        </div>
      </div>

      <div class="form-group-row">
        <label class="row-label">路线平滑模式</label>
        <div class="row-control">
          <select v-model="animConfig.curveType">
            <option value="smooth">Catmull-Rom 平滑曲线</option>
            <option value="linear">直线折线段</option>
          </select>
        </div>
      </div>

      <div class="form-group-row">
        <label class="row-label">缓动函数</label>
        <div class="row-control">
          <select v-model="animConfig.easing">
            <option value="linear">Linear (匀速)</option>
            <option value="ease">Ease (平缓)</option>
            <option value="ease-in">Ease-In (加速)</option>
            <option value="ease-out">Ease-Out (减速)</option>
            <option value="ease-in-out">Ease-In-Out (先加后减速)</option>
            <option value="bounce">Bounce (弹跳效果)</option>
          </select>
        </div>
      </div>

      <div class="divider"></div>
      <div class="section-title">锁定 X / Y / Z 轴旋转 (ROTATION LOCK)</div>

      <!-- Lock X Axis -->
      <div class="lock-card">
        <label class="checkbox-label">
          <input type="checkbox" v-model="animConfig.lockRotateX" />
          <span>锁定 X 轴旋转 (Pitch / 垂直倾斜)</span>
        </label>
        <div v-if="animConfig.lockRotateX" class="form-group-row mt-2">
          <label class="row-label">固定 X 轴角度</label>
          <div class="row-control range-control">
            <input
              type="range"
              v-model.number="animConfig.fixedAngleX"
              min="0"
              max="360"
              step="5"
              :style="getSliderStyle(animConfig.fixedAngleX, 0, 360)"
            />
            <span class="val-badge">{{ animConfig.fixedAngleX }}°</span>
          </div>
        </div>
      </div>

      <!-- Lock Y Axis -->
      <div class="lock-card mt-2">
        <label class="checkbox-label">
          <input type="checkbox" v-model="animConfig.lockRotateY" />
          <span>锁定 Y 轴旋转 (Yaw / 水平镜像翻转)</span>
        </label>
        <div v-if="animConfig.lockRotateY" class="form-group-row mt-2">
          <label class="row-label">固定 Y 轴角度</label>
          <div class="row-control range-control">
            <input
              type="range"
              v-model.number="animConfig.fixedAngleY"
              min="0"
              max="360"
              step="5"
              :style="getSliderStyle(animConfig.fixedAngleY, 0, 360)"
            />
            <span class="val-badge">{{ animConfig.fixedAngleY }}°</span>
          </div>
        </div>
      </div>

      <!-- Lock Z Axis -->
      <div class="lock-card mt-2">
        <label class="checkbox-label">
          <input type="checkbox" v-model="animConfig.lockRotateZ" />
          <span>锁定 Z 轴旋转 (Roll / 固定平面角度)</span>
        </label>
        <div v-if="animConfig.lockRotateZ" class="form-group-row mt-2">
          <label class="row-label">固定 Z 轴角度</label>
          <div class="row-control range-control">
            <input
              type="range"
              v-model.number="animConfig.fixedAngleZ"
              min="0"
              max="360"
              step="5"
              :style="getSliderStyle(animConfig.fixedAngleZ, 0, 360)"
            />
            <span class="val-badge">{{ animConfig.fixedAngleZ }}°</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>
      <div class="section-title">循环与播放模式</div>

      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="animConfig.loop" />
          <span>无限循环播放 (Loop)</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="animConfig.yoyo" />
          <span>往返往复播放 (Ping-Pong / Yoyo)</span>
        </label>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Layout,
  Box,
  MapPin,
  PlayCircle,
  Image,
  Trash2,
  Image as ImageIcon,
  Upload,
  Plus,
} from 'lucide-vue-next'
import { CanvasConfig, SubjectConfig, AnimationConfig, Point } from '../types/route'

const props = defineProps<{
  canvasConfig: CanvasConfig
  subjectConfig: SubjectConfig
  animConfig: AnimationConfig
  points: Point[]
  selectedPointId: string | null
}>()

const emit = defineEmits<{
  (e: 'update-canvas', width: number, height: number): void
  (e: 'update-point', id: string, x: number, y: number): void
  (e: 'delete-point', id: string): void
  (e: 'select-point', id: string): void
  (e: 'upload-bg', file: File): void
  (e: 'upload-subject', file: File): void
  (e: 'set-default-subject-image', id: string): void
  (e: 'remove-subject-image', id: string): void
}>()

const activeTab = ref<'canvas' | 'subject' | 'points' | 'anim'>('canvas')
const pivotBoxRef = ref<HTMLDivElement | null>(null)

const tabs = [
  { id: 'canvas', label: '画布背景', icon: Layout },
  { id: 'subject', label: '主体图片', icon: Box },
  { id: 'points', label: '路径点', icon: MapPin },
  { id: 'anim', label: '动画属性', icon: PlayCircle },
] as const

const onWidthInput = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  emit('update-canvas', val, props.canvasConfig.height)
}

const onHeightInput = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  emit('update-canvas', props.canvasConfig.width, val)
}

const onBgFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('upload-bg', file)
}

const onSubjectFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('upload-subject', file)
}

const updateCoord = (id: string, x: number, y: number) => {
  emit('update-point', id, x, y)
}

// Dynamic active slider gradient track fill
const getSliderStyle = (val: number, min: number, max: number) => {
  const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100))
  return {
    background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${pct}%, #334155 ${pct}%, #334155 100%)`,
  }
}

// Current subject active image src helper
const currentSubjectImageSrc = computed(() => {
  const defImg = props.subjectConfig.images?.find((img) => img.id === props.subjectConfig.defaultImageId || img.isDefault)
  return defImg?.url || props.subjectConfig.images?.[0]?.url || props.subjectConfig.image || null
})

// Drag-to-Set Pivot Center Point mouse handlers
const updatePivotFromMouse = (e: MouseEvent) => {
  if (!pivotBoxRef.value) return
  const rect = pivotBoxRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
  const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))

  const originX = Math.round((x / rect.width) * 100)
  const originY = Math.round((y / rect.height) * 100)

  props.subjectConfig.originX = originX
  props.subjectConfig.originY = originY
}

const onPivotMouseDown = (e: MouseEvent) => {
  updatePivotFromMouse(e)

  const onWindowMove = (e: MouseEvent) => {
    updatePivotFromMouse(e)
  }
  const onWindowUp = () => {
    window.removeEventListener('mousemove', onWindowMove)
    window.removeEventListener('mouseup', onWindowUp)
  }
  window.addEventListener('mousemove', onWindowMove)
  window.addEventListener('mouseup', onWindowUp)
}

const setPivot = (ox: number, oy: number) => {
  props.subjectConfig.originX = ox
  props.subjectConfig.originY = oy
}
</script>

<style scoped>
.control-panel {
  width: 380px;
  height: 100%;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  color: #f8fafc;
  z-index: 50;
  user-select: none;
}

.panel-tabs {
  display: flex;
  background: #090d16;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 6px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.04);
}

.tab-btn.active {
  color: #38bdf8;
  border-bottom-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  font-weight: 600;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
}

.flex-col-full {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 12px;
  background: linear-gradient(180deg, #38bdf8, #818cf8);
  border-radius: 2px;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  margin: 18px 0;
}

/* Utility Spacing Classes */
.mt-1 { margin-top: 4px !important; }
.mt-2 { margin-top: 10px !important; }
.mt-3 { margin-top: 16px !important; }
.mt-4 { margin-top: 22px !important; }

.mb-1 { margin-bottom: 4px !important; }
.mb-2 { margin-bottom: 10px !important; }
.mb-3 { margin-bottom: 16px !important; }
.mb-4 { margin-bottom: 22px !important; }

.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-grid > .form-group {
  margin-top: 0 !important;
}

.tab-content > .form-group + .form-group,
.form-group-row + .form-group-row,
.checkbox-group + .form-group-row,
.upload-box + .form-group-row,
.type-selector + .form-group-row,
.input-grid + .form-group-row {
  margin-top: 16px;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

/* Horizontal Row Layout: Label Left, Control Right */
.form-group-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.row-label {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  white-space: nowrap;
  min-width: 96px;
  flex-shrink: 0;
}

.row-control {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.val-badge {
  font-size: 11px;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  min-width: 44px;
  text-align: center;
  flex-shrink: 0;
}

/* Interactive Drag Pivot Section */
.pivot-section {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
}

.pivot-box-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pivot-canvas-box {
  position: relative;
  width: 115px;
  height: 100px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  overflow: hidden;
  cursor: crosshair;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.pivot-grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cross-line-h {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
}

.cross-line-v {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.12);
}

.subject-preview-rect {
  width: 60%;
  height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  border: 1px dashed #38bdf8;
  border-radius: 6px;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pivot-target-handle {
  position: absolute;
  width: 18px;
  height: 18px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.target-ring {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
  animation: pulsePivot 1.5s infinite;
}

.target-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 4px #ef4444;
}

@keyframes pulsePivot {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.8; }
}

.pivot-presets {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.preset-btn {
  font-size: 10px;
  padding: 5px 2px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.preset-btn:hover {
  border-color: #38bdf8;
  color: #f8fafc;
}

.preset-btn.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #f87171;
  font-weight: 600;
}

.form-group input[type='number'],
.form-group input[type='text'],
.form-group select,
.row-control input[type='text'],
.row-control select {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  outline: none;
  width: 100%;
  transition: all 0.2s ease;
}

.form-group input[type='number']:hover,
.form-group input[type='text']:hover,
.form-group select:hover,
.row-control input[type='text']:hover,
.row-control select:hover {
  border-color: rgba(56, 189, 248, 0.4);
}

.form-group input[type='number']:focus,
.form-group input[type='text']:focus,
.form-group select:focus,
.row-control input[type='text']:focus,
.row-control select:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
  background: #141e33;
}

/* Custom Range Slider styling with dynamic gradient fill */
.form-group input[type='range'],
.row-control input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  outline: none;
  margin: 6px 0;
  cursor: pointer;
  transition: background 0.1s ease;
}

.form-group input[type='range']::-webkit-slider-thumb,
.row-control input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  cursor: pointer;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
  transition: transform 0.15s ease;
}

.form-group input[type='range']::-webkit-slider-thumb:hover,
.row-control input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.lock-card {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px;
  transition: all 0.2s ease;
}

.lock-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.upload-box {
  width: 100%;
}

.upload-dropzone {
  border: 2px dashed rgba(56, 189, 248, 0.3);
  background: rgba(56, 189, 248, 0.04);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.15);
}

.bg-preview {
  position: relative;
  width: 100%;
  height: 110px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.bg-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(244, 63, 94, 0.9);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #f43f5e;
  transform: scale(1.1);
}

/* Multi-Image Gallery */
.btn-add-img {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.25);
  transition: all 0.2s;
}

.btn-add-img:hover {
  background: rgba(56, 189, 248, 0.22);
  border-color: #38bdf8;
}

.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
}

.gallery-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(30, 41, 59, 0.5);
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}

.gallery-item.is-default {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}

.thumb {
  width: 38px;
  height: 38px;
  object-fit: contain;
  border-radius: 8px;
  background: #0f172a;
  padding: 2px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.img-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.img-name-input {
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 500;
  outline: none;
}

.img-actions {
  display: flex;
  align-items: center;
}

.badge-default {
  font-size: 11px;
  color: #fbbf24;
  font-weight: 600;
}

.btn-set-default {
  font-size: 11px;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.btn-set-default:hover {
  color: #38bdf8;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type='checkbox'] {
  accent-color: #38bdf8;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Points List Stretching 100% Remaining Height */
.points-list-full {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 4px;
  margin-top: 4px;
}

.point-item {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.point-item:hover {
  border-color: rgba(56, 189, 248, 0.35);
  background: rgba(30, 41, 59, 0.7);
}

.point-item.active {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
}

.point-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.point-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: #334155;
  color: #f8fafc;
  font-family: 'Fira Code', monospace;
}

.point-badge.start {
  background: linear-gradient(135deg, #10b981, #059669);
}

.point-badge.end {
  background: linear-gradient(135deg, #f43f5e, #e11d48);
}

.point-name-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  outline: none;
}

.point-coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.coord-field {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #0f172a;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color 0.2s;
}

.coord-field:focus-within {
  border-color: #38bdf8;
}

.coord-label {
  font-size: 11px;
  font-weight: 600;
  color: #38bdf8;
  font-family: 'Fira Code', monospace;
}

.coord-field input {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Fira Code', monospace;
  outline: none;
}

.switch-image-group {
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.switch-label {
  font-size: 11px;
  font-weight: 500;
  color: #38bdf8;
}

.switch-select {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  outline: none;
}

.unit {
  font-size: 11px;
  color: #64748b;
}

.btn-delete-point {
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.25);
  color: #fb7185;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  margin-left: auto;
  flex-shrink: 0;
}

.btn-delete-point:hover {
  background: #f43f5e;
  color: #ffffff;
  border-color: #f43f5e;
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.5);
  transform: scale(1.08);
}

.hidden {
  display: none;
}
</style>
