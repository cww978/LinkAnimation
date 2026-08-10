# LinkAnimation 路径动画编辑器 & 独立运行库

<p align="center">
  <b>基于 Vue 3 + TypeScript + Vite 构建的高性能可视化路径动画编辑器及跨框架 JavaScript 运行库</b>
</p>

---

## 📖 项目简介

**LinkAnimation** 是一款强大的可视化路径动画制作工具。你可以通过可视化画布轻松绘制复杂的移动轨迹、设置主体外观与旋转规则、配置每个路径点的独立属性（如停留时间、速度倍率、动态切换主体图片等），并一键导出动画配置 JSON 或嵌入代码。

同时，本项目内置了**完全脱离 UI 框架依赖的轻量级 JavaScript 运行库 (`LinkAnimation`)**。构建生成的运行库可独立运行在 HTML、Vue、React、Angular 等任何前端项目中。

---

## ✨ 核心特性

### 🎨 1. 可视化画布与路径编辑
- **自由交互编辑**：点击添加路径点、拖拽调整节点位置、选中删除节点。
- **智能插点**：悬停在连线上可动态插入新路径点。
- **自定义背景图**：支持上传背景图、设置适应模式（`contain` / `cover` / `fill`）、透明度调节及显示/隐藏控制。
- **网格辅助系统**：可自定义网格大小，支持开启**网格吸附（Snap to Grid）**功能。
- **多种轨迹类型**：支持**平滑贝塞尔曲线**（Smooth Curve）与**直线段**（Linear Route）平滑切换。

### 🤖 2. 动画主体与多图管理
- **双主体类型**：支持图片主体与自定义 CSS/Div 主体（背景色、边框、圆角、文字、阴影等）。
- **多图切换**：支持为主体上传多张备选图片，设置默认主图。
- **路径点触发换图**：可指定主体到达某个路径点（Waypoint）时**自动切换指定图片**。
- **灵活旋转控制**：
  - 支持**切线自动旋转 (Auto Rotate)** 配合角度偏移 (Angle Offset)。
  - 支持指定旋转中心原点 (Origin X / Origin Y)。
  - 支持锁定或固定 X / Y / Z 三轴旋转角度。

### ⏱️ 3. 细粒度动画与播放控制
- **独立路径点控制**：为每个路径点单独配置**停留时长 (Pause Duration)** 和**局部速度倍率 (Speed Multiplier)**。
- **丰富动画参数**：总时长控制、缓动函数选择（Linear, Ease, Ease-In, Ease-Out, Bounce 等）、循环播放 (Loop) 及往复播放 (Yoyo)。
- **全功能播放器**：播放、暂停、复位、进度条拖拽跳帧。

### 📦 4. 导出与跨框架运行库
- **JSON 导入导出**：方便配置的保存、共享与复用。
- **代码生成器**：一键生成可在其他项目中直接粘贴运行的代码段。
- **独立 SDK 打包**：支持打包生成 UMD / ES Module 运行库，无框架依赖。

---

## 🚀 本地开发与构建

### 1. 安装依赖

```bash
npm install
# 或使用 pnpm / yarn
pnpm install
```

### 2. 启动可视化编辑器开发服务

```bash
npm run dev
```
启动后在浏览器打开 `http://localhost:5173` 即可使用路径动画编辑器。

### 3. 构建编辑器应用

```bash
npm run build
```

### 4. 构建独立运行库 (SDK)

将核心动画引擎打包为独立的 JS 库文件：

```bash
npm run build:lib
```
打包产物将输出在 `dist-lib/` 目录下：
- `dist-lib/link-animation.es.js` (ES Module)
- `dist-lib/link-animation.umd.js` (UMD 格式，适用于原生 HTML `<script>`)

---

## 📦 独立运行库 (`LinkAnimation`) 使用指南

### 1. 其他前端项目引入 (Vue / React / Node)

#### 方式 A：文件路径依赖

在其他项目的 `package.json` 中引用本项目：

```json
{
  "dependencies": {
    "link-animation-editor": "file:../LinkAnimation"
  }
}
```

代码中引入并使用：

```typescript
import { LinkAnimation } from 'link-animation-editor'
import configJson from './route-config.json' // 从编辑器导出的配置文件

// 初始化动画
const animation = new LinkAnimation({
  container: '#animation-container', // 挂载容器选择器或 DOM 节点
  config: configJson,                // 导出的 JSON 配置
  showBg: true,                       // 是否显示背景图
  showLine: true,                     // 是否显示连线
  showPoint: true,                    // 是否显示路径点
  lineType: 'dashed',                 // 路线样式 ('solid' | 'dashed' | 'dot' | 'dashdot')
  lineColor: '#cccccc',               // 默认路线颜色
  lineActiveColor: '#1296db',         // 已走过路线激活颜色
  step: 0,                            // 初始起始点索引
})

// 控制 API
animation.start()      // 开始播放
animation.pause()      // 暂停播放
animation.stop()       // 停止并回到起点
animation.seekTo(0.5)  // 跳转到指定时间进度 (单位: 秒)
animation.stepTo(2)    // 快捷跳转到第 2 个路径点
animation.stepAdd(1)   // 前进 1 个路径点并触发过渡动画
animation.stepAdd(-1)  // 后退 1 个路径点并触发过渡动画

// 事件监听
animation.on('waypoint', ({ index, point, imageSwitched }) => {
  console.log(`到达路径点 P${index}`, point)
  if (imageSwitched) {
    console.log(`切换主图为: ${imageSwitched}`)
  }
})

animation.on('finish', () => {
  console.log('动画播放结束')
})

// 销毁实例
// animation.destroy()
```

#### 方式 B：复制 ES 模块文件

将 `dist-lib/link-animation.es.js` 复制到目标项目的 `src/utils/` 目录中：

```javascript
import { LinkAnimation } from './utils/link-animation.es.js'

const animation = new LinkAnimation({
  container: '#animation-container',
  config: configJson,
})
animation.start()
```

### 2. 原生 HTML `<script>` 标签引入

将 `dist-lib/link-animation.umd.js` 引入网页：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>LinkAnimation Demo</title>
</head>
<body>
  <!-- 动画挂载容器 -->
  <div id="animation-container" style="width: 960px; height: 540px; position: relative;"></div>

  <!-- 引入 UMD 库文件 -->
  <script src="./dist-lib/link-animation.umd.js"></script>
  <script>
    const configData = /* 粘贴导出的配置 JSON */;

    const animation = new window.LinkAnimation({
      container: '#animation-container',
      config: configData,
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

## 🛠️ 项目目录结构

```
LinkAnimation/
├── dist-lib/               # 独立运行库打包产物目录
├── public/                 # 静态资源
├── src/
│   ├── assets/             # 资源文件 (图标、图标等)
│   ├── components/         # 编辑器 UI 组件
│   │   ├── CanvasStage.vue    # 核心画布交互视图
│   │   ├── ControlPanel.vue   # 右侧属性配置面板
│   │   ├── ExportModal.vue    # 代码与 JSON 导出弹窗
│   │   ├── Header.vue         # 顶部导航栏与文件导入导出
│   │   ├── PlayerToolbar.vue  # 底部悬浮播放控制条
│   │   └── PreviewModal.vue   # 运行库预览弹窗
│   ├── composables/        # 组合式函数 (编辑器状态与动画逻辑)
│   │   ├── useAnimationRunner.ts
│   │   └── useRouteEditor.ts
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 纯 JS / TS 引擎核心
│   │   └── LinkAnimation.ts   # 独立运行库 SDK 类实现
│   ├── App.vue             # 主应用入口视图
│   ├── main.ts             # 应用启动文件
│   └── index.ts            # SDK 导出入口
├── package.json
├── vite.config.ts          # 应用 Vite 配置
├── vite.lib.config.ts      # 运行库 Vite 构建配置
└── README.md
```

---

## 📄 License

[MIT License](LICENSE)
