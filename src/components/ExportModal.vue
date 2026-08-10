<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <div class="header-title">
          <Code2 class="w-5 h-5 text-sky-400" />
          <span>导出动画代码 (Relative left & top)</span>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Code Type Tabs -->
      <div class="modal-tabs">
        <button
          class="tab-item"
          :class="{ active: activeCodeType === 'css' }"
          @click="activeCodeType = 'css'"
        >
          CSS @keyframes 代码
        </button>
        <button
          class="tab-item"
          :class="{ active: activeCodeType === 'js' }"
          @click="activeCodeType = 'js'"
        >
          JavaScript 原生动画代码
        </button>
      </div>

      <!-- Code Container -->
      <div class="code-container">
        <pre><code>{{ codeContent }}</code></pre>
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <span v-if="copied" class="copied-toast">
          <Check class="w-4 h-4 text-emerald-400" />
          已复制到剪贴板！
        </span>
        <div class="footer-btns">
          <button class="btn btn-secondary" @click="$emit('close')">关闭</button>
          <button class="btn btn-primary" @click="copyCode">
            <Copy class="w-4 h-4" />
            <span>复制代码</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Code2, X, Copy, Check } from 'lucide-vue-next'
import { Point, AnimationConfig, SubjectConfig } from '../types/route'
import { generateCSSKeyframes, generateJSCode } from '../utils/codeGenerator'

const props = defineProps<{
  points: Point[]
  animConfig: AnimationConfig
  subjectConfig: SubjectConfig
}>()

defineEmits<{
  (e: 'close'): void
}>()

const activeCodeType = ref<'css' | 'js'>('css')
const copied = ref(false)

const codeContent = computed(() => {
  if (activeCodeType.value === 'css') {
    return generateCSSKeyframes(props.points, props.animConfig, props.subjectConfig)
  } else {
    return generateJSCode(props.points, props.animConfig, props.subjectConfig)
  }
})

const copyCode = () => {
  navigator.clipboard.writeText(codeContent.value).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-card {
  width: 100%;
  max-width: 720px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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

.modal-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #1e293b;
}

.tab-item {
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-item.active {
  color: #38bdf8;
  border-bottom-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  font-weight: 600;
}

.code-container {
  padding: 16px;
  max-height: 380px;
  overflow-y: auto;
  background: #090d16;
}

.code-container pre {
  margin: 0;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #38bdf8;
  white-space: pre-wrap;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: #0f172a;
}

.copied-toast {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #34d399;
  font-size: 13px;
  font-weight: 500;
}

.footer-btns {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-secondary {
  background: #1e293b;
  color: #cbd5e1;
  border-color: rgba(255, 255, 255, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
}
</style>
