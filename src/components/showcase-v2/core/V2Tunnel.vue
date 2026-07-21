<template>
  <canvas ref="canvasEl" class="v2-tunnel" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
/**
 * Persistent WebGL background: the camera flies through a tunnel of falling
 * particles (depth-layered, shape/color set by the active category variant
 * via `shapes`/`colors` — see v2ParticleShapes.ts) as the page scrolls, with
 * an interlocked-rings ornament (wedding motif) drifting in the middle
 * distance. Only mounted for the 'rich' motion tier (see useV2MotionTier) —
 * `three` is dynamically imported so its cost is paid only by the sessions
 * that actually render it.
 *
 * Falling is driven by an internal clock (gravity-like, independent of
 * scroll); flying *through* the tunnel is driven directly by scroll
 * progress — the same split used by the reference "Storybook Romance"
 * prototype this was built from.
 *
 * The ring is the *same object* throughout the showcase, not a hero-only
 * decoration: `setRingLock()` (exposed, driven by ShowcaseV2Experience.vue)
 * pulls it from its drifting background position to a fixed point in front
 * of the camera as the user scrolls into the story section, where it holds
 * still (but keeps turning/sparkling) behind the pinned couple/thread
 * choreography — there's no separate 2D ring icon there. Once fully locked,
 * the tunnel's own scroll-driven fly-through (camera z/x/y + lookAt) is
 * paused entirely — see `frozen` in loop() — rather than relying on the
 * ring's per-frame camera-relative tracking alone to hold it still; with
 * the camera still swaying, the ring visibly drifted over the length of
 * the pin even though it was mathematically screen-fixed. `setRingFade()`
 * dissolves the ring and resumes the fly-through once that section's pin
 * releases.
 */
import { onMounted, onUnmounted, ref } from 'vue'
import type * as ThreeNS from 'three'
import { V2_PARTICLE_SHAPES, type V2ParticleShape } from '../../../composables/showcase-v2/v2ParticleShapes'

interface Props {
  /** Petal colors, cycled across the three depth layers. */
  colors: string[]
  /** Particle silhouettes, one per depth layer (cycled if fewer than 3). */
  shapes?: V2ParticleShape[]
  /** Ring/ornament color (gold thread tone). */
  ringColor?: string
  /** Whether to render the interlocked-rings ornament (wedding motif). */
  showRings?: boolean
  /** Page background color — used to fog out distant particles/ornament so they recede into the page instead of reading as opaque foreground shapes. */
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  shapes: () => ['petals'],
  ringColor: '#C9A66B',
  showRings: true,
  backgroundColor: '#FAF6F0',
})

const emit = defineEmits<{
  /** WebGL unavailable or init failed — parent should fall back to V2PetalField. */
  unavailable: []
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)

let renderer: ThreeNS.WebGLRenderer | null = null
let scene: ThreeNS.Scene | null = null
let camera: ThreeNS.PerspectiveCamera | null = null
let rings: ThreeNS.Group | null = null
let ringBandA: ThreeNS.Group | null = null
let ringBandB: ThreeNS.Group | null = null
let ringMat: ThreeNS.MeshPhysicalMaterial | null = null
let ringBevelMat: ThreeNS.MeshPhysicalMaterial | null = null
let ringGemMat: ThreeNS.MeshPhysicalMaterial | null = null
let ringGem: ThreeNS.Mesh | null = null
// Scratch vectors reused every frame (avoids per-frame allocation) — see
// the ring-lock block in loop().
let ringNaturalPos: ThreeNS.Vector3 | null = null
let ringLockAnchor: ThreeNS.Vector3 | null = null
const RING_BASE_OPACITY = 0.6
const RING_LOCKED_OPACITY = 0.95
const RING_BASE_Z = -42
// World units in front of the camera the ring sits at once locked — chosen
// so it reads at roughly the same on-screen size the old 2D ring icon had
// on a landscape-ish aspect. See the aspect-based scale-down in loop() for
// how it stays that size on narrow portrait viewports too.
const RING_LOCK_DISTANCE = 20
const RING_LOCK_REFERENCE_ASPECT = 16 / 9
let ringLockLevel = 0
let ringFadeLevel = 0
let rafId = 0
let running = true
let disposed = false

interface PetalField {
  points: ThreeNS.Points
  seeds: Float32Array
}
let fields: PetalField[] = []

const TUNNEL_END = -260
let scrollTarget = 0
let scrollSmooth = 0
let flyBoost = 0
let clock = 0

const docProgress = () => {
  const h = document.documentElement.scrollHeight - window.innerHeight
  return h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0
}
const onScroll = () => {
  scrollTarget = docProgress()
}
const onVisibility = () => {
  running = document.visibilityState === 'visible'
}
const onResize = () => {
  if (!renderer || !camera) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

/** One-off camera lurch, played when the cover gate opens. */
const triggerOpenBurst = () => {
  flyBoost = 1
}

/**
 * 0 = the ring drifts as a subtle background object at its original tunnel
 * placement. 1 = it's locked to a fixed point directly in front of the
 * camera, recomputed fresh every frame from the camera's *current*
 * transform (see loop()) — so it stays visually anchored to the same
 * point on screen (screen-center, where the story section's gold thread
 * ties off) even while the camera keeps flying through the tunnel
 * underneath that section's pin. There's no separate 2D ring icon there
 * anymore — this lock *is* "the ring becoming the story section's ring."
 * Driven by a ScrollTrigger keyed to that pin's own start (see
 * ShowcaseV2Experience.vue), so the lock always completes exactly as the
 * pin begins regardless of page length.
 */
const setRingLock = (lock: number) => {
  ringLockLevel = Math.min(1, Math.max(0, lock))
}

/**
 * 0 = fully visible at whatever lock level is current. 1 = fully
 * dissolved — used once the story pin has released and the thread's tied
 * off, so the ring doesn't just sit frozen at screen-center for the rest
 * of the page.
 */
const setRingFade = (fade: number) => {
  ringFadeLevel = Math.min(1, Math.max(0, fade))
}

defineExpose({ triggerOpenBurst, setRingLock, setRingFade })

// Source resolution for the particle sprite texture. The camera flies
// through these particles, so any given sprite can end up magnified to a
// large chunk of the screen for a few frames — a low-res source (the old
// 64px) shows that moment as a blurry, blocky silhouette. 256px keeps edges
// clean under that magnification without materially raising GPU memory
// (only 3 of these textures exist, one per depth layer).
const PARTICLE_TEXTURE_SIZE = 256

function buildPetalTexture(
  THREE: typeof ThreeNS,
  hex: string,
  shapeName: V2ParticleShape,
): ThreeNS.CanvasTexture {
  const shape = V2_PARTICLE_SHAPES[shapeName] ?? V2_PARTICLE_SHAPES.petals
  const [minX, minY, vbW, vbH] = shape.viewBox.split(' ').map(Number)
  const extent = Math.max(vbW, vbH)
  const tex = PARTICLE_TEXTURE_SIZE

  const c = document.createElement('canvas')
  c.width = c.height = tex
  const ctx = c.getContext('2d')!
  ctx.translate(tex / 2, tex / 2)
  ctx.rotate(0.6)
  ctx.scale((tex * 0.85) / extent, (tex * 0.85) / extent)
  ctx.translate(-(minX + vbW / 2), -(minY + vbH / 2))

  const path = new Path2D(shape.path)

  // A corner-to-corner sheen (rather than a fixed hotspot) reads as a
  // natural highlight on any silhouette, including elongated/off-center
  // ones like the leaf and maple shapes where a centered radial highlight
  // used to land mostly outside the visible fill area.
  const grad = ctx.createLinearGradient(minX, minY, minX + vbW, minY + vbH)
  grad.addColorStop(0, `color-mix(in srgb, ${hex} 55%, white)`)
  grad.addColorStop(0.55, hex)
  grad.addColorStop(1, `color-mix(in srgb, ${hex} 70%, black)`)
  ctx.fillStyle = grad
  ctx.fill(path)

  // A thin, slightly darker edge stroke keeps the silhouette reading as a
  // crisp cut shape instead of a soft blob once stretched across a large
  // point sprite — and doubles as the leaf shape's vein detail.
  ctx.lineWidth = extent * 0.025
  ctx.lineJoin = 'round'
  ctx.strokeStyle = `color-mix(in srgb, ${hex} 45%, black)`
  ctx.stroke(path)

  return new THREE.CanvasTexture(c)
}

/**
 * Caps how large a point sprite can render on screen. Without this, a
 * particle the camera flies very close to balloons far past its source
 * texture's resolution for a few frames, reading as pixelated/blurry —
 * this keeps that moment from ever looking low-res.
 */
function clampPointSize(mat: ThreeNS.PointsMaterial, maxPx: number) {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      'if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );',
      `if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
			gl_PointSize = min( gl_PointSize, ${maxPx.toFixed(1)} );`,
    )
  }
}

function buildField(
  THREE: typeof ThreeNS,
  target: ThreeNS.Scene,
  colorHex: string,
  shapeName: V2ParticleShape,
  zFrom: number,
  zTo: number,
  count: number,
  size: number,
  opacity: number,
): PetalField {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 46
    pos[i * 3 + 1] = (Math.random() - 0.5) * 30
    pos[i * 3 + 2] = zFrom + Math.random() * (zTo - zFrom)
    seeds[i] = Math.random() * Math.PI * 2
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({
    size,
    map: buildPetalTexture(THREE, colorHex, shapeName),
    transparent: true,
    depthWrite: false,
    opacity,
  })
  clampPointSize(mat, 220)
  const points = new THREE.Points(geo, mat)
  target.add(points)
  return { points, seeds }
}

function buildRings(THREE: typeof ThreeNS, target: ThreeNS.Scene, color: string, isMobile: boolean) {
  ringNaturalPos = new THREE.Vector3()
  ringLockAnchor = new THREE.Vector3()

  // Softer/lighter than a literal gold band on purpose: this sits directly
  // behind the hero title, and a high-metalness/low-roughness combo rendered
  // near-black in its shadowed arcs — a heavy dark shape competing with the
  // text right on top of it. Clearcoat gives a premium lacquered-gold look
  // without that harsh contrast; partial transparency keeps it reading as a
  // gentle glint, not a solid object.
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: 0.4,
    roughness: 0.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    transparent: true,
    opacity: RING_BASE_OPACITY,
  })
  ringMat = mat

  // A thinner, lighter-toned bevel nested inside each band gives it a
  // faceted double-edge instead of a plain smooth donut.
  const bevelMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45),
    metalness: 0.3,
    roughness: 0.3,
    clearcoat: 0.8,
    transparent: true,
    opacity: RING_BASE_OPACITY,
  })
  ringBevelMat = bevelMat

  const segments = isMobile ? 60 : 96
  // Low radial-segment count on the main band gives its cross-section a
  // cut, faceted look (like a jewelry catalog shot) rather than a smooth
  // round tube; the bevel stays smooth (12) so it reads as a polished edge
  // highlight against the faceted body.
  const bandGeo = new THREE.TorusGeometry(2.2, 0.14, 7, segments)
  const bevelGeo = new THREE.TorusGeometry(2.2, 0.045, 12, segments)

  const group = new THREE.Group()
  // Band + its nested bevel live in a shared sub-group so the idle rotation
  // in loop() turns them together — rotating the two meshes independently
  // would let the bevel slowly drift out of alignment with its band.
  const makeBand = (x: number, rotY: number, rotX = 0) => {
    const band = new THREE.Mesh(bandGeo, mat)
    const bevel = new THREE.Mesh(bevelGeo, bevelMat)
    const sub = new THREE.Group()
    sub.add(band, bevel)
    sub.position.x = x
    sub.rotation.y = rotY
    if (rotX) sub.rotation.x = rotX
    group.add(sub)
    return sub
  }
  ringBandA = makeBand(-1.3, 0.5)
  ringBandB = makeBand(1.3, -0.5, 0.4)

  // Small faceted "diamond" catching the light at the top of the right-hand
  // band — the one non-negotiable detail that reads as "wedding ring" at a
  // glance rather than "gold donut."
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fdf8ee'),
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1,
    transparent: true,
    opacity: RING_BASE_OPACITY,
  })
  ringGemMat = gemMat
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), gemMat)
  gem.position.set(1.55, 2.05, 0.3)
  gem.rotation.set(0.4, 0.6, 0)
  ringGem = gem
  group.add(gem)

  // Deep in the tunnel by default so it starts small/subtle behind the hero
  // text instead of dominating the first frame; setRingLock() then pulls it
  // to a fixed point in front of the camera as the user scrolls into the
  // story section (see loop()), and setRingFade() dissolves it once that
  // section's pin releases.
  group.position.set(0, 1.2, RING_BASE_Z)
  target.add(group)
  return group
}

function loop() {
  rafId = requestAnimationFrame(loop)
  if (!running || !renderer || !scene || !camera) return

  clock += 0.016

  // Freeze the tunnel's own scroll-driven fly-through once the ring is
  // fully locked into the pinned story stage. The ring's locked position is
  // recomputed every frame *relative to the camera* (see below), which in
  // theory keeps it screen-fixed even while the camera keeps moving — but
  // the camera's x/y sway (next two lines) means it's never perfectly
  // static, so over the length of the pin the ring visibly drifted instead
  // of holding still. Actually stopping the camera here guarantees a
  // byte-for-byte identical position every frame — a real freeze, not an
  // approximate one. Resumes the instant the ring starts dissolving (the
  // pin has released), continuing from wherever it left off (scrollTarget
  // keeps updating from scroll events the whole time) so there's no jump.
  const frozen = ringLockLevel >= 1 && ringFadeLevel <= 0
  if (!frozen) {
    scrollSmooth += (scrollTarget - scrollSmooth) * 0.07
    flyBoost += (0 - flyBoost) * 0.04

    const z = 30 * flyBoost + scrollSmooth * (TUNNEL_END + 40)
    camera.position.z = z
    camera.position.x = Math.sin(scrollSmooth * Math.PI * 2) * 1.6
    camera.position.y = Math.cos(scrollSmooth * Math.PI * 1.5) * 1.1
    camera.lookAt(0, 0, z - 12)
  }

  for (let f = 0; f < fields.length; f++) {
    const { points, seeds } = fields[f]
    const attr = points.geometry.attributes.position as ThreeNS.BufferAttribute
    const arr = attr.array as Float32Array
    for (let i = 0; i < seeds.length; i++) {
      arr[i * 3 + 1] -= 0.012 + (seeds[i] % 1) * 0.008
      arr[i * 3] += Math.sin(clock + seeds[i]) * 0.006
      if (arr[i * 3 + 1] < -16) arr[i * 3 + 1] = 16
    }
    attr.needsUpdate = true
    points.rotation.z = Math.sin(clock * 0.1 + f) * 0.03
  }

  if (rings) {
    rings.rotation.y += 0.004
    if (ringBandA) ringBandA.rotation.x += 0.003
    if (ringBandB) ringBandB.rotation.x -= 0.003
    // Gentle sparkle pulse on the gem accent — keeps the ring feeling alive
    // even once its position is fully locked in place.
    if (ringGem) ringGem.scale.setScalar(1 + Math.sin(clock * 2.4) * 0.18)

    // Blend between the ring's natural drifting position and a point
    // locked directly in front of the camera, recomputed fresh every frame
    // from the camera's *current* world transform — so at lock level 1 the
    // ring rides along with the camera and stays fixed on screen no matter
    // how far the camera travels underneath the pinned story section.
    if (ringNaturalPos && ringLockAnchor) {
      camera.updateMatrixWorld()
      ringNaturalPos.set(0, 1.5 + Math.sin(clock * 0.6) * 0.4, RING_BASE_Z)
      ringLockAnchor.set(0, 0, -RING_LOCK_DISTANCE)
      camera.localToWorld(ringLockAnchor)
      rings.position.lerpVectors(ringNaturalPos, ringLockAnchor, ringLockLevel)
    }

    const lockedOpacity =
      RING_BASE_OPACITY + (RING_LOCKED_OPACITY - RING_BASE_OPACITY) * ringLockLevel
    const opacity = lockedOpacity * (1 - ringFadeLevel)
    if (ringMat) ringMat.opacity = opacity
    if (ringBevelMat) ringBevelMat.opacity = opacity
    if (ringGemMat) ringGemMat.opacity = opacity

    // The ring's world-space size was tuned against a landscape-ish aspect;
    // at a fixed distance from the camera, that same size eats a much
    // bigger fraction of a narrow portrait phone's width (width = height ×
    // aspect, so a narrower aspect means less visible width at the same
    // distance). Scaling the *locked* size down proportionally to aspect
    // keeps it reading as the same modest on-screen size the old CSS ring
    // icon had (that one was sized in vw, which had the same effect for
    // free) — the natural/unlocked background size is untouched.
    const lockedScale = Math.min(1, Math.max(0.22, camera.aspect / RING_LOCK_REFERENCE_ASPECT))
    const scale = (1 + (lockedScale - 1) * ringLockLevel) * (1 - ringFadeLevel * 0.35)
    rings.scale.setScalar(scale)
  }

  renderer.render(scene, camera)
}

function disposeField(field: PetalField) {
  field.points.geometry.dispose()
  const mat = field.points.material as ThreeNS.PointsMaterial
  mat.map?.dispose()
  mat.dispose()
}

onMounted(async () => {
  const canvas = canvasEl.value
  if (!canvas) {
    emit('unavailable')
    return
  }

  try {
    const THREE = await import('three')
    if (disposed) return // unmounted while the chunk was loading

    const isMobile = window.innerWidth < 600
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    scene = new THREE.Scene()
    // Fades distant particles/the ring ornament toward the page's own
    // background color (rather than cutting off crisp) as they recede, so
    // the scene reads as soft atmosphere behind the text instead of a flat
    // field of equally-opaque shapes.
    scene.fog = new THREE.Fog(new THREE.Color(props.backgroundColor), 50, 260)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300)
    camera.position.set(0, 0, 30)

    scene.add(new THREE.AmbientLight(0xfff5ea, 0.9))
    const key = new THREE.DirectionalLight(0xffe9c9, 1.1)
    key.position.set(3, 5, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xe8b4b8, 0.5)
    fill.position.set(-4, -2, 3)
    scene.add(fill)

    // Kept deliberately sparse — this reads as a few graceful falling
    // accents, not a dense starfield of specks. Distant layers also fade in
    // opacity (real depth-of-field cue) so they recede into soft atmosphere
    // rather than competing with the near layer for attention.
    const count = isMobile ? 70 : 140
    const palette = props.colors
    const shapeFor = (i: number) => props.shapes[i % props.shapes.length]
    fields = [
      buildField(
        THREE,
        scene,
        palette[0],
        shapeFor(0),
        35,
        -95,
        Math.floor(count * 0.42),
        isMobile ? 1.6 : 2.0,
        0.85,
      ),
      buildField(
        THREE,
        scene,
        palette[2 % palette.length],
        shapeFor(1),
        -80,
        -150,
        Math.floor(count * 0.3),
        isMobile ? 1.5 : 1.9,
        0.55,
      ),
      buildField(
        THREE,
        scene,
        palette[3 % palette.length],
        shapeFor(2),
        -135,
        -215,
        Math.floor(count * 0.28),
        isMobile ? 1.4 : 1.8,
        0.35,
      ),
    ]

    if (props.showRings) {
      rings = buildRings(THREE, scene, props.ringColor, isMobile)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    onScroll()
    loop()
  } catch {
    // WebGL unsupported/blocked, or the dynamic import failed — degrade to
    // the CSS petal field rather than leaving a blank/broken canvas
    emit('unavailable')
  }
})

onUnmounted(() => {
  disposed = true
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('visibilitychange', onVisibility)
  fields.forEach(disposeField)
  fields = []
  if (rings) {
    rings.traverse((obj) => {
      const mesh = obj as ThreeNS.Mesh
      if (mesh.isMesh) {
        mesh.geometry.dispose()
        ;(mesh.material as ThreeNS.Material).dispose()
      }
    })
    rings = null
    ringBandA = null
    ringBandB = null
    ringMat = null
    ringBevelMat = null
    ringGemMat = null
    ringGem = null
    ringNaturalPos = null
    ringLockAnchor = null
  }
  renderer?.dispose()
  renderer?.forceContextLoss()
  renderer = null
  scene = null
  camera = null
})
</script>

<style scoped>
.v2-tunnel {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
