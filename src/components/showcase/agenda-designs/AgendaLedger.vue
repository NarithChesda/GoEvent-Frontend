<template>
  <div class="ldg">
    <AgendaItemFrame
      v-for="(item, index) in items"
      :key="item.id"
      :agenda-id="item.id"
      :entrance-delay="index * stagger"
      :is-first="index === 0"
      :is-last="index === items.length - 1"
    >
      <div class="ldg-row" :style="{ '--agd-delay': `${index * stagger}s` }">
        <span class="ldg-rule agd-draws-in" aria-hidden="true" />

        <div class="ldg-clock" :style="{ fontFamily: bodyFont }">
          <span class="ldg-clock__start">{{ clock(item).start }}</span>
          <span v-if="clock(item).end" class="ldg-clock__end">{{ clock(item).end }}</span>
        </div>

        <h3
          class="agd-title ldg-title capitalize"
          :class="{ 'is-khmer': isKhmer(item) }"
          :style="{ fontFamily: displayFont }"
        >
          <span
            v-if="item.icon?.svg_code"
            class="agd-icon ldg-glyph"
            aria-hidden="true"
            v-html="iconSvg(item)"
          />
          <Calendar
            v-else
            class="agd-icon agd-icon--fallback ldg-glyph"
            :stroke-width="1.5"
            aria-hidden="true"
          />
          {{ item.title || 'Event Activity' }}
        </h3>
      </div>
    </AgendaItemFrame>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from 'lucide-vue-next'
import AgendaItemFrame from './AgendaItemFrame.vue'
import { useAgendaDesign } from './useAgendaDesign'
import type { AgendaDesignItem, AgendaDesignProps } from './types'

/**
 * `ledger` — an order of service. The time sets in tabular numerals in a fixed
 * leading column, the title beside it, one hairline rule per row, and the
 * activity icon reduced to a small glyph running ahead of the title.
 *
 * The quietest of the five and by far the densest: no medallion, no connector
 * and two lines per item, so a twelve-activity day still fits a phone screen
 * without scrolling — which is the case every other design here loses. That
 * density is the whole point, so resist adding chrome back to it.
 *
 * **The clock stacks rather than joining.** `06:00 - 07:00` on one line forces
 * the time column wide enough to eat the title's measure on a phone; the start
 * on its own line with the end under it in lighter type keeps the column at
 * roughly four characters and reads as a printed programme besides. That is why
 * this design derives its own time strings instead of using the shared
 * `timeText`, which is built to be one line.
 */
const props = defineProps<AgendaDesignProps>()

const { displayFont, bodyFont, stagger, iconSvg, isKhmer } = useAgendaDesign(props)
const items = computed(() => props.items)

/**
 * Start on the first line, end on the second. An item with only an end time
 * leads with it rather than showing an empty first line — the ledger has no
 * space for a placeholder and a blank row reads as a bug.
 */
const clock = (item: AgendaDesignItem): { start: string; end: string | null } => {
  const start = item.start_time_text?.trim()
  const end = item.end_time_text?.trim()
  if (start && end) return { start, end: `– ${end}` }
  if (start) return { start, end: null }
  if (end) return { start: end, end: null }
  return { start: '—', end: null }
}
</script>

<style scoped>
.ldg {
  max-width: 32rem;
  margin-inline: auto;
}

.ldg-row {
  position: relative;
  display: grid;
  grid-template-columns: 4.25rem 1fr;
  align-items: baseline;
  column-gap: 1rem;
  padding: 0.875rem 0.25rem 0.875rem 0;
}

/* One rule per row, drawn above it. Absolutely positioned so it spans the full
   measure regardless of the two columns' baselines. */
.ldg-rule {
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(
    to right,
    var(--agd-hairline),
    var(--agd-hairline) 72%,
    transparent
  );
  transform-origin: left center;
  animation: ldgRule 0.5s var(--agd-ease-out) var(--agd-delay, 0s) both;
}

@keyframes ldgRule {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

.ldg-clock {
  display: flex;
  flex-direction: column;
  font-variant-numeric: tabular-nums;
  color: var(--agd-ink);
  white-space: nowrap;
}

.ldg-clock__start {
  font-size: 0.9375rem;
  line-height: 1.25;
  letter-spacing: 0.02em;
}

.ldg-clock__end {
  font-size: 0.6875rem;
  line-height: 1.4;
  color: color-mix(in srgb, var(--agd-ink) 55%, transparent);
}

.ldg-title {
  display: block;
  color: var(--agd-ink);
  font-weight: 400;
  font-size: 0.9375rem;
  line-height: 1.55;
  overflow-wrap: break-word;
}

.ldg-title.is-khmer {
  font-size: 0.875rem;
  line-height: 1.85;
}

/* Inline with the title rather than in a column of its own: the icon is the
   organizer's content and shouldn't be dropped, but giving it a third column
   would cost the measure this design exists to protect. */
.ldg-glyph {
  display: inline-block;
  vertical-align: -0.12em;
  width: 1.05em;
  height: 1.05em;
  margin-right: 0.4em;
  opacity: 0.75;
}

@media (hover: hover) and (pointer: fine) {
  .ldg-row {
    transition: background-color 0.25s ease;
    border-radius: 0.5rem;
  }

  .ldg-row:hover {
    background-color: color-mix(in srgb, var(--agd-ink) 4%, transparent);
  }
}

@media (min-width: 640px) {
  .ldg-row {
    grid-template-columns: 5rem 1fr;
    column-gap: 1.25rem;
  }

  .ldg-clock__start {
    font-size: 1.0625rem;
  }

  .ldg-clock__end {
    font-size: 0.75rem;
  }

  .ldg-title {
    font-size: 1.0625rem;
  }

  .ldg-title.is-khmer {
    font-size: 1rem;
  }
}

@media (min-width: 1024px) and (max-width: 1535px) {
  .ldg {
    max-width: 22rem;
  }

  .ldg-row {
    grid-template-columns: 3rem 1fr;
    column-gap: 0.75rem;
    padding: 0.5rem 0.125rem 0.5rem 0;
  }

  .ldg-clock__start {
    font-size: 0.6875rem;
  }

  .ldg-clock__end {
    font-size: 0.5625rem;
  }

  .ldg-title {
    font-size: 0.6875rem;
    line-height: 1.5;
  }

  .ldg-title.is-khmer {
    font-size: 0.6875rem;
  }
}
</style>
