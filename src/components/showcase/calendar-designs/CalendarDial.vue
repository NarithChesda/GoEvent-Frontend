<template>
  <!-- The month as a dial: every day set round a ring like the hours of a
       clock, day 1 at the top. A marker travels round the inner track from the
       1st, drawing the month behind it, and stops on the day — then the day is
       circled in the marker colour. The centre holds the date in words. It is
       the one design that shows how far into the month the day falls. -->
  <div
    class="calc"
    :class="{ 'is-active': active, 'is-kh': khmer }"
    :style="{
      '--cal-t0': `${t0}s`,
      '--cal-on-marker': markerInk,
      '--calc-angle': `${eventAngle}deg`,
      '--calc-arc': String(arcLength),
    }"
  >
    <div class="calc__face" role="img" :aria-label="`${model.weekday} ${model.dayLabel} ${model.heading}`">
      <!-- One viewBox, turned so its circles start at twelve o'clock: the
           track, and the arc drawn over it as the marker moves. No
           non-scaling-stroke: it breaks pathLength draws in Chromium (see the
           arch design). The box is square, so the stroke scales evenly. -->
      <svg class="calc__rings" viewBox="0 0 100 100" aria-hidden="true">
        <circle class="calc__track" cx="50" cy="50" r="31" />
        <circle class="calc__arc" cx="50" cy="50" r="31" pathLength="100" />
      </svg>

      <span
        v-for="(day, i) in model.monthDays"
        :key="`d-${i}`"
        class="calc__num"
        :class="{ 'is-event': day.isEvent }"
        :style="numStyle(i)"
        aria-hidden="true"
      >
        <span v-if="day.isEvent" class="calc__disc" />
        <span class="calc__label">{{ day.label }}</span>
      </span>

      <span class="calc__sweep" aria-hidden="true"><span class="calc__marker" /></span>

      <div class="calc__centre">
        <span class="calc__weekday" :style="{ fontFamily: textFont }">{{ model.weekday }}</span>
        <span class="calc__day" :class="finishClass" :style="{ fontFamily: displayFont }">
          <span class="tfx-ink">{{ model.dayLabel }}</span>
        </span>
        <span class="calc__month" :style="{ fontFamily: textFont }">{{ model.heading }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarStyleProps } from './types'

const props = defineProps<CalendarStyleProps>()

/** Day numbers sit on this ring, as a share of the face's width. */
const NUMBER_RADIUS = 42

const dayCount = computed(() => props.model.monthDays.length || 30)

const eventIndex = computed(() => props.model.monthDays.findIndex((day) => day.isEvent))

/** Day 1 at twelve o'clock, clockwise — where the marker stops. */
const eventAngle = computed(() => (Math.max(0, eventIndex.value) / dayCount.value) * 360)

/** The same angle as a share of the track's pathLength of 100. */
const arcLength = computed(() => (eventAngle.value / 360) * 100)

const numStyle = (index: number): Record<string, string> => {
  const radians = ((index / dayCount.value) * 360 * Math.PI) / 180
  return {
    left: `${50 + NUMBER_RADIUS * Math.sin(radians)}%`,
    top: `${50 - NUMBER_RADIUS * Math.cos(radians)}%`,
    '--i': String(index),
    fontFamily: props.textFont,
  }
}
</script>

<style scoped>
.calc {
  --cal-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --cal-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  /* One clock for the travel, shared by the marker and the arc behind it so
     the arc's end never leaves the marker. */
  --calc-sweep: 1100ms var(--cal-ease-in-out) calc(var(--cal-t0) + 0.55s);

  display: flex;
  justify-content: center;
  width: 100%;
}

.calc__face {
  position: relative;
  width: min(100%, 17.5em);
  aspect-ratio: 1;
}

.calc__rings {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  overflow: visible;
}

.calc__rings circle {
  fill: none;
}

.calc__track {
  stroke: color-mix(in srgb, currentColor 16%, transparent);
  stroke-width: 0.5;
}

/* dasharray "arc 100": one dash as long as the month so far. Offset by its own
   length it sits entirely before the start; offset 0 lays it from twelve
   o'clock to the day. Interpolating the offset grows it from the top. */
.calc__arc {
  stroke: var(--details-marker-color, #b3261e);
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-dasharray: var(--calc-arc) 100;
  stroke-dashoffset: var(--calc-arc);
  transition: stroke-dashoffset var(--calc-sweep);
}

.calc__num {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  height: 2em;
  font-size: 0.7em;
  line-height: 1;
  transform: translate(-50%, -50%);
  opacity: 0;
  /* Round the dial in order, quickly — the whole ring is in before the marker
     sets off, so the travel is read against a finished clock face. */
  transition: opacity 300ms ease-out calc(var(--cal-t0) + 0.1s + var(--i) * 12ms);
}

.is-kh .calc__num {
  line-height: 1.3;
}

.calc__label {
  position: relative;
}

/* Circled once the marker has arrived: the disc sets down and the day turns
   to its ink. */
.calc__disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--details-marker-color, #b3261e);
  opacity: 0;
  transform: scale(0.55);
  transition:
    opacity 200ms ease-out calc(var(--cal-t0) + 1.6s),
    transform 380ms cubic-bezier(0.34, 1.4, 0.64, 1) calc(var(--cal-t0) + 1.6s);
}

.calc__num.is-event {
  font-weight: 700;
  transition:
    opacity 300ms ease-out calc(var(--cal-t0) + 0.1s + var(--i) * 12ms),
    color 250ms ease calc(var(--cal-t0) + 1.6s);
}

/* The marker rides the edge of a box exactly the track's size: rotating the
   box carries the dot round the track at a constant radius. Track-sized, not
   face-sized — a face-sized square turned 45° reaches 41% past the face on
   every side, and the card's scroller (overflow-y: auto) scrolled sideways by
   that much while it turned. At the track's size its diagonal stays inside. */
.calc__sweep {
  position: absolute;
  inset: 19%;
  transform: rotate(0deg);
  transition: transform var(--calc-sweep);
  pointer-events: none;
}

.calc__marker {
  position: absolute;
  left: 50%;
  top: 0;
  width: 0.55em;
  height: 0.55em;
  border-radius: 50%;
  background: var(--details-marker-color, #b3261e);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 200ms ease-out calc(var(--cal-t0) + 0.5s);
}

.calc__centre {
  position: absolute;
  inset: 27%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  opacity: 0;
  transition: opacity 500ms var(--cal-ease-out) calc(var(--cal-t0) + 0.3s);
}

.calc__weekday {
  font-size: 0.8em;
  line-height: 1.3;
  opacity: 0.8;
}

.calc__day {
  font-size: 3em;
  line-height: 1.05;
}

.is-kh .calc__day {
  line-height: 1.25;
}

.calc__month {
  font-size: 0.66em;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.75;
}

.is-kh .calc__month {
  font-size: 0.78em;
  letter-spacing: 0;
}

.is-active .calc__num,
.is-active .calc__centre,
.is-active .calc__marker {
  opacity: 1;
}

.is-active .calc__num.is-event {
  color: var(--cal-on-marker);
}

.is-active .calc__disc {
  opacity: 1;
  transform: none;
}

.is-active .calc__sweep {
  transform: rotate(var(--calc-angle));
}

.is-active .calc__arc {
  stroke-dashoffset: 0;
}

/* Everything simply present: the arc already drawn, the marker already on the
   day, the day already circled. */
@media (prefers-reduced-motion: reduce) {
  .calc__sweep {
    transform: rotate(var(--calc-angle));
    transition: none;
  }

  .calc__arc {
    stroke-dashoffset: 0;
    transition: none;
  }

  .calc__disc {
    transform: none;
  }
}
</style>
