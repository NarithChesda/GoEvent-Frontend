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
  balloon: { minSize: 24, maxSize: 52, speedMul: 0.4 },
  hummingbird: { minSize: 18, maxSize: 36, speedMul: 1.4 },
}

interface CreatureState {
  element: HTMLDivElement
  type: AmbientCreatureEffectType
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
  /** Simulated distance from viewer: scales size, opacity, and speed (parallax) */
  depth: number
  /** Phase offset for speed surging (butterflies) and drift (fireflies) */
  speedPhase: number
  /** Current heading in radians — doves steer with a limited turn rate to fly arcs */
  heading: number
  /** Dragonfly state machine: dart fast toward target, then hover in place */
  mode: 'seek' | 'hover'
  modeUntil: number
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
// Each creature is a layered structure:
//   wrapper (JS positions this)
//     └─ flyer (CSS perspective + body-bob animation)
//          ├─ wing divs (3D rotateY flap — reads as a real fold, unlike scaleX)
//          └─ body SVG
// Flap cycles include glide phases (flap-flap-flap…soar) and per-creature
// randomized durations so no two creatures beat in sync.

function makeWrapper(size: number): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = `width:${size}px;height:${size}px;position:absolute;left:0;top:0;pointer-events:none;will-change:transform;`
  return el
}

/** Inner layer carrying perspective (for 3D wing folds) and the vertical bob */
function makeFlyer(size: number, bobAnim: string | null, dur: number, delay: number): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = `position:absolute;inset:0;perspective:${Math.max(120, size * 4)}px;`
  if (bobAnim) {
    el.style.animation = `${bobAnim} ${dur}s ease-in-out ${delay}s infinite`
  }
  return el
}

/** Half-width layer holding one side's wing SVG, flapping via 3D rotateY */
function makeWing(
  side: 'L' | 'R',
  viewBox: string,
  originY: number,
  anim: string,
  dur: number,
  delay: number,
): { div: HTMLDivElement; svg: SVGSVGElement } {
  const div = document.createElement('div')
  div.style.cssText = `position:absolute;top:0;${side === 'L' ? 'left' : 'right'}:0;width:50%;height:100%;transform-origin:${side === 'L' ? 'right' : 'left'} ${originY}%;animation:${anim} ${dur}s ease-in-out ${delay}s infinite;will-change:transform;`
  const svg = makeSVG(viewBox)
  div.appendChild(svg)
  return { div, svg }
}

/** Full-size layer for the body parts (drawn in the creature's full viewBox) */
function makeBodyLayer(viewBox: string): { div: HTMLDivElement; svg: SVGSVGElement } {
  const div = document.createElement('div')
  div.style.cssText = 'position:absolute;inset:0;'
  const svg = makeSVG(viewBox)
  div.appendChild(svg)
  return { div, svg }
}

function makeSVG(viewBox: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', viewBox)
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.style.overflow = 'visible'
  svg.style.display = 'block'
  return svg
}

/**
 * A drawn path.
 *
 * `strokeWidth` renders it as a stroked line instead of a filled shape. The
 * hummingbird's beak is a bare quadratic curve — filled, SVG closes it
 * implicitly and it comes out as a thin dark sliver; it only reads as a beak
 * when stroked. Its call site had always passed a width for exactly that, into
 * a parameter that did not exist, so the argument was dropped on the floor.
 */
function makePath(
  d: string,
  fill: string,
  opacity: string,
  strokeWidth?: number,
): SVGPathElement {
  const p = document.createElementNS(SVG_NS, 'path')
  p.setAttribute('d', d)
  if (strokeWidth === undefined) {
    p.setAttribute('fill', fill)
  } else {
    p.setAttribute('fill', 'none')
    p.setAttribute('stroke', fill)
    p.setAttribute('stroke-width', String(strokeWidth))
    p.setAttribute('stroke-linecap', 'round')
  }
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

// ─── Color & gradient helpers ───────────────────────────────────────

let gradientUid = 0

/** Blend a 6-digit hex color toward white (amt > 0) or black (amt < 0) */
function shadeColor(color: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return color
  const n = parseInt(m[1], 16)
  const t = amt < 0 ? 0 : 255
  const p = Math.abs(amt)
  const ch = (shift: number) => {
    const v = (n >> shift) & 255
    return Math.round((t - v) * p + v)
  }
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`
}

/** Add a <linearGradient> to an svg and return its fill url */
function addLinearGradient(svg: SVGSVGElement, c1: string, c2: string): string {
  const id = `ac-grad-${++gradientUid}`
  const grad = document.createElementNS(SVG_NS, 'linearGradient')
  grad.setAttribute('id', id)
  grad.setAttribute('x1', '0')
  grad.setAttribute('y1', '0')
  grad.setAttribute('x2', '1')
  grad.setAttribute('y2', '1')
  for (const [offset, c] of [['0%', c1], ['100%', c2]] as const) {
    const stop = document.createElementNS(SVG_NS, 'stop')
    stop.setAttribute('offset', offset)
    stop.setAttribute('stop-color', c)
    grad.appendChild(stop)
  }
  const defs = document.createElementNS(SVG_NS, 'defs')
  defs.appendChild(grad)
  svg.appendChild(defs)
  return `url(#${id})`
}

/** Add a <radialGradient> (soft glow) and return its fill url.
 *  Stops: [offset, color, stopOpacity][] */
function addRadialGradient(
  svg: SVGSVGElement,
  stops: Array<[string, string, string]>,
): string {
  const id = `ac-grad-${++gradientUid}`
  const grad = document.createElementNS(SVG_NS, 'radialGradient')
  grad.setAttribute('id', id)
  for (const [offset, c, op] of stops) {
    const stop = document.createElementNS(SVG_NS, 'stop')
    stop.setAttribute('offset', offset)
    stop.setAttribute('stop-color', c)
    stop.setAttribute('stop-opacity', op)
    grad.appendChild(stop)
  }
  const defs = document.createElementNS(SVG_NS, 'defs')
  defs.appendChild(grad)
  svg.appendChild(defs)
  return `url(#${id})`
}

/** Stroked path — wing veins, feather lines, antennae, segment marks */
function makeLine(d: string, stroke: string, width: number, opacity: string): SVGPathElement {
  const p = document.createElementNS(SVG_NS, 'path')
  p.setAttribute('d', d)
  p.setAttribute('fill', 'none')
  p.setAttribute('stroke', stroke)
  p.setAttribute('stroke-width', String(width))
  p.setAttribute('opacity', opacity)
  p.setAttribute('stroke-linecap', 'round')
  return p
}

function makeGroup(): SVGGElement {
  return document.createElementNS(SVG_NS, 'g')
}

// All creatures are drawn facing up in a 100×100 viewBox; left-wing
// geometry lives in x ∈ [0,50] and the right wing reuses the exact same
// shapes mirrored via translate(100)scale(-1,1), so the two sides always
// match. Gradients + vein/feather detail layers replace the old flat blobs.

// ── Butterfly ───────────────────────────────────────────────────────
// Elongated swept forewing + rounded hindwing, gradient fill, dark outer
// edge band, vein lines radiating from the body, and pale spots.
// Burst-flutter cycle: several quick flaps, then a glide with gentle sway.

function createButterflySVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const dur = 1.7 + Math.random() * 0.8
  const delay = -Math.random() * dur
  const flyer = makeFlyer(size, 'acFlutterBob', dur, delay)

  const light = shadeColor(color, 0.45)
  const dark = shadeColor(color, -0.3)

  const buildWing = (svg: SVGSVGElement): SVGGElement => {
    const fill = addLinearGradient(svg, light, color)
    const g = makeGroup()
    // Forewing: long, swept toward the upper outer corner
    g.appendChild(
      makePath(
        'M50 45 C44 36 34 22 22 16 C11 11 3 17 5 27 C7 38 19 47 33 50 C39 51 46 49 50 45 Z',
        fill,
        '0.92',
      ),
    )
    // Hindwing: rounded, hanging below
    g.appendChild(
      makePath(
        'M50 52 C43 51 32 53 24 59 C15 66 14 77 23 81 C31 84 41 77 46 67 C49 61 50 56 50 52 Z',
        fill,
        '0.85',
      ),
    )
    // Dark band along the forewing's outer edge
    g.appendChild(
      makePath(
        'M22 16 C11 11 3 17 5 27 C5.5 30 7 33 9 35 C6 28 8 21 16 19 C18 18.4 20 17.2 22 16 Z',
        dark,
        '0.55',
      ),
    )
    // Veins radiating from the wing root
    g.appendChild(
      makeLine('M50 46 L20 22 M50 47 L10 30 M49 49 L18 41 M50 53 L24 62 M49 55 L26 74', dark, 0.7, '0.3'),
    )
    // Pale spots
    g.appendChild(makeCircle('19', '25', '2.4', light, '0.85'))
    g.appendChild(makeCircle('27', '33', '1.7', light, '0.7'))
    g.appendChild(makeCircle('29', '68', '2.2', light, '0.7'))
    return g
  }

  const lw = makeWing('L', '0 0 50 100', 50, 'acWingL', dur, delay)
  lw.svg.appendChild(buildWing(lw.svg))

  const rw = makeWing('R', '50 0 50 100', 50, 'acWingR', dur, delay)
  const rg = buildWing(rw.svg)
  rg.setAttribute('transform', 'translate(100 0) scale(-1 1)')
  rw.svg.appendChild(rg)

  const body = makeBodyLayer('0 0 100 100')
  body.svg.append(
    makeEllipse('50', '52', '1.8', '10', dark, '0.95'),
    makeCircle('50', '39', '2.8', dark, '0.95'),
    // Antennae with clubbed tips
    makeLine('M48.5 37 C45 31 41 27 37 25 M51.5 37 C55 31 59 27 63 25', dark, 0.9, '0.8'),
    makeCircle('37', '25', '1', dark, '0.8'),
    makeCircle('63', '25', '1', dark, '0.8'),
  )

  flyer.append(lw.div, rw.div, body.div)
  wrapper.appendChild(flyer)
  return wrapper
}

// ── Dove ────────────────────────────────────────────────────────────
// Top view: teardrop body, swept wings with a scalloped feathered
// trailing edge, fanned notched tail. Deep slow strokes, then a soar.

function createDoveSVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const dur = 2.2 + Math.random() * 0.8
  const delay = -Math.random() * dur
  const flyer = makeFlyer(size, 'acSoarBob', dur, delay)

  const light = shadeColor(color, 0.45)
  const dark = shadeColor(color, -0.25)

  const buildWing = (svg: SVGSVGElement): SVGGElement => {
    const fill = addLinearGradient(svg, light, color)
    const g = makeGroup()
    // Wing sweeping to the upper-left tip, scalloped feather notches on
    // the trailing edge on the way back to the body
    g.appendChild(
      makePath(
        'M50 42 C40 30 26 22 14 24 C5 26 2 33 7 38 C9 40 12 41 15 41 L13 45 C15 48 19 49 23 48 L22 52 C25 55 30 55 34 53 L34 56 C38 58 44 57 50 52 Z',
        fill,
        '0.92',
      ),
    )
    // Feather shafts
    g.appendChild(makeLine('M47 44 L13 31 M46 47 L18 39 M45 50 L26 47', dark, 0.6, '0.3'))
    return g
  }

  const lw = makeWing('L', '0 0 50 100', 45, 'acDoveWingL', dur, delay)
  lw.svg.appendChild(buildWing(lw.svg))

  const rw = makeWing('R', '50 0 50 100', 45, 'acDoveWingR', dur, delay)
  const rg = buildWing(rw.svg)
  rg.setAttribute('transform', 'translate(100 0) scale(-1 1)')
  rw.svg.appendChild(rg)

  const body = makeBodyLayer('0 0 100 100')
  const bodyFill = addLinearGradient(body.svg, light, color)
  body.svg.append(
    // Teardrop body, head to tail
    makePath(
      'M50 18 C55 22 57 32 57 44 C57 58 53 68 50 76 C47 68 43 58 43 44 C43 32 45 22 50 18 Z',
      bodyFill,
      '0.95',
    ),
    makeCircle('50', '16', '4.5', color, '0.95'),
    // Beak
    makePath('M50 9 L48 13.5 L52 13.5 Z', dark, '0.85'),
    // Fanned tail with feather notches
    makePath(
      'M50 72 C46 78 41 85 36 89 L43 86 C44 89 47 92 50 94 C53 92 56 89 57 86 L64 89 C59 85 54 78 50 72 Z',
      color,
      '0.85',
    ),
    makeLine('M50 76 L43 87 M50 76 L57 87', dark, 0.6, '0.35'),
  )

  flyer.append(lw.div, rw.div, body.div)
  wrapper.appendChild(flyer)
  return wrapper
}

// ── Firefly ─────────────────────────────────────────────────────────
// A tiny beetle silhouette with a glowing abdomen lantern, wrapped in a
// soft radial-gradient halo. Irregular blink: long dark spells broken by
// a quick double-flash, randomized per firefly.

function createFireflySVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const svg = makeSVG('0 0 40 40')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  const light = shadeColor(color, 0.6)
  const dark = shadeColor(color, -0.55)

  const blinkDur = 2.5 + Math.random() * 2.5
  const blinkDelay = -Math.random() * blinkDur

  // Soft halo (radial gradient, not flat circles)
  const haloFill = addRadialGradient(svg, [
    ['0%', light, '0.9'],
    ['35%', color, '0.45'],
    ['100%', color, '0'],
  ])
  const halo = makeCircle('20', '26', '14', haloFill, '1')
  halo.style.animation = `acBlink ${blinkDur}s ease-in-out ${blinkDelay}s infinite`
  halo.style.transformOrigin = '20px 26px'

  // Beetle body: wing covers with a center split, small head
  const elytra = makePath(
    'M20 10 C24 11 25.5 15 25 20 C24.6 24 22.6 27 20 28 C17.4 27 15.4 24 15 20 C14.5 15 16 11 20 10 Z',
    dark,
    '0.9',
  )
  const split = makeLine('M20 11 L20 27', shadeColor(color, -0.75), 0.5, '0.6')
  const head = makeCircle('20', '8.5', '2.6', dark, '0.9')

  // Glowing abdomen lantern: stays softly lit between flashes
  const lantern = makeEllipse('20', '26', '3.2', '4.4', light, '0.9')

  svg.append(halo, elytra, split, head, lantern)
  wrapper.appendChild(svg)
  return wrapper
}

// ── Dragonfly ───────────────────────────────────────────────────────
// Long slender membrane wings (translucent with a stroked outline),
// segmented tapering abdomen, big compound eyes. Tiny-amplitude
// ultra-fast flap reads as the shimmer-blur of real dragonfly wings.

function createDragonflySVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const flyer = makeFlyer(size, null, 0, 0)

  const light = shadeColor(color, 0.4)
  const dark = shadeColor(color, -0.35)

  const buildWings = (): SVGGElement => {
    const g = makeGroup()
    // Forewing: narrow elongated membrane angled slightly up
    const fore = makeEllipse('26', '40', '22', '4.5', color, '0.22')
    fore.setAttribute('transform', 'rotate(-14 26 40)')
    fore.setAttribute('stroke', color)
    fore.setAttribute('stroke-width', '0.7')
    fore.setAttribute('stroke-opacity', '0.55')
    // Hindwing: slightly broader, angled down
    const hind = makeEllipse('27', '51', '20', '5.5', color, '0.18')
    hind.setAttribute('transform', 'rotate(9 27 51)')
    hind.setAttribute('stroke', color)
    hind.setAttribute('stroke-width', '0.7')
    hind.setAttribute('stroke-opacity', '0.5')
    // Membrane highlight
    const sheen = makeEllipse('16', '36.5', '8', '1.6', light, '0.4')
    sheen.setAttribute('transform', 'rotate(-14 26 40)')
    g.append(fore, hind, sheen)
    return g
  }

  const lw = makeWing('L', '0 0 50 100', 45, 'acDartWingL', 0.1, -Math.random() * 0.1)
  lw.svg.appendChild(buildWings())

  const rw = makeWing('R', '50 0 50 100', 45, 'acDartWingR', 0.1, -0.05 - Math.random() * 0.1)
  const rg = buildWings()
  rg.setAttribute('transform', 'translate(100 0) scale(-1 1)')
  rw.svg.appendChild(rg)

  const body = makeBodyLayer('0 0 100 100')
  body.svg.append(
    // Tapering abdomen
    makePath(
      'M50 54 C51.6 54 52.2 56 52.1 60 L51.3 84 C51.2 87 50.7 89 50 89 C49.3 89 48.8 87 48.7 84 L47.9 60 C47.8 56 48.4 54 50 54 Z',
      color,
      '0.9',
    ),
    // Segment marks
    makeLine('M48.4 62 L51.6 62 M48.5 68 L51.5 68 M48.6 74 L51.4 74 M48.7 80 L51.3 80', dark, 0.5, '0.5'),
    // Thorax + head
    makeEllipse('50', '47', '4', '6.5', color, '0.95'),
    makeCircle('50', '37', '3.6', color, '0.95'),
    // Compound eyes with glints
    makeCircle('47', '35', '2.6', dark, '0.9'),
    makeCircle('53', '35', '2.6', dark, '0.9'),
    makeCircle('46.3', '34.2', '0.8', light, '0.8'),
    makeCircle('52.3', '34.2', '0.8', light, '0.8'),
  )

  flyer.append(lw.div, rw.div, body.div)
  wrapper.appendChild(flyer)
  return wrapper
}

// ── Balloon ────────────────────────────────────────────────────────
// Teardrop balloon with a string, gently bobbing upward with side sway

function createBalloonSVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const svg = makeSVG('0 0 100 140')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  const light = shadeColor(color, 0.5)
  const dark = shadeColor(color, -0.35)

  // Balloon body: rounded teardrop with highlight
  const balloonFill = addLinearGradient(svg, light, color)
  svg.append(
    // Main balloon shape
    makePath(
      'M50 15 C32 15 18 28 18 48 C18 72 32 95 50 105 C68 95 82 72 82 48 C82 28 68 15 50 15 Z',
      balloonFill,
      '0.95',
    ),
    // Highlight on balloon
    makeEllipse('38', '35', '12', '16', light, '0.6'),
    // String
    makePath('M50 105 L48 125 Q50 132 52 125 L50 105 Z', dark, '0.5'),
  )

  // Gentle floating animation
  const dur = 3.2 + Math.random() * 1.2
  const delay = -Math.random() * dur
  wrapper.style.animation = `acBalloonFloat ${dur}s ease-in-out ${delay}s infinite`

  wrapper.appendChild(svg)
  return wrapper
}

// ── Hummingbird ────────────────────────────────────────────────────
// Tiny bird with a long curved beak, iridescent body, rapid wing flutter

function createHummingbirdSVG(color: string, size: number): HTMLDivElement {
  const wrapper = makeWrapper(size)
  const flyer = makeFlyer(size, null, 0, 0)

  const light = shadeColor(color, 0.6)
  const dark = shadeColor(color, -0.4)

  // Wings: thin curved ovals with a shimmer
  const lw = makeWing('L', '0 0 50 100', 45, 'acHummingbirdWingL', 0.08, -Math.random() * 0.08)
  const rwing = makeEllipse('15', '45', '14', '3.5', color, '0.4')
  rwing.setAttribute('transform', 'rotate(-22 15 45)')
  rwing.setAttribute('stroke', light)
  rwing.setAttribute('stroke-width', '0.5')
  rwing.setAttribute('stroke-opacity', '0.6')
  lw.svg.appendChild(rwing)

  const rw = makeWing('R', '50 0 50 100', 45, 'acHummingbirdWingR', 0.08, -0.04 - Math.random() * 0.08)
  const rwing2 = makeEllipse('85', '45', '14', '3.5', color, '0.4')
  rwing2.setAttribute('transform', 'rotate(22 85 45) scaleX(-1)')
  rwing2.setAttribute('stroke', light)
  rwing2.setAttribute('stroke-width', '0.5')
  rwing2.setAttribute('stroke-opacity', '0.6')
  rw.svg.appendChild(rwing2)

  const body = makeBodyLayer('0 0 100 100')
  body.svg.append(
    // Body: compact teardrop
    makePath(
      'M50 30 C58 32 63 40 63 50 C63 60 58 68 50 70 C42 68 37 60 37 50 C37 40 42 32 50 30 Z',
      addLinearGradient(body.svg, light, color),
      '0.95',
    ),
    // Head
    makeCircle('50', '24', '6', color, '0.95'),
    // Eye
    makeCircle('53', '22', '2', dark, '0.9'),
    makeCircle('54', '21.5', '0.6', light, '0.8'),
    // Long curved beak
    makePath('M56 24 Q68 23 75 28', dark, '0.85', 0.8),
    // Tail feathers
    makePath(
      'M37 55 L28 60 L32 65 L40 62 Z M50 70 L45 82 L50 85 L55 82 Z',
      color,
      '0.8',
    ),
  )

  flyer.append(lw.div, rw.div, body.div)
  wrapper.appendChild(flyer)
  return wrapper
}

// ── Creator registry ────────────────────────────────────────────────

const CREATORS: Record<AmbientCreatureEffectType, (color: string, size: number) => HTMLDivElement> = {
  butterfly: createButterflySVG,
  dove: createDoveSVG,
  firefly: createFireflySVG,
  dragonfly: createDragonflySVG,
  balloon: createBalloonSVG,
  hummingbird: createHummingbirdSVG,
}

// ─── Composable ─────────────────────────────────────────────────────

/**
 * Composable for ambient hovering creature animations on the cover stage.
 *
 * Creates butterflies, doves, fireflies, or dragonflies with lifelike,
 * species-specific motion:
 *  - butterflies flutter in bursts, surge and stall, and wander erratically
 *  - doves fly smooth arcs with deep wing strokes and soaring glides
 *  - dragonflies dart in straight lines, then hover with micro-jitter
 *  - fireflies drift slowly and blink irregularly
 *
 * Wings flap via 3D rotateY CSS keyframes (GPU-accelerated) with glide
 * phases; flight paths use requestAnimationFrame and are biased toward
 * cover decorations. Each creature gets a random depth that scales its
 * size, opacity, and speed for a parallax feel.
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

  /**
   * Container size and decoration rectangles, measured rather than re-read.
   *
   * `tick` used to read offsetWidth/offsetHeight on every frame, and every
   * waypoint a creature reached ran `getDecorationZones` — five more
   * getBoundingClientRect() calls — from inside the same frame that was about
   * to write all six transforms. Both are forced synchronous layouts in the
   * middle of an animation frame. Neither measurement changes unless the stage
   * resizes, so a ResizeObserver owns them instead.
   */
  let containerW = 0
  let containerH = 0
  let decorationZones: DecorationZone[] = []
  let resizeObserver: ResizeObserver | null = null
  /** Timestamp of the last zone probe, while none have been found yet. */
  let lastZoneProbe = 0

  /**
   * Duration of one frame at 60Hz.
   *
   * Every step below is written as "pixels per frame", which silently meant
   * "pixels per frame at whatever rate this display happens to run" — so the
   * same butterfly crossed the cover twice as fast on a 120Hz phone as on a
   * 60Hz laptop, and half as fast again whenever the showcase was busy
   * decoding video. Scaling each step by the frames actually elapsed keeps the
   * tuning in the presets meaningful on every device.
   */
  const FRAME_MS = 1000 / 60
  let lastTimestamp = 0

  function measure() {
    const container = containerRef.value
    if (!container) return
    containerW = container.offsetWidth
    containerH = container.offsetHeight
    decorationZones = getDecorationZones(container)
  }

  /** Inject CSS @keyframes for wing flapping, body bob, and firefly blink */
  function injectStyles() {
    if (styleEl) return
    const container = containerRef.value
    if (!container) return

    styleEl = document.createElement('style')
    styleEl.textContent = `
      /* Butterfly: burst of quick flaps, then a glide with gentle sway */
      @keyframes acWingL {
        0%   { transform: rotateY(70deg); }
        6%   { transform: rotateY(-20deg); }
        13%  { transform: rotateY(70deg); }
        20%  { transform: rotateY(-20deg); }
        27%  { transform: rotateY(70deg); }
        36%  { transform: rotateY(-12deg); }
        50%  { transform: rotateY(22deg); }
        62%  { transform: rotateY(-4deg); }
        76%  { transform: rotateY(28deg); }
        88%  { transform: rotateY(8deg); }
        100% { transform: rotateY(70deg); }
      }
      @keyframes acWingR {
        0%   { transform: rotateY(-70deg); }
        6%   { transform: rotateY(20deg); }
        13%  { transform: rotateY(-70deg); }
        20%  { transform: rotateY(20deg); }
        27%  { transform: rotateY(-70deg); }
        36%  { transform: rotateY(12deg); }
        50%  { transform: rotateY(-22deg); }
        62%  { transform: rotateY(4deg); }
        76%  { transform: rotateY(-28deg); }
        88%  { transform: rotateY(-8deg); }
        100% { transform: rotateY(-70deg); }
      }
      /* Body lifts during the flap burst, settles during the glide */
      @keyframes acFlutterBob {
        0%   { transform: translateY(3%); }
        30%  { transform: translateY(-7%); }
        55%  { transform: translateY(-2%); }
        80%  { transform: translateY(4%); }
        100% { transform: translateY(3%); }
      }
      /* Dove: two deep strokes, then a soaring hold */
      @keyframes acDoveWingL {
        0%   { transform: rotateY(35deg); }
        12%  { transform: rotateY(-70deg); }
        26%  { transform: rotateY(35deg); }
        38%  { transform: rotateY(-70deg); }
        52%  { transform: rotateY(25deg); }
        70%  { transform: rotateY(5deg); }
        85%  { transform: rotateY(18deg); }
        100% { transform: rotateY(35deg); }
      }
      @keyframes acDoveWingR {
        0%   { transform: rotateY(-35deg); }
        12%  { transform: rotateY(70deg); }
        26%  { transform: rotateY(-35deg); }
        38%  { transform: rotateY(70deg); }
        52%  { transform: rotateY(-25deg); }
        70%  { transform: rotateY(-5deg); }
        85%  { transform: rotateY(-18deg); }
        100% { transform: rotateY(-35deg); }
      }
      @keyframes acSoarBob {
        0%   { transform: translateY(2%); }
        26%  { transform: translateY(-5%); }
        52%  { transform: translateY(-1%); }
        100% { transform: translateY(2%); }
      }
      /* Dragonfly: tiny ultra-fast shimmer */
      @keyframes acDartWingL {
        0%, 100% { transform: rotateY(10deg); }
        50%      { transform: rotateY(-30deg); }
      }
      @keyframes acDartWingR {
        0%, 100% { transform: rotateY(-10deg); }
        50%      { transform: rotateY(30deg); }
      }
      /* Firefly: long dark spell, then a quick double-flash */
      @keyframes acBlink {
        0%, 50%   { opacity: 0.04; transform: scale(0.7); }
        58%       { opacity: 0.85; transform: scale(1.35); }
        66%       { opacity: 0.5;  transform: scale(1.1); }
        72%       { opacity: 0.95; transform: scale(1.5); }
        82%, 100% { opacity: 0.04; transform: scale(0.7); }
      }
      /* Balloon: gentle upward float with sinusoidal sway */
      @keyframes acBalloonFloat {
        0%   { transform: translateY(0px) translateX(0px); }
        25%  { transform: translateY(-60px) translateX(25px); }
        50%  { transform: translateY(-120px) translateX(0px); }
        75%  { transform: translateY(-180px) translateX(-25px); }
        100% { transform: translateY(-240px) translateX(0px); }
      }
      /* Hummingbird: rapid wing flutter (ultra-fast shimmer) */
      @keyframes acHummingbirdWingL {
        0%, 100% { transform: rotateY(8deg); }
        25%      { transform: rotateY(-35deg); }
        50%      { transform: rotateY(8deg); }
        75%      { transform: rotateY(-35deg); }
      }
      @keyframes acHummingbirdWingR {
        0%, 100% { transform: rotateY(-8deg); }
        25%      { transform: rotateY(35deg); }
        50%      { transform: rotateY(-8deg); }
        75%      { transform: rotateY(35deg); }
      }
    `
    container.appendChild(styleEl)
  }

  /** Pick a target position — near decorations when available, else edge-biased */
  function pickTarget(w: number, h: number, homeZone?: number): { x: number; y: number } {
    const container = containerRef.value
    if (container) {
      const zones = decorationZones
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

    // First spawn can land before the stage has been measured (or after a
    // resize the observer has not delivered yet), so fall back to a read.
    if (!containerW || !containerH) measure()
    const cw = containerW
    const ch = containerH
    const entry = pickCreatureEntry()
    const defaults = CREATURE_DEFAULTS[entry.type]

    const minSize = entry.min_size ?? defaults.minSize
    const maxSize = entry.max_size ?? defaults.maxSize
    const size = minSize + Math.random() * (maxSize - minSize)

    // Assign a home decoration zone and start near it
    const zones = decorationZones
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

    // Parallax depth: far creatures are smaller, fainter, and slower
    const depth = 0.65 + Math.random() * 0.5

    // Fade in gently to a depth-scaled opacity.
    //
    // Driven by WAAPI rather than by a CSS transition flipped inside a rAF:
    // that callback runs at the top of the rendering update, BEFORE style is
    // computed for the freshly appended element, so the 0 and the target
    // collapsed into a single recalc and the transition had no start value to
    // run from — every creature popped in at full opacity instead of fading.
    // An animation cannot be lost that way. ease-out, not ease-in: the arrival
    // is the moment being watched, so the movement belongs at the front of it.
    const restOpacity = 0.55 + depth * 0.35
    element.style.opacity = String(restOpacity)
    container.appendChild(element)
    element.animate([{ opacity: 0 }, { opacity: restOpacity }], {
      duration: 1200,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      fill: 'backwards',
    })

    creatures.push({
      element,
      type: entry.type,
      x: startX,
      y: startY,
      targetX: target.x,
      targetY: target.y,
      speed: preset.baseSpeed * defaults.speedMul * (0.6 + Math.random() * 0.8),
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleAmp: 0.4 + Math.random() * 0.4,
      angle: Math.random() * 360,
      homeZone,
      depth,
      speedPhase: Math.random() * Math.PI * 2,
      heading: Math.random() * Math.PI * 2,
      mode: 'seek',
      modeUntil: 0,
    })
  }

  /**
   * A per-frame smoothing rate, corrected for how many frames actually passed.
   *
   * The step below is exponential decay toward the target, so the rate cannot
   * simply be multiplied by dt — at dt = 3 that overshoots and the heading
   * wobbles. Compounding the per-frame retention instead is exact at any frame
   * rate.
   */
  function easeRate(perFrame: number, dt: number): number {
    return 1 - Math.pow(1 - perFrame, dt)
  }

  /** Smoothly rotate heading angle (degrees) toward flight direction */
  function easeAngle(c: CreatureState, targetAngle: number, rate: number) {
    let diff = targetAngle - c.angle
    while (diff > 180) diff -= 360
    while (diff < -180) diff += 360
    c.angle += diff * rate
  }

  function retarget(c: CreatureState, cw: number, ch: number) {
    const t = pickTarget(cw, ch, c.homeZone)
    c.targetX = t.x
    c.targetY = t.y
  }

  /** Main animation loop — species-specific flight behaviors */
  function tick(timestamp: number) {
    const container = containerRef.value
    if (!container) {
      rafId = requestAnimationFrame(tick)
      return
    }

    // Frames of 60Hz elapsed since the previous tick. Clamped at 3: a tab
    // returning from the background hands us a multi-second gap, and scaling a
    // whole flight step by that would teleport the flock across the cover.
    const dt = lastTimestamp ? clamp((timestamp - lastTimestamp) / FRAME_MS, 0, 3) : 1
    lastTimestamp = timestamp

    const cw = containerW
    const ch = containerH

    // The cover decorations are eager <img>s, so on a cold load they can still
    // be laying out when the field is first measured. Re-probe about once a
    // second until they turn up, then stop — after that the observer owns it.
    if (!decorationZones.length && timestamp - lastZoneProbe > 1000) {
      lastZoneProbe = timestamp
      decorationZones = getDecorationZones(container)
    }

    for (const c of creatures) {
      const dx = c.targetX - c.x
      const dy = c.targetY - c.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      switch (c.type) {
        case 'butterfly': {
          // Flutter: speed surges and near-stalls; heavy wobble; occasional
          // erratic mid-flight retarget (real butterflies rarely commit)
          if (dist < 15 || Math.random() < 0.0015 * dt) {
            retarget(c, cw, ch)
            break
          }
          const surge = 0.55 + 0.55 * Math.sin(timestamp * 0.0035 + c.speedPhase)
          const sp = c.speed * surge * c.depth
          const nx = dx / dist
          const ny = dy / dist
          const wobble =
            Math.sin(timestamp * preset.wobbleFreq * 2.2 + c.wobbleOffset) * c.wobbleAmp * 1.6
          const px = -ny * wobble
          const py = nx * wobble
          c.x += (nx * sp + px) * dt
          c.y += (ny * sp + py) * dt
          easeAngle(
            c,
            Math.atan2(ny * sp + py, nx * sp + px) * (180 / Math.PI) + 90,
            easeRate(0.07, dt),
          )
          break
        }

        case 'dove': {
          // Glide: limited turn rate makes the dove carve smooth arcs
          // instead of beelining at the target
          if (dist < 30) {
            retarget(c, cw, ch)
            break
          }
          const desired = Math.atan2(dy, dx)
          let turn = desired - c.heading
          while (turn > Math.PI) turn -= Math.PI * 2
          while (turn < -Math.PI) turn += Math.PI * 2
          c.heading += clamp(turn, -0.025 * dt, 0.025 * dt)
          const sp = c.speed * c.depth
          c.x += Math.cos(c.heading) * sp * dt
          c.y += Math.sin(c.heading) * sp * dt
          c.angle = c.heading * (180 / Math.PI) + 90
          break
        }

        case 'dragonfly': {
          // Dart-and-hover: fast straight dashes, abrupt heading snaps,
          // then a motionless hover with micro-jitter
          if (c.mode === 'hover') {
            c.x += (Math.random() - 0.5) * 1.2 * dt
            c.y += (Math.random() - 0.5) * 1.2 * dt
            if (timestamp > c.modeUntil) {
              c.mode = 'seek'
              retarget(c, cw, ch)
              c.angle =
                Math.atan2(c.targetY - c.y, c.targetX - c.x) * (180 / Math.PI) + 90
            }
          } else if (dist < 12) {
            c.mode = 'hover'
            c.modeUntil = timestamp + 600 + Math.random() * 1800
          } else {
            const sp = c.speed * 2.8 * c.depth
            c.x += (dx / dist) * sp * dt
            c.y += (dy / dist) * sp * dt
          }
          break
        }

        case 'firefly': {
          // Drift: slow waypoint seek layered with smooth sinusoidal
          // wander; no heading rotation (it's a glowing point)
          if (dist < 20) {
            retarget(c, cw, ch)
            break
          }
          const sp = c.speed * 0.5 * c.depth
          c.x += ((dx / dist) * sp + Math.sin(timestamp * 0.0007 + c.wobbleOffset) * 0.3) * dt
          c.y += ((dy / dist) * sp + Math.sin(timestamp * 0.0009 + c.wobbleOffset * 2) * 0.25) * dt
          c.angle = 0
          break
        }

        case 'balloon': {
          // Float: gentle upward drift with occasional side-to-side sway
          // Balloons rarely descend and have no target seeking
          const sway = Math.sin(timestamp * 0.0008 + c.wobbleOffset) * 20
          const upDrift = c.speed * 0.5 * c.depth
          c.x += sway * 0.02 * dt
          c.y -= upDrift * dt
          c.angle = 0

          // Reset to top when balloon floats off screen
          if (c.y < -60) {
            c.y = ch + 30
            c.x = Math.random() * cw
          }
          break
        }

        case 'hummingbird': {
          // Dart: erratic, high-energy movement with rapid direction changes
          // Similar to butterfly but faster and more direct target seeking
          if (dist < 10 || Math.random() < 0.004 * dt) {
            retarget(c, cw, ch)
            break
          }
          const surge = 0.7 + 0.3 * Math.sin(timestamp * 0.005 + c.speedPhase)
          const sp = c.speed * surge * c.depth
          const nx = dx / dist
          const ny = dy / dist
          const wobble =
            Math.sin(timestamp * preset.wobbleFreq * 3 + c.wobbleOffset) * c.wobbleAmp * 0.8
          const px = -ny * wobble
          const py = nx * wobble
          c.x += (nx * sp + px) * dt
          c.y += (ny * sp + py) * dt
          easeAngle(
            c,
            Math.atan2(ny * sp + py, nx * sp + px) * (180 / Math.PI) + 90,
            easeRate(0.1, dt),
          )
          break
        }
      }

      // Keep within container bounds
      c.x = Math.max(-10, Math.min(cw + 10, c.x))
      c.y = Math.max(-10, Math.min(ch + 10, c.y))

      c.element.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) rotate(${c.angle}deg) scale(${c.depth})`
    }

    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (isActive.value) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    isActive.value = true
    injectStyles()
    measure()

    if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
      resizeObserver = new ResizeObserver(() => measure())
      resizeObserver.observe(containerRef.value)
    }

    for (let i = 0; i < count; i++) {
      const timer = setTimeout(() => spawnCreature(), i * 500)
      spawnTimers.push(timer)
    }

    lastTimestamp = 0
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    spawnTimers.forEach(clearTimeout)
    spawnTimers.length = 0
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    resizeObserver?.disconnect()
    resizeObserver = null
    // Cleared so a restart measures its first step against a fresh timestamp
    // rather than against however long the field was stopped for.
    lastTimestamp = 0
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
