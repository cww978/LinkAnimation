import { ref, reactive, computed } from 'vue'
import { Point, CanvasConfig, SubjectConfig, AnimationConfig, SubjectImage } from '../types/route'
import { findClosestSegmentIndex } from '../utils/spline'

export function useRouteEditor() {
  // Route Waypoints
  const points = ref<Point[]>([
    { id: 'p-1', x: 120, y: 150, name: '起点 P0', switchImageId: null },
    { id: 'p-2', x: 380, y: 100, name: '控制点 P1', switchImageId: null },
    { id: 'p-3', x: 620, y: 350, name: '控制点 P2', switchImageId: null },
    { id: 'p-4', x: 800, y: 220, name: '终点 P3', switchImageId: null },
  ])

  const selectedPointId = ref<string | null>('p-1')
  const hoveredSegment = ref<{ insertIndex: number; point: { x: number; y: number } } | null>(null)

  // Canvas Settings
  const canvasConfig = reactive<CanvasConfig>({
    width: 960,
    height: 540,
    bgImage: null,
    bgVisible: true,
    bgFit: 'cover',
    bgOpacity: 1,
    gridVisible: true,
    gridSize: 40,
    snapToGrid: false,
  })

  // Subject Settings (div / image)
  const subjectConfig = reactive<SubjectConfig>({
    type: 'image',
    images: [],
    defaultImageId: null,
    image: null,
    width: 56,
    height: 56,
    originX: 50,
    originY: 50,
    borderRadius: 50,
    bgColor: '#3b82f6',
    borderColor: '#ffffff',
    borderWidth: 3,
    text: '🚀',
    shadow: false,
    autoRotate: true,
    angleOffset: 0,
  })

  // Animation Settings (with X, Y, Z rotation locking)
  const animConfig = reactive<AnimationConfig>({
    duration: 4,
    curveType: 'smooth',
    easing: 'ease-in-out',
    loop: false,
    yoyo: false,
    speed: 1,
    lockRotateX: false,
    fixedAngleX: 0,
    lockRotateY: false,
    fixedAngleY: 0,
    lockRotateZ: false,
    fixedAngleZ: 0,
  })

  // Canvas View Scale
  const zoomScale = ref(1)

  // Add a new point at (x, y)
  const addPoint = (x: number, y: number): Point => {
    let finalX = x
    let finalY = y

    if (canvasConfig.snapToGrid) {
      finalX = Math.round(x / canvasConfig.gridSize) * canvasConfig.gridSize
      finalY = Math.round(y / canvasConfig.gridSize) * canvasConfig.gridSize
    }

    const newPoint: Point = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      x: Math.round(finalX),
      y: Math.round(finalY),
      name: `控制点 P${points.value.length}`,
      switchImageId: null,
    }

    points.value.push(newPoint)
    selectedPointId.value = newPoint.id
    return newPoint
  }

  // Insert a point between existing segments
  const insertPointAtSegment = (index: number, x: number, y: number) => {
    const newPoint: Point = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      x: Math.round(x),
      y: Math.round(y),
      name: `插入点 P${index}`,
      switchImageId: null,
    }

    points.value.splice(index, 0, newPoint)
    selectedPointId.value = newPoint.id
    hoveredSegment.value = null
  }

  // Move point position
  const updatePointPosition = (id: string, x: number, y: number) => {
    const target = points.value.find((p) => p.id === id)
    if (!target) return

    let finalX = x
    let finalY = y

    if (canvasConfig.snapToGrid) {
      finalX = Math.round(x / canvasConfig.gridSize) * canvasConfig.gridSize
      finalY = Math.round(y / canvasConfig.gridSize) * canvasConfig.gridSize
    }

    // Clamp inside canvas bounds
    target.x = Math.max(0, Math.min(canvasConfig.width, Math.round(finalX)))
    target.y = Math.max(0, Math.min(canvasConfig.height, Math.round(finalY)))
  }

  // Delete point
  const deletePoint = (id: string) => {
    const idx = points.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      points.value.splice(idx, 1)
      if (selectedPointId.value === id) {
        selectedPointId.value = points.value[Math.max(0, idx - 1)]?.id || null
      }
    }
  }

  // Clear all points
  const clearPoints = () => {
    points.value = []
    selectedPointId.value = null
  }

  // Handle stage mouse move for line segment insertion detection
  const checkLineInsertion = (x: number, y: number) => {
    if (points.value.length < 2) {
      hoveredSegment.value = null
      return
    }
    const candidate = findClosestSegmentIndex(points.value, x, y, 18)
    hoveredSegment.value = candidate
  }

  // Handle image uploads
  const handleBgImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      canvasConfig.bgImage = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Multi-subject image management
  const handleSubjectImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      const isFirst = subjectConfig.images.length === 0
      const newImg: SubjectImage = {
        id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: file.name.replace(/\.[^/.]+$/, '') || `主体图片 ${subjectConfig.images.length + 1}`,
        url,
        isDefault: isFirst,
      }

      subjectConfig.images.push(newImg)
      subjectConfig.type = 'image'

      if (isFirst) {
        subjectConfig.defaultImageId = newImg.id
        subjectConfig.image = url
      }
    }
    reader.readAsDataURL(file)
  }

  const setDefaultSubjectImage = (imageId: string) => {
    subjectConfig.images.forEach((img) => {
      img.isDefault = img.id === imageId
    })
    subjectConfig.defaultImageId = imageId
    const target = subjectConfig.images.find((img) => img.id === imageId)
    if (target) {
      subjectConfig.image = target.url
    }
  }

  const removeSubjectImage = (imageId: string) => {
    const idx = subjectConfig.images.findIndex((img) => img.id === imageId)
    if (idx !== -1) {
      const removed = subjectConfig.images.splice(idx, 1)[0]
      // Clear waypoint switch references targeting this deleted image
      points.value.forEach((p) => {
        if (p.switchImageId === imageId) {
          p.switchImageId = null
        }
      })

      if (removed.isDefault && subjectConfig.images.length > 0) {
        setDefaultSubjectImage(subjectConfig.images[0].id)
      } else if (subjectConfig.images.length === 0) {
        subjectConfig.defaultImageId = null
        subjectConfig.image = null
      }
    }
  }

  // Default Active Image Url helper
  const defaultSubjectImageUrl = computed(() => {
    if (subjectConfig.type !== 'image') return null
    const defImg = subjectConfig.images.find((img) => img.id === subjectConfig.defaultImageId || img.isDefault)
    return defImg?.url || subjectConfig.images[0]?.url || subjectConfig.image || null
  })

  // Selected Point helper
  const selectedPoint = computed(() => {
    return points.value.find((p) => p.id === selectedPointId.value) || null
  })

  // Export JSON
  const exportConfigJSON = () => {
    const data = {
      canvasConfig: { ...canvasConfig },
      subjectConfig: { ...subjectConfig },
      animConfig: { ...animConfig },
      points: points.value,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `link-animation-route-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import JSON
  const importConfigJSON = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.canvasConfig) Object.assign(canvasConfig, data.canvasConfig)
      if (data.subjectConfig) Object.assign(subjectConfig, data.subjectConfig)
      if (data.animConfig) Object.assign(animConfig, data.animConfig)
      if (Array.isArray(data.points)) points.value = data.points
    } catch (e) {
      alert('解析配置文件失败，请确认 JSON 格式正确！')
    }
  }

  return {
    points,
    selectedPointId,
    selectedPoint,
    hoveredSegment,
    canvasConfig,
    subjectConfig,
    animConfig,
    zoomScale,
    defaultSubjectImageUrl,
    addPoint,
    insertPointAtSegment,
    updatePointPosition,
    deletePoint,
    clearPoints,
    checkLineInsertion,
    handleBgImageUpload,
    handleSubjectImageUpload,
    setDefaultSubjectImage,
    removeSubjectImage,
    exportConfigJSON,
    importConfigJSON,
  }
}
