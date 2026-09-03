<template>
  <div class="rail">
    <AgendaItemFrame
      v-for="(item, index) in items"
      :key="item.id"
      :agenda-id="item.id"
      :entrance-delay="index * stagger"
      :is-first="index === 0"
      :is-last="index === items.length - 1"
    >
      <div
        class="rail-row"
        :class="{ 'is-first': index === 0, 'is-last': index === items.length - 1 }"
      >
        <!-- Timeline rail: icon medallion sitting on a continuous hairline spine -->
        <div class="rail-spine">
          <span class="rail-line rail-line--top"></span>
          <div class="rail-medallion">
            <div
              v-if="item.icon?.svg_code"
              class="agd-icon rail-glyph"
              v-html="iconSvg(item)"
            />
            <Calendar v-else class="agd-icon agd-icon--fallback rail-glyph" :stroke-width="1.25" />
          </div>
          <span class="rail-line rail-line--bottom"></span>
        </div>

        <div class="rail-content">
          <div class="rail-time" :style="{ fontFamily: bodyFont }">
            <span>{{ timeText(item) || 'Time TBD' }}</span>
            <span class="rail-time__rule"></span>
          </div>
          <h3
            class="agd-title rail-title capitalize"
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
 * `rail` — the default, and byte-for-byte the agenda every template renders
 * today. A continuous hairline spine runs the leading edge with one medallion
 * per item sitting on it; the time is a tracked overline closed by a fading
 * rule, the title sits under it. Borderless, left-aligned, and the only design
 * whose connector is a straight line.
 *
 * Its motion is exactly the shared scroll-driven scale/fade in the frame — no
 * signature gesture of its own, because this is the composition every existing
 * event is already looking at and a new flourish here would change live pages.
 */
const props = defineProps<AgendaDesignProps>()

const { displayFont, bodyFont, stagger, iconSvg, timeText, isKhmer } = useAgendaDesign(props)
const items = computed(() => props.items)
</script>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
}

.rail-row {
  display: flex;
  gap: 0.875rem;
}

.rail-spine {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 3.5rem;
}

.rail-line {
  width: 1px;
  flex: 1;
  min-height: 0.625rem;
  background-color: var(--agd-hairline);
}

/* Fade the spine in and out at the ends of the list, so it reads as a drawn
   line rather than one that was cut off by the section's padding. */
.rail-row.is-first .rail-line--top {
  background: linear-gradient(to bottom, transparent, var(--agd-hairline));
}

.rail-row.is-last .rail-line--bottom {
  background: linear-gradient(to bottom, var(--agd-hairline), transparent);
}

/* Soft fill, hairline inner ring, faint outer halo */
.rail-medallion {
  position: relative;
  width: 3.5rem;
  height: 3.5rem;
  margin: 0.5rem 0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--agd-ink);
  background-color: color-mix(in srgb, var(--agd-ink) 7%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--agd-ink) 22%, transparent);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.rail-medallion::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 9999px;
  border: 1px solid var(--agd-hairline-soft);
}

.rail-glyph {
  width: 1.75rem;
  height: 1.75rem;
}

.rail-content {
  flex: 1;
  min-width: 0;
  align-self: center;
  padding: 0.875rem 1rem 0.875rem 0.75rem;
  border-radius: 1.125rem;
  transition: background-color 0.3s ease;
}

.rail-time {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.6875rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--agd-ink) 70%, transparent);
  white-space: nowrap;
}

.rail-time__rule {
  flex: 1;
  max-width: 4.5rem;
  height: 1px;
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--agd-ink) 30%, transparent),
    transparent
  );
}

.rail-title {
  margin-top: 0.375rem;
  color: var(--agd-ink);
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.65;
  overflow-wrap: break-word;
}

.rail-title.is-khmer {
  font-size: 0.9375rem;
  line-height: 1.9;
}

@media (min-width: 640px) {
  .rail-title {
    font-size: 1.125rem;
  }

  .rail-title.is-khmer {
    font-size: 1rem;
  }
}

/* Gentle hover treatment on fine pointers only — a touch device fires hover on
   tap, which would light the medallion up as the guest scrolls past it. */
@media (hover: hover) and (pointer: fine) {
  .rail-row:hover .rail-medallion {
    background-color: color-mix(in srgb, var(--agd-ink) 13%, transparent);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--agd-ink) 35%, transparent),
      0 8px 20px -8px color-mix(in srgb, var(--agd-ink) 45%, transparent);
  }

  .rail-row:hover .rail-content {
    background-color: color-mix(in srgb, var(--agd-ink) 5%, transparent);
  }
}

/* Mobile (<640px) */
@media (max-width: 639px) {
  .rail-row {
    gap: 0.75rem;
  }

  .rail-spine {
    width: 2.75rem;
  }

  .rail-medallion {
    width: 2.75rem;
    height: 2.75rem;
    margin: 0.375rem 0;
  }

  .rail-medallion::after {
    inset: -3px;
  }

  .rail-glyph {
    width: 1.375rem;
    height: 1.375rem;
  }

  .rail-content {
    padding: 0.75rem 0.75rem 0.75rem 0.5rem;
  }

  .rail-time {
    font-size: 0.625rem;
    letter-spacing: 0.14em;
    gap: 0.5rem;
  }
}

/* Small laptops 13-inch (1024px-1365px) — compact showcase card scale */
@media (min-width: 1024px) and (max-width: 1365px) {
  .rail-row {
    gap: 0.625rem;
  }

  .rail-spine {
    width: 2.25rem;
  }

  .rail-medallion {
    width: 2.25rem;
    height: 2.25rem;
    margin: 0.3125rem 0;
  }

  .rail-medallion::after {
    inset: -3px;
  }

  .rail-glyph {
    width: 1.125rem;
    height: 1.125rem;
  }

  .rail-content {
    padding: 0.5rem 0.625rem;
    border-radius: 0.75rem;
  }

  .rail-time {
    font-size: 0.5625rem;
    gap: 0.5rem;
  }

  .rail-time__rule {
    max-width: 3rem;
  }

  .rail-title {
    margin-top: 0.25rem;
    font-size: 0.6875rem;
    line-height: 1.6;
  }

  .rail-title.is-khmer {
    font-size: 0.6875rem;
    line-height: 1.8;
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) */
@media (min-width: 1366px) and (max-width: 1535px) {
  .rail-row {
    gap: 0.75rem;
  }

  .rail-spine {
    width: 2.5rem;
  }

  .rail-medallion {
    width: 2.5rem;
    height: 2.5rem;
    margin: 0.375rem 0;
  }

  .rail-medallion::after {
    inset: -3px;
  }

  .rail-glyph {
    width: 1.25rem;
    height: 1.25rem;
  }

  .rail-content {
    padding: 0.625rem 0.75rem;
    border-radius: 0.875rem;
  }

  .rail-time {
    font-size: 0.625rem;
    gap: 0.5rem;
  }

  .rail-time__rule {
    max-width: 3.5rem;
  }

  .rail-title {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    line-height: 1.6;
  }

  .rail-title.is-khmer {
    font-size: 0.75rem;
    line-height: 1.8;
  }
}
</style>
