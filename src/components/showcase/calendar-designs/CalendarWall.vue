<template>
  <!-- A wall planner's page: the month set large at the leading edge with the
       year across from it, then every day in a ruled box with its number in the
       corner, empty boxes included — a planner never leaves a gap in its rules.
       The event day is pressed with a solid stamp. Where the classic calendar
       circles the date by hand, this one marks it like an appointment. -->
  <div
    class="calw"
    :class="{ 'is-active': active, 'is-kh': khmer }"
    :style="{ '--cal-t0': `${t0}s`, '--cal-on-marker': markerInk }"
  >
    <div class="calw__head">
      <span class="calw__month" :style="{ fontFamily: displayFont }">{{ model.month }}</span>
      <span class="calw__year" :style="{ fontFamily: textFont }">{{ model.year }}</span>
    </div>

    <div class="calw__weekdays" :style="{ fontFamily: textFont }" aria-hidden="true">
      <span v-for="(label, i) in model.weekdayLabels" :key="`wd-${i}`">{{ label }}</span>
    </div>

    <div class="calw__sheet" role="table" :aria-label="model.heading" :style="{ fontFamily: textFont }">
      <template v-for="(week, row) in model.weeks" :key="`row-${row}`">
        <div
          v-for="(cell, col) in week"
          :key="`cell-${row}-${col}`"
          class="calw__cell"
          :class="{ 'is-event': cell?.isEvent }"
          role="cell"
        >
          <span v-if="cell" class="calw__num">{{ cell.label }}</span>
          <span v-if="cell?.isEvent" class="calw__stamp" aria-hidden="true">
            <span>{{ cell.label }}</span>
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarStyleProps } from './types'

defineProps<CalendarStyleProps>()
</script>

<style scoped>
.calw {
  --calw-rule: color-mix(in srgb, currentColor 30%, transparent);
  --cal-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

  width: 100%;
  text-align: left;
}

.calw__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1em;
  padding: 0 0.15em 0.55em;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 450ms var(--cal-ease-out) calc(var(--cal-t0) + 0.1s),
    transform 450ms var(--cal-ease-out) calc(var(--cal-t0) + 0.1s);
}

.calw__month {
  font-size: 1.75em;
  line-height: 1.15;
}

.calw__year {
  font-size: 0.8em;
  letter-spacing: 0.18em;
  opacity: 0.7;
}

.calw__weekdays,
.calw__sheet {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calw__weekdays {
  padding-bottom: 0.4em;
  font-size: 0.625em;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  opacity: 0;
  transition: opacity 400ms var(--cal-ease-out) calc(var(--cal-t0) + 0.2s);
}

/* The rules: the sheet draws its top and left edge, every box its right and
   bottom, so each line is drawn exactly once and the grid never doubles up. */
.calw__sheet {
  border-top: 1px solid var(--calw-rule);
  border-left: 1px solid var(--calw-rule);
  /* The page is revealed top to bottom, rules and numbers together, as one
     sheet coming down rather than 35 boxes arriving one at a time. */
  clip-path: inset(0 0 100% 0);
  transition: clip-path 750ms var(--cal-ease-out) calc(var(--cal-t0) + 0.2s);
}

.calw__cell {
  position: relative;
  aspect-ratio: 1 / 0.9;
  border-right: 1px solid var(--calw-rule);
  border-bottom: 1px solid var(--calw-rule);
}

.calw__num {
  position: absolute;
  top: 0.3em;
  left: 0.35em;
  font-size: 0.72em;
  line-height: 1;
  opacity: 0.8;
}

.is-kh .calw__num {
  line-height: 1.3;
}

.calw__cell.is-event .calw__num {
  visibility: hidden;
}

/* The stamp: a solid square of the marker colour, pressed a few degrees off
   true like one done by hand. It arrives after the page has come down —
   large and faint, then set down hard with the slightest bounce. */
.calw__stamp {
  position: absolute;
  inset: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.3em;
  background: var(--details-marker-color, #b3261e);
  color: var(--cal-on-marker);
  font-size: 1.05em;
  font-weight: 700;
  line-height: 1;
  opacity: 0;
  transform: scale(1.6) rotate(-10deg);
  transition:
    opacity 180ms ease-out calc(var(--cal-t0) + 1s),
    transform 320ms cubic-bezier(0.34, 1.4, 0.64, 1) calc(var(--cal-t0) + 1s);
}

.is-active .calw__head {
  opacity: 1;
  transform: none;
}

.is-active .calw__weekdays {
  opacity: 0.7;
}

.is-active .calw__sheet {
  clip-path: inset(0);
}

.is-active .calw__stamp {
  opacity: 1;
  transform: rotate(-4deg);
}

@media (prefers-reduced-motion: reduce) {
  .calw__head {
    transform: none;
  }

  /* Still pressed a few degrees off true — a resting angle is not motion. */
  .calw__stamp,
  .is-active .calw__stamp {
    transform: rotate(-4deg);
  }

  .calw__sheet {
    clip-path: none;
    opacity: 0;
    transition: opacity 400ms ease calc(var(--cal-t0) + 0.2s);
  }

  .is-active .calw__sheet {
    opacity: 1;
  }
}
</style>
