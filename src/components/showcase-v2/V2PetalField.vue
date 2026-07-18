<template>
  <div ref="rootEl" class="v2-petal-field" aria-hidden="true">
    <span
      v-for="petal in petals"
      :key="petal.id"
      class="v2-petal"
      :class="{ 'v2-petal--static': !animate }"
      :style="petal.style"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useScrollStory } from '../../composables/showcase-v2/useScrollStory'
import { V2_COLORS } from '../../composables/showcase-v2/v2Theme'

const rootEl = ref<HTMLElement | null>(null)
const { createStory } = useScrollStory(rootEl)

const animate = ref(true)

// Storybook palette petals — blush leads, sage and gold as accents
const petalColors = [V2_COLORS.blush, V2_COLORS.blushDeep, V2_COLORS.sage, V2_COLORS.gold]

interface Petal {
  id: number
  style: Record<string, string>
}

// Randomized once per mount (CSS custom-property pattern)
const petals = ref<Petal[]>([])

const buildPetals = (count: number) => {
  petals.value = Array.from({ length: count }, (_, i) => {
    const size = 8 + Math.random() * 14
    return {
      id: i,
      style: {
        '--petal-x': `${Math.random() * 100}%`,
        '--petal-size': `${size.toFixed(1)}px`,
        '--petal-color': petalColors[i % petalColors.length],
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

.v2-petal {
  position: absolute;
  top: -5%;
  left: var(--petal-x);
  width: var(--petal-size);
  height: calc(var(--petal-size) * 1.25);
  background: radial-gradient(
    ellipse at 35% 30%,
    var(--petal-color) 0%,
    color-mix(in srgb, var(--petal-color) 55%, transparent) 70%,
    transparent 100%
  );
  border-radius: 62% 38% 55% 45% / 48% 62% 38% 52%;
  opacity: var(--petal-opacity);
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
