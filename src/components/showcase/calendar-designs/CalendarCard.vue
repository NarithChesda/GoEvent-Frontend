<template>
  <!-- A paper calendar card floating on the page, clipped at the top: the year
       circled by hand in the corner, the month set as large as the card allows,
       then a plain grid of numbers with no rules at all. Where the others are
       drawn onto the invitation, this one is an object laid on it — which is
       why it is the one style with a surface, a shadow and a corner radius the
       template chooses. The day is circled in the same hand as the year, so the
       only marks on the card read as someone having picked it up and marked it. -->
  <div
    class="calp"
    :class="[`calp--${paperTone ?? 'light'}`, { 'is-active': active, 'is-kh': khmer }]"
    :style="{
      '--cal-t0': `${t0}s`,
      '--calp-radius': `${cardRadius ?? 0}px`,
      '--calp-paper': cardColor ?? '#ffffff',
      '--calp-ink': cardInk ?? 'currentColor',
    }"
  >
    <div class="calp__card">
      <svg class="calp__clip" viewBox="0 0 24 64" aria-hidden="true">
        <path d="M10 20V48a5 5 0 0 0 10 0V10a8 8 0 0 0-16 0V52" />
      </svg>

      <div class="calp__year">
        <span :style="{ fontFamily: displayFont }">{{ model.year }}</span>
        <svg class="calp__loop calp__loop--year" viewBox="0 0 100 60" aria-hidden="true">
          <path :d="LOOP" pathLength="100" />
        </svg>
      </div>

      <div
        ref="monthRef"
        class="calp__month"
        :class="finishClass"
        :style="{
          fontFamily: displayFont,
          fontSize: fittedMonthPx ? `${fittedMonthPx}px` : monthSize,
        }"
      >
        <span ref="monthTextRef" class="calp__month-text"><span class="tfx-ink">{{ model.month }}</span></span>
      </div>

      <div class="calp__weekdays" :style="{ fontFamily: textFont }" aria-hidden="true">
        <span v-for="(label, i) in weekdayInitials" :key="`wd-${i}`">{{ label }}</span>
      </div>

      <div class="calp__grid" role="table" :aria-label="model.heading" :style="{ fontFamily: textFont }">
        <template v-for="(cell, i) in cells" :key="`c-${i}`">
          <span v-if="!cell" class="calp__cell" role="cell" />
          <span
            v-else
            class="calp__cell"
            :class="{ 'is-event': cell.isEvent }"
            :style="{ '--i': i }"
            role="cell"
          >
            <span class="calp__num">{{ cell.label }}</span>
            <svg v-if="cell.isEvent" class="calp__loop calp__loop--day" viewBox="0 0 100 60" aria-hidden="true">
              <path :d="LOOP" pathLength="100" />
            </svg>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { countGraphemes } from '@/utils/graphemes'
import type { CalendarStyleProps } from './types'

const props = defineProps<CalendarStyleProps>()

/**
 * One pen loop, used for both marks: round from the top right, down the left,
 * along the bottom and back up past where it started, so the ends cross the
 * way a hand-drawn circle's do. Drawing the year and the day with the same
 * stroke is what makes them read as one person's marks.
 */
const LOOP = 'M64 7C34 1 5 13 7 32c2 18 38 26 66 20 22-5 26-26 12-38C74 5 52 4 34 10'

/** Every cell of the month, leading and trailing blanks included. */
const cells = computed(() => props.model.weeks.flat())

/**
 * A single letter per weekday, as a wall card prints them. Khmer day names do
 * not shorten to one letter — the first consonant of each is not an
 * abbreviation anyone reads — so Khmer keeps its short names.
 */
const weekdayInitials = computed(() =>
  props.khmer
    ? props.model.weekdayLabels
    : props.model.weekdayLabels.map((label) => [...label][0]?.toUpperCase() ?? ''),
)

/**
 * The month is set to fill the card's width, as the reference card's is. The
 * face is the template's, and a condensed display serif and an extended one
 * set "SEPTEMBER" at very different widths, so no size chosen in advance can
 * do that — it is measured.
 *
 * `monthSize` is only the first paint (and the fallback where nothing can be
 * measured): an estimate from how many marks the month has. Once laid out,
 * `fit()` scales that by how far the text falls short of or runs past the
 * card, and caps short months so "May" is not a poster. Measured again when
 * the template's fonts arrive, since the estimate was laid out in a fallback
 * face, and whenever the card changes width.
 */
const monthSize = computed(() => {
  const count = countGraphemes(props.model.month)
  // A Khmer cluster is about an em wide; a Latin capital about 0.72 of one.
  const perMark = props.khmer ? 1 : 0.72
  return `${Math.min(15, 76 / Math.max(3, count * perMark))}cqw`
})

const monthRef = ref<HTMLElement | null>(null)
const monthTextRef = ref<HTMLElement | null>(null)
const fittedMonthPx = ref<number | null>(null)

/** Share of the card's inner width the month may fill. */
const MONTH_FILL = 0.92
/** Ceiling on the month's size, as a share of the inner width — Khmer's
 *  stacked marks make a tall line far sooner than Latin capitals do. */
const monthCap = () => (props.khmer ? 0.2 : 0.24)

const fit = () => {
  const box = monthRef.value
  const text = monthTextRef.value
  if (!box || !text) return
  const available = box.clientWidth
  const natural = text.getBoundingClientRect().width
  const current = parseFloat(getComputedStyle(box).fontSize)
  if (!available || !natural || !current) return
  // Width is proportional to size, so one measurement gives the answer.
  fittedMonthPx.value = Math.min(
    (current * available * MONTH_FILL) / natural,
    available * monthCap(),
  )
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  requestAnimationFrame(fit)
  document.fonts?.ready.then(() => requestAnimationFrame(fit)).catch(() => {})
  if (typeof ResizeObserver !== 'undefined' && monthRef.value) {
    resizeObserver = new ResizeObserver(() => fit())
    resizeObserver.observe(monthRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

// A language switch or another event changes the word; the box does not, so
// the observer would not notice.
watch(
  () => [props.model.month, props.displayFont],
  () => {
    fittedMonthPx.value = null
    nextTick(() => requestAnimationFrame(fit))
  },
)
</script>

<style scoped>
.calp {
  --cal-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  /* The marks that are not the event: the clip and the year's circle. The
     marker colour is spent once, on the day. */
  --calp-pencil: color-mix(in srgb, currentColor 42%, transparent);

  display: flex;
  justify-content: center;
  width: 100%;
  /* Room for the clip, which stands above the card's top edge. */
  padding: 1.4em 0 0.4em;
}

/* The paper is the template's colour (white by default) and the ink is chosen
   to read on it — the template's own ink, unless that would drop under 3:1 on
   this paper (see cardInkFor). Setting `color` here re-inks everything on the
   card at once: the month, the numbers, and the clip and year circle, which
   are mixed from currentColor. */
.calp__card {
  position: relative;
  container-type: inline-size;
  width: min(100%, 18em);
  padding: 3.4em 1.5em 2.1em;
  border-radius: var(--calp-radius);
  background: var(--calp-paper);
  color: var(--calp-ink);
  text-align: center;
}

/* A lighter card needs only a soft lift; a dark one needs more shadow to leave
   the page at all. The hairline keeps a white card's edge on a white page.
   The lift is the invitation's paper lift (stationery.ts → PAPER_SHADOW),
   which EventInfo passes down as --st-paper-shadow so the reply card and the
   map's polaroid below sit on the page exactly as this card does; the values
   here are the same numbers, for a caller that passes nothing. */
.calp--light .calp__card {
  box-shadow: var(
    --st-paper-shadow,
    inset 0 0 0 1px color-mix(in srgb, currentColor 8%, transparent),
    0 1px 2px rgb(0 0 0 / 0.06),
    0 16px 36px -16px rgb(0 0 0 / 0.3)
  );
}

.calp--dark .calp__card {
  box-shadow: var(
    --st-paper-shadow,
    inset 0 0 0 1px color-mix(in srgb, currentColor 16%, transparent),
    0 1px 2px rgb(0 0 0 / 0.2),
    0 18px 40px -16px rgb(0 0 0 / 0.55)
  );
}

/* Clipped over the top edge, a few degrees off true. It is put on after the
   card has landed: it drops the last few pixels onto the edge. */
.calp__clip {
  position: absolute;
  top: -1.55em;
  left: 1.35em;
  width: 1.25em;
  height: 3.4em;
  overflow: visible;
  fill: none;
  stroke: var(--calp-pencil);
  stroke-width: 2.2;
  stroke-linecap: round;
  opacity: 0;
  transform: translateY(-0.5em) rotate(-8deg);
  transition:
    opacity 250ms ease-out calc(var(--cal-t0) + 0.05s),
    transform 380ms cubic-bezier(0.34, 1.4, 0.64, 1) calc(var(--cal-t0) + 0.05s);
}

.calp__year {
  position: absolute;
  top: 0.95em;
  right: 1.15em;
  padding: 0.15em 0.55em;
  transform: rotate(-7deg);
}

.calp__year span {
  position: relative;
  z-index: 1;
  font-size: 1.05em;
  font-style: italic;
}

/* The size is set inline (measured, see fit()). No margin here: an `em` on
   this element is the month's own, so the gap under it would grow with the
   month. The weekday row below holds the gap instead, in the card's scale. */
.calp__month {
  line-height: 1.1;
  text-transform: uppercase;
  white-space: nowrap;
}

.calp__month-text {
  display: inline-block;
}

.is-kh .calp__month {
  line-height: 1.35;
}

.calp__weekdays,
.calp__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calp__weekdays {
  margin-top: 1.5em;
  margin-bottom: 0.7em;
  font-size: 0.72em;
  font-weight: 700;
}

.is-kh .calp__weekdays {
  font-weight: 400;
}

.calp__grid {
  row-gap: 0.55em;
  font-size: 0.8em;
}

.calp__cell {
  position: relative;
  line-height: 1.6;
}

.calp__num {
  position: relative;
  z-index: 1;
}

.calp__cell.is-event .calp__num {
  font-weight: 700;
}

/* Numbers come in with the card, row by row in reading order, fast enough
   that the month is whole before the pen reaches the day. */
.calp__weekdays,
.calp__cell {
  opacity: 0;
  transition: opacity 350ms ease-out;
  transition-delay: calc(var(--cal-t0) + 0.1s + var(--i, 0) * 9ms);
}

/* The pen loop. A dashed draw on pathLength 100, never
   `vector-effect: non-scaling-stroke` — it breaks this in Chromium (see the
   arch design); the loop's box keeps its aspect, so the stroke scales evenly. */
.calp__loop {
  position: absolute;
  overflow: visible;
  fill: none;
  stroke-linecap: round;
  pointer-events: none;
}

.calp__loop path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
}

.calp__loop--year {
  inset: -38% -14%;
  stroke: var(--calp-pencil);
  stroke-width: 2;
}

.calp__loop--year path {
  transition: stroke-dashoffset 650ms var(--cal-ease-out) calc(var(--cal-t0) + 0.35s);
}

/* The day: the same loop in the marker colour, a little heavier, drawn last
   and slowly — the one mark the card exists to carry. */
.calp__loop--day {
  left: 50%;
  top: 50%;
  width: 2.7em;
  height: 1.75em;
  transform: translate(-50%, -50%) rotate(-6deg);
  stroke: var(--details-marker-color, #b3261e);
  stroke-width: 3.2;
}

.calp__loop--day path {
  transition: stroke-dashoffset 900ms cubic-bezier(0.65, 0, 0.35, 1) calc(var(--cal-t0) + 0.8s);
}

.is-active .calp__clip {
  opacity: 1;
  transform: rotate(-8deg);
}

.is-active .calp__weekdays {
  opacity: 0.85;
}

.is-active .calp__cell {
  opacity: 1;
}

.is-active .calp__loop path {
  stroke-dashoffset: 0;
}

@media (prefers-reduced-motion: reduce) {
  .calp__clip {
    transform: rotate(-8deg);
  }

  .calp__loop path {
    stroke-dashoffset: 0;
    transition: none;
  }
}
</style>
