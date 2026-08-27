<template>
  <div class="std std-medallion" :class="{ 'is-revealed': revealed }">
    <p class="std-eyebrow med-label std-rise" :class="inkClass">{{ label }}</p>

    <div v-if="parts" class="med-seal">
      <!-- The ring is drawn, not faded: one stroke travelling all the way round
           at a constant speed. `pathLength` normalises the circumference to 100
           so the dash pair below is readable and independent of the radius. -->
      <svg class="med-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle
          class="med-ring-path"
          cx="50"
          cy="50"
          r="46"
          fill="none"
          :stroke="inkColor"
          stroke-width="1"
          pathLength="100"
        />
        <circle
          class="med-ring-inner"
          cx="50"
          cy="50"
          r="41"
          fill="none"
          :stroke="inkColor"
          stroke-width="0.5"
        />
      </svg>
      <span class="med-day" :class="inkClass">{{ parts.day }}</span>
    </div>

    <p v-if="parts" class="med-monthyear std-rise" :class="inkClass">
      {{ parts.monthLong }} {{ parts.year }}
    </p>
    <p v-if="parts" class="std-longdate med-weekday std-rise" :class="inkClass">
      {{ parts.weekday }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SaveTheDateDesignProps } from '../types'

/**
 * `medallion` — a drawn hairline ring with the day numeral inside it, the month
 * and year tracked beneath and the label above: a crest rather than a frame.
 *
 * It borrows `engraved`'s formality but inverts what the chrome is doing. There,
 * the rules *bracket* the copy from outside and the numeral is the hero on its
 * own; here the chrome *encloses* one number and the rest of the date arranges
 * itself under the seal. Two concentric rings rather than one — a single
 * hairline circle reads as a placeholder avatar, and the second, half-weight
 * ring is what makes it read as struck.
 *
 * Its gesture is the **draw round**: the outer ring is stroked from twelve
 * o'clock all the way back to it at a constant speed, and the day scales up out
 * of the middle as it closes.
 */
const props = defineProps<SaveTheDateDesignProps>()

const inkClass = computed(() => (props.ink === 'metal' ? 'std-metal' : 'std-solid'))
</script>

<style scoped>
.std-medallion {
  gap: calc(var(--std-w) * 0.028);
  padding-inline: calc(var(--std-w) * 0.05);
}

.med-label {
  opacity: 0;
}

.is-revealed .med-label {
  animation: stdRise 800ms var(--std-ease-out) var(--std-t0) forwards;
}

.med-seal {
  position: relative;
  width: calc(var(--std-w) * 0.33);
  height: calc(var(--std-w) * 0.33);
  display: grid;
  place-items: center;
  /* A hair of breathing room above and below the seal beyond the block's own
     gap — it is the one element here that isn't a line of type, and at the flat
     gap it crowded the label into the ring. */
  margin-block: calc(var(--std-w) * 0.012);
}

.med-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Twelve o'clock, so the stroke starts and finishes at the top rather than at
     the three o'clock the SVG circle would otherwise begin from. */
  transform: rotate(-90deg);
  overflow: visible;
}

.med-ring-path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  opacity: 0;
}

.med-ring-inner {
  opacity: 0;
}

/* Linear: a line being drawn travels at the speed of the hand drawing it, and
   an eased stroke visibly hesitates halfway round — which on a circle is the
   bottom, in full view. */
.is-revealed .med-ring-path {
  animation: medRingDraw 1100ms linear calc(var(--std-t0) + 250ms) forwards;
}

@keyframes medRingDraw {
  0% {
    stroke-dashoffset: 100;
    opacity: 0.9;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0.9;
  }
}

/* The inner ring is not drawn — it fades up once the outer one has closed, so
   the seal reads as one line drawn and then inked rather than as two lines
   racing each other. */
.is-revealed .med-ring-inner {
  animation: medRingInk 700ms var(--std-ease-out) calc(var(--std-t0) + 1250ms) forwards;
}

@keyframes medRingInk {
  to {
    opacity: 0.55;
  }
}

.med-day {
  position: relative;
  font-family: var(--std-date-font, var(--std-display));
  font-size: calc(var(--std-w) * 0.13);
  line-height: 1;
  font-weight: 500;
  letter-spacing: 0.01em;
  opacity: 0;
  /* Never from scale(0): nothing in the real world appears from nothing, and a
     numeral that grows out of a point reads as a UI element rather than as
     something stamped. */
  transform: scale(0.9);
}

.is-revealed .med-day {
  animation:
    medDayStamp 900ms var(--std-ease-out) calc(var(--std-t0) + 700ms) forwards,
    stdSheen 2s ease-in-out calc(var(--std-t0) + 1600ms) forwards;
}

@keyframes medDayStamp {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.med-monthyear {
  font-family: var(--std-date-font, var(--std-display));
  font-size: calc(var(--std-w) * 0.042);
  letter-spacing: 0.22em;
  padding-left: 0.22em;
  text-transform: uppercase;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  opacity: 0;
}

.is-revealed .med-monthyear {
  animation: stdRise 900ms var(--std-ease-out) calc(var(--std-t0) + 1350ms) forwards;
}

.med-weekday {
  font-size: calc(var(--std-w) * 0.026);
  opacity: 0;
}

.is-revealed .med-weekday {
  animation: stdRise 900ms var(--std-ease-out) calc(var(--std-t0) + 1550ms) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .med-day {
    transform: none;
  }

  .is-revealed .med-label {
    animation-delay: 0ms;
  }

  /* The ring stops being drawn and is simply inked in place — the draw is the
     one thing here that is motion rather than arrival. */
  .med-ring-path {
    stroke-dashoffset: 0;
  }

  .is-revealed .med-ring-path {
    animation: medRingFade 500ms ease 100ms forwards;
  }

  @keyframes medRingFade {
    to {
      opacity: 0.9;
    }
  }

  .is-revealed .med-ring-inner {
    animation-duration: 500ms;
    animation-delay: 250ms;
  }

  .is-revealed .med-day {
    animation:
      medDayStamp 600ms ease 250ms forwards,
      stdSheen 1ms linear forwards;
  }

  .is-revealed .med-monthyear {
    animation-duration: 500ms;
    animation-delay: 450ms;
  }

  .is-revealed .med-weekday {
    animation-duration: 500ms;
    animation-delay: 600ms;
  }
}
</style>
