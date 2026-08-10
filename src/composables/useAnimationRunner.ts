import { ref, computed, watch, onUnmounted, Ref } from 'vue'
import { Point, AnimationConfig, SubjectConfig } from '../types/route'
import { generateSampledPath, getPointAtProgress, EASINGS, InterpolatedPoint } from '../utils/spline'

export function useAnimationRunner(
  pointsRef: { value: Point[] },
  animConfig: AnimationConfig,
  subjectConfig?: SubjectConfig,
  selectedPointIdRef?: Ref<string | null>
) {
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const progress = ref(0) // 0 to 1
  let rafId: number | null = null
  let startTime: number | null = null
  let pauseTime: number | null = null
  let isReversing = false

  let lastLoggedUrl: string | null = null

  // Sampled Path calculation
  const sampledPath = computed(() => {
    return generateSampledPath(pointsRef.value, animConfig.curveType, 30)
  })

  // Easing function reference
  const currentEasingFn = computed(() => {
    return EASINGS[animConfig.easing] || EASINGS.linear
  })

  // Current interpolated target position
  const currentPosition = computed<InterpolatedPoint>(() => {
    if (sampledPath.value.length === 0) {
      return { x: 0, y: 0, angle: 0, distanceFromStart: 0 }
    }
    return getPointAtProgress(sampledPath.value, progress.value, currentEasingFn.value)
  })

  // Calculate cumulative distance along curve for each waypoint P[i]
  const waypointDistances = computed<number[]>(() => {
    const points = pointsRef.value
    const samples = sampledPath.value
    if (points.length === 0 || samples.length === 0) return []

    const dists: number[] = []
    let searchStartIdx = 0

    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        dists.push(0)
        continue
      }
      if (i === points.length - 1) {
        dists.push(samples[samples.length - 1].distanceFromStart)
        continue
      }

      const pt = points[i]
      let minSq = Infinity
      let bestDist = samples[searchStartIdx]?.distanceFromStart || 0
      let bestIdx = searchStartIdx

      for (let s = searchStartIdx; s < samples.length; s++) {
        const sample = samples[s]
        const dx = sample.x - pt.x
        const dy = sample.y - pt.y
        const sq = dx * dx + dy * dy
        if (sq < minSq) {
          minSq = sq
          bestDist = sample.distanceFromStart
          bestIdx = s
        }
      }
      searchStartIdx = bestIdx
      dists.push(bestDist)
    }

    return dists
  })

  // Active Subject Image URL (triggers strictly when subject's actual curve distance reaches each waypoint)
  const activeSubjectImageUrl = computed(() => {
    if (!subjectConfig || subjectConfig.type !== 'image' || subjectConfig.images.length === 0) {
      return subjectConfig?.image || null
    }

    // Default image fallback
    const defaultImg = subjectConfig.images.find(
      (img) => img.id === subjectConfig.defaultImageId || img.isDefault
    )
    let currentUrl = defaultImg?.url || subjectConfig.images[0]?.url || subjectConfig.image || null

    const points = pointsRef.value
    if (points.length === 0) return currentUrl

    const dists = waypointDistances.value
    const currentDist = currentPosition.value.distanceFromStart

    // Scan waypoints P0..Pn-1. A point is reached only when actual curve distance >= dists[i] - 1.5px
    for (let i = 0; i < points.length; i++) {
      const pt = points[i]
      const pDist = dists[i] ?? 0

      let isReached = false
      if (isPlaying.value || progress.value > 0) {
        isReached = currentDist >= (pDist - 1.5)
      } else if (selectedPointIdRef?.value) {
        const selIdx = points.findIndex((p) => p.id === selectedPointIdRef.value)
        isReached = i <= selIdx
      }

      if (isReached) {
        const swId = pt?.switchImageId
        if (swId && swId !== 'null' && swId !== 'undefined' && swId !== '') {
          const match = subjectConfig.images.find((img) => img.id === swId)
          if (match) {
            currentUrl = match.url
          }
        }
      } else {
        // Point P[i] has not been physically reached yet
        break
      }
    }

    return currentUrl
  })

  // Watch for active image changes and print accurate console logs
  watch(
    activeSubjectImageUrl,
    (newUrl) => {
      if (!newUrl || newUrl === lastLoggedUrl) return
      lastLoggedUrl = newUrl

      if (!subjectConfig || subjectConfig.type !== 'image') return

      const matchedImg = subjectConfig.images?.find((img) => img.url === newUrl)
      const imgName = matchedImg ? matchedImg.name : '未知图片'
      const currentTimeSec = (progress.value * animConfig.duration).toFixed(1)

      const points = pointsRef.value
      const dists = waypointDistances.value
      const currentDist = currentPosition.value.distanceFromStart

      let reachedIdx = 0
      for (let i = 0; i < points.length; i++) {
        if (currentDist >= ((dists[i] ?? 0) - 1.5)) {
          reachedIdx = i
        } else {
          break
        }
      }

      if (!isPlaying.value && selectedPointIdRef?.value) {
        const idx = points.findIndex((p) => p.id === selectedPointIdRef.value)
        if (idx !== -1) reachedIdx = idx
      }

      const triggeredPoint = points[reachedIdx]
      const pointLabel = triggeredPoint ? `节点 P${reachedIdx} (${triggeredPoint.name || ''})` : `进度 ${currentTimeSec}s`
      const posInfo = triggeredPoint ? `[left: ${triggeredPoint.x}px, top: ${triggeredPoint.y}px]` : ''

      console.log(
        `%c[LinkAnimation 切换图片] 🖼️ 主体精准到达 ${pointLabel} ${posInfo} -> 成功切换为图片: "${imgName}"`,
        'color: #38bdf8; font-weight: bold; background: #0f172a; padding: 4px 10px; border-radius: 6px; border: 1px solid #38bdf8;'
      )
    },
    { immediate: false }
  )

  // Main Animation Frame loop
  const loop = (timestamp: number) => {
    if (!isPlaying.value || isPaused.value) return

    if (!startTime) {
      const effectiveDuration = (animConfig.duration * 1000) / animConfig.speed
      startTime = timestamp - (progress.value * effectiveDuration)
    }

    const effectiveDuration = (animConfig.duration * 1000) / animConfig.speed
    const elapsed = timestamp - startTime

    let rawProgress = elapsed / effectiveDuration

    if (rawProgress >= 1) {
      if (animConfig.yoyo) {
        isReversing = !isReversing
        startTime = timestamp
        rawProgress = 0
      } else if (animConfig.loop) {
        startTime = timestamp
        rawProgress = 0
      } else {
        progress.value = 1
        isPlaying.value = false
        isPaused.value = false
        startTime = null
        return
      }
    }

    progress.value = isReversing ? 1 - rawProgress : rawProgress

    rafId = requestAnimationFrame(loop)
  }

  // Play / Resume (Resumes from current progress / waypoint instead of resetting to 0)
  const play = () => {
    if (pointsRef.value.length < 2) {
      alert('请至少添加 2 个路径点才能开始运行动画！')
      return
    }

    if (isPlaying.value && !isPaused.value) return

    lastLoggedUrl = null // reset log state for fresh playback

    if (progress.value >= 1) {
      progress.value = 0
    }

    isPlaying.value = true
    isPaused.value = false
    isReversing = false

    const effectiveDuration = (animConfig.duration * 1000) / animConfig.speed
    startTime = performance.now() - (progress.value * effectiveDuration)

    if (rafId) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(loop)
  }

  // Pause
  const pause = () => {
    if (isPlaying.value) {
      isPaused.value = true
      isPlaying.value = false
      pauseTime = performance.now()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }

  // Stop / Reset
  const stop = () => {
    isPlaying.value = false
    isPaused.value = false
    progress.value = 0
    startTime = null
    pauseTime = null
    isReversing = false
    lastLoggedUrl = null
    if (rafId) cancelAnimationFrame(rafId)
  }

  // Seek manually with timeline scrubber
  const seekTo = (newProgress: number) => {
    progress.value = Math.max(0, Math.min(1, newProgress))
    if (isPlaying.value) {
      const effectiveDuration = (animConfig.duration * 1000) / animConfig.speed
      startTime = performance.now() - (progress.value * effectiveDuration)
    }
  }

  // Reset progress when points change drastically
  watch(
    () => pointsRef.value.length,
    (len) => {
      if (len < 2 && isPlaying.value) {
        stop()
      }
    }
  )

  onUnmounted(() => {
    if (rafId) cancelAnimationFrame(rafId)
  })

  return {
    isPlaying,
    isPaused,
    progress,
    currentPosition,
    activeSubjectImageUrl,
    sampledPath,
    play,
    pause,
    stop,
    seekTo,
  }
}
