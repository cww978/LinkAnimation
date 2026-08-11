# LinkAnimation

<p align="center">
  <b>Visual Path Animation Editor & JavaScript SDK</b>
</p>

<p align="center">
  <a href="https://cww978.github.io/LinkAnimation/">
    <img src="https://img.shields.io/badge/Demo-Live%20Preview-brightgreen.svg" alt="Live Demo">
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
  <a href="./README.md">简体中文</a> | <b>English</b> | <a href="./README_JA.md">日本語</a>
</p>

---

## 🔗 Live Demo Preview

👉 **[Click to Open Live Online Editor Demo](https://cww978.github.io/LinkAnimation/)**

---

## 📖 Introduction

**LinkAnimation** is a powerful visual path animation editor and standalone JavaScript runtime library. With the interactive canvas, you can easily draw complex movement trajectories, customize animated subject appearances and rotation rules, configure individual waypoint attributes (such as pause duration, speed multiplier, dynamic image switching at waypoints), and export the animation configuration as JSON with one click.

Additionally, this project includes a **framework-agnostic lightweight JavaScript runtime library (`LinkAnimation`)**. The compiled library can run independently in any frontend environment including HTML, Vue, React, Angular, and Svelte, featuring built-in **responsive auto-scaling** for mobile and multi-device screens.

---

## ⚡ Quick Start (NPM)

### 1. Install npm package

```bash
npm install link-animation-editor
# or using pnpm / yarn
pnpm add link-animation-editor
yarn add link-animation-editor
```

### 2. Usage in Projects (Vue / React / TS / JS)

```typescript
import { LinkAnimation } from 'link-animation-editor'
import configJson from './route-config.json' // Exported JSON configuration

// Initialize LinkAnimation instance
const animation = new LinkAnimation({
  container: '#animation-container', // Selector or HTMLElement
  config: configJson,                // JSON configuration object
  responsive: true,                  // [v1.0.3] Enable mobile & multi-screen auto-scaling
  showBg: false,                     // Show background (set to false for transparent bg)
  bgColor: 'transparent',           // [v1.0.3] Custom bg color or 'transparent'
  bgImage: '',                       // [v1.0.3] Custom background image URL
  showLine: true,                    // Show path lines
  showPoint: true,                   // Show waypoint dots
  lineType: 'dashed',                // Line style ('solid' | 'dashed' | 'dot' | 'dashdot')
  lineColor: '#cccccc',              // Default path color
  lineActiveColor: '#1296db',        // Active path color
  step: 0,                           // Starting waypoint index
})

// Control APIs
animation.start()            // Start playing path animation
animation.pause()            // Pause animation
animation.stop()             // Stop and reset to start
animation.seekTo(0.5)        // Seek to progress ratio (0 to 1)
animation.stepTo(2, true)    // Smoothly slide to waypoint index 2 with transition
animation.stepAdd(1)         // Move forward 1 waypoint with smooth animation
animation.stepAdd(-1)        // Move backward 1 waypoint with smooth animation

// Event Listeners
animation.on('waypoint', ({ index, point, imageSwitched }) => {
  console.log(`Reached waypoint P${index}`, point)
  if (imageSwitched) {
    console.log(`Switched image to: ${imageSwitched}`)
  }
})

animation.on('end', () => {
  console.log('Animation playback completed')
})

// Cleanup instance on component unmount
// animation.destroy()
```

### 3. CDN / Vanilla HTML `<script>` Import

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LinkAnimation Demo</title>
</head>
<body>
  <div id="animation-container" style="width: 100%; height: 100vh; position: relative;"></div>

  <script src="https://unpkg.com/link-animation-editor/dist-lib/link-animation.umd.js"></script>

  <script>
    const configData = /* Paste exported JSON */;

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

## 🛠️ API Reference (v1.0.3)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `container` | `string \| HTMLElement` | - | Target container selector or DOM element |
| `config` | `object \| string` | - | Animation config JSON object or JSON string |
| `responsive` | `boolean` | `true` | **[v1.0.3]** Auto-scale canvas proportionally to fit container |
| `showBg` | `boolean` | `true` | Show background layer (set `false` for transparent background) |
| `bgColor` | `string` | `'#0f172a'` | **[v1.0.3]** Background color, supports `'transparent'`, Hex, RGB |
| `bgImage` | `string` | `null` | **[v1.0.3]** Override background image URL |
| `showLine` | `boolean` | `true` | Show trajectory line |
| `showPoint` | `boolean` | `true` | Show waypoint dots |
| `lineType` | `'solid' \| 'dashed' \| 'dot' \| 'dashdot'` | `'dashed'` | Line style |
| `lineColor` | `string` | `'#cccccc'` | Unvisited path line color |
| `lineActiveColor` | `string` | `'#1296db'` | Visited path active highlight color |
| `step` | `number` | `0` | Initial starting waypoint index |
| `curveType` | `'smooth' \| 'linear'` | `'smooth'` | Path algorithm (Bézier smooth curve or polyline) |
| `easing` | `EasingType` | `'ease-in-out'` | Easing function (`linear`, `ease`, `ease-in`, `ease-out`, `bounce`) |
| `duration` | `number` | - | Global animation duration in seconds |
| `speed` | `number` | `1` | Playback speed multiplier |

---

## ✨ Features

### 📱 1. Mobile & Multi-Device Auto-Scaling (`v1.0.3`)
- **Zero Coordinate Math**: Paths drawn in `750x1624` or any design resolution can be mounted directly into `width: 100%` mobile containers.
- **Proportional Scaling**: Built-in `ResizeObserver` + CSS `transform: scale()` automatically adjusts the canvas to fit any screen size seamlessly.

### 🎨 2. Visual Canvas Editing
- **Interactive Editing**: Click to add, drag to reposition, and delete waypoints.
- **Smart Insertion**: Hover over lines to insert waypoints dynamically.
- **Custom Background**: Set background colors, image URLs, fitting modes (`contain` / `cover` / `fill`), and opacity.
- **Grid Assist**: Customizable grid size with **Snap to Grid** capability.
- **Trajectory Types**: Switch between **smooth Bézier curves** and **straight line segments**.

### 🤖 3. Subject & Image Management
- **Image Subject Customization**: Configure subject images, dimensions, rotation origins, shadows, and angle offsets.
- **Multi-Image Assets**: Upload multiple fallback images and set default subjects.
- **Waypoint Image Triggers**: Dynamically switch subject images when passing specific waypoints.
- **Rotation Rules**: Supports auto-rotation along tangent vectors, origin offsets, and 3-axis rotation locks.

### ⏱️ 4. Fine-Grained Controls
- **Waypoint Overrides**: Customize pause duration and speed multipliers per waypoint.
- **Smooth Step Navigation**: Call `stepTo(index, true)` for smooth gliding transitions between waypoints.

---

## 🚀 Local Development & Build

```bash
# 1. Clone repository and install dependencies
git clone https://github.com/cww978/LinkAnimation.git
cd LinkAnimation
npm install

# 2. Start local dev server
npm run dev

# 3. Build online editor app
npm run build

# 4. Build standalone SDK (dist-lib/)
npm run build:lib

# 5. One-click deploy demo (GitHub Pages)
npm run deploy
```

---

## 📄 License

[MIT License](LICENSE)
