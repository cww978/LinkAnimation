# LinkAnimation 动画运行库 - 其他项目引入指南

在当前项目运行 `pnpm run build:lib` 之后，会在 `dist-lib/` 目录下打包生成独立的运行库：
- `dist-lib/link-animation.es.js` (ES Module 格式)
- `dist-lib/link-animation.umd.js` (UMD / 原生 HTML 格式)

---

## 方式一：其他项目直接通过相对路径 / 文件依赖引入 (推荐)

### 1. 在其他项目的 `package.json` 中添加本地文件依赖
```json
{
  "dependencies": {
    "link-animation-editor": "file:/Users/wenweicao/Desktop/AI/LinkAnimation"
  }
}
```
然后在其他项目中运行 `pnpm install` 或 `npm install` 即可！

### 2. 在其他项目的 Vue / React / TS 代码中引入
```typescript
import { LinkAnimation } from 'link-animation-editor'

// 初始化动画实例
const animation = new LinkAnimation({
  container: '#animation-container', // 挂载容器的选择器或 DOM 节点
  config: configJson, // 从编辑器中【导出 JSON】导出的配置数据
  showBg: true, // 是否显示背景图
  showLine: true, // 是否显示连接路线
  showPoint: true, // 是否显示路线路径点
  lineType: 'dashed', // 路线类型 ('solid' | 'dashed' | 'dot' | 'dashdot')
  lineColor: '#cccccc', // 路线颜色
  lineActiveColor: '#1296db', // 路线已走过的激活颜色
  step: 0, // 默认开始路径点索引
})

// 播放控制
animation.start() // 开始播放
animation.pause() // 暂停播放
animation.stop() // 停止并重置到起点
animation.seekTo(0.5) // 跳转到 0.5 秒位置
animation.stepTo(2) // 快捷跳转到第 2 个路径点
animation.stepAdd(1) // 往前移动 1 个路径点并触发过渡动画
animation.stepAdd(-1) // 往后倒退 1 个路径点并触发过渡动画

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

## 方式二：直接复制 `dist-lib/link-animation.es.js` 文件

将打包生成的 `dist-lib/link-animation.es.js` 复制到其他项目的 `src/utils/` 文件夹下直接引入：

```javascript
import { LinkAnimation } from './utils/link-animation.es.js'

const animation = new LinkAnimation({
  container: '#animation-container',
  config: configJson,
  showLine: true,
  lineActiveColor: '#1296db',
})

animation.start()
```

---

## 方式三：原生 HTML `<script>` 标签引入

将 `dist-lib/link-animation.umd.js` 放到 public 静态资源目录下：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>LinkAnimation Demo</title>
</head>
<body>
  <div id="animation-container" style="width: 960px; height: 540px; position: relative;"></div>

  <!-- 引入 UMD 运行库 -->
  <script src="./dist-lib/link-animation.umd.js"></script>
  <script>
    const animation = new window.LinkAnimation({
      container: '#animation-container',
      config: configJson,
      showLine: true,
      lineType: 'dashed',
      lineActiveColor: '#1296db',
    });

    animation.start();
  </script>
</body>
</html>
```
