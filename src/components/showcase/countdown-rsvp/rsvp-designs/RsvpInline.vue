<template>
  <!-- No surface at all: the form inked straight onto the page, opened by a
       short centred hairline — the engraved card's one interior mark, drawn
       from the centre out. For templates whose whole invitation is type on
       the ground, where a card of any material would be the only object. -->
  <div class="rsi" :class="{ 'is-revealed': revealed }">
    <span class="rsi__mark" aria-hidden="true" />
    <div class="rsi__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RsvpShellProps } from '../types'

defineProps<RsvpShellProps>()
</script>

<style scoped>
.rsi {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.rsi__mark {
  display: block;
  width: 2.5rem;
  height: 1px;
  margin-bottom: 1.35rem;
  background: color-mix(in srgb, var(--crs-ink) 32%, transparent);
  transform: scaleX(0);
  transition: transform 700ms var(--crs-ease-out) 120ms;
}

.rsi__body {
  width: 100%;
  max-width: 26rem;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 600ms var(--crs-ease-out) 260ms,
    transform 600ms var(--crs-ease-out) 260ms;
}

.is-revealed .rsi__mark,
.is-revealed .rsi__body {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .rsi__mark,
  .rsi__body {
    transform: none;
  }
}
</style>
