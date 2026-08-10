<template>
  <div
    class="stage-wrapper"
    ref="wrapperRef"
    :class="{ 'is-panning': isPanning, 'space-held': isSpacePressed }"
    @mousedown="onStageMouseDown"
  >
    <!-- Scaler Wrapper (expands layout dimensions for parent scrollbars) -->
    <div class="canvas-scaler" :style="canvasScalerStyle">
      <div
        class="canvas-container"
        :style="canvasContainerStyle"
        @click="onStageClick"
        @mousemove="onStageMouseMove"
        @mouseleave="onStageMouseLeave"
      >
        <!-- Grid Overlay Layer -->
        <div
          v-if="canvasConfig.gridVisible"
          class="grid-layer"
          :style="gridStyle"
        ></div>

        <!-- Background Image Layer -->
        <div
          v-if="canvasConfig.bgImage && (canvasConfig.bgVisible ?? true)"
          class="bg-image-layer"
          :style="bgImageStyle"
        ></div>

        <!-- SVG Path & Line Connections Layer -->
        <svg
          class="svg-layer"
          :width="canvasConfig.width"
          :height="canvasConfig.height"
        >
          <defs>
            <linearGradient
              id="pathGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="50%" stop-color="#818cf8" />
              <stop offset="100%" stop-color="#c084fc" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <!-- Direction Marker Arrow -->
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          <!-- Base Path Glow Line -->
          <path
            v-if="pathD"
            :d="pathD"
            fill="none"
            stroke="url(#pathGradient)"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
            filter="url(#glow)"
            opacity="0.85"
          />

          <!-- Active Core Path Line -->
          <path
            v-if="pathD"
            :d="pathD"
            fill="none"
            stroke="#ffffff"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="6 6"
          />

          <!-- Straight Line Helper connection lines -->
          <polyline
            v-if="points.length > 1"
            :points="points.map((p) => `${p.x},${p.y}`).join(' ')"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            stroke-width="1"
            stroke-dasharray="3 3"
          />
        </svg>

        <!-- Hover Segment Candidate Point Insertion (+ Tag) -->
        <div
          v-if="hoveredSegment"
          class="candidate-point"
          :style="{
            left: `${hoveredSegment.point.x}px`,
            top: `${hoveredSegment.point.y}px`,
          }"
          title="点击在路线上新增路径点"
          @click.stop="onCandidateClick"
        >
          <span class="plus-icon">+</span>
        </div>

        <!-- Waypoint Nodes list -->
        <div
          v-for="(point, index) in points"
          :key="point.id"
          class="waypoint-node"
          :class="{
            selected: selectedPointId === point.id,
            isStart: index === 0,
            isEnd: index === points.length - 1,
            hasImageSwitch: isPointHasValidImageSwitch(point),
          }"
          :style="{
            left: `${point.x}px`,
            top: `${point.y}px`,
          }"
          @mousedown.stop="onPointMouseDown(point, $event)"
          @click.stop="onPointClick(point)"
        >
          <div class="node-dot">
            <span class="node-label">P{{ index }}</span>
            <span
              v-if="isPointHasValidImageSwitch(point)"
              class="image-switch-indicator"
              title="到达此点切换图片"
              >🖼️</span
            >
          </div>
        </div>

        <!-- Moving Animated Subject Element -->
        <div
          v-if="points.length > 0"
          class="animated-subject"
          :style="subjectStyle"
        >
          <!-- Custom Sprite Image -->
          <img
            v-if="subjectConfig.type === 'image' && currentSubjectImageSrc"
            :src="currentSubjectImageSrc"
            class="subject-img"
            alt="Subject"
          />

          <!-- Custom Div Content -->
          <div v-else class="subject-div-content">
            <span>{{ subjectConfig.text || "🚀" }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type CSSProperties } from "vue";
import {
  Point,
  CanvasConfig,
  SubjectConfig,
  AnimationConfig,
} from "../types/route";
import { generateSvgPathD } from "../utils/spline";
import { InterpolatedPoint } from "../utils/spline";

const props = defineProps<{
  points: Point[];
  selectedPointId: string | null;
  hoveredSegment: {
    insertIndex: number;
    point: { x: number; y: number };
  } | null;
  canvasConfig: CanvasConfig;
  subjectConfig: SubjectConfig;
  animConfig?: AnimationConfig;
  zoomScale: number;
  currentPosition: InterpolatedPoint;
  activeImageUrl?: string | null;
  curveType: "smooth" | "linear";
}>();

const emit = defineEmits<{
  (e: "update:zoomScale", val: number): void;
  (e: "add-point", x: number, y: number): void;
  (e: "insert-point", index: number, x: number, y: number): void;
  (e: "update-point", id: string, x: number, y: number): void;
  (e: "select-point", id: string): void;
  (e: "delete-point", id: string): void;
  (e: "mouse-move-stage", x: number, y: number): void;
  (e: "mouse-leave-stage"): void;
}>();

const wrapperRef = ref<HTMLDivElement | null>(null);
const draggingPointId = ref<string | null>(null);
const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 });

// Canvas Panning via Scrollbars
const isPanning = ref(false);
const isSpacePressed = ref(false);
let isPanningPrep = false;
let hasMovedDuringPan = false;
let panStart = { scrollLeft: 0, scrollTop: 0, clientX: 0, clientY: 0 };

// Helper to check if point has valid image switch
const isPointHasValidImageSwitch = (point: Point) => {
  const id = point.switchImageId;
  return !!id && id !== "null" && id !== "undefined" && id !== "";
};

// Compute subject image source (uses active playback image, or default image)
const currentSubjectImageSrc = computed(() => {
  if (props.activeImageUrl) return props.activeImageUrl;

  const defImg = props.subjectConfig.images?.find(
    (img) => img.id === props.subjectConfig.defaultImageId || img.isDefault,
  );
  return (
    defImg?.url ||
    props.subjectConfig.images?.[0]?.url ||
    props.subjectConfig.image ||
    null
  );
});

// Scaler Wrapper Style (Dynamically expands/shrinks layout box for parent scrollbars)
const canvasScalerStyle = computed<CSSProperties>(() => {
  const w = props.canvasConfig.width * props.zoomScale;
  const h = props.canvasConfig.height * props.zoomScale;
  return {
    width: `${w}px`,
    height: `${h}px`,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
  };
});

// Canvas Container Styles
const canvasContainerStyle = computed<CSSProperties>(() => {
  return {
    width: `${props.canvasConfig.width}px`,
    height: `${props.canvasConfig.height}px`,
    transform: `scale(${props.zoomScale})`,
    transformOrigin: "center center",
    flexShrink: "0",
  };
});

// Grid Layer Style
const gridStyle = computed<CSSProperties>(() => {
  const size = props.canvasConfig.gridSize;
  return {
    backgroundSize: `${size}px ${size}px`,
    backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
  };
});

// Background Image Style
const bgImageStyle = computed<CSSProperties>(() => {
  return {
    backgroundImage: `url(${props.canvasConfig.bgImage})`,
    backgroundSize: props.canvasConfig.bgFit,
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    opacity: props.canvasConfig.bgOpacity,
  };
});

// SVG Path D string
const pathD = computed(() => {
  return generateSvgPathD(props.points, props.curveType);
});

// Animated Subject Absolute Positioning & 3D Transform (X, Y, Z Rotation Locks)
const subjectStyle = computed<CSSProperties>(() => {
  const { x, y, angle } = props.currentPosition;
  const {
    width,
    height,
    borderRadius,
    bgColor,
    borderColor,
    borderWidth,
    autoRotate,
    angleOffset,
    shadow,
    originX,
    originY,
  } = props.subjectConfig;

  const ox = originX ?? 50;
  const oy = originY ?? 50;

  const lockRotateX = props.animConfig?.lockRotateX ?? false;
  const fixedAngleX = props.animConfig?.fixedAngleX ?? 0;
  const lockRotateY = props.animConfig?.lockRotateY ?? false;
  const fixedAngleY = props.animConfig?.fixedAngleY ?? 0;
  const lockRotateZ = props.animConfig?.lockRotateZ ?? false;
  const fixedAngleZ = props.animConfig?.fixedAngleZ ?? 0;

  // Z Axis Rotation (Path Tangent Angle or Lock Fixed Angle)
  let rotZ = lockRotateZ ? fixedAngleZ : autoRotate ? angle + angleOffset : 0;
  rotZ = ((rotZ % 360) + 360) % 360;

  // X Axis Rotation (Pitch / Tilt)
  const rotX = lockRotateX ? fixedAngleX : 0;

  // Y Axis Rotation (Yaw / Mirror Flip)
  const rotY = lockRotateY ? fixedAngleY : 0;

  return {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: `${borderRadius}%`,
    backgroundColor:
      props.subjectConfig.type === "div" ? bgColor : "transparent",
    border:
      props.subjectConfig.type === "div" && borderWidth > 0
        ? `${borderWidth}px solid ${borderColor}`
        : "none",
    transform: `translate(-${ox}%, -${oy}%) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ.toFixed(1)}deg)`,
    transformOrigin: `${ox}% ${oy}%`,
    boxShadow:
      shadow && props.subjectConfig.type === "div"
        ? "0 10px 25px rgba(0, 0, 0, 0.5)"
        : "none",
    filter:
      shadow && props.subjectConfig.type === "image"
        ? "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))"
        : "none",
  };
});

// Convert mouse event coordinates to Canvas stage coordinates
const getStageCoords = (e: MouseEvent) => {
  const container = document.querySelector(".canvas-container") as HTMLElement;
  if (!container) return { x: 0, y: 0 };

  const rect = container.getBoundingClientRect();
  const scale = props.zoomScale;

  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  let finalX = Math.round(x);
  let finalY = Math.round(y);

  // Snap to Grid if enabled
  if (props.canvasConfig.snapToGrid && props.canvasConfig.gridSize > 0) {
    const grid = props.canvasConfig.gridSize;
    finalX = Math.round(finalX / grid) * grid;
    finalY = Math.round(finalY / grid) * grid;
  }

  // Constrain inside stage bounds
  finalX = Math.max(0, Math.min(props.canvasConfig.width, finalX));
  finalY = Math.max(0, Math.min(props.canvasConfig.height, finalY));

  return { x: finalX, y: finalY };
};

// Stage Mousedown (panning setup)
const onStageMouseDown = (e: MouseEvent) => {
  if (draggingPointId.value) return;

  isPanningPrep = true;
  hasMovedDuringPan = false;
  if (wrapperRef.value) {
    panStart = {
      scrollLeft: wrapperRef.value.scrollLeft,
      scrollTop: wrapperRef.value.scrollTop,
      clientX: e.clientX,
      clientY: e.clientY,
    };
  }

  window.addEventListener("mousemove", onWindowPanMove);
  window.addEventListener("mouseup", onWindowPanUp);
};

const onWindowPanMove = (e: MouseEvent) => {
  if (!isPanningPrep) return;

  const dx = e.clientX - panStart.clientX;
  const dy = e.clientY - panStart.clientY;

  if (Math.hypot(dx, dy) > 4) {
    isPanning.value = true;
    hasMovedDuringPan = true;
  }

  if (isPanning.value && wrapperRef.value) {
    wrapperRef.value.scrollLeft = panStart.scrollLeft - dx;
    wrapperRef.value.scrollTop = panStart.scrollTop - dy;
  }
};

const onWindowPanUp = () => {
  isPanningPrep = false;
  isPanning.value = false;
  window.removeEventListener("mousemove", onWindowPanMove);
  window.removeEventListener("mouseup", onWindowPanUp);
};

// Stage Click (Add new point if not dragging/panning)
const onStageClick = (e: MouseEvent) => {
  if (hasMovedDuringPan || draggingPointId.value) return;
  const { x, y } = getStageCoords(e);
  emit("add-point", x, y);
};

// Candidate Point (+) Click (Insert intermediate point)
const onCandidateClick = () => {
  if (props.hoveredSegment) {
    const { insertIndex, point } = props.hoveredSegment;
    emit("insert-point", insertIndex, point.x, point.y);
  }
};

// Point Selection Click
const onPointClick = (point: Point) => {
  emit("select-point", point.id);
};

// Start Mouse Dragging Point
const onPointMouseDown = (point: Point, e: MouseEvent) => {
  draggingPointId.value = point.id;
  emit("select-point", point.id);

  const coords = getStageCoords(e);
  dragOffset.value = {
    x: coords.x - point.x,
    y: coords.y - point.y,
  };

  window.addEventListener("mousemove", onWindowMouseMove);
  window.addEventListener("mouseup", onWindowMouseUp);
};

// Window Mouse Move during point drag
const onWindowMouseMove = (e: MouseEvent) => {
  if (!draggingPointId.value) return;

  const coords = getStageCoords(e);
  const x = coords.x - dragOffset.value.x;
  const y = coords.y - dragOffset.value.y;

  emit("update-point", draggingPointId.value, x, y);
};

// Window Mouse Up stop point drag
const onWindowMouseUp = () => {
  draggingPointId.value = null;
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onWindowMouseUp);
};

// Stage Mouse Move (detect segment insertion)
const onStageMouseMove = (e: MouseEvent) => {
  if (draggingPointId.value || isPanning.value) return;
  const { x, y } = getStageCoords(e);
  emit("mouse-move-stage", x, y);
};

// Stage Mouse Leave
const onStageMouseLeave = () => {
  emit("mouse-leave-stage");
};

// Ctrl + Mouse Wheel Zooming Shortcut
const onWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newZoom = Math.min(
      2.5,
      Math.max(0.4, Number((props.zoomScale + delta).toFixed(2))),
    );
    emit("update:zoomScale", newZoom);
  }
};

// Keyboard shortcuts for Spacebar panning
const onKeyDown = (e: KeyboardEvent) => {
  if (
    e.code === "Space" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(
      (e.target as HTMLElement)?.tagName,
    )
  ) {
    isSpacePressed.value = true;
  }
};
const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === "Space") {
    isSpacePressed.value = false;
  }
};

onMounted(() => {
  if (wrapperRef.value) {
    wrapperRef.value.addEventListener("wheel", onWheel, { passive: false });
  }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onWindowMouseUp);
  window.removeEventListener("mousemove", onWindowPanMove);
  window.removeEventListener("mouseup", onWindowPanUp);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  if (wrapperRef.value) {
    wrapperRef.value.removeEventListener("wheel", onWheel);
  }
});
</script>

<style scoped>
.stage-wrapper {
  flex: 1;
  height: 100%;
  background: radial-gradient(circle at center, #1e293b 0%, #090d16 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  position: relative;
  padding: 40px;
  cursor: default;
}

.stage-wrapper.space-held {
  cursor: grab;
}

.stage-wrapper.is-panning {
  cursor: grabbing !important;
  user-select: none;
}

.canvas-scaler {
  transition:
    width 0.1s ease-out,
    height 0.1s ease-out;
  margin: auto;
}

.canvas-container {
  position: relative;
  background-color: #0f172a;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: crosshair;
  user-select: none;
  transition: transform 0.1s ease-out;
}

.grid-layer,
.bg-image-layer,
.svg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-layer {
  z-index: 1;
}

.bg-image-layer {
  z-index: 2;
}

.svg-layer {
  z-index: 10;
  overflow: visible;
}

/* Candidate Insertion Point (+) */
.candidate-point {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  z-index: 25;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.8);
  animation: pulse 1.5s infinite;
}

.plus-icon {
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.95);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.15);
  }
  100% {
    transform: translate(-50%, -50%) scale(0.95);
  }
}

/* Waypoint Nodes */
.waypoint-node {
  position: absolute;
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
  z-index: 30;
  cursor: move;
}

.node-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #38bdf8;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s;
}

.waypoint-node.isStart .node-dot {
  background: #10b981;
}

.waypoint-node.isEnd .node-dot {
  background: #f43f5e;
}

.waypoint-node.selected .node-dot {
  background: #f59e0b;
  transform: scale(1.25);
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.8);
}

.node-label {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  font-family: "Fira Code", monospace;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.image-switch-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 12px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
}

/* Animated Subject Element */
.animated-subject {
  z-index: 40;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    width 0.2s,
    height 0.2s;
  transform-origin: center center;
}

.subject-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.subject-div-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
</style>
