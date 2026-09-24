<template>
  <!-- A desk flip calendar on two binder rings: the month on a coloured band,
       the day set huge beneath it, the weekday and year under that. It
       arrives on the page BEFORE — the day before the event — which flips up
       over the rings and away, the way you turn one of these to today. That
       one gesture is the whole idea: the calendar being turned to this date. -->
  <div
    class="cald"
    :class="{ 'is-active': active, 'is-kh': khmer }"
    :style="{ '--cal-t0': `${t0}s`, '--cal-on-marker': markerInk }"
  >
    <div class="cald__block">
      <span class="cald__ring cald__ring--l" aria-hidden="true" />
      <span class="cald__ring cald__ring--r" aria-hidden="true" />

      <div class="cald__page">
        <div class="cald__band" :style="{ fontFamily: textFont }">{{ model.month }}</div>
        <div class="cald__face">
          <div class="cald__day" :class="finishClass" :style="{ fontFamily: displayFont }">
            <span class="tfx-ink">{{ model.dayLabel }}</span>
          </div>
          <div class="cald__weekday" :style="{ fontFamily: textFont }">{{ model.weekday }}</div>
          <div class="cald__year" :style="{ fontFamily: textFont }">{{ model.year }}</div>
        </div>
      </div>

      <!-- The page before. Its band carries no month: on the 1st the day
           before belongs to the previous month, and for the half-second it is
           on screen the number is all that reads anyway. -->
      <div class="cald__page cald__page--before" aria-hidden="true">
        <div class="cald__band" />
        <div class="cald__face">
          <div class="cald__day" :style="{ fontFamily: displayFont }">{{ model.previousDayLabel }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarStyleProps } from './types'

defineProps<CalendarStyleProps>()
</script>

<style scoped>
.cald {
  --cal-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --cal-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --cald-rule: color-mix(in srgb, currentColor 22%, transparent);

  display: flex;
  justify-content: center;
  width: 100%;
  padding-top: 0.6em;
}

/* Perspective on the block, so the turning page is foreshortened while the
   page beneath it — which never moves — stays flat. */
.cald__block {
  position: relative;
  width: min(100%, 11.5em);
  perspective: 700px;
}

/* A pad, not a card: the pages under this one show as two edges below it. */
.cald__page {
  position: relative;
  overflow: hidden;
  border-radius: 0.4em;
  background: color-mix(in srgb, currentColor 5%, transparent);
  box-shadow:
    inset 0 0 0 1px var(--cald-rule),
    0 3px 0 -1px color-mix(in srgb, currentColor 14%, transparent),
    0 6px 0 -2px color-mix(in srgb, currentColor 9%, transparent);
}

.cald__band {
  height: 2.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 0.2em;
  background: var(--details-marker-color, #b3261e);
  color: var(--cal-on-marker);
  font-size: 0.8em;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.is-kh .cald__band {
  font-size: 0.95em;
  letter-spacing: 0;
}

.cald__face {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.35em 0.75em 0.95em;
}

.cald__day {
  font-size: 4.25em;
  line-height: 1.05;
}

.is-kh .cald__day {
  line-height: 1.25;
}

.cald__weekday {
  font-size: 0.95em;
  line-height: 1.4;
}

.cald__year {
  margin-top: 0.15em;
  font-size: 0.7em;
  letter-spacing: 0.2em;
  opacity: 0.7;
}

/* Two loops over the top edge. They sit above both pages, so the turning page
   reads as hinged on them. */
.cald__ring {
  position: absolute;
  z-index: 3;
  top: -0.6em;
  width: 0.5em;
  height: 1.2em;
  border: 2px solid color-mix(in srgb, currentColor 48%, transparent);
  border-radius: 999px;
}

.cald__ring--l {
  left: 26%;
}

.cald__ring--r {
  right: 26%;
}

/* The date under the turning page stays hidden until the page has lifted past
   it — the two are the same translucent material, so without this the event's
   numeral would show through the day before's. */
.cald__page:not(.cald__page--before) .cald__face {
  opacity: 0;
  transition: opacity 350ms var(--cal-ease-out) calc(var(--cal-t0) + 0.85s);
}

/* Lifts from its bottom edge toward the reader and over the rings, gone past
   the vertical. An ease-in-out: a page starts slowly under a thumb and falls
   away quickly once it is past its balance point. */
.cald__page--before {
  position: absolute;
  inset: 0;
  z-index: 2;
  transform-origin: 50% 0;
  backface-visibility: hidden;
  transition:
    transform 750ms var(--cal-ease-in-out) calc(var(--cal-t0) + 0.5s),
    /* Only a backstop for engines that paint a back face anyway: by now the
       page is past vertical and `backface-visibility` has hidden it. */
    opacity 200ms linear calc(var(--cal-t0) + 1s);
}

.cald__page--before .cald__day {
  opacity: 0.55;
}

.is-active .cald__page:not(.cald__page--before) .cald__face {
  opacity: 1;
}

.is-active .cald__page--before {
  transform: rotateX(110deg);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .cald__page--before {
    display: none;
  }

  .cald__page:not(.cald__page--before) .cald__face {
    transition-delay: calc(var(--cal-t0) + 0.2s);
  }
}
</style>
