<template>
  <canvas ref="canvasEl" class="v2-tunnel" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
/**
 * Persistent WebGL background: the camera flies through a tunnel of falling
 * particles (depth-layered, shape/color set by the active category variant
 * via `shapes`/`colors` — see v2ParticleShapes.ts) as the page scrolls, with
 * an ornament (interlocked rings, for the wedding motif) drifting in the
 * middle distance. Only mounted for the 'rich' motion tier (see
 * useV2MotionTier) — `three` is dynamically imported so its cost is paid
 * only by the sessions that actually render it.
 *
 * Falling is driven by an internal clock (gravity-like, independent of
 * scroll); flying *through* the tunnel is driven directly by scroll
 * progress — the same split used by the reference "Storybook Romance"
 * prototype this was built from.
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
}

const props = withDefaults(defineProps<Props>(), {
  shapes: () => ['petals'],
  ringColor: '#C9A66B',
  showRings: true,
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
defineExpose({ triggerOpenBurst })

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
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 0.85,
    roughness: 0.28,
  })
  const ringGeo = new THREE.TorusGeometry(3.2, 0.22, 20, isMobile ? 60 : 96)
  const ringA = new THREE.Mesh(ringGeo, ringMat)
  const ringB = new THREE.Mesh(ringGeo, ringMat)
  ringA.position.x = -1.9
  ringA.rotation.y = 0.5
  ringB.position.x = 1.9
  ringB.rotation.y = -0.5
  ringB.rotation.x = 0.4
  const group = new THREE.Group()
  group.add(ringA, ringB)
  group.position.set(0, 1.5, -18)
  target.add(group)
  return group
}

function loop() {
  rafId = requestAnimationFrame(loop)
  if (!running || !renderer || !scene || !camera) return

  clock += 0.016
  scrollSmooth += (scrollTarget - scrollSmooth) * 0.07
  flyBoost += (0 - flyBoost) * 0.04

  const z = 30 * flyBoost + scrollSmooth * (TUNNEL_END + 40)
  camera.position.z = z
  camera.position.x = Math.sin(scrollSmooth * Math.PI * 2) * 1.6
  camera.position.y = Math.cos(scrollSmooth * Math.PI * 1.5) * 1.1
  camera.lookAt(0, 0, z - 12)

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
    ;(rings.children[0] as ThreeNS.Mesh).rotation.x += 0.003
    ;(rings.children[1] as ThreeNS.Mesh).rotation.x -= 0.003
    rings.position.y = 1.5 + Math.sin(clock * 0.6) * 0.4
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
