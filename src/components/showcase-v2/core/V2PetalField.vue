<template>
  <div ref="rootEl" class="v2-petal-field" aria-hidden="true">
    <!-- Shared gradient/stroke defs, one per palette color — referenced by
         every petal instead of a flat fill so the shapes keep the soft
         shaded look the old CSS blob had. -->
    <svg width="0" height="0" class="v2-petal-defs">
      <defs>
        <linearGradient
          v-for="(color, i) in colors"
          :id="`v2-petal-grad-${i}`"
          :key="i"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" :style="{ stopColor: lighten(color) }" />
          <stop offset="55%" :style="{ stopColor: color }" />
          <stop offset="100%" :style="{ stopColor: darken(color) }" />
        </linearGradient>
      </defs>
    </svg>
    <svg
      v-for="petal in petals"
      :key="petal.id"
      class="v2-petal"
      :class="{ 'v2-petal--static': !animate }"
      :viewBox="petal.viewBox"
      :style="petal.style"
    >
      <path
        :d="petal.path"
        :fill="`url(#v2-petal-grad-${petal.colorIndex})`"
        :stroke="darken(colors[petal.colorIndex])"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useScrollStory } from '../../../composables/showcase-v2/useScrollStory'
import { V2_PARTICLE_SHAPES, type V2ParticleShape } from '../../../composables/showcase-v2/v2ParticleShapes'

interface Props {
  /** Petal fill colors, cycled per petal — supplied by the active category variant's palette. */
  colors: string[]
  /** Particle silhouettes, cycled per petal — supplied by the active category variant. */
  shapes?: V2ParticleShape[]
}

const props = withDefaults(defineProps<Props>(), {
  shapes: () => ['petals'],
})

const lighten = (hex: string) => `color-mix(in srgb, ${hex} 55%, white)`
const darken = (hex: string) => `color-mix(in srgb, ${hex} 70%, black)`

const rootEl = ref<HTMLElement | null>(null)
const { createStory } = useScrollStory(rootEl)

const animate = ref(true)

interface Petal {
  id: number
  path: string
  viewBox: string
  colorIndex: number
  style: Record<string, string>
}

// Randomized once per mount (CSS custom-property pattern)
const petals = ref<Petal[]>([])

const buildPetals = (count: number) => {
  petals.value = Array.from({ length: count }, (_, i) => {
    const size = 8 + Math.random() * 14
    const shapeName = props.shapes[i % props.shapes.length]
    const shape = V2_PARTICLE_SHAPES[shapeName] ?? V2_PARTICLE_SHAPES.petals
    return {
      id: i,
      path: shape.path,
      viewBox: shape.viewBox,
      colorIndex: i % props.colors.length,
      style: {
        '--petal-x': `${Math.random() * 100}%`,
        '--petal-size': `${size.toFixed(1)}px`,
        '--petal-drift': `${(Math.random() * 60 - 30).toFixed(0)}px`,
        '--petal-duration': `${(14 + Math.random() * 14).toFixed(1)}s`,
        '--petal-delay': `${(-Math.random() * 28).toFixed(1)}s`,
        '--petal-opacity': `${(0.22 + Math.random() * 0.3).toFixed(2)}`,
        '--petal-spin': `${(Math.random() * 720 - 360).toFixed(0)}deg`,
      },
    }
  })
}

onMounted(() => {
  createStory(
    ({ gsap, rich }) => {
      buildPetals(rich ? 20 : 10)
      animate.value = true
      if (rich && rootEl.value) {
        // Classic parallax: the fixed petal layer drifts upward at a fraction
        // of scroll velocity, so it reads as a slower background plane
        gsap.to(rootEl.value, {
          yPercent: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'max',
            scrub: 1.2,
          },
        })
      }
    },
    () => {
      // Reduced motion: a few static petals as texture, no drift
      buildPetals(6)
      animate.value = false
    },
  )
})
</script>

<style scoped>
.v2-petal-field {
  position: fixed;
  inset: -12% 0 0 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  will-change: transform;
}

.v2-petal-defs {
  position: absolute;
  overflow: hidden;
}

.v2-petal {
  position: absolute;
  top: -5%;
  left: var(--petal-x);
  width: var(--petal-size);
  height: calc(var(--petal-size) * 1.25);
  opacity: var(--petal-opacity);
  overflow: visible;
  animation: v2-petal-fall var(--petal-duration) linear var(--petal-delay) infinite;
}

.v2-petal--static {
  animation: none;
  top: calc(8% + var(--petal-opacity) * 90%);
}

@keyframes v2-petal-fall {
  0% {
    transform: translate3d(0, -6vh, 0) rotate(0deg);
  }
  100% {
    transform: translate3d(var(--petal-drift), 112vh, 0) rotate(var(--petal-spin));
  }
}

@media (prefers-reduced-motion: reduce) {
  .v2-petal {
    animation: none;
  }
}
</style>
