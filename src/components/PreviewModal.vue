<template>
  <div class="preview-backdrop" @click.self="closePreview">
    <div class="preview-modal">
      <!-- Modal Header -->
      <div class="preview-header">
        <div class="header-title">
          <PlayCircle class="w-5 h-5 text-sky-400" />
          <span>动画独立运行预览模式 (LinkAnimation Class Instance)</span>
        </div>
        <button class="close-btn" @click="closePreview">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Preview Body (Left Stage + Right Controls & Event Logs) -->
      <div class="preview-body">
        <!-- Stage Container -->
        <div class="preview-stage-wrapper">
          <div id="preview-stage-container" class="preview-stage-box"></div>
        </div>

        <!-- Right Preview Inspector -->
        <div class="preview-sidebar">
          <div class="section-title">LinkAnimation 实例化参数</div>

          <!-- Easing Override -->
          <div class="form-group mb-2">
            <label>动画缓动类型 (easing)</label>
            <select v-model="easing" @change="recreateInstance">
              <option value="ease-in-out">ease-in-out (平滑缓入缓出)</option>
              <option value="linear">linear (匀速直线)</option>
              <option value="ease-in">ease-in (渐快加速)</option>
              <option value="ease-out">ease-out (渐慢减速)</option>
              <option value="bounce">bounce (弹跳回弹)</option>
            </select>
          </div>

          <!-- Show Bg, Show Line & Show Point Toggles -->
          <div class="form-group mb-2">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="showBg"
                @change="recreateInstance"
              />
              <span>显示背景图 (showBg)</span>
            </label>
          </div>

          <div class="form-group mb-2">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="showLine"
                @change="recreateInstance"
              />
              <span>显示连接路线 (showLine)</span>
            </label>
          </div>

          <div class="form-group mb-2">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="showPoint"
                @change="recreateInstance"
              />
              <span>显示路径点 (showPoint)</span>
            </label>
          </div>

          <template v-if="showLine">
            <div class="form-group mb-2">
              <label>路线类型 (lineType)</label>
              <select v-model="lineType" @change="recreateInstance">
                <option value="dashed">dashed (虚线)</option>
                <option value="solid">solid (实线)</option>
                <option value="dot">dot (点线)</option>
                <option value="dashdot">dashdot (点划线)</option>
              </select>
            </div>

            <div class="input-grid mb-2">
              <div class="form-group">
                <label>路线颜色 (lineColor)</label>
                <div class="color-picker">
                  <input
                    type="color"
                    v-model="lineColor"
                    @change="recreateInstance"
                  />
                  <span class="text-xs font-mono">{{ lineColor }}</span>
                </div>
              </div>
              <div class="form-group">
                <label>激活颜色 (activeColor)</label>
                <div class="color-picker">
                  <input
                    type="color"
                    v-model="lineActiveColor"
                    @change="recreateInstance"
                  />
                  <span class="text-xs font-mono">{{ lineActiveColor }}</span>
                </div>
              </div>
            </div>
          </template>

          <div class="form-group mb-3">
            <label>初始开始路径点 (step: {{ initialStep }})</label>
            <div class="flex items-center gap-2">
              <input
                type="number"
                v-model.number="initialStep"
                min="0"
                :max="points.length - 1"
                class="step-input"
              />
              <button class="btn-sm btn-secondary" @click="recreateInstance">
                应用 step
              </button>
            </div>
          </div>

          <div class="divider"></div>
          <div class="section-title">实例 API 控制方法</div>

          <!-- API Control Buttons -->
          <div class="api-btn-grid mb-2">
            <button class="api-btn btn-primary" @click="handleStart">
              <Play class="w-4 h-4" />
              <span>start()</span>
            </button>
            <button class="api-btn btn-secondary" @click="handlePause">
              <Pause class="w-4 h-4" />
              <span>pause()</span>
            </button>
            <button class="api-btn btn-secondary" @click="handleStop">
              <Square class="w-4 h-4 text-red-400" />
              <span>stop()</span>
            </button>
          </div>

          <!-- Smooth StepAdd Buttons -->
          <div class="input-grid mb-3">
            <button class="api-btn btn-secondary" @click="handleStepAdd(1)">
              <FastForward class="w-4 h-4 text-sky-400" />
              <span>stepAdd(+1) [移动1步]</span>
            </button>
            <button class="api-btn btn-secondary" @click="handleStepAdd(-1)">
              <Rewind class="w-4 h-4 text-amber-400" />
              <span>stepAdd(-1) [倒退1步]</span>
            </button>
          </div>

          <!-- StepTo Selector -->
          <div class="form-group mb-3">
            <label>跳转指定路径点 (stepTo - 平滑移动)</label>
            <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              <button
                v-for="(p, idx) in points"
                :key="p.id"
                class="step-badge"
                @click="handleStepTo(idx, true)"
              >
                P{{ idx }}
              </button>
            </div>
          </div>

          <div class="divider"></div>
          <div class="section-title flex justify-between items-center">
            <span>实时事件监听日志 (.on)</span>
            <button
              class="text-xs text-sky-400 hover:underline"
              @click="eventLogs = []"
            >
              清空日志
            </button>
          </div>

          <!-- Event Log Stream -->
          <div class="event-log-container">
            <div v-for="(log, i) in eventLogs" :key="i" class="log-item">
              <span class="log-tag" :class="log.type">{{ log.type }}</span>
              <span class="log-text">{{ log.text }}</span>
            </div>
            <div v-if="eventLogs.length === 0" class="empty-log">
              等待触发动画事件 (start, pause, stop, move, waypoint, end)...
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import {
  PlayCircle,
  X,
  Play,
  Pause,
  Square,
  FastForward,
  Rewind,
} from "lucide-vue-next";
import {
  Point,
  CanvasConfig,
  SubjectConfig,
  AnimationConfig,
} from "../types/route";
import { LinkAnimation, LineType, EasingType } from "../utils/LinkAnimation";

const props = defineProps<{
  points: Point[];
  canvasConfig: CanvasConfig;
  subjectConfig: SubjectConfig;
  animConfig: AnimationConfig;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

let instance: LinkAnimation | null = null;

const easing = ref<EasingType>(props.animConfig.easing || "ease-in-out");
const showBg = ref(true);
const showLine = ref(true);
const showPoint = ref(true);
const lineType = ref<LineType>("dashed");
const lineColor = ref("#cccccc");
const lineActiveColor = ref("#1296db");
const initialStep = ref(0);

const eventLogs = ref<{ type: string; text: string }[]>([]);

const addLog = (type: string, text: string) => {
  eventLogs.value.unshift({ type, text });
  if (eventLogs.value.length > 50) eventLogs.value.pop();
};

const recreateInstance = () => {
  if (instance) {
    instance.destroy();
    instance = null;
  }

  nextTick(() => {
    instance = new LinkAnimation({
      container: "#preview-stage-container",
      config: {
        canvasConfig: props.canvasConfig,
        subjectConfig: props.subjectConfig,
        animConfig: props.animConfig,
        points: props.points,
      },
      easing: easing.value,
      showBg: showBg.value,
      showLine: showLine.value,
      showPoint: showPoint.value,
      lineType: lineType.value,
      lineColor: lineColor.value,
      lineActiveColor: lineActiveColor.value,
      step: initialStep.value,
    });

    // Bind all requested event callbacks
    instance.on("start", (d) =>
      addLog(
        "start",
        `动画开始/平滑移动 (${new Date(d.timestamp).toLocaleTimeString()})`,
      ),
    );
    instance.on("pause", (d) =>
      addLog("pause", `动画暂停 (进度: ${(d.progress * 100).toFixed(1)}%)`),
    );
    instance.on("stop", (d) => addLog("stop", `动画停止`));
    instance.on("end", () => addLog("end", `动画/移动完成`));
    instance.on("waypoint", (d) => {
      addLog(
        "waypoint",
        `精准到达节点 P${d.index} ${d.imageSwitched ? "-> 切换图片: " + d.imageSwitched.slice(-20) : ""}`,
      );
    });
    instance.on("move", (d) => {
      if (Math.random() < 0.05) {
        addLog(
          "move",
          `移动中 (left: ${Math.round(d.left)}px, top: ${Math.round(d.top)}px)`,
        );
      }
    });
  });
};

const handleStart = () => instance?.start();
const handlePause = () => instance?.pause();
const handleStop = () => instance?.stop();
const handleStepAdd = (count: number) => instance?.stepAdd(count);
const handleStepTo = (idx: number, animated = true) =>
  instance?.stepTo(idx, animated);

const closePreview = () => {
  if (instance) {
    instance.destroy();
    instance = null;
  }
  emit("close");
};

onMounted(() => {
  recreateInstance();
});

onUnmounted(() => {
  if (instance) {
    instance.destroy();
    instance = null;
  }
});
</script>

<style scoped>
.preview-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  z-index: 250;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.preview-modal {
  width: 100%;
  max-width: 1280px;
  height: 85vh;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.95);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
}

.close-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.preview-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.preview-stage-wrapper {
  flex: 1;
  background: #090d16;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: auto;
}

.preview-stage-box {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  overflow: hidden;
}

.preview-sidebar {
  width: 380px;
  background: rgba(15, 23, 42, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  user-select: none;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 12px 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  color: #cbd5e1;
}

.form-group select,
.step-input {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
}

.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e293b;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.color-picker input[type="color"] {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  accent-color: #38bdf8;
  width: 16px;
  height: 16px;
}

.api-btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.api-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  color: #fff;
}

.btn-secondary {
  background: #1e293b;
  color: #cbd5e1;
  border-color: rgba(255, 255, 255, 0.1);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 6px;
  cursor: pointer;
}

.step-badge {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #38bdf8;
  font-family: "Fira Code", monospace;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.step-badge:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
}

.event-log-container {
  flex: 1;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-family: "Fira Code", monospace;
}

.log-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
}

.log-tag.start {
  background: #10b981;
  color: #fff;
}
.log-tag.pause {
  background: #f59e0b;
  color: #fff;
}
.log-tag.stop {
  background: #ef4444;
  color: #fff;
}
.log-tag.end {
  background: #8b5cf6;
  color: #fff;
}
.log-tag.waypoint {
  background: #38bdf8;
  color: #0f172a;
}
.log-tag.move {
  background: #334155;
  color: #94a3b8;
}

.log-text {
  color: #cbd5e1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-log {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  margin-top: 20px;
}
</style>
