<template>
  <!-- A split-flap board, the kind a station departures hall counts down on:
       each digit its own flap in the template's ink, the three units grouped,
       each captioned underneath. It arrives blank — every flap on zero — and
       turns over to the count once the tiles have landed, which is the one
       time it moves until the minute changes. -->
  <div class="cdf" :class="{ 'is-revealed': revealed }">
    <div class="cdf__board" :style="{ fontFamily: textFont }">
      <div v-for="(unit, u) in units" :key="unit.key" class="cdf__group">
        <span class="cdf__digits" :aria-label="`${unit.value} ${unit.label}`" role="img">
          <FlipDigit
            v-for="(digit, d) in digitsOf(unit)"
            :key="d"
            class="cdf__tile"
            :style="{ '--t': tileIndex(u, d) }"
            :digit="digit"
            :delay="tileIndex(u, d) * 70"
          />
        </span>
        <span class="cdf__unit" :class="{ 'is-khmer': khmer }">{{ unit.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import FlipDigit from './FlipDigit.vue'
import type { CountdownDesignProps, CountdownUnit } from '../types'

const props = defineProps<CountdownDesignProps>()

/**
 * Flips from its blank board to the count once the tiles have landed. Before
 * that every digit reads zero — in the event's own numerals, so the Khmer
 * board turns from ០ to its figures rather than from a Latin 0.
 */
const counting = ref(false)
let settle: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.revealed,
  (revealed) => {
    if (!revealed || counting.value) return
    settle = setTimeout(() => (counting.value = true), 520)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (settle) clearTimeout(settle)
})

const zero = computed(() => (props.khmer ? '០' : '0'))

const digitsOf = (unit: CountdownUnit): string[] => {
  const digits = [...unit.value]
  return counting.value ? digits : digits.map(() => zero.value)
}

/** Position across the whole board, so the stagger runs left to right. */
const tileIndex = (unitIndex: number, digitIndex: number): number =>
  props.units.slice(0, unitIndex).reduce((sum, unit) => sum + [...unit.value].length, 0) +
  digitIndex
</script>

<style scoped>
.cdf {
  display: flex;
  justify-content: center;
  width: 100%;
  color: var(--crs-ink);
}

.cdf__board {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: clamp(0.7rem, 3.6vw, 1.15rem);
  font-size: clamp(1.6rem, 7.6vw, 2.4rem);
  font-weight: 600;
}

.cdf__group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
}

.cdf__digits {
  display: flex;
  gap: 0.09em;
}

/* Each tile lands on its own, left to right — the board being set up. */
.cdf__tile {
  opacity: 0;
  transform: translateY(0.3em) scale(0.96);
  transition:
    opacity 460ms var(--crs-ease-out) calc(var(--t) * 45ms),
    transform 460ms var(--crs-ease-out) calc(var(--t) * 45ms);
}

.is-revealed .cdf__tile {
  opacity: 1;
  transform: none;
}

.cdf__unit {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  line-height: 1.4;
  color: color-mix(in srgb, var(--crs-ink) 72%, transparent);
  opacity: 0;
  transition: opacity 500ms var(--crs-ease-out) 380ms;
}

.is-revealed .cdf__unit {
  opacity: 1;
}

.cdf__unit.is-khmer {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.7;
}

@media (prefers-reduced-motion: reduce) {
  .cdf__tile {
    transform: none;
  }
}
</style>
