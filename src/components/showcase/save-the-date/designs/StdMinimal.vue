<template>
  <div class="std std-minimal" :class="{ 'is-revealed': revealed }">
    <p class="std-eyebrow min-label std-rise" :class="inkClass">{{ label }}</p>
    <p v-if="longDate" class="min-date std-rise" :class="inkClass">{{ longDate }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SaveTheDateDesignProps } from '../types'

/**
 * `minimal` — no rules, no ornament, no numeral. A small tracked label over the
 * date set large in the display serif, and nothing else.
 *
 * This is the option for a template whose featured photograph is the hero: the
 * other five all add drawn chrome over the image, and on a strong photograph
 * that chrome is what you look at. The hierarchy here is carried by scale and
 * space alone — the label is deliberately the smallest thing on the stage and
 * the date the largest, which is the inverse of `engraved`, where the numeral
 * is big *and* framed.
 *
 * Its gesture is the plain **rise and fade**, two beats 300ms apart, resolved
 * inside a second and a half. Nothing here is worth a longer wait.
 */
const props = defineProps<SaveTheDateDesignProps>()

const inkClass = computed(() => (props.ink === 'metal' ? 'std-metal' : 'std-solid'))
</script>

<style scoped>
/* The gap does the work the rules do in the other designs, so it is far wider
   than any of them — at the tighter spacing the two lines read as one stacked
   block rather than as a label introducing a date. */
.std-minimal {
  gap: calc(var(--std-w) * 0.055);
  padding-inline: calc(var(--std-w) * 0.06);
}

.min-label {
  opacity: 0;
}

.is-revealed .min-label {
  animation: stdRise 900ms var(--std-ease-out) var(--std-t0) forwards;
}

/* Long enough that the widest en-US date still fits a 390px phone without
   wrapping: at 0.052 that measures ~330px, inside the block's own padding. */
.min-date {
  font-family: var(--std-display);
  font-size: calc(var(--std-w) * 0.052);
  letter-spacing: 0.02em;
  line-height: 1.25;
  font-weight: 500;
  opacity: 0;
  white-space: nowrap;
}

.is-revealed .min-date {
  animation:
    stdRise 1100ms var(--std-ease-out) calc(var(--std-t0) + 300ms) forwards,
    stdSheen 2s ease-in-out calc(var(--std-t0) + 1200ms) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .is-revealed .min-label {
    animation-delay: 0ms;
  }

  .is-revealed .min-date {
    animation:
      stdRise 700ms ease 150ms forwards,
      stdSheen 1ms linear forwards;
  }
}
</style>
