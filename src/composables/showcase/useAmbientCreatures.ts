import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type { AmbientCreatureEntry, AmbientCreatureEffectType } from '@/services/api/types/template.types'

export interface AmbientCreaturesOptions {
  /** Backend-driven creature entries with weights and optional size overrides */
  creatures: AmbientCreatureEntry[]
  /** Creature fill color */
  color?: () => string
  /** Number of creatures to spawn (default: 6) */
  count?: number
  /** Flight speed preset (default: 'normal') */
  speed?: 'slow' | 'normal' | 'fast'
}

const SPEED_PRESETS = {
  slow: { baseSpeed: 0.3, wobbleFreq: 0.0012 },
  normal: { baseSpeed: 0.5, wobbleFreq: 0.002 },
  fast: { baseSpeed: 0.8, wobbleFreq: 0.003 },
} as const

/** Per-creature-type default size ranges and speed multipliers */
const CREATURE_DEFAULTS: Record<
  AmbientCreatureEffectType,
  { minSize: number; maxSize: number; speedMul: number }
> = {
  butterfly: { minSize: 20, maxSize: 70, speedMul: 1.0 },
  dove: { minSize: 25, maxSize: 40, speedMul: 0.8 },
  firefly: { minSize: 8, maxSize: 16, speedMul: 0.6 },
  dragonfly: { minSize: 22, maxSize: 38, speedMul: 1.2 },
}

interface CreatureState {
  element: HTMLDivElement
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
  wobbleOffset: number
  wobbleAmp: number
  angle: number
  /** Index into decoration zones — creature orbits this decoration most often */
  homeZone: number
}

// ─── Decoration tracking ──────────────────────────────────────────

interface DecorationZone {
  side: 'left' | 'right' | 'top' | 'bottom'
  rect: DOMRect
}

const DECORATION_SELECTORS = [
  { side: 'left' as const, cls: '.cover-decoration-left' },
  { side: 'right' as const, cls: '.cover-decoration-right' },
  { side: 'top' as const, cls: '.cover-decoration-top' },
  { side: 'bottom' as const, cls: '.cover-decoration-bottom' },
]

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Query decoration image positions relative to the creature container */
function getDecorationZones(container: HTMLElement): DecorationZone[] {
  const parent = container.parentElement
  if (!parent) return []

  const containerRect = container.getBoundingClientRect()
  const zones: DecorationZone[] = []

  for (const { side, cls } of DECORATION_SELECTORS) {
    const img = parent.querySelector(cls) as HTMLElement | null
    if (img && img.offsetWidth > 0 && img.offsetHeight > 0) {
      const imgRect = img.getBoundingClientRect()
      zones.push({
        side,
        rect: new DOMRect(
          imgRect.left - containerRect.left,
          imgRect.top - containerRect.top,
          imgRect.width,
          imgRect.height,
        ),
      })
    }
  }

  return zones
}

/** Pick a point near the inner edge of a decoration element.
 *  Negative offset = on the decoration surface, positive = hovering off the edge.
 *  This makes creatures appear to interact with the floral elements. */
function pickDecorationPoint(zone: DecorationZone, cw: number, ch: number): { x: number; y: number } {
  const { side, rect } = zone
  const offset = -20 + Math.random() * 80 // -20px (on deco) to +60px (hovering off edge)

  switch (side) {
    case 'left': {
      const x = rect.x + rect.width + offset
      const y = rect.y + Math.random() * rect.height
      return { x: clamp(x, 0, cw), y: clamp(y, 0, ch) }
    }
    case 'right': {
      const x = rect.x - offset
      const y = rect.y + Math.random() * rect.height
      return { x: clamp(x, 0, cw), y: clamp(y, 0, ch) }
    }
    case 'top': {
      const x = rect.x + Math.random() * rect.width
      const y = rect.y + rect.height + offset
      return { x: clamp(x, 0, cw), y: clamp(y, 0, ch) }
    }
    case 'bottom': {
      const x = rect.x + Math.random() * rect.width
      const y = rect.y - offset
      return { x: clamp(x, 0, cw), y: clamp(y, 0, ch) }
    }
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg'

// ─── SVG creature creators ──────────────────────────────────────────
// Each returns a positioned wrapper div containing an animated SVG.
// Wing flapping is driven by CSS @keyframes referenced via inline
// animation styles, so each creature is self-contained.

function makeWrapper(size: number): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = `width:${size}px;height:${size}px;position:absolute;left:0;top:0;pointer-events:none;`
  return el
}

function makeSVG(viewBox: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', viewBox)
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.style.overflow = 'visible'
  return svg
}

function makePath(d: string, fill: string, opacity: string): SVGPathElement {
  const p = document.createElementNS(SVG_NS, 'path')
  p.setAttribute('d', d)
  p.setAttribute('fill', fill)
  p.setAttribute('opacity', opacity)
  return p
}

function makeEllipse(
  cx: string, cy: string, rx: string, ry: string,
  fill: string, opacity: string,
): SVGEllipseElement {
  const e = document.createElementNS(SVG_NS, 'ellipse')
  e.setAttribute('cx', cx)
  e.setAttribute('cy', cy)
  e.setAttribute('rx', rx)
  e.setAttribute('ry', ry)
  e.setAttribute('fill', fill)
  e.setAttribute('opacity', opacity)
  return e
}

function makeCircle(
  cx: string, cy: string, r: string,
  fill: string, opacity: string,
): SVGCircleElement {
  const c = document.createElementNS(SVG_NS, 'circle')
  c.setAttribute('cx', cx)
  c.setAttribute('cy', cy)
  c.setAttribute('r', r)
  c.setAttribute('fill', fill)
  c.setAttribute('opacity', opacity)
  return c
}

/** Apply wing-flap animation inline on an SVG element */
function setWingAnim(
  el: SVGElement,
  side: 'L' | 'R',
  origin: string,
  duration: string,
  delay = '0s',
) {
  el.style.transformOrigin = origin
  el.style.animation = `acFlap${side} ${duration} ease-in-out ${delay} infinite`
}

// ── Butterfly ───────────────────────────────────────────────────────

function createButterflySVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const svg = makeSVG('0 0 60 48')
  const origin = '30px 24px'

  // Left wing group
  const lw = document.createElementNS(SVG_NS, 'g')
  setWingAnim(lw, 'L', origin, '0.35s')
  lw.append(
    makePath('M30 24 C24 14 12 6 8 16 C5 22 18 30 30 24Z', color, '0.8'),
    makePath('M30 24 C24 28 14 38 12 30 C10 24 22 22 30 24Z', color, '0.6'),
  )

  // Right wing group
  const rw = document.createElementNS(SVG_NS, 'g')
  setWingAnim(rw, 'R', origin, '0.35s')
  rw.append(
    makePath('M30 24 C36 14 48 6 52 16 C55 22 42 30 30 24Z', color, '0.8'),
    makePath('M30 24 C36 28 46 38 48 30 C50 24 38 22 30 24Z', color, '0.6'),
  )

  // Body
  const body = makeEllipse('30', '24', '1.5', '7', color, '0.9')

  // Antennae
  const aL = makePath('M29 17 C27 11 24 7 22 5', color, '0.7')
  aL.setAttribute('stroke', color)
  aL.setAttribute('stroke-width', '0.8')
  aL.setAttribute('fill', 'none')

  const aR = makePath('M31 17 C33 11 36 7 38 5', color, '0.7')
  aR.setAttribute('stroke', color)
  aR.setAttribute('stroke-width', '0.8')
  aR.setAttribute('fill', 'none')

  svg.append(lw, rw, body, aL, aR)
  wrapper.appendChild(svg)
  return wrapper
}

// ── Dove ────────────────────────────────────────────────────────────

function createDoveSVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const svg = makeSVG('0 0 48 44')
  const origin = '24px 20px'

  // Left wing
  const lw = makePath('M24 18 C16 8 4 2 2 14 C0 20 14 26 24 20Z', color, '0.7')
  setWingAnim(lw, 'L', origin, '0.5s')

  // Right wing
  const rw = makePath('M24 18 C32 8 44 2 46 14 C48 20 34 26 24 20Z', color, '0.7')
  setWingAnim(rw, 'R', origin, '0.5s')

  // Body
  const body = makeEllipse('24', '20', '3', '7', color, '0.9')

  // Head
  const head = makeCircle('24', '11', '3', color, '0.9')

  // Beak
  const beak = makePath('M24 14 L22.5 15.5 L25.5 15.5Z', color, '0.7')

  // Tail fan
  const tail = makePath('M24 27 L18 38 L21 33 L24 40 L27 33 L30 38Z', color, '0.6')

  svg.append(lw, rw, body, head, beak, tail)
  wrapper.appendChild(svg)
  return wrapper
}

// ── Firefly ─────────────────────────────────────────────────────────

function createFireflySVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const svg = makeSVG('0 0 24 24')

  // Outer glow (pulsing via CSS)
  const glow = makeCircle('12', '12', '10', color, '0.25')
  glow.style.animation = 'acGlow 2s ease-in-out infinite'
  glow.style.transformOrigin = '12px 12px'

  // Mid glow
  const midGlow = makeCircle('12', '12', '6', color, '0.4')
  midGlow.style.animation = 'acGlow 2s ease-in-out infinite 0.3s'
  midGlow.style.transformOrigin = '12px 12px'

  // Core body
  const body = makeCircle('12', '12', '3', color, '0.95')

  svg.append(glow, midGlow, body)
  wrapper.appendChild(svg)
  return wrapper
}

// ── Dragonfly ───────────────────────────────────────────────────────

function createDragonflySVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const svg = makeSVG('0 0 56 52')
  const origin = '28px 22px'

  // Upper left wing
  const ulw = makePath('M28 18 C22 10 10 8 8 16 C6 20 18 22 28 20Z', color, '0.45')
  setWingAnim(ulw, 'L', origin, '0.28s')

  // Lower left wing
  const llw = makePath('M28 24 C22 26 12 30 10 26 C8 22 20 22 28 24Z', color, '0.35')
  setWingAnim(llw, 'L', origin, '0.28s', '0.07s')

  // Upper right wing
  const urw = makePath('M28 18 C34 10 46 8 48 16 C50 20 38 22 28 20Z', color, '0.45')
  setWingAnim(urw, 'R', origin, '0.28s')

  // Lower right wing
  const lrw = makePath('M28 24 C34 26 44 30 46 26 C48 22 36 22 28 24Z', color, '0.35')
  setWingAnim(lrw, 'R', origin, '0.28s', '0.07s')

  // Long body (abdomen)
  const body = makeEllipse('28', '28', '1.2', '16', color, '0.85')

  // Thorax
  const thorax = makeEllipse('28', '18', '2', '4', color, '0.9')

  // Head
  const head = makeCircle('28', '12', '2.5', color, '0.9')

  // Large compound eyes
  const eyeL = makeCircle('25.5', '11', '1.8', color, '0.6')
  const eyeR = makeCircle('30.5', '11', '1.8', color, '0.6')

  svg.append(ulw, llw, urw, lrw, body, thorax, head, eyeL, eyeR)
  wrapper.appendChild(svg)
  return wrapper
}

// ── Creator registry ────────────────────────────────────────────────

const CREATORS: Record<AmbientCreatureEffectType, (color: string, size: number) => HTMLDivElement> = {
  butterfly: createButterflySVG,
  dove: createDoveSVG,
  firefly: createFireflySVG,
  dragonfly: createDragonflySVG,
}

// ─── Composable ─────────────────────────────────────────────────────

/**
 * Composable for ambient hovering creature animations on the cover stage.
 *
 * Creates butterflies, doves, fireflies, or dragonflies that hover around
 * the container with organic flight paths biased toward edges (near
 * decorations). Wing flapping uses CSS keyframes (GPU-accelerated),
 * flight paths use requestAnimationFrame.
 *
 * All creatures are pure SVG — no image assets required.
 * Configuration is driven by the backend `ambient_creatures` template field.
 */
export function useAmbientCreatures(
  containerRef: Ref<HTMLElement | undefined>,
  options: AmbientCreaturesOptions,
) {
  const {
    creatures: creatureEntries,
    color = () => '#e91e63',
    count = 6,
    speed = 'normal',
  } = options

  if (!creatureEntries || creatureEntries.length === 0) {
    return { isActive: ref(false), start: () => {}, stop: () => {}, cleanup: () => {} }
  }

  // Build weighted spawn pool from creature entries
  const weightedPool: AmbientCreatureEntry[] = []
  for (const entry of creatureEntries) {
    const w = entry.weight ?? 1
    for (let i = 0; i < w; i++) {
      weightedPool.push(entry)
    }
  }

  const isActive = ref(false)
  const creatures: CreatureState[] = []
  const spawnTimers: ReturnType<typeof setTimeout>[] = []
  let rafId: number | null = null
  let styleEl: HTMLStyleElement | null = null
  const preset = SPEED_PRESETS[speed]

  /** Inject CSS @keyframes for wing flapping and firefly glow */
  function injectStyles() {
    if (styleEl) return
    const container = containerRef.value
    if (!container) return

    styleEl = document.createElement('style')
    styleEl.textContent = `
      @keyframes acFlapL {
        0%, 100% { transform: scaleX(1); }
        50% { transform: scaleX(0.25) skewY(8deg); }
      }
      @keyframes acFlapR {
        0%, 100% { transform: scaleX(1); }
        50% { transform: scaleX(0.25) skewY(-8deg); }
      }
      @keyframes acGlow {
        0%, 100% { opacity: 0.25; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.5); }
      }
    `
    container.appendChild(styleEl)
  }

  /** Pick a target position — near decorations when available, else edge-biased */
  function pickTarget(w: number, h: number, homeZone?: number): { x: number; y: number } {
    const container = containerRef.value
    if (container) {
      const zones = getDecorationZones(container)
      if (zones.length > 0) {
        const r = Math.random()
        if (r < 0.6 && homeZone !== undefined && homeZone < zones.length) {
          // 60% — orbit home decoration
          return pickDecorationPoint(zones[homeZone], w, h)
        } else if (r < 0.85) {
          // 25% — visit a random decoration
          const zone = zones[Math.floor(Math.random() * zones.length)]
          return pickDecorationPoint(zone, w, h)
        } else if (zones.length >= 2) {
          // 15% — drift between two decorations
          const a = zones[Math.floor(Math.random() * zones.length)]
          let bIdx = Math.floor(Math.random() * zones.length)
          while (zones[bIdx] === a && zones.length > 1) {
            bIdx = Math.floor(Math.random() * zones.length)
          }
          const pa = pickDecorationPoint(a, w, h)
          const pb = pickDecorationPoint(zones[bIdx], w, h)
          const t = 0.3 + Math.random() * 0.4
          return { x: pa.x + (pb.x - pa.x) * t, y: pa.y + (pb.y - pa.y) * t }
        } else {
          return pickDecorationPoint(zones[0], w, h)
        }
      }
    }

    // Fallback: edge-biased random (no decorations found)
    const pad = 0.15
    if (Math.random() < 0.6) {
      const side = Math.floor(Math.random() * 4)
      switch (side) {
        case 0: return { x: Math.random() * w * pad, y: Math.random() * h }
        case 1: return { x: w * (1 - pad) + Math.random() * w * pad, y: Math.random() * h }
        case 2: return { x: Math.random() * w, y: Math.random() * h * pad }
        default: return { x: Math.random() * w, y: h * (1 - pad) + Math.random() * h * pad }
      }
    }
    return {
      x: w * 0.1 + Math.random() * w * 0.8,
      y: h * 0.1 + Math.random() * h * 0.8,
    }
  }

  /** Pick a random creature entry from the weighted pool */
  function pickCreatureEntry(): AmbientCreatureEntry {
    return weightedPool[Math.floor(Math.random() * weightedPool.length)]
  }

  function spawnCreature() {
    const container = containerRef.value
    if (!container) return

    const cw = container.offsetWidth
    const ch = container.offsetHeight
    const entry = pickCreatureEntry()
    const defaults = CREATURE_DEFAULTS[entry.type]

    const minSize = entry.min_size ?? defaults.minSize
    const maxSize = entry.max_size ?? defaults.maxSize
    const size = minSize + Math.random() * (maxSize - minSize)

    // Assign a home decoration zone and start near it
    const zones = getDecorationZones(container)
    const homeZone = zones.length > 0 ? Math.floor(Math.random() * zones.length) : 0
    let startX: number, startY: number
    if (zones.length > 0) {
      const start = pickDecorationPoint(zones[homeZone], cw, ch)
      startX = start.x
      startY = start.y
    } else {
      startX = Math.random() * cw
      startY = Math.random() * ch
    }
    const target = pickTarget(cw, ch, homeZone)

    const element = CREATORS[entry.type](color(), size)

    // Randomize wing flap / glow phase so creatures aren't in sync
    const animated = element.querySelectorAll('[style*="animation"]')
    const phaseOffset = Math.random() * 800
    animated.forEach((el: Element) => {
      ;(el as HTMLElement).style.animationDelay = `-${phaseOffset}ms`
    })

    // Fade in gently
    element.style.opacity = '0'
    element.style.transition = 'opacity 1.2s ease-in'
    container.appendChild(element)
    requestAnimationFrame(() => {
      element.style.opacity = '0.85'
    })

    creatures.push({
      element,
      x: startX,
      y: startY,
      targetX: target.x,
      targetY: target.y,
      speed: preset.baseSpeed * defaults.speedMul * (0.6 + Math.random() * 0.8),
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleAmp: 0.4 + Math.random() * 0.4,
      angle: Math.random() * 360,
      homeZone,
    })
  }

  /** Main animation loop — moves creatures toward waypoints with wobble */
  function tick(timestamp: number) {
    const container = containerRef.value
    if (!container) {
      rafId = requestAnimationFrame(tick)
      return
    }

    const cw = container.offsetWidth
    const ch = container.offsetHeight

    for (const c of creatures) {
      const dx = c.targetX - c.x
      const dy = c.targetY - c.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 15) {
        const t = pickTarget(cw, ch, c.homeZone)
        c.targetX = t.x
        c.targetY = t.y
      } else {
        const nx = dx / dist
        const ny = dy / dist

        // Sinusoidal wobble perpendicular to flight direction
        const wobble =
          Math.sin(timestamp * preset.wobbleFreq + c.wobbleOffset) * c.wobbleAmp
        const px = -ny * wobble
        const py = nx * wobble

        c.x += nx * c.speed + px
        c.y += ny * c.speed + py

        // Smoothly rotate to face flight direction
        const targetAngle =
          Math.atan2(ny * c.speed + py, nx * c.speed + px) * (180 / Math.PI) + 90
        let angleDiff = targetAngle - c.angle
        while (angleDiff > 180) angleDiff -= 360
        while (angleDiff < -180) angleDiff += 360
        c.angle += angleDiff * 0.05
      }

      // Keep within container bounds
      c.x = Math.max(-10, Math.min(cw + 10, c.x))
      c.y = Math.max(-10, Math.min(ch + 10, c.y))

      c.element.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.angle}deg)`
    }

    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (isActive.value) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    isActive.value = true
    injectStyles()

    for (let i = 0; i < count; i++) {
      const timer = setTimeout(() => spawnCreature(), i * 500)
      spawnTimers.push(timer)
    }

    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    spawnTimers.forEach(clearTimeout)
    spawnTimers.length = 0
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    isActive.value = false
  }

  function cleanup() {
    stop()
    creatures.length = 0
    const container = containerRef.value
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }
    styleEl = null
  }

  onMounted(() => start())
  onUnmounted(() => cleanup())

  return { isActive, start, stop, cleanup }
}
