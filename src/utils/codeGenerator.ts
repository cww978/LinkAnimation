import { Point, AnimationConfig, SubjectConfig } from '../types/route'
import { generateSampledPath, EASINGS } from './spline'

export function generateCSSKeyframes(
  points: Point[],
  animConfig: AnimationConfig,
  subjectConfig: SubjectConfig,
  keyframeName = 'moveAlongPath'
): string {
  if (points.length === 0) return '/* 没有增加路线点 */'

  const sampled = generateSampledPath(points, animConfig.curveType, 20)
  if (sampled.length === 0) return ''

  const stepsCount = Math.min(sampled.length, 100) // Sample up to 100 keyframe steps
  const keyframes: string[] = []

  const easingFn = EASINGS[animConfig.easing] || EASINGS.linear

  for (let i = 0; i < stepsCount; i++) {
    const rawRatio = i / (stepsCount - 1)
    const easedRatio = easingFn(rawRatio)
    
    // Sample from sampled array
    const sampleIdx = Math.min(
      Math.floor(easedRatio * (sampled.length - 1)),
      sampled.length - 1
    )
    const item = sampled[sampleIdx]
    const percent = (rawRatio * 100).toFixed(1)

    let transform = ''
    if (subjectConfig.autoRotate) {
      const angle = (item.angle + subjectConfig.angleOffset).toFixed(1)
      transform = ` transform: rotate(${angle}deg);`
    }

    keyframes.push(
      `  ${percent}% {\n    left: ${Math.round(item.x)}px;\n    top: ${Math.round(item.y)}px;${transform}\n  }`
    )
  }

  const loopStr = animConfig.loop ? 'infinite' : '1'
  const directionStr = animConfig.yoyo ? 'alternate' : 'normal'

  return `/* CSS Keyframes (Relative left & top positioning) */
@keyframes ${keyframeName} {
${keyframes.join('\n')}
}

/* 目标主体 CSS 样式 */
.animated-subject {
  position: absolute;
  left: ${Math.round(points[0].x)}px;
  top: ${Math.round(points[0].y)}px;
  width: ${subjectConfig.width}px;
  height: ${subjectConfig.height}px;
  animation: ${keyframeName} ${animConfig.duration}s ${animConfig.easing} ${loopStr} ${directionStr} forwards;
  will-change: left, top, transform;
}`
}

export function generateJSCode(
  points: Point[],
  animConfig: AnimationConfig,
  subjectConfig: SubjectConfig
): string {
  if (points.length === 0) return '// 没有增加路线点'

  const pointsJson = JSON.stringify(
    points.map((p) => ({ left: p.x, top: p.y })),
    null,
    2
  )

  return `// JavaScript 原生 requestAnimationFrame 运行主体动画 (基于 left / top 定位)
const targetElement = document.querySelector('#animated-subject');
const routePoints = ${pointsJson};

const duration = ${animConfig.duration * 1000}; // ms
let startTime = null;

function animate(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;
  const progress = Math.min(elapsed / duration, 1);

  // 计算当前点坐标
  const totalSegments = routePoints.length - 1;
  const segmentProgress = progress * totalSegments;
  const currentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const segmentT = segmentProgress - currentIndex;

  const p1 = routePoints[currentIndex];
  const p2 = routePoints[currentIndex + 1] || p1;

  const currentLeft = p1.left + (p2.left - p1.left) * segmentT;
  const currentTop = p1.top + (p2.top - p1.top) * segmentT;

  targetElement.style.left = \`\${currentLeft}px\`;
  targetElement.style.top = \`\${currentTop}px\`;

  if (progress < 1) {
    requestAnimationFrame(animate);
  }
}

// 开始运行
requestAnimationFrame(animate);`
}
