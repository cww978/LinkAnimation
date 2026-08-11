# LinkAnimation 路径动画编辑器 & 独立运行库

<p align="center">
  <b>基于 Vue 3 + TypeScript + Vite 构建的高性能可视化路径动画编辑器及跨框架 JavaScript 运行库</b>
</p>

<p align="center">
  <a href="https://cww978.github.io/LinkAnimation/">
    <img src="https://img.shields.io/badge/Demo-%E5%9C%A8%E7%BA%BF%E9%A2%84%E8%A7%88-brightgreen.svg" alt="Live Demo">
  </a>
  <a href="https://www.npmjs.com/package/link-animation-editor">
    <img src="https://img.shields.io/npm/v/link-animation-editor.svg" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/link-animation-editor">
    <img src="https://img.shields.io/npm/dm/link-animation-editor.svg" alt="npm downloads">
  </a>
  <a href="https://github.com/cww978/LinkAnimation/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/link-animation-editor.svg" alt="license">
  </a>
</p>

<p align="center">
  <b>简体中文</b> | <a href="./README_EN.md">English</a> | <a href="./README_JA.md">日本語</a>
</p>

---

## 🔗 在线 Demo 预览

👉 **[点击体验在线路径动画编辑器](https://cww978.github.io/LinkAnimation/)**

---

## 📖 项目简介

**LinkAnimation** 是一款强大的可视化路径动画制作工具与运行库。你可以通过可视化画布轻松绘制复杂的移动轨迹、设置主体外观与旋转规则、配置每个路径点的独立属性（如停留时间、速度倍率、动态切换主体图片等），并一键导出动画配置 JSON。

同时，本项目内置了**完全脱离 UI 框架依赖的轻量级 JavaScript 运行库 (`LinkAnimation`)**。构建生成的运行库可独立运行在 HTML、Vue、React、Angular、Svelte 等任何前端项目中，并内置了针对移动端多尺寸屏幕的**响应式自动等比缩放**能力。

---

## ⚡ 快速开始 (NPM 安装)

### 1. 安装 npm 包

```bash
npm install link-animation-editor
# 或使用 pnpm / yarn
pnpm add link-animation-editor
yarn add link-animation-editor
```

### 2. 在项目中使用 (Vue / React / TS / JS)

```typescript
import { LinkAnimation } from 'link-animation-editor'
import configJson from './route-config.json' // 从编辑器中导出的 JSON 配置文件

// 初始化动画实例
const animation = new LinkAnimation({
  container: '#animation-container', // 挂载容器选择器或 DOM 节点
  config: configJson,                // 导出的 JSON 配置
  responsive: true,                   // 【v1.0.3 新增】开启移动端多端屏幕响应式自适应等比缩放
  showBg: false,                      // 是否显示背景图（设为 false 即背景透明透出）
  bgColor: 'transparent',            // 【v1.0.3 新增】自定义背景颜色或 transparent
  bgImage: '',                        // 【v1.0.3 新增】自定义背景图片 URL
  showLine: true,                     // 是否显示连线
  showPoint: true,                    // 是否显示路径点
  lineType: 'dashed',                 // 路线样式 ('solid' | 'dashed' | 'dot' | 'dashdot')
  lineColor: '#cccccc',               // 默认路线颜色
  lineActiveColor: '#1296db',         // 已走过路线激活颜色
  step: 0,                            // 初始起始点索引
})

// 播放控制 API
animation.start()            // 开始播放全路径动画
animation.pause()            // 暂停播放
animation.stop()             // 停止并重置到起点
animation.seekTo(0.5)        // 跳转到指定进度比例 (0~1)
animation.stepTo(2, true)    // 【平滑移动】带过渡动画滑行到第 2 个路径点
animation.stepAdd(1)         // 前进 1 个路径点并触发平滑过渡动画
animation.stepAdd(-1)        // 后退 1 个路径点并触发平滑过渡动画

// 事件监听
animation.on('waypoint', ({ index, point, imageSwitched }) => {
  console.log(`到达路径点 P${index}`, point)
  if (imageSwitched) {
    console.log(`切换主图为: ${imageSwitched}`)
  }
})

animation.on('end', () => {
  console.log('动画播放结束')
})

// 组件销毁时清除实例
// animation.destroy()
```

### 3. CDN / 原生 HTML `<script>` 引入

你可以通过 CDN 直接在 HTML 中引入 UMD 构建包：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>LinkAnimation Demo</title>
</head>
<body>
  <!-- 动画挂载容器 -->
  <div id="animation-container" style="width: 100%; height: 100vh; position: relative;"></div>

  <!-- 使用 UNPKG 或 jsDelivr CDN 引入 -->
  <script src="https://unpkg.com/link-animation-editor/dist-lib/link-animation.umd.js"></script>

  <script>
    const configData = /* 粘贴导出的配置 JSON */;

    const animation = new window.LinkAnimation({
      container: '#animation-container',
      config: configData,
      responsive: true,
      showLine: true,
      lineType: 'dashed',
      lineActiveColor: '#1296db',
    });

    animation.start();
  </script>
</body>
</html>
```

---

## 🛠️ API 配置项说明 (v1.0.3)

| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `container` | `string \| HTMLElement` | - | 挂载容器的选择器（如 `'#box'`）或 DOM 元素对象 |
| `config` | `object \| string` | - | 编辑器导出的动画配置 JSON 对象或 JSON 字符串 |
| `responsive` | `boolean` | `true` | **【v1.0.3 新增】** 开启移动端/多屏幕等比响应式自适应缩放 |
| `showBg` | `boolean` | `true` | 是否显示背景（设为 `false` 可实现完全背景透明透出） |
| `bgColor` | `string` | `'#0f172a'` | **【v1.0.3 新增】** 背景颜色，支持 `'transparent'` 或自定义 Hex/RGB |
| `bgImage` | `string` | `null` | **【v1.0.3 新增】** 动态覆盖背景图片 URL 地址 |
| `showLine` | `boolean` | `true` | 是否显示轨迹路线连接线 |
| `showPoint` | `boolean` | `true` | 是否显示路径节点圆点 |
| `lineType` | `'solid' \| 'dashed' \| 'dot' \| 'dashdot'` | `'dashed'` | 连线线型样式 |
| `lineColor` | `string` | `'#cccccc'` | 未走过路线基础颜色 |
| `lineActiveColor` | `string` | `'#1296db'` | 已走过路线高亮激活颜色 |
| `step` | `number` | `0` | 初始开始路径点索引 |
| `curveType` | `'smooth' \| 'linear'` | `'smooth'` | 轨迹算法类型 (贝塞尔平滑曲线 / 折线) |
| `easing` | `EasingType` | `'ease-in-out'` | 动画缓动函数 (`linear`, `ease`, `ease-in`, `ease-out`, `bounce`) |
| `duration` | `number` | - | 覆盖全局动画播放总时长（秒） |
| `speed` | `number` | `1` | 动画播放速度倍率 |

---

## ✨ 核心特性

### 📱 1. 移动端与多端屏幕自适应 (`v1.0.3`)
- **零坐标换算**：在 `750x1624` 或任意设计稿基准尺寸下制作的轨迹，直接放到移动端网页 `width: 100%` 容器中挂载。
- **自动等比缩放**：内置 `ResizeObserver` + CSS `transform: scale()`，自动平滑等比适配各种手机屏幕。

### 🎨 2. 可视化画布与路径编辑
- **自由交互编辑**：点击添加路径点、拖拽调整节点位置、选中删除节点。
- **智能插点**：悬停在连线上可动态插入新路径点。
- **自定义背景**：支持设置背景颜色、图片 URL、适应模式（`contain` / `cover` / `fill`）及透明控制。
- **网格辅助系统**：可自定义网格大小，支持开启**网格吸附（Snap to Grid）**功能。
- **多种轨迹类型**：支持**平滑贝塞尔曲线**与**直线段**切换。

### 🤖 3. 动画主体与多图管理
- **图片主体展示**：支持主体图片自定义、尺寸与旋转原点设置、阴影与角度偏移控制。
- **多图资源管理**：支持为主体上传多张备选图片与默认主图。
- **路径点触发换图**：可指定主体到达某个路径点（Waypoint）时**自动切换指定图片**。
- **灵活旋转控制**：支持切线自动旋转 (Auto Rotate)、旋转中心原点控制及三轴旋转锁定。

### ⏱️ 4. 细粒度动画与播放控制
- **节点控制**：独立配置每个节点的停留时长 (Pause Duration) 与速度倍率 (Speed Multiplier)。
- **平滑步进导航**：调用 `stepTo(index, true)` 即可从当前位置平滑滑行到指定打卡节点。

---

## 🚀 本地开发与构建

```bash
# 1. 克隆仓库与安装依赖
git clone https://github.com/cww978/LinkAnimation.git
cd LinkAnimation
npm install

# 2. 启动可视化编辑器开发服务
npm run dev

# 3. 构建在线预览网页 (Vite)
npm run build

# 4. 构建独立运行库 SDK (dist-lib/)
npm run build:lib

# 5. 一键部署发布在线 Demo (GitHub Pages)
npm run deploy
```

---

## 📄 License

[MIT License](LICENSE)
