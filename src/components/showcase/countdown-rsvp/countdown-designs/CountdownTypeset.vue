<template>
  <!-- The count as print: an eyebrow, then the figures set between two
       hairlines — the numerals in the display face, the units small and
       lower-case on their baseline, a lozenge between hours and minutes. The
       quiet one, for templates whose date is itself type rather than an
       object (the flanked and arch date designs, the engraved card). -->
  <div class="cdt" :class="{ 'is-revealed': revealed }">
    <span class="cdt__eyebrow" :class="{ 'is-khmer': khmer }" :style="{ fontFamily: textFont }">
      {{ header }}
    </span>

    <span class="cdt__rule" aria-hidden="true" />

    <!-- Two tiers, not one line that wraps: three figures at display size do
         not fit a phone's column in any script, and a wrap left a lozenge
         hanging at the end of the first line. So the days lead — the figure a
         guest reads first — and the hours and minutes follow as a smaller
         line of their own, with the lozenge between them. -->
    <p class="cdt__lines">
      <span v-if="lead" class="cdt__figure cdt__figure--lead" :style="{ '--i': 0 }">
        <span class="cdt__num" :class="fx('primary')" :style="{ fontFamily: displayFont }">
          <RollingNumber :value="lead.value" />
        </span>
        <span class="cdt__unit" :class="{ 'is-khmer': khmer }" :style="{ fontFamily: textFont }">
          {{ lead.label }}
        </span>
      </span>
      <span class="cdt__rest">
        <template v-for="(unit, index) in rest" :key="unit.key">
          <span
            v-if="index > 0"
            class="cdt__mark"
            :style="{ '--i': index + 0.5 }"
            aria-hidden="true"
          />
          <span class="cdt__figure" :style="{ '--i': index + 1 }">
            <span class="cdt__num" :class="fx('primary')" :style="{ fontFamily: displayFont }">
              <RollingNumber :value="unit.value" />
            </span>
            <span class="cdt__unit" :class="{ 'is-khmer': khmer }" :style="{ fontFamily: textFont }">
              {{ unit.label }}
            </span>
          </span>
        </template>
      </span>
    </p>

    <span class="cdt__rule cdt__rule--foot" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTextEffect } from '@/composables/showcase/useTextEffects'
import RollingNumber from '../RollingNumber.vue'
import type { CountdownDesignProps } from '../types'

const props = defineProps<CountdownDesignProps>()

const lead = computed(() => props.units[0])
const rest = computed(() => props.units.slice(1))

// The figures are this design's display type, in the primary slot.
const fx = useTextEffect()
</script>

<style scoped>
.cdt {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  color: var(--crs-ink);
  text-align: center;
}

.cdt__eyebrow {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  line-height: 1.4;
  color: color-mix(in srgb, var(--crs-ink) 62%, transparent);
  margin-bottom: 0.9rem;
  opacity: 0;
  transition: opacity 600ms var(--crs-ease-out);
}

.cdt__eyebrow.is-khmer {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.7;
}

/* Two rules the width of a printed measure, each drawn out from its centre —
   the same gesture the flanked date's rules and the engraved card's mark use. */
.cdt__rule {
  display: block;
  width: min(18rem, 78%);
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    color-mix(in srgb, var(--crs-ink) 42%, transparent) 18%,
    color-mix(in srgb, var(--crs-ink) 42%, transparent) 82%,
    transparent
  );
  transform: scaleX(0);
  transition: transform 900ms var(--crs-ease-out) 180ms;
}

.cdt__rule--foot {
  transition-delay: 260ms;
}

.cdt__lines {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  margin: 0;
  padding: 0.85rem 0.5rem 1.05rem;
}

.cdt__rest {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem 0.8rem;
}

/* Each figure settles out of a slight blur, one after the other: a blur
   bridges the jump from nothing to type that opacity alone makes abrupt. */
.cdt__figure {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  opacity: 0;
  filter: blur(4px);
  transform: translateY(6px);
  transition:
    opacity 700ms var(--crs-ease-out) calc(420ms + var(--i) * 110ms),
    filter 700ms var(--crs-ease-out) calc(420ms + var(--i) * 110ms),
    transform 700ms var(--crs-ease-out) calc(420ms + var(--i) * 110ms);
}

.cdt__num {
  font-size: clamp(1.6rem, 7vw, 2.1rem);
  line-height: 1.15;
}

.cdt__figure--lead .cdt__num {
  font-size: clamp(3.1rem, 15vw, 4.25rem);
  line-height: 1.05;
}

.cdt__unit {
  font-size: 0.875rem;
  letter-spacing: 0.03em;
  text-transform: lowercase;
  color: color-mix(in srgb, var(--crs-ink) 74%, transparent);
}

.cdt__unit.is-khmer {
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.7;
}

/* A small lozenge between figures, in the accent — the one spend of it. */
.cdt__mark {
  align-self: center;
  width: 0.3rem;
  height: 0.3rem;
  background: var(--crs-accent);
  /* Grows from a visible seed, never from nothing. */
  opacity: 0;
  transform: rotate(45deg) scale(0.4);
  transition:
    opacity 400ms var(--crs-ease-out) calc(420ms + var(--i) * 110ms),
    transform 500ms var(--crs-ease-out) calc(420ms + var(--i) * 110ms);
}

.is-revealed .cdt__eyebrow,
.is-revealed .cdt__figure {
  opacity: 1;
  filter: none;
  transform: none;
}

.is-revealed .cdt__rule {
  transform: none;
}

.is-revealed .cdt__mark {
  opacity: 1;
  transform: rotate(45deg);
}

@media (prefers-reduced-motion: reduce) {
  .cdt__rule,
  .cdt__figure {
    transform: none;
    filter: none;
  }

  .cdt__mark {
    transform: rotate(45deg);
  }
}
</style>
