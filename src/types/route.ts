export interface SubjectImage {
  id: string
  name: string
  url: string
  isDefault: boolean
}

export interface Point {
  id: string
  x: number // left position in px
  y: number // top position in px
  name?: string
  speedMultiplier?: number
  pauseDuration?: number
  switchImageId?: string | null // image id to switch to when reaching this waypoint
}

export interface CanvasConfig {
  width: number
  height: number
  bgImage: string | null
  bgVisible?: boolean // Whether to show background image (default true)
  bgFit: 'contain' | 'cover' | 'fill'
  bgOpacity: number
  gridVisible: boolean
  gridSize: number
  snapToGrid: boolean
}

export interface SubjectConfig {
  type: 'image' | 'div'
  images: SubjectImage[]
  defaultImageId: string | null
  image: string | null // fallback for backward compatibility
  width: number
  height: number
  originX?: number // Center point X ratio: 0-100% (default 50)
  originY?: number // Center point Y ratio: 0-100% (default 50)
  borderRadius: number
  bgColor: string
  borderColor: string
  borderWidth: number
  text: string
  shadow: boolean
  autoRotate: boolean
  angleOffset: number // in degrees
}

export interface AnimationConfig {
  duration: number // in seconds
  curveType: 'smooth' | 'linear'
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce'
  loop: boolean
  yoyo: boolean
  speed: number // 0.5x, 1x, 2x
  // X, Y, Z Rotation Locking
  lockRotateX: boolean
  fixedAngleX: number // degrees (0-360)
  lockRotateY: boolean
  fixedAngleY: number // degrees (0-360)
  lockRotateZ: boolean
  fixedAngleZ: number // degrees (0-360)
}

export interface InsertionCandidate {
  segmentIndex: number
  point: { x: number; y: number }
  distance: number
}
