import {
  Point,
  CanvasConfig,
  SubjectConfig,
  AnimationConfig,
  SubjectImage,
} from "../types/route";
import {
  generateSampledPath,
  getPointAtProgress,
  generateSvgPathD,
  EASINGS,
  InterpolatedPoint,
} from "./spline";

export type LineType = "solid" | "dashed" | "dot" | "dashdot";
export type EasingType = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "bounce";
export type EventName =
  | "start"
  | "pause"
  | "stop"
  | "move"
  | "end"
  | "waypoint";
export type EventCallback = (data: any) => void;

export interface LinkAnimationOptions {
  container?: HTMLElement | string;
  config:
    | {
        canvasConfig?: Partial<CanvasConfig>;
        subjectConfig?: Partial<SubjectConfig>;
        animConfig?: Partial<AnimationConfig>;
        points?: Point[];
      }
    | string;
  showBg?: boolean;
  showLine?: boolean;
  showPoint?: boolean;
  showPoints?: boolean;
  lineType?: LineType;
  lineColor?: string;
  lineActiveColor?: string;
  step?: number;
  curveType?: "smooth" | "linear";
  easing?: EasingType;
  duration?: number;
  speed?: number;
}

export class LinkAnimation {
  private containerEl: HTMLElement | null = null;
  private stageEl: HTMLElement | null = null;
  private svgEl: SVGElement | null = null;
  private pathEl: SVGPathElement | null = null;
  private activePathEl: SVGPathElement | null = null;
  private waypointsGroupEl: SVGGElement | null = null;
  private subjectEl: HTMLElement | null = null;
  private subjectImgEl: HTMLImageElement | null = null;
  private subjectDivEl: HTMLElement | null = null;

  private points: Point[] = [];
  private canvasConfig: CanvasConfig;
  private subjectConfig: SubjectConfig;
  private animConfig: AnimationConfig;

  private showBg: boolean;
  private showLine: boolean;
  private showPoint: boolean;
  private lineType: LineType;
  private lineColor: string;
  private lineActiveColor: string;
  private step: number;

  private isPlaying = false;
  private isPaused = false;
  private progress = 0; // 0 to 1;
  private rafId: number | null = null;
  private startTime: number | null = null;
  private pauseTime: number | null = null;
  private isReversing = false;

  private sampledPath: InterpolatedPoint[] = [];
  private waypointDistances: number[] = [];
  private lastPassedWaypointIndex = -1;
  private currentActiveImageUrl: string | null = null;

  private eventListeners: Map<EventName, Set<EventCallback>> = new Map();

  constructor(options: LinkAnimationOptions) {
    // Parse config (JSON object or JSON string)
    let parsedConfig: any = {};
    if (typeof options.config === "string") {
      try {
        parsedConfig = JSON.parse(options.config);
      } catch (e) {
        console.error("[LinkAnimation] 配置文件 JSON 解析失败:", e);
      }
    } else if (options.config) {
      parsedConfig = options.config;
    }

    this.points = parsedConfig.points || [];
    this.canvasConfig = {
      width: 960,
      height: 540,
      bgImage: null,
      bgFit: "cover",
      bgOpacity: 1,
      gridVisible: false,
      gridSize: 40,
      snapToGrid: false,
      ...(parsedConfig.canvasConfig || {}),
    };

    this.subjectConfig = {
      type: "div",
      images: [],
      defaultImageId: null,
      image: null,
      width: 56,
      height: 56,
      borderRadius: 50,
      bgColor: "#3b82f6",
      borderColor: "#ffffff",
      borderWidth: 3,
      text: "🚀",
      shadow: true,
      autoRotate: true,
      angleOffset: 0,
      ...(parsedConfig.subjectConfig || {}),
    };

    this.animConfig = {
      duration: 4,
      curveType: "smooth",
      easing: "ease-in-out",
      loop: false,
      yoyo: false,
      speed: 1,
      lockRotateX: false,
      fixedAngleX: 0,
      lockRotateY: false,
      fixedAngleY: 0,
      lockRotateZ: false,
      fixedAngleZ: 0,
      ...(parsedConfig.animConfig || {}),
    };

    // Top-level option overrides (defaults to config values if omitted)
    if (options.curveType) this.animConfig.curveType = options.curveType;
    if (options.easing) this.animConfig.easing = options.easing as any;
    if (options.duration !== undefined) this.animConfig.duration = options.duration;
    if (options.speed !== undefined) this.animConfig.speed = options.speed;

    this.showBg = options.showBg ?? true;
    this.showLine = options.showLine ?? true;
    this.showPoint = options.showPoint ?? options.showPoints ?? true;
    this.lineType = options.lineType || "dashed";
    this.lineColor = options.lineColor || "#cccccc";
    this.lineActiveColor = options.lineActiveColor || "#1296db";
    this.step = options.step ?? 0;

    // Resolve container
    if (typeof options.container === "string") {
      this.containerEl = document.querySelector(options.container);
    } else if (options.container instanceof HTMLElement) {
      this.containerEl = options.container;
    }

    this.initPathData();

    if (this.containerEl) {
      this.mount();
    }

    // Step to initial waypoint if requested
    if (this.step > 0) {
      this.stepTo(this.step);
    }
  }

  private initPathData() {
    this.sampledPath = generateSampledPath(
      this.points,
      this.animConfig.curveType,
      30,
    );

    // Compute exact cumulative distances at each waypoint P[i]
    this.waypointDistances = [];
    let searchStartIdx = 0;

    for (let i = 0; i < this.points.length; i++) {
      if (i === 0) {
        this.waypointDistances.push(0);
        continue;
      }
      if (i === this.points.length - 1 && this.sampledPath.length > 0) {
        this.waypointDistances.push(
          this.sampledPath[this.sampledPath.length - 1].distanceFromStart,
        );
        continue;
      }

      const pt = this.points[i];
      let minSq = Infinity;
      let bestDist = this.sampledPath[searchStartIdx]?.distanceFromStart || 0;
      let bestIdx = searchStartIdx;

      for (let s = searchStartIdx; s < this.sampledPath.length; s++) {
        const sample = this.sampledPath[s];
        const dx = sample.x - pt.x;
        const dy = sample.y - pt.y;
        const sq = dx * dx + dy * dy;
        if (sq < minSq) {
          minSq = sq;
          bestDist = sample.distanceFromStart;
          bestIdx = s;
        }
      }
      searchStartIdx = bestIdx;
      this.waypointDistances.push(bestDist);
    }
  }

  // Mount DOM elements into container
  public mount(targetContainer?: HTMLElement | string) {
    if (targetContainer) {
      if (typeof targetContainer === "string") {
        this.containerEl = document.querySelector(targetContainer);
      } else {
        this.containerEl = targetContainer;
      }
    }

    if (!this.containerEl) return;

    // Clear previous
    this.containerEl.innerHTML = "";

    // Create Stage Container
    this.stageEl = document.createElement("div");
    this.stageEl.className = "link-animation-stage";
    Object.assign(this.stageEl.style, {
      position: "relative",
      width: `${this.canvasConfig.width}px`,
      height: `${this.canvasConfig.height}px`,
      overflow: "hidden",
      backgroundColor: "#0f172a",
      borderRadius: "12px",
      userSelect: "none",
    });

    // Background Image
    if (this.showBg && this.canvasConfig.bgImage) {
      const bgEl = document.createElement("div");
      Object.assign(bgEl.style, {
        position: "absolute",
        inset: "0",
        backgroundImage: `url(${this.canvasConfig.bgImage})`,
        backgroundSize: this.canvasConfig.bgFit,
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        opacity: `${this.canvasConfig.bgOpacity}`,
        pointerEvents: "none",
      });
      this.stageEl.appendChild(bgEl);
    }

    // SVG Layer (Lines and/or Waypoint Dots)
    if (this.showLine || this.showPoint) {
      this.svgEl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      this.svgEl.setAttribute("width", `${this.canvasConfig.width}`);
      this.svgEl.setAttribute("height", `${this.canvasConfig.height}`);
      Object.assign(this.svgEl.style, {
        position: "absolute",
        inset: "0",
        pointerEvents: "none",
        zIndex: "10",
      });

      const pathD = generateSvgPathD(this.points, this.animConfig.curveType);

      if (this.showLine) {
        // Base line
        this.pathEl = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        this.pathEl.setAttribute("d", pathD);
        this.pathEl.setAttribute("fill", "none");
        this.pathEl.setAttribute("stroke", this.lineColor);
        this.pathEl.setAttribute("stroke-width", "3");
        this.pathEl.setAttribute("stroke-linecap", "round");
        this.setStrokeDash(this.pathEl, this.lineType);

        // Active line highlight
        this.activePathEl = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        this.activePathEl.setAttribute("d", pathD);
        this.activePathEl.setAttribute("fill", "none");
        this.activePathEl.setAttribute("stroke", this.lineActiveColor);
        this.activePathEl.setAttribute("stroke-width", "4");
        this.activePathEl.setAttribute("stroke-linecap", "round");
        this.setStrokeDash(this.activePathEl, "solid");

        this.svgEl.appendChild(this.pathEl);
        this.svgEl.appendChild(this.activePathEl);
      }

      if (this.showPoint) {
        // Draw non-editable waypoint dots
        this.waypointsGroupEl = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        this.points.forEach((pt, idx) => {
          const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
          );
          circle.setAttribute("cx", `${pt.x}`);
          circle.setAttribute("cy", `${pt.y}`);
          circle.setAttribute(
            "r",
            idx === 0 || idx === this.points.length - 1 ? "6" : "4",
          );
          circle.setAttribute(
            "fill",
            idx === 0
              ? "#10b981"
              : idx === this.points.length - 1
                ? "#f43f5e"
                : this.lineActiveColor,
          );
          circle.setAttribute("stroke", "#ffffff");
          circle.setAttribute("stroke-width", "1.5");
          this.waypointsGroupEl?.appendChild(circle);
        });
        this.svgEl.appendChild(this.waypointsGroupEl);
      }

      this.stageEl.appendChild(this.svgEl);
    }

    // Animated Subject Element
    this.subjectEl = document.createElement("div");
    this.subjectEl.className = "link-animation-subject";
    Object.assign(this.subjectEl.style, {
      position: "absolute",
      width: `${this.subjectConfig.width}px`,
      height: `${this.subjectConfig.height}px`,
      borderRadius: `${this.subjectConfig.borderRadius}%`,
      zIndex: "40",
      pointerEvents: "none",
      transformOrigin: "center center",
      willChange: "left, top, transform",
    });

    if (this.subjectConfig.type === "image") {
      this.subjectImgEl = document.createElement("img");
      Object.assign(this.subjectImgEl.style, {
        width: "100%",
        height: "100%",
        objectFit: "contain",
      });
      this.subjectEl.appendChild(this.subjectImgEl);
    } else {
      this.subjectDivEl = document.createElement("div");
      Object.assign(this.subjectDivEl.style, {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: this.subjectConfig.bgColor,
        border:
          this.subjectConfig.borderWidth > 0
            ? `${this.subjectConfig.borderWidth}px solid ${this.subjectConfig.borderColor}`
            : "none",
        borderRadius: `${this.subjectConfig.borderRadius}%`,
        fontSize: "24px",
      });
      this.subjectDivEl.textContent = this.subjectConfig.text || "🚀";
      this.subjectEl.appendChild(this.subjectDivEl);
    }

    this.stageEl.appendChild(this.subjectEl);
    this.containerEl.appendChild(this.stageEl);

    this.updateRender();
  }

  private setStrokeDash(el: SVGPathElement, type: LineType) {
    switch (type) {
      case "dashed":
        el.setAttribute("stroke-dasharray", "8 6");
        break;
      case "dot":
        el.setAttribute("stroke-dasharray", "2 5");
        break;
      case "dashdot":
        el.setAttribute("stroke-dasharray", "10 4 2 4");
        break;
      case "solid":
      default:
        el.removeAttribute("stroke-dasharray");
        break;
    }
  }

  // Core Animation Loop
  private loop = (timestamp: number) => {
    if (!this.isPlaying || this.isPaused) return;

    if (!this.startTime) {
      const effectiveDuration =
        (this.animConfig.duration * 1000) / this.animConfig.speed;
      this.startTime = timestamp - this.progress * effectiveDuration;
    }

    const effectiveDuration =
      (this.animConfig.duration * 1000) / this.animConfig.speed;
    const elapsed = timestamp - this.startTime;
    let rawProgress = elapsed / effectiveDuration;

    if (rawProgress >= 1) {
      if (this.animConfig.yoyo) {
        this.isReversing = !this.isReversing;
        this.startTime = timestamp;
        rawProgress = 0;
      } else if (this.animConfig.loop) {
        this.startTime = timestamp;
        rawProgress = 0;
      } else {
        this.progress = 1;
        this.isPlaying = false;
        this.isPaused = false;
        this.startTime = null;
        this.updateRender();
        this.emit("end", { timestamp: Date.now() });
        return;
      }
    }

    this.progress = this.isReversing ? 1 - rawProgress : rawProgress;
    this.updateRender();

    this.rafId = requestAnimationFrame(this.loop);
  };

  // Update rendering of position, active image, 3D transform, and active path line
  private updateRender() {
    if (this.sampledPath.length === 0) return;

    const easingFn = EASINGS[this.animConfig.easing] || EASINGS.linear;
    const interpolated = getPointAtProgress(
      this.sampledPath,
      this.progress,
      easingFn,
    );

    // Compute active subject image & waypoint triggers
    let activeImgUrl = this.subjectConfig.image || null;
    const defaultImg = this.subjectConfig.images?.find(
      (img) => img.id === this.subjectConfig.defaultImageId || img.isDefault,
    );
    if (defaultImg) activeImgUrl = defaultImg.url;

    let currentWaypointIdx = -1;

    for (let i = 0; i < this.points.length; i++) {
      const pDist = this.waypointDistances[i] ?? 0;
      if (interpolated.distanceFromStart >= pDist - 1.5) {
        currentWaypointIdx = i;
        const swId = this.points[i]?.switchImageId;
        if (swId && swId !== "null" && swId !== "undefined" && swId !== "") {
          const match = this.subjectConfig.images?.find
            ? this.subjectConfig.images.find((img) => img.id === swId)
            : null;
          if (match) activeImgUrl = match.url;
        }
      } else {
        break;
      }
    }

    // Trigger waypoint event if passed new waypoint
    if (
      currentWaypointIdx !== -1 &&
      currentWaypointIdx !== this.lastPassedWaypointIndex
    ) {
      this.lastPassedWaypointIndex = currentWaypointIdx;
      this.emit("waypoint", {
        index: currentWaypointIdx,
        point: this.points[currentWaypointIdx],
        imageSwitched: activeImgUrl,
      });
    }

    // Update Image Src
    if (
      this.subjectImgEl &&
      activeImgUrl &&
      this.currentActiveImageUrl !== activeImgUrl
    ) {
      this.currentActiveImageUrl = activeImgUrl;
      this.subjectImgEl.src = activeImgUrl;
    }

    // Update 3D Transform
    const {
      lockRotateX,
      fixedAngleX,
      lockRotateY,
      fixedAngleY,
      lockRotateZ,
      fixedAngleZ,
    } = this.animConfig;
    let rotZ = lockRotateZ
      ? fixedAngleZ
      : this.subjectConfig.autoRotate
        ? interpolated.angle + this.subjectConfig.angleOffset
        : 0;
    rotZ = ((rotZ % 360) + 360) % 360;
    const rotX = lockRotateX ? fixedAngleX : 0;
    const rotY = lockRotateY ? fixedAngleY : 0;

    const hasShadow = this.subjectConfig.shadow ?? false;

    const ox = this.subjectConfig.originX ?? 50;
    const oy = this.subjectConfig.originY ?? 50;

    if (this.subjectEl) {
      this.subjectEl.style.left = `${interpolated.x}px`;
      this.subjectEl.style.top = `${interpolated.y}px`;
      this.subjectEl.style.transform = `translate(-${ox}%, -${oy}%) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ.toFixed(1)}deg)`;
      this.subjectEl.style.transformOrigin = `${ox}% ${oy}%`;
      this.subjectEl.style.boxShadow =
        hasShadow && this.subjectConfig.type === "div"
          ? "0 10px 25px rgba(0, 0, 0, 0.5)"
          : "none";
      this.subjectEl.style.filter =
        hasShadow && this.subjectConfig.type === "image"
          ? "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))"
          : "none";
    }

    // Update Active SVG Path stroke dashoffset
    if (this.activePathEl && this.pathEl) {
      const totalLen = this.pathEl.getTotalLength
        ? this.pathEl.getTotalLength()
        : 1000;
      const currentLen =
        (interpolated.distanceFromStart /
          (this.sampledPath[this.sampledPath.length - 1].distanceFromStart ||
            1)) *
        totalLen;
      this.activePathEl.style.strokeDasharray = `${currentLen} ${totalLen}`;
    }

    // Emit move event
    this.emit("move", {
      progress: this.progress,
      point: interpolated,
      left: interpolated.x,
      top: interpolated.y,
    });
  }

  // Get current waypoint index closest to current progress
  public getCurrentWaypointIndex(): number {
    if (this.points.length === 0 || this.sampledPath.length === 0) return 0;

    const currentDist = getPointAtProgress(
      this.sampledPath,
      this.progress,
    ).distanceFromStart;
    let idx = 0;

    for (let i = 0; i < this.points.length; i++) {
      if (currentDist >= (this.waypointDistances[i] ?? 0) - 1.5) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }

  // API Methods
  public start() {
    if (this.points.length < 2) return;
    if (this.isPlaying && !this.isPaused) return;

    // Reset progress to 0 ONLY if animation finished (reached end)
    if (this.progress >= 1) {
      this.progress = 0;
      this.lastPassedWaypointIndex = -1;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.isReversing = false;

    const effectiveDuration =
      (this.animConfig.duration * 1000) / this.animConfig.speed;
    this.startTime = performance.now() - this.progress * effectiveDuration;

    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(this.loop);
    this.emit("start", { timestamp: Date.now(), progress: this.progress });
  }

  public pause() {
    if (this.isPlaying) {
      this.isPaused = true;
      this.isPlaying = false;
      this.pauseTime = performance.now();
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.emit("pause", { timestamp: Date.now(), progress: this.progress });
    }
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.progress = 0;
    this.startTime = null;
    this.pauseTime = null;
    this.isReversing = false;
    this.lastPassedWaypointIndex = -1;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.updateRender();
    this.emit("stop", { timestamp: Date.now() });
  }

  public seekTo(progress: number) {
    this.progress = Math.max(0, Math.min(1, progress));
    if (this.isPlaying) {
      const effectiveDuration =
        (this.animConfig.duration * 1000) / this.animConfig.speed;
      this.startTime = performance.now() - this.progress * effectiveDuration;
    }
    this.updateRender();
  }

  // Move forward/backward by count steps with smooth movement animation
  public stepAdd(count = 1, durationSec?: number) {
    if (this.points.length < 2) return;

    const currentIdx = this.getCurrentWaypointIndex();
    const targetIdx = Math.max(
      0,
      Math.min(this.points.length - 1, currentIdx + count),
    );

    this.stepTo(targetIdx, true, durationSec);
  }

  // Jump or smoothly animate to target stepIndex
  public stepTo(stepIndex: number, animated = false, durationSec?: number) {
    const targetIdx = Math.max(0, Math.min(this.points.length - 1, stepIndex));
    if (this.points.length < 2) return;

    const targetDist = this.waypointDistances[targetIdx] ?? 0;
    const totalDist =
      this.sampledPath[this.sampledPath.length - 1]?.distanceFromStart || 1;
    const targetProgress = targetDist / totalDist;

    if (!animated) {
      this.seekTo(targetProgress);
      return;
    }

    this.animateToProgress(targetProgress, durationSec);
  }

  // Smoothly animate progress from current progress to targetProgress
  public animateToProgress(targetProgress: number, durationSec?: number) {
    if (this.points.length < 2) return;

    const startProgress = this.progress;
    const endProgress = Math.max(0, Math.min(1, targetProgress));
    if (Math.abs(startProgress - endProgress) < 0.0001) return;

    if (this.rafId) cancelAnimationFrame(this.rafId);

    const defaultDuration =
      (Math.abs(endProgress - startProgress) * this.animConfig.duration) /
      this.animConfig.speed;
    const durationMs = (durationSec ?? Math.max(0.4, defaultDuration)) * 1000;

    const animStartTime = performance.now();
    this.isPlaying = true;
    this.isPaused = false;
    this.emit("start", { timestamp: Date.now(), progress: startProgress });

    const animStep = (timestamp: number) => {
      if (!this.isPlaying || this.isPaused) return;

      const elapsed = timestamp - animStartTime;
      const t = Math.min(elapsed / durationMs, 1);

      // Smooth ease-in-out transition between startProgress and endProgress
      const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      this.progress = startProgress + (endProgress - startProgress) * easedT;

      this.updateRender();

      if (t < 1) {
        this.rafId = requestAnimationFrame(animStep);
      } else {
        this.progress = endProgress;
        this.isPlaying = false;
        this.updateRender();
        this.emit("end", { timestamp: Date.now(), progress: endProgress });
      }
    };

    this.rafId = requestAnimationFrame(animStep);
  }

  public getPoints(): Point[] {
    return [...this.points];
  }

  public on(eventName: EventName, callback: EventCallback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)?.add(callback);
  }

  public off(eventName: EventName, callback: EventCallback) {
    this.eventListeners.get(eventName)?.delete(callback);
  }

  private emit(eventName: EventName, data: any) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }

  public destroy() {
    this.stop();
    this.eventListeners.clear();
    if (this.stageEl && this.stageEl.parentNode) {
      this.stageEl.parentNode.removeChild(this.stageEl);
    }
    this.containerEl = null;
    this.stageEl = null;
  }
}
