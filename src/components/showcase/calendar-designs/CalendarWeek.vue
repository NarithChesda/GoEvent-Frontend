<template>
  <!-- Only the week the event falls in: seven days in one row, the day itself
       standing in a tall filled capsule. The whole month is context a guest
       rarely needs; the week answers the question they actually have — "which
       day is it, next to the ones I know?" — in a third of the height. The
       neighbouring month's days stay in the row, faded, so a week that crosses
       a month end still reads as seven days. -->
  <div
    class="calk"
    :class="{ 'is-active': active, 'is-kh': khmer }"
    :style="{ '--cal-t0': `${t0}s`, '--cal-on-marker': markerInk }"
  >
    <div class="calk__head" :style="{ fontFamily: textFont }">{{ model.heading }}</div>

    <div class="calk__row" role="list" :style="{ fontFamily: textFont }">
      <div
        v-for="(day, i) in model.week"
        :key="`day-${i}`"
        class="calk__day"
        :class="{ 'is-event': day.isEvent, 'is-out': !day.inMonth }"
        :style="{ '--i': i }"
        role="listitem"
      >
        <span v-if="day.isEvent" class="calk__pill" aria-hidden="true" />
        <span class="calk__wd">{{ model.weekdayLabels[i] }}</span>
        <span class="calk__num" :style="day.isEvent ? { fontFamily: displayFont } : undefined">{{
          day.label
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarStyleProps } from './types'

defineProps<CalendarStyleProps>()
</script>

<style scoped>
.calk {
  --cal-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

  width: 100%;
  /* The capsule stands 0.55em past the row at both ends; this is its room
     below, so it never sits on the map card. */
  padding-bottom: 1em;
}

/* A tracked line, not a headline: in this design the capsule is the loudest
   thing and the month only says which one it is in. */
.calk__head {
  margin-bottom: 1.35em;
  font-size: 0.8em;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 450ms var(--cal-ease-out) calc(var(--cal-t0) + 0.1s);
}

.is-kh .calk__head {
  font-size: 0.95em;
  letter-spacing: 0;
}

.calk__row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  align-items: center;
}

.calk__day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45em;
  padding: 0.5em 0;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 450ms var(--cal-ease-out),
    transform 450ms var(--cal-ease-out),
    color 300ms ease;
  transition-delay: calc(var(--cal-t0) + 0.2s + var(--i) * 45ms);
}

.calk__day.is-out {
  --calk-rest: 0.35;
}

.calk__wd {
  position: relative;
  font-size: 0.6em;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.65;
}

.is-kh .calk__wd {
  font-size: 0.72em;
  letter-spacing: 0;
}

.calk__num {
  position: relative;
  font-size: 1.15em;
  line-height: 1;
}

.is-kh .calk__num {
  line-height: 1.3;
}

/* The capsule stands taller than the row, which is what makes the day read
   as chosen rather than merely highlighted. It grows from its own middle once
   the week is in, and the day's type turns to the capsule's ink with it. */
.calk__pill {
  position: absolute;
  inset: -0.55em 0.15em;
  border-radius: 999px;
  background: var(--details-marker-color, #b3261e);
  opacity: 0;
  transform: scaleY(0.35);
  transition:
    opacity 250ms ease-out calc(var(--cal-t0) + 0.6s),
    transform 500ms var(--cal-ease-out) calc(var(--cal-t0) + 0.6s);
}

.calk__day.is-event .calk__num {
  font-size: 1.55em;
}

.calk__day.is-event .calk__wd {
  opacity: 0.85;
}

.is-active .calk__head {
  opacity: 0.8;
}

.is-active .calk__day {
  opacity: var(--calk-rest, 1);
  transform: none;
}

.is-active .calk__day.is-event {
  color: var(--cal-on-marker);
  transition-delay:
    calc(var(--cal-t0) + 0.2s + var(--i) * 45ms),
    calc(var(--cal-t0) + 0.2s + var(--i) * 45ms),
    calc(var(--cal-t0) + 0.65s);
}

.is-active .calk__pill {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .calk__day,
  .calk__pill {
    transform: none;
  }
}
</style>
