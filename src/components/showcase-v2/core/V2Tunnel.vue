<template>
  <canvas ref="canvasEl" class="v2-tunnel" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
/**
 * Persistent WebGL background: the camera flies through a tunnel of falling
 * petal particles (depth-layered) as the page scrolls, with an ornament
 * (interlocked rings, for the wedding motif) drifting in the middle
 * distance. Only mounted for the 'rich' motion tier (see useV2MotionTier) —
 * `three` is dynamically imported so its cost is paid only by the
 * sessions that actually render it.
 *
 * Falling is driven by an internal clock (gravity-like, independent of
 * scroll); flying *through* the tunnel is driven directly by scroll
 * progress — the same split used by the reference "Storybook Romance"
 * prototype this was built from.
 */
import { onMounted, onUnmounted, ref } from 'vue'
import type * as ThreeNS from 'three'

interface Props {
  /** Petal colors, cycled across the three depth layers. */
  colors: string[]
  /** Ring/ornament color (gold thread tone). */
  ringColor?: string
  /** Whether to render the interlocked-rings ornament (wedding motif). */
  showRings?: boolean
}

const props = withDefaults(defineProps<Props>(), {
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

function buildPetalTexture(THREE: typeof ThreeNS, hex: string): ThreeNS.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  ctx.translate(32, 32)
  ctx.rotate(0.6)
  const grad = ctx.createRadialGradient(0, -4, 2, 0, 0, 26)
  grad.addColorStop(0, 'rgba(255,255,255,.95)')
  grad.addColorStop(0.35, hex)
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.ellipse(0, 0, 14, 24, 0, 0, Math.PI * 2)
  ctx.fill()
  return new THREE.CanvasTexture(c)
}

function buildField(
  THREE: typeof ThreeNS,
  target: ThreeNS.Scene,
  colorHex: string,
  zFrom: number,
  zTo: number,
  count: number,
  size: number,
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
    map: buildPetalTexture(THREE, colorHex),
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
  })
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

    const count = isMobile ? 240 : 500
    const palette = props.colors
    fields = [
      buildField(THREE, scene, palette[0], 35, -95, Math.floor(count * 0.42), isMobile ? 1.6 : 2.0),
      buildField(
        THREE,
        scene,
        palette[2 % palette.length],
        -80,
        -150,
        Math.floor(count * 0.3),
        isMobile ? 1.5 : 1.9,
      ),
      buildField(
        THREE,
        scene,
        palette[3 % palette.length],
        -135,
        -215,
        Math.floor(count * 0.28),
        isMobile ? 1.4 : 1.8,
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
