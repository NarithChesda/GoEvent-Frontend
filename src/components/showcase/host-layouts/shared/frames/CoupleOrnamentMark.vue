<template>
  <svg
    v-if="ornament !== 'none'"
    class="couple-ornament"
    :class="{ 'is-animated': animated }"
    :viewBox="ORNAMENT_VIEWBOX"
    fill="none"
    aria-hidden="true"
    focusable="false"
    :style="{ color, animationDelay: `${animationDelay}s` }"
  >
    <template v-if="ornament === 'heart'">
      <path :d="HEART_PATH" stroke="currentColor" :stroke-width="strokeWidth" stroke-linejoin="round" />
      <path
        :d="HEART_INNER_PATH"
        stroke="currentColor"
        :stroke-width="strokeWidth * 0.75"
        stroke-linejoin="round"
        opacity="0.55"
      />
    </template>

    <template v-else-if="ornament === 'rings'">
      <circle
        v-for="(ring, i) in RINGS_CIRCLES"
        :key="i"
        :cx="ring.cx"
        :cy="ring.cy"
        :r="ring.r"
        stroke="currentColor"
        :stroke-width="strokeWidth"
      />
    </template>

    <path
      v-else-if="ornament === 'knot'"
      :d="KNOT_PATH"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linejoin="round"
    />

    <template v-else-if="ornament === 'bloom'">
      <path
        v-for="(petal, i) in BLOOM_PATHS"
        :key="i"
        :d="petal"
        stroke="currentColor"
        :stroke-width="strokeWidth * 0.85"
        stroke-linejoin="round"
        :opacity="i === 0 ? 1 : 0.78"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { CoupleOrnament } from '@/services/api/types/template.types'
import {
  ORNAMENT_VIEWBOX,
  HEART_PATH,
  HEART_INNER_PATH,
  RINGS_CIRCLES,
  KNOT_PATH,
  BLOOM_PATHS,
} from './ornamentPaths'

/**
 * The motif between the two hosts, drawn into the grid's centre column.
 *
 * It sits in `.center-spacer` — a track the layout has always had and never
 * filled — so adding it costs no structural change and cannot push the two
 * host columns around: the track is `auto`, and it stays 1rem wide until a
 * motif asks for more.
 *
 * Stroke, never fill. A filled heart at this size reads as an icon, which on a
 * showcase invites a tap that does nothing; a drawn one reads as ornament.
 */
interface Props {
  ornament?: CoupleOrnament | null
  /** Usually the template's accent — the same slot the other drawn chrome uses. */
  color: string
  animated?: boolean
  animationDelay?: number
}

withDefaults(defineProps<Props>(), {
  ornament: 'none',
  animated: false,
  animationDelay: 0,
})

/**
 * One stroke weight for every motif, in viewBox units. They all share a 100x100
 * box and render at the same size, so a per-motif weight would make some read
 * heavier than others for no reason the guest could name.
 */
const strokeWidth = 3.2
</script>

<style scoped>
.couple-ornament {
  display: block;
  /* Never shrink. The motif is a flex item in the centre track, and a track
     that ends up narrower than the drawing would otherwise squeeze it to
     nothing rather than overflow — silently, with no layout error to notice. */
  flex: none;
  /* The layout owns this size, because the same value has to set the width of
     *every* row's centre track — not just this one — or the rows stop sharing a
     column geometry and the title and name drift off the avatar's axis. The
     fallback is the same value, for any caller that doesn't define the token. */
  width: var(--ornament-size, clamp(26px, 8vw, 46px));
  height: auto;
  overflow: visible;
  opacity: 0.85;
}

/* Draws itself in rather than appearing: the two host columns either side
   arrive on their own stagger, and a motif that simply exists between them
   reads as a background watermark instead of as part of the same gesture. */
.couple-ornament.is-animated {
  opacity: 0;
  animation: ornamentDraw 0.7s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes ornamentDraw {
  from {
    opacity: 0;
    transform: scale(0.86);
  }
  to {
    opacity: 0.85;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .couple-ornament.is-animated {
    animation: ornamentFade 0.4s ease forwards;
  }

  @keyframes ornamentFade {
    to {
      opacity: 0.85;
    }
  }
}
</style>
