import { Point } from '../types/route'

export interface InterpolatedPoint {
  x: number
  y: number
  angle: number // degrees (0-360)
  distanceFromStart: number
}

// Catmull-Rom spline interpolation
export function getCatmullRomPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): { x: number; y: number } {
  const t2 = t * t
  const t3 = t2 * t

  const f0 = -0.5 * t3 + t2 - 0.5 * t
  const f1 = 1.5 * t3 - 2.5 * t2 + 1.0
  const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t
  const f3 = 0.5 * t3 - 0.5 * t2

  return {
    x: p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3,
    y: p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3,
  }
}

// Generate fine samples along path
export function generateSampledPath(
  points: Point[],
  curveType: 'smooth' | 'linear' = 'smooth',
  samplesPerSegment = 30
): InterpolatedPoint[] {
  if (points.length === 0) return []
  if (points.length === 1) {
    return [
      {
        x: points[0].x,
        y: points[0].y,
        angle: 0,
        distanceFromStart: 0,
      },
    ]
  }

  const rawSamples: { x: number; y: number }[] = []

  if (curveType === 'linear' || points.length === 2) {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      const steps = Math.max(10, samplesPerSegment)
      for (let s = 0; s < steps; s++) {
        if (i > 0 && s === 0) continue // avoid duplicates
        const t = s / steps
        rawSamples.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        })
      }
    }
    rawSamples.push({ x: points[points.length - 1].x, y: points[points.length - 1].y })
  } else {
    // Smooth Catmull-Rom
    const n = points.length
    for (let i = 0; i < n - 1; i++) {
      const p0 = i === 0 ? points[0] : points[i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = i + 2 < n ? points[i + 2] : p2

      const steps = samplesPerSegment
      for (let s = 0; s < steps; s++) {
        if (i > 0 && s === 0) continue
        const t = s / steps
        rawSamples.push(getCatmullRomPoint(p0, p1, p2, p3, t))
      }
    }
    rawSamples.push({ x: points[n - 1].x, y: points[n - 1].y })
  }

  // Calculate cumulative distance and angles
  const result: InterpolatedPoint[] = []
  let totalDist = 0

  for (let i = 0; i < rawSamples.length; i++) {
    const curr = rawSamples[i]
    let angle = 0

    if (i < rawSamples.length - 1) {
      const next = rawSamples[i + 1]
      const dx = next.x - curr.x
      const dy = next.y - curr.y
      angle = (Math.atan2(dy, dx) * 180) / Math.PI
    } else if (result.length > 0) {
      angle = result[result.length - 1].angle
    }

    if (i > 0) {
      const prev = rawSamples[i - 1]
      const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y)
      totalDist += dist
    }

    result.push({
      x: curr.x,
      y: curr.y,
      angle,
      distanceFromStart: totalDist,
    })
  }

  return result
}

// Get point on sampled path at normalized progress progress (0 to 1)
export function getPointAtProgress(
  sampledPath: InterpolatedPoint[],
  progress: number,
  easingFunction: (t: number) => number = (t) => t
): InterpolatedPoint {
  if (sampledPath.length === 0) {
    return { x: 0, y: 0, angle: 0, distanceFromStart: 0 }
  }
  if (sampledPath.length === 1) return sampledPath[0]

  const clampedT = Math.max(0, Math.min(1, progress))
  const easedT = easingFunction(clampedT)

  const totalDistance = sampledPath[sampledPath.length - 1].distanceFromStart
  const targetDistance = easedT * totalDistance

  // Binary search for segment
  let low = 0
  let high = sampledPath.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (sampledPath[mid].distanceFromStart < targetDistance) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  const idx = Math.min(Math.max(0, low), sampledPath.length - 1)
  if (idx === 0) return sampledPath[0]

  const pPrev = sampledPath[idx - 1]
  const pNext = sampledPath[idx]

  const segmentLen = pNext.distanceFromStart - pPrev.distanceFromStart
  if (segmentLen <= 0.0001) return pNext

  const segT = (targetDistance - pPrev.distanceFromStart) / segmentLen

  const interpolatedX = pPrev.x + (pNext.x - pPrev.x) * segT
  const interpolatedY = pPrev.y + (pNext.y - pPrev.y) * segT
  
  // Angle interpolation handling 360 wrap
  let dAngle = pNext.angle - pPrev.angle
  if (dAngle > 180) dAngle -= 360
  if (dAngle < -180) dAngle += 360
  const interpolatedAngle = pPrev.angle + dAngle * segT

  return {
    x: interpolatedX,
    y: interpolatedY,
    angle: (interpolatedAngle + 360) % 360,
    distanceFromStart: targetDistance,
  }
}

// Generate SVG Path d string for visualization
export function generateSvgPathD(points: Point[], curveType: 'smooth' | 'linear'): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  if (curveType === 'linear' || points.length === 2) {
    return points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
    }, '')
  }

  // Smooth SVG Bezier representation
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i + 2 < points.length ? points[i + 2] : p2

    // Approximate control points for Catmull-Rom to Cubic Bezier
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6

    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  return d
}

// Find closest segment to a click/hover coordinate for line point insertion
export function findClosestSegmentIndex(
  points: Point[],
  x: number,
  y: number,
  maxDistance = 20
): { insertIndex: number; point: { x: number; y: number } } | null {
  if (points.length < 2) return null

  let minDistance = Infinity
  let bestResult: { insertIndex: number; point: { x: number; y: number } } | null = null

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]

    // Distance from point to line segment
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const lenSq = dx * dx + dy * dy

    if (lenSq === 0) continue

    let t = ((x - p1.x) * dx + (y - p1.y) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))

    const projX = p1.x + t * dx
    const projY = p1.y + t * dy

    const dist = Math.hypot(x - projX, y - projY)

    if (dist < minDistance && dist <= maxDistance) {
      minDistance = dist
      bestResult = {
        insertIndex: i + 1, // Insert after i
        point: { x: Math.round(projX), y: Math.round(projY) },
      }
    }
  }

  return bestResult
}

// Easing functions
export const EASINGS: Record<string, (t: number) => number> = {
  linear: (t) => t,
  ease: (t) => t * t * (3 - 2 * t),
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  },
}
