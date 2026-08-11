# LinkAnimation 动画运行库 - 引入与使用指南 (v1.0.3)

`link-animation-editor` 已发布至 NPM。你可以通过多种方式在你的项目中引入并使用它。

---

## ⚡ 方式一：通过 npm / pnpm / yarn 安装 (强烈推荐)

### 1. 安装 npm 包
```bash
npm install link-animation-editor
# 或
pnpm add link-animation-editor
# 或
yarn add link-animation-editor
```

### 2. 在前端代码中引入使用 (Vue / React / Angular / Svelte / TS / JS)

```typescript
import { LinkAnimation } from 'link-animation-editor'
import configJson from './route-config.json' // 从编辑器导出的 JSON 配置文件

// 初始化动画实例
const animation = new LinkAnimation({
  container: '#animation-container', // 挂载容器的选择器或 DOM 节点
  config: configJson,                 // 导出的配置 JSON
  responsive: true,                   // 【v1.0.3 新增】开启移动端/多端屏幕响应式自适应等比缩放
  showBg: false,                      // 是否显示背景图（设为 false 即背景透明透出）
  bgColor: 'transparent',            // 【v1.0.3 新增】自定义背景颜色或 transparent
  bgImage: '',                        // 【v1.0.3 新增】自定义背景图片 URL
  showLine: true,                     // 是否显示连接路线
  showPoint: true,                    // 是否显示路线路径点
  lineType: 'dashed',                  // 路线类型 ('solid' | 'dashed' | 'dot' | 'dashdot')
  lineColor: '#cccccc',                // 路线颜色
  lineActiveColor: '#1296db',          // 路线已走过的激活颜色
  step: 0,                             // 默认开始路径点索引
})

// 播放控制 API
animation.start()            // 开始播放全路径动画
animation.pause()            // 暂停播放
animation.stop()             // 停止并重置到起点
animation.seekTo(0.5)        // 跳转到进度比例 0.5 (0~1)
animation.stepTo(2, true)    // 【平滑移动】带过渡动画滑行到第 2 个路径点
animation.stepAdd(1)         // 往前移动 1 个路径点并触发平滑过渡动画
animation.stepAdd(-1)        // 往后倒退 1 个路径点并触发平滑过渡动画

// 事件监听
animation.on('waypoint', ({ index, point, imageSwitched }) => {
  console.log(`到达第 ${index} 个路径点 P${index}`, point)
  if (imageSwitched) {
    console.log(`在此点切换了图片为: ${imageSwitched}`)
  }
})

animation.on('end', () => {
  console.log('动画播放结束！')
})

// 组件销毁/页面卸载时清理实例
// animation.destroy()
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

## 🌐 方式二：通过 CDN / 原生 HTML `<script>` 标签引入

可以直接使用 UNPKG 或 jsDelivr CDN 引入：

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

  <!-- 引入 CDN 运行库 -->
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
