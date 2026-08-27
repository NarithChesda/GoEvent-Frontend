<template>
  <div class="std std-columns" :class="{ 'is-revealed': revealed }">
    <p class="std-eyebrow col-label std-rise" :class="inkClass">{{ label }}</p>

    <!-- Month, day, year — so the day sits in the middle track and the whole row
         is centred on it, the way the info card's `flanked` date is centred on
         its own day numeral. -->
    <div v-if="parts" class="col-row">
      <span class="col-cell col-cell-1" :class="inkClass">{{ parts.monthShort }}</span>
      <span class="col-divider" aria-hidden="true" />
      <span class="col-cell col-cell-2" :class="inkClass">{{ parts.day }}</span>
      <span class="col-divider" aria-hidden="true" />
      <span class="col-cell col-cell-3" :class="inkClass">{{ parts.year }}</span>
    </div>

    <p v-if="parts" class="std-longdate col-weekday std-rise" :class="inkClass">
      {{ parts.weekday }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SaveTheDateDesignProps } from '../types'

/**
 * `columns` — the date broken into `month | day | year`, three cells of equal
 * weight divided by vertical hairlines, under a tracked eyebrow and over the
 * weekday.
 *
 * Where `engraved` runs the date together as one numeral with the separators
 * set *in the type* (`06 · 12 · 2026`), this sets them in the *layout*. That
 * makes the three pieces legible at a glance without the block getting taller,
 * and it is the only design in the set with any horizontal structure — worth
 * having, because a centred column of centred lines is what all five others are.
 *
 * The day is the hero and the month and year are labels around it. That is not
 * decoration: the row is *centred on the day*, and a centred element that isn't
 * the focal point reads as a mistake rather than as restraint. Set at equal
 * weight the month won instead, because three capitals are a solid cap-height
 * block while a two-digit day in this face's default old-style figures is
 * x-height with a descender. Three levers fix it and none of them is colour —
 * scale (~3x), case and tracking (labels are tracked caps), and lining figures
 * on the row so the day is cap-height in the first place.
 *
 * The row is built the way the info card's `flanked` date is (EventInfo.vue):
 * a content-width centre track between two equal `1fr` tracks whose text is
 * pushed inward. That is what actually centres the row — laying the three cells
 * out at their own widths instead (`DEC` narrow, `2026` wide) hangs the block
 * off-axis from everything stacked above and below it, by a different amount
 * every month. The day takes the centre track so the row is centred on a
 * number rather than on a word that changes length.
 *
 * Its gesture is the **downward draw**: the two dividers grow from their top
 * edge while the cells fade up behind them, left to right. Every other design
 * that draws a line draws it sideways.
 */
const props = defineProps<SaveTheDateDesignProps>()

const inkClass = computed(() => (props.ink === 'metal' ? 'std-metal' : 'std-solid'))
</script>

<style scoped>
.std-columns {
  gap: calc(var(--std-w) * 0.035);
  padding-inline: calc(var(--std-w) * 0.05);
}

.col-label {
  opacity: 0;
}

.is-revealed .col-label {
  animation: stdRise 800ms var(--std-ease-out) var(--std-t0) forwards;
}

/* The centre track is content-width and the two outer ones share what's left
   equally, so the middle cell sits on the block's axis whatever the month and
   year measure. `minmax(0, …)` on all three keeps a long month from forcing the
   row wider than the stage. */
.col-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, auto) 1px minmax(0, 1fr);
  align-items: center;
  gap: 0 calc(var(--std-w) * 0.038);
  width: 100%;
  font-family: var(--std-date-font, var(--std-display));

  /* Lining figures, not the display serif's default old-style ones. Old-style
     is right for figures set *inside* running text and wrong for a date set
     beside capitals: `23` renders with the 2 at x-height and the 3 hanging below
     the baseline, so the day reads smaller than the month's three full-height
     caps and sits visibly low against them. Lining figures are cap-height and
     share the caps' baseline, which is the whole reason the day can hold the
     centre. (`engraved` doesn't need this — every glyph in `07 · 12 · 2026` is a
     figure, so they're consistent with each other.) */
  font-variant-numeric: lining-nums;
  font-feature-settings: 'lnum' 1;
}

.col-cell {
  line-height: 1;
  white-space: nowrap;
  min-width: 0;
  opacity: 0;
  transform: translateY(8px);
}

/* The day is the hero, because it is what the row is centred on — a centred
   element that isn't the focal point reads as a mistake rather than as
   restraint. The ratio to the labels either side is ~3x, a step down from the
   ~3.7x the info card's `flanked` date runs at: this block sits over a
   photograph with a weekday line under it and less room to spend, and past
   about 3x the labels stop reading as part of the same object. */
.col-cell-2 {
  font-size: calc(var(--std-w) * 0.125);
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Month and year are labels, not peers of the day. Case and tracking do as much
   of that work as size does: at label scale, tracked caps read as a caption
   under any amount of ink, which is what stops the month from competing again
   at a smaller size. */
.col-cell-1,
.col-cell-3 {
  font-size: calc(var(--std-w) * 0.042);
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/* The flanking cells face inward rather than centring in their own track, so
   the gap either side of a divider stays the same width as the month and year
   change length. Centred in-track, the row would read as three loose columns
   with the rules floating between them. */
.col-cell-1 {
  text-align: end;
}

.col-cell-3 {
  text-align: start;
}

/* letter-spacing also adds a trailing space after the *last* glyph, so a box
   sized to its own text is that much wider than the glyphs in it. On the month
   that leaves its right edge short of the track edge; on the day — whose track
   is `auto`, i.e. sized to exactly this box — it hangs the numeral half a space
   left of the axis the whole row is built around. The matching negative margin
   cancels it on both, in each one's own em. The year needs none: it is
   start-aligned inside a 1fr track, so a trailing space changes nothing about
   where it begins. */
.col-cell-1 {
  margin-right: -0.2em;
}

.col-cell-2 {
  margin-right: -0.02em;
}

/* Sized to the *day's* cap height, not to the labels' — it is the day these
   rules divide, and a rule cut to the small caps either side would leave the
   numeral standing proud of its own frame. Slightly over cap height so it reads
   as a divider rather than as an underline for the caps. It sits in its own 1px
   grid track, so the draw below can't move the cells either side of it. */
.col-divider {
  width: 1px;
  height: calc(var(--std-w) * 0.105);
  /* The soft ends are a percentage of the rule, so growing it to the day's cap
     height grew them too — at 22/78 only half of a 41px rule was ever at full
     strength and the whole thing read smudged next to crisp type. Tightened so
     the fade is a terminal rather than most of the stroke. */
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--std-ink) 12%,
    var(--std-ink) 88%,
    transparent 100%
  );
  transform: scaleY(0);
  transform-origin: top center;
  opacity: 0;
}

.is-revealed .col-divider {
  animation: colDividerDraw 600ms var(--std-ease-out) calc(var(--std-t0) + 350ms) forwards;
}

@keyframes colDividerDraw {
  to {
    transform: scaleY(1);
    opacity: 0.85;
  }
}

/* 100ms apart — short enough that the row still lands as one event, long enough
   that the eye is led across it left to right instead of being handed all three
   at once. */
.is-revealed .col-cell-1 {
  animation:
    colCellIn 800ms var(--std-ease-out) calc(var(--std-t0) + 450ms) forwards,
    stdSheen 2s ease-in-out calc(var(--std-t0) + 1400ms) forwards;
}

.is-revealed .col-cell-2 {
  animation:
    colCellIn 800ms var(--std-ease-out) calc(var(--std-t0) + 550ms) forwards,
    stdSheen 2s ease-in-out calc(var(--std-t0) + 1500ms) forwards;
}

.is-revealed .col-cell-3 {
  animation:
    colCellIn 800ms var(--std-ease-out) calc(var(--std-t0) + 650ms) forwards,
    stdSheen 2s ease-in-out calc(var(--std-t0) + 1600ms) forwards;
}

@keyframes colCellIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.col-weekday {
  opacity: 0;
}

.is-revealed .col-weekday {
  animation: stdRise 900ms var(--std-ease-out) calc(var(--std-t0) + 900ms) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .col-cell {
    transform: none;
  }

  .is-revealed .col-label {
    animation-delay: 0ms;
  }

  .is-revealed .col-divider {
    animation-duration: 400ms;
    animation-delay: 150ms;
  }

  .is-revealed .col-cell-1,
  .is-revealed .col-cell-2,
  .is-revealed .col-cell-3 {
    animation:
      colCellIn 500ms ease 250ms forwards,
      stdSheen 1ms linear forwards;
  }

  .is-revealed .col-weekday {
    animation-duration: 500ms;
    animation-delay: 450ms;
  }
}
</style>
