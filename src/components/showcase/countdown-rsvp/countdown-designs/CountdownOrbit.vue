<template>
  <!-- A dial. The days are the figure in the middle; round them, the hours
       left in the day and the minutes left in the hour are two arcs inside a
       watch bezel, each ending in a bead. The legend underneath names the two
       arcs with a stroke drawn the way each is, so the rings are read, not
       just admired. -->
  <div class="cdo" :class="{ 'is-revealed': revealed }">
    <div class="cdo__dial">
      <svg class="cdo__svg" viewBox="0 0 220 220" aria-hidden="true">
        <g class="cdo__bezel">
          <line
            v-for="tick in TICKS"
            :key="tick.index"
            class="cdo__tick"
            :class="{ 'is-major': tick.major }"
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :style="{ transitionDelay: `${tick.index * 8}ms` }"
          />
        </g>

        <circle class="cdo__track cdo__track--hours" cx="110" cy="110" :r="R_HOURS" />
        <circle class="cdo__track cdo__track--minutes" cx="110" cy="110" :r="R_MINUTES" />

        <circle
          class="cdo__arc cdo__arc--hours"
          cx="110"
          cy="110"
          :r="R_HOURS"
          pathLength="100"
          :style="{ strokeDashoffset: offset('hours') }"
        />
        <circle
          class="cdo__arc cdo__arc--minutes"
          cx="110"
          cy="110"
          :r="R_MINUTES"
          pathLength="100"
          :style="{ strokeDashoffset: offset('minutes') }"
        />

        <!-- The beads ride a rotation on the same clock as the arcs, so each
             sits on its arc's end the whole way round. -->
        <g class="cdo__bead-arm" :style="{ '--share': share('hours') }">
          <circle class="cdo__bead cdo__bead--hours" cx="110" :cy="110 - R_HOURS" r="4.2" />
        </g>
        <g class="cdo__bead-arm" :style="{ '--share': share('minutes') }">
          <circle class="cdo__bead cdo__bead--minutes" cx="110" :cy="110 - R_MINUTES" r="2.8" />
        </g>
      </svg>

      <div class="cdo__centre">
        <span class="cdo__days" :class="fx('primary')" :style="{ fontFamily: displayFont }">
          <RollingNumber :value="days.value" />
        </span>
        <span class="cdo__days-label" :class="{ 'is-khmer': khmer }" :style="{ fontFamily: textFont }">
          {{ days.label }}
        </span>
      </div>
    </div>

    <div class="cdo__legend" :class="{ 'is-khmer': khmer }" :style="{ fontFamily: textFont }">
      <span class="cdo__legend-item">
        <span class="cdo__swatch cdo__swatch--hours" aria-hidden="true" />
        <RollingNumber class="cdo__legend-num" :value="hours.value" />
        <span>{{ hours.label }}</span>
      </span>
      <span class="cdo__legend-item">
        <span class="cdo__swatch cdo__swatch--minutes" aria-hidden="true" />
        <RollingNumber class="cdo__legend-num" :value="minutes.value" />
        <span>{{ minutes.label }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTextEffect } from '@/composables/showcase/useTextEffects'
import RollingNumber from '../RollingNumber.vue'
import type { CountdownDesignProps, CountdownUnit } from '../types'

const props = defineProps<CountdownDesignProps>()

// The days are the dial's display figure, in the primary slot — gilded when the
// template struck that slot in a metal.
const fx = useTextEffect()

const R_HOURS = 91
const R_MINUTES = 82

/** A watch bezel: sixty minute ticks, every fifth one longer. */
const TICKS = Array.from({ length: 60 }, (_, index) => {
  const major = index % 5 === 0
  const angle = (index / 60) * Math.PI * 2
  const outer = 106
  const inner = major ? 98 : 101.5
  const at = (r: number) => ({ x: 110 + Math.sin(angle) * r, y: 110 - Math.cos(angle) * r })
  const a = at(outer)
  const b = at(inner)
  return { index, major, x1: a.x, y1: a.y, x2: b.x, y2: b.y }
})

const unit = (key: CountdownUnit['key']): CountdownUnit =>
  props.units.find((u) => u.key === key) ?? { key, value: '', label: '', share: null }

const days = computed(() => unit('days'))
const hours = computed(() => unit('hours'))
const minutes = computed(() => unit('minutes'))

/** 0–1 of the arc drawn: nothing until the dial has arrived. */
const shareOf = (key: 'hours' | 'minutes'): number =>
  props.revealed ? (unit(key).share ?? 0) : 0

const share = (key: 'hours' | 'minutes'): string => String(shareOf(key))

/**
 * The arc's dash offset against its 100-unit pathLength, as a plain number. It
 * is computed here rather than in a `calc()` because stroke-dashoffset's
 * unitless form is an SVG quirk, and a calc() that resolves to a bare number
 * there is not one every engine accepts.
 */
const offset = (key: 'hours' | 'minutes'): string => String(100 - shareOf(key) * 100)
</script>

<style scoped>
.cdo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  width: 100%;
  color: var(--crs-ink);
}

.cdo__dial {
  position: relative;
  width: min(15.5rem, 64vw);
  aspect-ratio: 1;
  opacity: 0;
  transform: scale(0.96);
  transition:
    opacity 700ms var(--crs-ease-out),
    transform 900ms var(--crs-ease-out);
}

.is-revealed .cdo__dial {
  opacity: 1;
  transform: none;
}

.cdo__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* The bezel lights round from twelve o'clock, one tick every 8ms. */
.cdo__tick {
  stroke: color-mix(in srgb, var(--crs-ink) 26%, transparent);
  stroke-width: 0.9;
  stroke-linecap: round;
  opacity: 0;
  transition: opacity 360ms var(--crs-ease-out);
}

.cdo__tick.is-major {
  stroke: color-mix(in srgb, var(--crs-ink) 50%, transparent);
  stroke-width: 1.4;
}

.is-revealed .cdo__tick {
  opacity: 1;
}

.cdo__track {
  fill: none;
  stroke: color-mix(in srgb, var(--crs-ink) 11%, transparent);
}

.cdo__track--hours {
  stroke-width: 3.2;
}

.cdo__track--minutes {
  stroke-width: 1.6;
}

/* A solid stroke, so dashoffset draws it (the dotted-line trap V2's gold
   thread documents does not apply). Rotated to start at twelve, clockwise. */
.cdo__arc {
  fill: none;
  stroke-linecap: round;
  stroke-dasharray: 100 100;
  stroke-dashoffset: 100;
  transform: rotate(-90deg);
  transform-origin: 110px 110px;
  transition: stroke-dashoffset 1400ms var(--crs-ease-out) 420ms;
}

.cdo__arc--hours {
  stroke: var(--crs-accent);
  stroke-width: 3.2;
}

.cdo__arc--minutes {
  stroke: color-mix(in srgb, var(--crs-ink) 72%, transparent);
  stroke-width: 1.6;
}

.cdo__bead-arm {
  transform: rotate(calc(var(--share) * 360deg));
  transform-origin: 110px 110px;
  transition: transform 1400ms var(--crs-ease-out) 420ms;
}

.cdo__bead {
  opacity: 0;
  transition: opacity 300ms var(--crs-ease-out) 420ms;
}

.is-revealed .cdo__bead {
  opacity: 1;
}

.cdo__bead--hours {
  fill: var(--crs-accent);
}

.cdo__bead--minutes {
  fill: var(--crs-ink);
}

.cdo__centre {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 600ms var(--crs-ease-out) 300ms,
    transform 600ms var(--crs-ease-out) 300ms;
}

.is-revealed .cdo__centre {
  opacity: 1;
  transform: none;
}

.cdo__days {
  font-size: clamp(2.75rem, 13vw, 3.6rem);
  line-height: 1.05;
}

.cdo__days-label,
.cdo__legend {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  line-height: 1.4;
  color: color-mix(in srgb, var(--crs-ink) 72%, transparent);
}

.cdo__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.25rem;
  opacity: 0;
  transition: opacity 600ms var(--crs-ease-out) 900ms;
}

.is-revealed .cdo__legend {
  opacity: 1;
}

.cdo__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.cdo__legend-num {
  color: var(--crs-ink);
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
}

/* Each swatch is its ring's stroke in miniature: weight and colour. */
.cdo__swatch {
  width: 0.875rem;
  border-radius: 999px;
}

.cdo__swatch--hours {
  height: 3px;
  background: var(--crs-accent);
}

.cdo__swatch--minutes {
  height: 1.5px;
  background: color-mix(in srgb, var(--crs-ink) 72%, transparent);
}

.cdo__days-label.is-khmer,
.cdo__legend.is-khmer {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.7;
}

@media (prefers-reduced-motion: reduce) {
  .cdo__dial,
  .cdo__centre {
    transform: none;
  }

  .cdo__tick {
    transition-delay: 0ms !important;
  }

  .cdo__arc,
  .cdo__bead-arm {
    transition-duration: 0ms;
  }
}
</style>
