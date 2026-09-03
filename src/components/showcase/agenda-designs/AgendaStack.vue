<template>
  <div class="stk">
    <AgendaItemFrame
      v-for="(item, index) in items"
      :key="item.id"
      :agenda-id="item.id"
      :entrance-delay="index * stagger"
      :is-first="index === 0"
      :is-last="index === items.length - 1"
    >
      <div class="stk-card" :style="{ '--agd-delay': `${index * stagger}s` }">
        <div class="stk-badge">
          <div
            v-if="item.icon?.svg_code"
            class="agd-icon stk-glyph"
            v-html="iconSvg(item)"
          />
          <Calendar v-else class="agd-icon agd-icon--fallback stk-glyph" :stroke-width="1.5" />
        </div>

        <div class="stk-copy">
          <span class="stk-chip agd-draws-in" :style="{ fontFamily: bodyFont }">
            {{ timeText(item) || 'Time TBD' }}
          </span>
          <h3
            class="agd-title stk-title capitalize"
            :class="{ 'is-khmer': isKhmer(item) }"
            :style="{ fontFamily: displayFont }"
          >
            {{ item.title || 'Event Activity' }}
          </h3>
        </div>
      </div>
    </AgendaItemFrame>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from 'lucide-vue-next'
import AgendaItemFrame from './AgendaItemFrame.vue'
import { useAgendaDesign } from './useAgendaDesign'
import type { AgendaDesignProps } from './types'

/**
 * `stack` — each activity a soft-tinted rounded card with a filled icon badge
 * and the time on a solid pill. The only design with a material of its own:
 * every other one draws on the invitation's ground, this one puts a surface
 * between them. Rounder, warmer and higher contrast, which is what makes it the
 * birthday answer without hard-coding a category anywhere.
 *
 * **The three tints are one ramp of the template's ink** — card at 6%, badge at
 * 14%, chip solid with white copy — rather than a palette of its own. That last
 * step is white-on-primary, the same contract the day tabs directly above this
 * list already use for their active pill, so the two read as one system and a
 * pale primary fails in one place rather than in two different ways.
 *
 * Its signature gesture is the chip: the card rides the shared reveal, then the
 * pill scales up under it a beat later, so the eye lands on the time. Scaled
 * from 0.92, never from 0 — nothing in the world appears out of nothing.
 */
const props = defineProps<AgendaDesignProps>()

const { displayFont, bodyFont, stagger, iconSvg, timeText, isKhmer } = useAgendaDesign(props)
const items = computed(() => props.items)
</script>

<style scoped>
.stk {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  max-width: 32rem;
  margin-inline: auto;
}

.stk-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem;
  border-radius: 1.25rem;
  background: color-mix(in srgb, var(--agd-ink) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--agd-ink) 10%, transparent);
  transition:
    background-color 0.25s var(--agd-ease-out),
    box-shadow 0.25s var(--agd-ease-out);
}

.stk-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--agd-ink) 14%, transparent);
}

.stk-glyph {
  width: 1.5rem;
  height: 1.5rem;
}

.stk-copy {
  min-width: 0;
  flex: 1;
}

.stk-chip {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: 9999px;
  background: var(--agd-ink);
  color: #ffffff;
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transform-origin: left center;
  animation: stkChip 0.35s var(--agd-ease-out) calc(var(--agd-delay, 0s) + 140ms) both;
}

@keyframes stkChip {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.stk-title {
  margin-top: 0.375rem;
  color: var(--agd-ink);
  font-weight: 400;
  font-size: 0.9375rem;
  line-height: 1.55;
  overflow-wrap: break-word;
}

.stk-title.is-khmer {
  font-size: 0.875rem;
  line-height: 1.85;
}

@media (hover: hover) and (pointer: fine) {
  .stk-card:hover {
    background: color-mix(in srgb, var(--agd-ink) 10%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--agd-ink) 20%, transparent);
  }
}

@media (min-width: 640px) {
  .stk-card {
    gap: 1rem;
    padding: 1rem 1.125rem;
  }

  .stk-badge {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 1.125rem;
  }

  .stk-glyph {
    width: 1.75rem;
    height: 1.75rem;
  }

  .stk-chip {
    font-size: 0.6875rem;
  }

  .stk-title {
    font-size: 1.0625rem;
  }

  .stk-title.is-khmer {
    font-size: 1rem;
  }
}

@media (min-width: 1024px) and (max-width: 1535px) {
  .stk {
    gap: 0.375rem;
    max-width: 22rem;
  }

  .stk-card {
    gap: 0.625rem;
    padding: 0.5rem 0.625rem;
    border-radius: 0.875rem;
  }

  .stk-badge {
    width: 2rem;
    height: 2rem;
    border-radius: 0.625rem;
  }

  .stk-glyph {
    width: 1rem;
    height: 1rem;
  }

  .stk-chip {
    padding: 0.125rem 0.4375rem;
    font-size: 0.5rem;
    letter-spacing: 0.08em;
  }

  .stk-title {
    margin-top: 0.25rem;
    font-size: 0.6875rem;
    line-height: 1.5;
  }

  .stk-title.is-khmer {
    font-size: 0.6875rem;
  }
}
</style>
