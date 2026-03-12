import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type { FallingEffectType } from '@/services/api/types/template.types'

/**
 * Built-in particle shape definitions.
 * Each entry provides an SVG path + viewBox for rendering as inline SVG.
 */
interface ParticleShape {
  path: string
  viewBox: string
  /** Default opacity for this particle type */
  opacity?: number
}

const PARTICLE_SHAPES: Record<Exclude<FallingEffectType, 'none'>, ParticleShape> = {
  petals: {
    path: 'M16 2C11 6 6 8 6 14c0 6 5 10 10 14 5-4 10-8 10-14 0-6-5-8-10-12z',
    viewBox: '0 0 32 32',
    opacity: 0.7,
  },
  confetti: {
    path: 'M2 2h12v6H2z',
    viewBox: '0 0 16 10',
    opacity: 0.8,
  },
  snowflakes: {
    path: 'M16 0l1.5 5.5L22 4l-2.5 4.5L25 10l-5.5 1L21 16l-4.5-2L16 20l-.5-6-4.5 2 1.5-5L7 10l5.5-1.5L10 4l4.5 2.5z',
    viewBox: '0 0 32 20',
    opacity: 0.75,
  },
  stars: {
    path: 'M12 0l3.7 7.5L24 8.7l-6 5.8 1.4 8.5L12 18.8 4.6 23l1.4-8.5-6-5.8 8.3-1.2z',
    viewBox: '0 0 24 24',
    opacity: 0.7,
  },
  leaves: {
    path: 'M2 28C2 28 6 20 14 12c8-8 16-10 16-10S28 10 20 18C12 26 2 28 2 28zM14 12l6 6',
    viewBox: '0 0 32 32',
    opacity: 0.65,
  },
}

/** Intensity presets mapping to spawn interval (ms) and max particle count */
const INTENSITY_PRESETS = {
  light: { interval: 800, maxParticles: 15 },
  normal: { interval: 500, maxParticles: 25 },
  heavy: { interval: 300, maxParticles: 40 },
} as const

export interface FallingParticlesOptions {
  /** Built-in shape type (ignored when customImage is provided) */
  type?: FallingEffectType
  /** URL to a custom particle image (PNG with transparency or SVG) */
  customImage?: string | null
  /** Particle fill color — only applies to built-in SVG shapes */
  color?: () => string
  /** Spawn rate / density preset */
  intensity?: 'light' | 'normal' | 'heavy'
  /** Minimum particle size in px (default: 10) */
  minSize?: number
  /** Maximum particle size in px (default: 25) */
  maxSize?: number
  /** Minimum fall duration in ms (default: 6000) */
  minDuration?: number
  /** Maximum fall duration in ms (default: 12000) */
  maxDuration?: number
}

/**
 * Composable for creating falling particle animations on the showcase.
 *
 * Supports two rendering modes:
 * 1. Built-in SVG shapes — petals, confetti, snowflakes, stars, leaves
 * 2. Custom uploaded images — transparent PNG or SVG via URL
 *
 * Uses the Web Animations API for GPU-accelerated, performant animations.
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
    minSize = 10,
    maxSize = 25,
    minDuration = 6000,
    maxDuration = 12000,
  } = options

  // Don't set up anything for 'none' type (unless custom image is provided)
  if (type === 'none' && !customImage) {
    return { isActive: ref(false), start: () => {}, stop: () => {}, cleanup: () => {} }
  }

  const preset = INTENSITY_PRESETS[intensity]
  let spawnTimer: ReturnType<typeof setInterval> | null = null
  const isActive = ref(false)

  // Pre-cache the custom image if provided
  let cachedImg: HTMLImageElement | null = null
  if (customImage) {
    cachedImg = new Image()
    cachedImg.src = customImage
  }

  // Resolve the SVG shape for built-in types
  const shape = !customImage && type !== 'none' ? PARTICLE_SHAPES[type] : null

  function createParticle() {
    const container = containerRef.value
    if (!container) return
    if (container.children.length >= preset.maxParticles) return

    const particle = document.createElement('div')
    particle.style.position = 'absolute'
    particle.style.top = '-50px'
    particle.style.pointerEvents = 'none'

    const size = Math.random() * (maxSize - minSize) + minSize
    particle.style.width = size + 'px'
    particle.style.height = size + 'px'
    particle.style.left = Math.random() * 100 + '%'

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

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('fill', color())
      path.setAttribute('d', shape.path)
      path.setAttribute('opacity', String(shape.opacity ?? 0.7))

      svg.appendChild(path)
      particle.appendChild(svg)
    }

    container.appendChild(particle)

    // Animate: fall + drift + rotate
    const duration = Math.random() * (maxDuration - minDuration) + minDuration
    const drift = Math.random() * 200 - 100
    const rotate = Math.random() * 720
    const containerHeight = container.offsetHeight

    const animation = particle.animate(
      [
        { transform: 'translate(0, -50px) rotate(0deg)', opacity: 0.7 },
        {
          transform: `translate(${drift}px, ${containerHeight + 100}px) rotate(${rotate}deg)`,
          opacity: 0.3,
        },
      ],
      { duration, easing: 'linear' },
    )

    animation.onfinish = () => particle.remove()
  }

  function start() {
    if (isActive.value) return

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    isActive.value = true
    spawnTimer = setInterval(createParticle, preset.interval)
  }

  function stop() {
    if (spawnTimer) {
      clearInterval(spawnTimer)
      spawnTimer = null
    }
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
