# LinkAnimation 动画运行库 - 引入指南

`link-animation-editor` 已成功发布至 NPM。你可以通过多种方式在你的项目中引入并使用它。

---

## 方式一：通过 npm / pnpm / yarn 安装 (强烈推荐)

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
  showBg: true,                        // 是否显示背景图
  showLine: true,                      // 是否显示连接路线
  showPoint: true,                     // 是否显示路线路径点
  lineType: 'dashed',                  // 路线类型 ('solid' | 'dashed' | 'dot' | 'dashdot')
  lineColor: '#cccccc',                // 路线颜色
  lineActiveColor: '#1296db',          // 路线已走过的激活颜色
  step: 0,                             // 默认开始路径点索引
})

// 播放控制 API
animation.start()      // 开始播放
animation.pause()      // 暂停播放
animation.stop()       // 停止并重置到起点
animation.seekTo(0.5)  // 跳转到 0.5 秒位置
animation.stepTo(2)    // 快捷跳转到第 2 个路径点
animation.stepAdd(1)   // 往前移动 1 个路径点并触发过渡动画
animation.stepAdd(-1)  // 往后倒退 1 个路径点并触发过渡动画

// 事件监听
animation.on('waypoint', ({ index, point, imageSwitched }) => {
  console.log(`到达第 ${index} 个路径点 P${index}`, point)
  if (imageSwitched) {
    console.log(`在此点切换了图片为: ${imageSwitched}`)
  }
})

animation.on('finish', () => {
  console.log('动画播放结束！')
})

// 销毁实例
// animation.destroy()
```

---

## 方式二：通过 CDN / 原生 HTML `<script>` 标签引入

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
  <div id="animation-container" style="width: 960px; height: 540px; position: relative;"></div>

  <!-- 引入 CDN 运行库 -->
  <script src="https://unpkg.com/link-animation-editor/dist-lib/link-animation.umd.js"></script>
  <!-- 或: <script src="https://cdn.jsdelivr.net/npm/link-animation-editor/dist-lib/link-animation.umd.js"></script> -->

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

## 方式三：本地打包产物引入 / 本地开发引用

如果你想直接复用本地源码或者生成的 `dist-lib/` 产物：

1. 本地打包：运行 `npm run build:lib` 得到 `dist-lib/link-animation.es.js` 及 `dist-lib/link-animation.umd.js`
2. 在 `package.json` 中配置本地依赖：
```json
{
  "dependencies": {
    "link-animation-editor": "file:../LinkAnimation"
  }
}
```
