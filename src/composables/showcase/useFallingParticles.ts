import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type { FallingEffectConfig, FallingEffectType } from '@/services/api/types/template.types'

/**
 * Remount key for a `<FallingEffect>` instance.
 *
 * `useFallingParticles` reads its options ONCE, during setup: it destructures
 * them into plain locals and derives the motion profile, intensity preset and
 * cached custom image right there, so nothing about a later config change can
 * reach a mounted instance. Keying on this and letting Vue remount is what
 * makes the field react.
 *
 * Inert on the public showcase — a guest's template can't change mid-session —
 * and load-bearing in the partner template studio, where editing this effect
 * and watching it is the entire point.
 *
 * Deliberately covers the effect's own config only, not primaryColor /
 * accentColor: those are resolved through a `color()` callback the composable
 * invokes per spawned particle, so palette edits already reach new particles
 * (converging as the field recycles) without tearing the whole field down on
 * every drag of an unrelated color picker.
 */
export function fallingEffectKeyOf(config: FallingEffectConfig | null | undefined): string {
  if (!config) return 'none'
  return [
    config.type,
    config.intensity ?? 'normal',
    config.color_source ?? 'primary',
    config.custom_color ?? '',
    config.custom_image ?? '',
    config.speed ?? FALLING_SPEED_RANGE.default,
  ].join('|')
}

/**
 * Bounds for `FallingEffectConfig.speed`, the fall-speed multiplier.
 *
 * `default: 1` is the speed the effect shipped with, so a template that never
 * sets the field renders exactly as before. The floor is where petals stop
 * reading as falling and start reading as hanging; the ceiling is where they
 * cross the stage fast enough to register as streaks rather than objects, which
 * no template should want and a slider shouldn't offer.
 *
 * Exported for the partner template studio's slider, so the control and the
 * renderer can't drift apart on what a legal speed is.
 */
export const FALLING_SPEED_RANGE = { min: 0.25, max: 3, default: 1, step: 0.05 } as const

/** Clamp an author-supplied speed into the range above; absent/junk → default. */
export function resolveFallingSpeed(speed: number | null | undefined): number {
  if (typeof speed !== 'number' || !Number.isFinite(speed)) return FALLING_SPEED_RANGE.default
  return Math.min(FALLING_SPEED_RANGE.max, Math.max(FALLING_SPEED_RANGE.min, speed))
}

/**
 * Built-in particle shape definitions.
 * Each entry provides an SVG path + viewBox for rendering as inline SVG.
 */
interface ParticleShape {
  path: string
  viewBox: string
  /** Default opacity for this particle type */
  opacity?: number
  /** Height ÷ width. Defaults to 1 (square box) — petals are taller than wide. */
  aspect?: number
}

/**
 * Per-type motion personality. Tuned so each particle type moves the way
 * its real-world counterpart does (petals flutter, confetti flips, snow drifts).
 */
interface MotionProfile {
  /** Horizontal sway amplitude range in px */
  sway: [number, number]
  /** Number of full sway oscillations over the fall */
  swayCycles: [number, number]
  /** Z-axis rotation behavior: full spins vs gentle back-and-forth wobble */
  rotateMode: 'spin' | 'wobble'
  /** Total spin degrees (spin mode) or wobble amplitude degrees (wobble mode) */
  rotate: [number, number]
  /** 3D flutter: rotateX oscillation amplitude in degrees (0 = flat 2D) */
  tumble: number
  /** Fall duration multiplier (>1 = floats slower, <1 = drops faster) */
  fallSpeed: number
  /**
   * Size multiplier relative to the configured min/max size. Keep every type
   * inside a narrow band (roughly 0.65–0.85) so no shape reads as noticeably
   * bigger than its neighbours — remember the petal box is 1.25× taller than
   * wide, so its scale has to sit lower than the square shapes' to match.
   */
  sizeScale: number
  /** Opacity pulse for sparkle (stars) */
  twinkle?: boolean
  /** Slow opacity breathe over the fall — brightest at top and bottom, halved
   *  mid-screen. Reads as the petal turning edge-on as it tumbles past. */
  shimmer?: boolean
  /** Hue jitter range in degrees applied per particle */
  hueJitter: number
}

const PARTICLE_SHAPES: Record<Exclude<FallingEffectType, 'none'>, ParticleShape> = {
  // Pointed leaf: the `border-radius: 58% 8% 58% 8%` silhouette traced as a
  // path — round at top-left/bottom-right, tapering to a tip at the other two
  // corners, on a 1:1.25 box.
  petals: {
    path: 'M18.6 0H29.4A2.6 3.2 0 0 1 32 3.2V16.8A18.6 23.2 0 0 1 13.4 40H2.6A2.6 3.2 0 0 1 0 36.8V23.2A18.6 23.2 0 0 1 18.6 0Z',
    viewBox: '0 0 32 40',
    opacity: 0.8,
    aspect: 1.25,
  },
  confetti: {
    path: 'M2 2h12v6H2z',
    viewBox: '0 0 16 10',
    opacity: 0.85,
  },
  snowflakes: {
    path: 'M16 0l1.5 5.5L22 4l-2.5 4.5L25 10l-5.5 1L21 16l-4.5-2L16 20l-.5-6-4.5 2 1.5-5L7 10l5.5-1.5L10 4l4.5 2.5z',
    viewBox: '0 0 32 20',
    opacity: 0.8,
  },
  stars: {
    path: 'M12 0l3.7 7.5L24 8.7l-6 5.8 1.4 8.5L12 18.8 4.6 23l1.4-8.5-6-5.8 8.3-1.2z',
    viewBox: '0 0 24 24',
    opacity: 0.75,
  },
  leaves: {
    path: 'M2 28C2 28 6 20 14 12c8-8 16-10 16-10S28 10 20 18C12 26 2 28 2 28zM14 12l6 6',
    viewBox: '0 0 32 32',
    opacity: 0.7,
  },
  // Japanese maple (momiji): 7 slender pointed lobes with concave sides + stem
  maple: {
    path: 'M16 1Q17.2 7.8 17.7 10.7Q19.6 9.2 24.2 4.7Q21.4 10.5 20.5 12.7Q22.4 12.9 28.4 12Q23.1 14.8 21.6 16.1Q24.6 17.7 26.3 19.8Q20.3 19.4 17 18.8L16.4 25.5 15.6 25.5 15 18.8Q11.7 19.4 5.7 19.8Q7.4 17.7 10.4 16.1Q8.9 14.8 3.6 12Q9.6 12.9 11.5 12.7Q10.6 10.5 7.8 4.7Q12.4 9.2 14.3 10.7Q14.8 7.8 16 1z',
    viewBox: '0 0 32 32',
    opacity: 0.75,
  },
  hearts: {
    path: 'M16 29C16 29 2 20.5 2 11.2 2 6.6 5.7 3 10.1 3c2.7 0 5.1 1.4 5.9 3.4C16.8 4.4 19.2 3 21.9 3 26.3 3 30 6.6 30 11.2 30 20.5 16 29 16 29z',
    viewBox: '0 0 32 32',
    opacity: 0.75,
  },
}

/** Confetti gets a mix of shapes — rectangles, streamers, circles, triangles */
const CONFETTI_VARIANTS: ParticleShape[] = [
  PARTICLE_SHAPES.confetti,
  { path: 'M2 0h4v16H2z', viewBox: '0 0 8 16', opacity: 0.85 },
  { path: 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z', viewBox: '0 0 16 16', opacity: 0.85 },
  { path: 'M8 1l7 13H1z', viewBox: '0 0 16 16', opacity: 0.85 },
]

const MOTION_PROFILES: Record<Exclude<FallingEffectType, 'none'>, MotionProfile> = {
  // Flat 2D spin, no 3D tumble: the dimensionality comes from the shading
  // gradient rotating with the petal, so the highlight sweeps across it.
  petals: {
    sway: [30, 120],
    swayCycles: [1.6, 2.4],
    rotateMode: 'spin',
    rotate: [120, 500],
    tumble: 0,
    fallSpeed: 1,
    // Tallest silhouette of the set (1.25 aspect), so it needs the deepest trim
    // to sit in the same size band as everything else.
    sizeScale: 0.75,
    shimmer: true,
    hueJitter: 10,
  },
  confetti: {
    sway: [20, 60],
    swayCycles: [2, 4],
    rotateMode: 'spin',
    rotate: [540, 1260],
    tumble: 80,
    fallSpeed: 0.9,
    sizeScale: 0.65,
    hueJitter: 36,
  },
  snowflakes: {
    sway: [30, 70],
    swayCycles: [1, 2],
    rotateMode: 'spin',
    rotate: [90, 270],
    tumble: 0,
    fallSpeed: 1.35,
    sizeScale: 0.85,
    hueJitter: 6,
  },
  stars: {
    sway: [20, 50],
    swayCycles: [1, 2],
    rotateMode: 'spin',
    rotate: [120, 360],
    tumble: 0,
    fallSpeed: 1.2,
    sizeScale: 0.8,
    twinkle: true,
    hueJitter: 8,
  },
  leaves: {
    sway: [50, 110],
    swayCycles: [1.5, 3.5],
    rotateMode: 'spin',
    rotate: [240, 600],
    tumble: 65,
    fallSpeed: 1.1,
    sizeScale: 0.83,
    hueJitter: 14,
  },
  maple: {
    sway: [45, 100],
    swayCycles: [1.5, 3],
    rotateMode: 'spin',
    rotate: [200, 560],
    tumble: 60,
    fallSpeed: 1.05,
    sizeScale: 0.79,
    hueJitter: 12,
  },
  hearts: {
    sway: [25, 60],
    swayCycles: [1, 2.5],
    rotateMode: 'wobble',
    rotate: [15, 35],
    tumble: 0,
    fallSpeed: 1.05,
    sizeScale: 0.8,
    hueJitter: 8,
  },
}

/** Default motion for custom uploaded images — gentle petal-like drift */
const CUSTOM_IMAGE_PROFILE: MotionProfile = {
  sway: [35, 80],
  swayCycles: [1.5, 3],
  rotateMode: 'spin',
  rotate: [120, 420],
  tumble: 0,
  fallSpeed: 1,
  sizeScale: 0.85,
  hueJitter: 0,
}

/**
 * Depth layers create parallax: background particles are smaller, softer,
 * dimmer, and fall slower; foreground particles are larger, sharper, faster.
 */
const DEPTH_LAYERS = [
  { size: 0.55, blur: 1.6, opacity: 0.5, speed: 1.4, weight: 0.3 },
  { size: 0.8, blur: 0.6, opacity: 0.75, speed: 1.2, weight: 0.4 },
  { size: 1.1, blur: 0, opacity: 1, speed: 1, weight: 0.3 },
] as const

/**
 * Intensity presets mapping to spawn interval (ms) and max particle count.
 * Tuned sparse — a calm drift of a dozen-odd petals reads as premium, where a
 * dense field reads as a screensaver. `normal` sits at the density the effect
 * was designed against; the caps govern, the intervals just refill them.
 */
const INTENSITY_PRESETS = {
  light: { interval: 1100, maxParticles: 10 },
  normal: { interval: 700, maxParticles: 16 },
  heavy: { interval: 420, maxParticles: 26 },
} as const

/**
 * Keyframes sampled per full oscillation of a particle's fastest sine.
 *
 * The motion below is authored as continuous sine waves and then handed to
 * WAAPI as discrete stops it interpolates LINEARLY between, so the sample rate
 * is what decides whether a sway reads as a curve or as a crease. A fixed ten
 * stops was enough for a petal at 1.6 cycles and nowhere near enough for
 * confetti, whose tumble runs at swayCycles + 1 — up to five cycles, i.e. two
 * samples per cycle, right at Nyquist. Measured against the true sine, that
 * reconstruction kept 61% of the intended amplitude with an RMS error of 0.49:
 * the confetti was not tumbling slowly, it was tumbling through a shape that
 * had little to do with the one written here. Twelve samples per cycle holds
 * the error at 0.018 for every profile.
 */
const SAMPLES_PER_CYCLE = 12
/** Floor keeps the gentle profiles smooth; ceiling keeps a spawn cheap. */
const KEYFRAME_STEPS = { min: 12, max: 72 } as const

/**
 * Stage width the sway and drift amplitudes below were tuned against.
 *
 * The showcase stage is `min(100vw, 56.25vh)`, so it is roughly 600px on a
 * laptop and 390px on a phone. Pixel amplitudes tuned on the former swing a
 * petal across half the width of the latter — the same reason the spark field
 * measures its motes in percent of the stage rather than in pixels.
 */
const REFERENCE_STAGE_WIDTH = 600

const rand = (min: number, max: number) => Math.random() * (max - min) + min

function pickDepthLayer() {
  const r = Math.random()
  let acc = 0
  for (const layer of DEPTH_LAYERS) {
    acc += layer.weight
    if (r <= acc) return layer
  }
  return DEPTH_LAYERS[DEPTH_LAYERS.length - 1]
}

/**
 * Parse a hex color (#rgb or #rrggbb) into HSL. Returns null for any other
 * format so non-hex CSS colors gracefully skip the jitter step.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  let raw = match[1]
  if (raw.length === 3)
    raw = raw
      .split('')
      .map((c) => c + c)
      .join('')
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: h * 360, s, l }
}

const hslCss = (h: number, s: number, l: number) =>
  `hsl(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`

/**
 * Per-particle shading pair. Hue/saturation/lightness jitter keeps a swarm from
 * looking flat; the light/dark spread around the jittered base is what gives
 * each particle a lit face and a shaded one once the gradient rotates with it.
 */
function shadeStops(base: string, hueJitter: number): { light: string; dark: string } | null {
  const hsl = hexToHsl(base)
  if (!hsl) return null
  const h = (hsl.h + rand(-hueJitter, hueJitter) + 360) % 360
  const s = Math.min(1, Math.max(0, hsl.s + rand(-0.06, 0.1)))
  const l = Math.min(0.92, Math.max(0.15, hsl.l + rand(-0.08, 0.1)))
  return {
    light: hslCss(h, Math.min(1, s + 0.03), Math.min(0.95, l + 0.17)),
    dark: hslCss(h, Math.max(0, s - 0.1), Math.max(0.12, l - 0.2)),
  }
}

/** Document-unique ids for the per-particle gradient defs */
let gradientSeq = 0

export interface FallingParticlesOptions {
  /** Built-in shape type (ignored when customImage is provided) */
  type?: FallingEffectType
  /** URL to a custom particle image (PNG with transparency or SVG) */
  customImage?: string | null
  /** Particle fill color — only applies to built-in SVG shapes */
  color?: () => string
  /** Spawn rate / density preset */
  intensity?: 'light' | 'normal' | 'heavy'
  /** Minimum particle size in px (default: 12) */
  minSize?: number
  /** Maximum particle size in px (default: 26) */
  maxSize?: number
  /** Minimum fall duration in ms (default: 10000) */
  minDuration?: number
  /** Maximum fall duration in ms (default: 17000) */
  maxDuration?: number
  /**
   * Fall-speed multiplier: 1 = the tuned default, >1 faster, <1 slower.
   * Divides the duration and the spawn interval alike, so the field keeps the
   * density its `intensity` asked for at any speed.
   */
  speed?: number
}

/**
 * Composable for creating falling particle animations on the showcase.
 *
 * Supports two rendering modes:
 * 1. Built-in SVG shapes — petals, confetti, snowflakes, stars, leaves, hearts
 * 2. Custom uploaded images — transparent PNG or SVG via URL
 *
 * Particles move with per-type personality: sinusoidal sway, 3D tumble,
 * depth-layer parallax, color variation, and soft fade in/out — all driven
 * by the Web Animations API on compositor-friendly properties.
 */
export function useFallingParticles(
  containerRef: Ref<HTMLElement | undefined>,
  options: FallingParticlesOptions = {},
) {
  const {
    type = 'petals',
    customImage = null,
    color = () => '#e91e63',
    intensity = 'normal',
    minSize = 12,
    maxSize = 26,
    minDuration = 10000,
    maxDuration = 17000,
    speed,
  } = options

  // Don't set up anything for 'none' type (unless custom image is provided)
  if (type === 'none' && !customImage) {
    return { isActive: ref(false), start: () => {}, stop: () => {}, cleanup: () => {} }
  }

  const speedFactor = resolveFallingSpeed(speed)
  const basePreset = INTENSITY_PRESETS[intensity]
  // Density is `intensity`'s job, so the spawn interval tracks the speed: at 2x
  // each particle clears the stage in half the time, and refilling at the
  // original rate would leave half as many on screen. Rounded up off a 60ms
  // floor so a fast setting can't degenerate into a per-frame spawn loop.
  const preset = {
    maxParticles: basePreset.maxParticles,
    interval: Math.max(60, Math.round(basePreset.interval / speedFactor)),
  }
  const profile: MotionProfile =
    customImage || type === 'none' ? CUSTOM_IMAGE_PROFILE : MOTION_PROFILES[type]
  let spawnTimer: ReturnType<typeof setInterval> | null = null
  const isActive = ref(false)

  // Pre-cache the custom image if provided
  let cachedImg: HTMLImageElement | null = null
  if (customImage) {
    cachedImg = new Image()
    cachedImg.src = customImage
  }

  function pickShape(): ParticleShape | null {
    if (customImage || type === 'none') return null
    if (type === 'confetti')
      return CONFETTI_VARIANTS[Math.floor(Math.random() * CONFETTI_VARIANTS.length)]
    return PARTICLE_SHAPES[type]
  }

  /**
   * Build multi-keyframe motion: vertical fall + sinusoidal horizontal sway
   * + spin/wobble rotation + optional 3D rotateX tumble + fade in/out.
   * Pre-sampled into discrete keyframes that WAAPI interpolates between.
   */
  function buildKeyframes(opts: {
    fallDistance: number
    baseOpacity: number
    drift: number
    sway: number
    swayCycles: number
    swayPhase: number
    rotateTotal: number
    rotateDir: number
    tumblePhase: number
  }): Keyframe[] {
    // Sample against whichever of this particle's oscillators runs fastest:
    // the sway, the tumble that beats one cycle above it, or the star twinkle
    // at its fixed 2.5 cycles.
    const fastestCycles = Math.max(
      opts.swayCycles,
      profile.tumble ? opts.swayCycles + 1 : 0,
      profile.twinkle ? 2.5 : 0,
      1,
    )
    const STEPS = Math.min(
      KEYFRAME_STEPS.max,
      Math.max(KEYFRAME_STEPS.min, Math.round(fastestCycles * SAMPLES_PER_CYCLE)),
    )
    const frames: Keyframe[] = []
    for (let i = 0; i <= STEPS; i++) {
      const p = i / STEPS
      const x =
        opts.drift * p + Math.sin(opts.swayPhase + p * opts.swayCycles * Math.PI * 2) * opts.sway
      const y = opts.fallDistance * p

      let rotZ: number
      if (profile.rotateMode === 'wobble') {
        rotZ =
          Math.sin(opts.swayPhase + p * opts.swayCycles * Math.PI * 2) *
          opts.rotateTotal *
          opts.rotateDir
      } else {
        rotZ = opts.rotateTotal * p * opts.rotateDir
      }

      const rotX = profile.tumble
        ? Math.sin(opts.tumblePhase + p * (opts.swayCycles + 1) * Math.PI * 2) * profile.tumble
        : 0

      let opacity = opts.baseOpacity
      if (profile.shimmer) opacity *= 0.5 + 0.5 * Math.abs(Math.cos(p * Math.PI))
      if (p < 0.08) opacity *= p / 0.08
      else if (p > 0.85) opacity *= (1 - p) / 0.15
      if (profile.twinkle) {
        opacity *= 0.65 + 0.35 * Math.abs(Math.sin(opts.tumblePhase + p * 5 * Math.PI))
      }

      frames.push({
        transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateZ(${rotZ.toFixed(1)}deg)${rotX ? ` rotateX(${rotX.toFixed(1)}deg)` : ''}`,
        opacity: Math.max(0, Math.min(1, opacity)),
        offset: p,
        easing: 'linear',
      })
    }
    return frames
  }

  /**
   * Spawn a single particle. `startProgress` (0–1) starts the animation
   * partway through its fall via a negative delay — used to pre-populate
   * the scene so it isn't empty when the stage first appears.
   */
  function createParticle(startProgress = 0) {
    const container = containerRef.value
    if (!container) return
    if (container.children.length >= preset.maxParticles) return

    const shape = pickShape()
    const layer = pickDepthLayer()

    const particle = document.createElement('div')
    particle.style.position = 'absolute'
    particle.style.top = '-60px'
    particle.style.pointerEvents = 'none'
    particle.style.willChange = 'transform, opacity'
    particle.style.opacity = '0'
    if (layer.blur > 0) particle.style.filter = `blur(${layer.blur}px)`

    const size = rand(minSize, maxSize) * profile.sizeScale * layer.size
    particle.style.width = size + 'px'
    particle.style.height = size * (shape?.aspect ?? 1) + 'px'

    const containerWidth = container.offsetWidth
    const containerHeight = container.offsetHeight

    // Trim the horizontal amplitudes on a narrow stage so a phone gets the same
    // proportion of sway a laptop does rather than the same pixel count.
    const widthScale = Math.min(
      1,
      Math.max(0.6, containerWidth / REFERENCE_STAGE_WIDTH),
    )
    const sway = rand(profile.sway[0], profile.sway[1]) * widthScale
    const drift = rand(-80, 80) * widthScale

    // Spawn inside a band narrow enough that THIS particle's own excursion
    // still lands on stage. The old fixed 2–98% claimed to do this and could
    // not: sway plus drift reaches a third of a phone's stage width, so a petal
    // spawned near either edge spent much of its fall clipped against the
    // container's `overflow: hidden` — it simply vanished partway down. Capped
    // at 48 so a wide excursion narrows the band rather than inverting it.
    const excursion = sway + Math.abs(drift) + size
    const band = Math.min(48, (excursion / Math.max(1, containerWidth)) * 100)
    particle.style.left = rand(band, 100 - band) + '%'

    if (customImage) {
      // Render as an <img> element for custom uploaded images
      const img = document.createElement('img')
      img.src = customImage
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.objectFit = 'contain'
      img.draggable = false
      particle.appendChild(img)
    } else if (shape) {
      // Render as inline SVG for built-in shapes
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', shape.viewBox)
      svg.style.width = '100%'
      svg.style.height = '100%'
      svg.style.overflow = 'visible'

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', shape.path)

      // A two-stop gradient rather than a flat fill. Because it's painted in
      // the particle's own coordinate space it rotates with the particle, so
      // the highlight sweeps across the face as it spins — that's what reads
      // as a real petal catching the light. Non-hex colors can't be split into
      // stops, so those fall back to the flat fill.
      const stops = shadeStops(color(), profile.hueJitter)
      if (stops) {
        const id = `fp-grad-${gradientSeq++}`
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
        grad.setAttribute('id', id)
        // 140° in CSS terms — down and to the right.
        grad.setAttribute('x1', '0.18')
        grad.setAttribute('y1', '0.12')
        grad.setAttribute('x2', '0.82')
        grad.setAttribute('y2', '0.88')
        for (const [offset, stopColor] of [
          ['0', stops.light],
          ['1', stops.dark],
        ]) {
          const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
          stop.setAttribute('offset', offset)
          stop.setAttribute('stop-color', stopColor)
          grad.appendChild(stop)
        }
        defs.appendChild(grad)
        svg.appendChild(defs)
        path.setAttribute('fill', `url(#${id})`)
      } else {
        path.setAttribute('fill', color())
      }

      svg.appendChild(path)
      particle.appendChild(svg)
    }

    container.appendChild(particle)

    const baseOpacity = (shape?.opacity ?? 0.75) * layer.opacity
    const duration =
      (rand(minDuration, maxDuration) * profile.fallSpeed * layer.speed) / speedFactor

    const frames = buildKeyframes({
      fallDistance: containerHeight + 140,
      baseOpacity,
      drift,
      sway,
      swayCycles: rand(profile.swayCycles[0], profile.swayCycles[1]),
      swayPhase: rand(0, Math.PI * 2),
      rotateTotal: rand(profile.rotate[0], profile.rotate[1]),
      rotateDir: Math.random() < 0.5 ? -1 : 1,
      tumblePhase: rand(0, Math.PI * 2),
    })

    const animation = particle.animate(frames, {
      duration,
      easing: 'linear',
      delay: startProgress > 0 ? -duration * startProgress : 0,
      fill: 'backwards',
    })

    animation.onfinish = () => particle.remove()
    animation.oncancel = () => particle.remove()
  }

  /** Fill the sky with particles already mid-fall so the scene starts alive */
  function prePopulate() {
    const count = Math.floor(preset.maxParticles * 0.5)
    for (let i = 0; i < count; i++) {
      createParticle(rand(0.05, 0.75))
    }
  }

  // Pause spawning while the tab is hidden — running WAAPI animations finish
  // and clean themselves up, and we don't pile up new particles meanwhile.
  function handleVisibilityChange() {
    if (document.hidden) {
      if (spawnTimer) {
        clearInterval(spawnTimer)
        spawnTimer = null
      }
    } else if (isActive.value && !spawnTimer) {
      spawnTimer = setInterval(createParticle, preset.interval)
    }
  }

  function start() {
    if (isActive.value) return

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    isActive.value = true
    prePopulate()
    spawnTimer = setInterval(createParticle, preset.interval)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  function stop() {
    if (spawnTimer) {
      clearInterval(spawnTimer)
      spawnTimer = null
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    isActive.value = false
  }

  function cleanup() {
    stop()
    const container = containerRef.value
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }
  }

  onMounted(() => {
    start()
  })

  onUnmounted(() => {
    cleanup()
  })

  return { isActive, start, stop, cleanup }
}
