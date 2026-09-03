<template>
  <div class="thread">
    <template v-for="(item, index) in items" :key="item.id">
      <AgendaItemFrame
        :agenda-id="item.id"
        :entrance-delay="index * stagger"
        :is-first="index === 0"
        :is-last="index === items.length - 1"
      >
        <div class="thread-row" :class="{ 'is-mirrored': index % 2 === 1 }">
          <div class="thread-stop">
            <div class="thread-roundel">
              <div
                v-if="item.icon?.svg_code"
                class="agd-icon thread-glyph"
                v-html="iconSvg(item)"
              />
              <Calendar v-else class="agd-icon agd-icon--fallback thread-glyph" :stroke-width="1.25" />
            </div>
          </div>

          <div class="thread-copy">
            <p class="thread-time" :style="{ fontFamily: bodyFont }">
              {{ timeText(item) || 'Time TBD' }}
            </p>
            <h3
              class="agd-title thread-title capitalize"
              :class="{ 'is-khmer': isKhmer(item) }"
              :style="{ fontFamily: displayFont }"
            >
              {{ item.title || 'Event Activity' }}
            </h3>
          </div>
        </div>
      </AgendaItemFrame>

      <!-- The thread itself: one authored curve, mirrored for every other gap,
           so the two stop columns are always joined by the same swing. -->
      <div
        v-if="index < items.length - 1"
        class="thread-link agd-draws-in"
        :class="{ 'is-mirrored': index % 2 === 1 }"
        :style="{ '--agd-delay': `${index * stagger + 0.18}s` }"
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 16" role="presentation" focusable="false">
          <path :d="THREAD_PATH" />
        </svg>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from 'lucide-vue-next'
import AgendaItemFrame from './AgendaItemFrame.vue'
import { useAgendaDesign } from './useAgendaDesign'
import type { AgendaDesignProps } from './types'

/**
 * `thread` — activities alternate sides down the page, each one an icon roundel
 * and its copy mirrored against the row before it, joined by a dotted thread
 * that swings between the two roundels. Borderless: no card, no fill, nothing
 * but the roundel, a tracked time and the title sitting on the invitation's own
 * ground.
 *
 * **The curve is authored once and mirrored.** Both stop columns are at fixed
 * fractions of the row (15% and 85%, `--thr-stop`), so one cubic joins them and
 * every other gap is the same path under `scaleX(-1)`. Anything else — a path
 * per gap, coordinates measured from the DOM — would have to be recomputed on
 * every resize and would drift out of alignment with the roundels the moment a
 * title wrapped to a second line.
 *
 * The SVG scales uniformly (no `preserveAspectRatio="none"`), so the swing gets
 * taller as the column gets wider, which is what keeps it reading as a curve
 * instead of a flattening zigzag. That is also why the design caps its own
 * measure: past ~30rem the gaps grow faster than the content does.
 *
 * Its signature gesture is the thread drawing itself in the direction of travel
 * — a `clip-path` wipe, not a `stroke-dashoffset` one. Offsetting a dashed path
 * marches the dots along it instead of revealing them, which reads as the thread
 * crawling. (The same trap the V2 gold thread documents.)
 */
const props = defineProps<AgendaDesignProps>()

const { displayFont, bodyFont, stagger, iconSvg, timeText, isKhmer } = useAgendaDesign(props)
const items = computed(() => props.items)

/**
 * Left stop → right stop, in the 100×16 design space. The control points sit
 * near the midpoint of the vertical run so the curve leaves each roundel
 * straight down and turns in the middle — a swing, not a diagonal.
 */
const THREAD_PATH = 'M 15 0 C 15 9, 85 7, 85 16'
</script>

<style scoped>
.thread {
  /* The alternating layout wants a narrow measure: it spends horizontal space
     on the swing, and the copy column is only ever ~70% of the row. Past this
     the gaps grow faster than the content does. */
  max-width: 30rem;
  margin-inline: auto;
}

.thread-row {
  --thr-stop: 30%;
  display: grid;
  grid-template-columns: var(--thr-stop) 1fr;
  align-items: center;
  column-gap: 0.5rem;
}

.thread-row.is-mirrored {
  grid-template-columns: 1fr var(--thr-stop);
}

.thread-stop {
  display: flex;
  justify-content: center;
}

.thread-row.is-mirrored .thread-stop {
  grid-column: 2;
  grid-row: 1;
}

.thread-row.is-mirrored .thread-copy {
  grid-column: 1;
  grid-row: 1;
  text-align: right;
}

/* Borderless by design — the roundel is the only enclosed shape, and it is a
   soft disc rather than a ring so it reads as a resting place for the glyph
   instead of a badge. */
.thread-roundel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--agd-ink) 8%, transparent);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--agd-ink) 4%, transparent);
  transition:
    background-color 0.25s var(--agd-ease-out),
    box-shadow 0.25s var(--agd-ease-out);
}

.thread-glyph {
  width: 1.625rem;
  height: 1.625rem;
}

.thread-copy {
  min-width: 0;
}

.thread-time {
  font-size: 0.625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--agd-ink) 65%, transparent);
  white-space: nowrap;
}

.thread-title {
  margin-top: 0.25rem;
  color: var(--agd-ink);
  font-weight: 400;
  font-size: 0.9375rem;
  line-height: 1.5;
  overflow-wrap: break-word;
}

.thread-title.is-khmer {
  font-size: 0.875rem;
  line-height: 1.85;
}

/* The connector: full-width box, uniformly scaled, mirrored on alternate gaps */
.thread-link {
  width: 100%;
  line-height: 0;
}

/* The stops shift left by the arrow gutter inside the editable preview; without
   the same inset here the thread would stop meeting the roundels it joins. */
.agd--editing .thread-link {
  padding-right: var(--agd-gutter, 0);
}

.thread-link svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.thread-link.is-mirrored svg {
  transform: scaleX(-1);
}

.thread-link path {
  fill: none;
  stroke: color-mix(in srgb, var(--agd-ink) 55%, transparent);
  /* Authored in the 100-unit design space: ~1.2px of stroke and a 1.4/6.8px dot
     rhythm at a 340px phone column, scaling with the measure from there. */
  stroke-width: 0.35;
  stroke-linecap: round;
  stroke-dasharray: 0.4 2;
}

/* Draw the thread in the direction it travels. A clip wipe, not a dash offset:
   offsetting a dashed path marches the dots rather than revealing them. */
.thread-link {
  animation: thrDraw 0.55s var(--agd-ease-out) var(--agd-delay, 0s) both;
}

.thread-link.is-mirrored {
  animation-name: thrDrawMirrored;
}

@keyframes thrDraw {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes thrDrawMirrored {
  from {
    clip-path: inset(0 0 0 100%);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

@media (hover: hover) and (pointer: fine) {
  .thread-row:hover .thread-roundel {
    background: color-mix(in srgb, var(--agd-ink) 14%, transparent);
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--agd-ink) 6%, transparent);
  }
}

@media (min-width: 640px) {
  .thread-roundel {
    width: 3.75rem;
    height: 3.75rem;
  }

  .thread-glyph {
    width: 1.875rem;
    height: 1.875rem;
  }

  .thread-time {
    font-size: 0.6875rem;
  }

  .thread-title {
    font-size: 1.0625rem;
  }

  .thread-title.is-khmer {
    font-size: 1rem;
  }
}

/* Narrow phones: the stop column takes a bigger share of a small row, so pull
   it back before the copy is squeezed into two-word lines. */
@media (max-width: 359px) {
  .thread-row {
    --thr-stop: 26%;
  }

  .thread-roundel {
    width: 2.75rem;
    height: 2.75rem;
  }

  .thread-glyph {
    width: 1.375rem;
    height: 1.375rem;
  }
}

/* Laptop showcase frames render the card at a fraction of its mobile scale */
@media (min-width: 1024px) and (max-width: 1535px) {
  .thread {
    max-width: 22rem;
  }

  .thread-roundel {
    width: 2.25rem;
    height: 2.25rem;
  }

  .thread-glyph {
    width: 1.125rem;
    height: 1.125rem;
  }

  .thread-time {
    font-size: 0.5rem;
    letter-spacing: 0.14em;
  }

  .thread-title {
    font-size: 0.6875rem;
    line-height: 1.5;
  }

  .thread-title.is-khmer {
    font-size: 0.6875rem;
  }
}
</style>
