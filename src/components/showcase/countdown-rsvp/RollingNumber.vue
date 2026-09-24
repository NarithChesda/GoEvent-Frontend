<template>
  <!-- The figure that changes when the minute does. The outgoing value rolls up
       and away while the new one rolls in from below, both in one grid cell so
       neither needs absolute positioning (and the width follows whichever is
       wider while both are there). No `appear`: the design's own arrival
       brings the first value in; this only ever animates a change.

       The ink span is inside each value, not around this component: a value
       mid-roll is transformed, so it is its own stacking context, and a
       metallic finish painted from a parent cannot reach text in one (see
       text-effects.css). It is inert without a `.tfx` ancestor. -->
  <span class="rn">
    <Transition name="rn">
      <span :key="value" class="rn__v"><span class="tfx-ink">{{ value }}</span></span>
    </Transition>
  </span>
</template>

<script setup lang="ts">
defineProps<{ value: string }>()
</script>

<style scoped>
.rn {
  display: inline-grid;
  font-variant-numeric: tabular-nums;
}

.rn__v {
  grid-area: 1 / 1;
}

/* A short blur bridges old and new so the swap reads as one figure turning
   over, not two figures crossing. Seen at most once a minute, so it can be
   felt: 380ms on the showcase's strong ease-out. */
.rn-enter-active,
.rn-leave-active {
  transition:
    transform 380ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 380ms cubic-bezier(0.23, 1, 0.32, 1),
    filter 380ms cubic-bezier(0.23, 1, 0.32, 1);
}

.rn-enter-from {
  opacity: 0;
  transform: translateY(0.42em);
  filter: blur(2px);
}

.rn-leave-to {
  opacity: 0;
  transform: translateY(-0.42em);
  filter: blur(2px);
}

@media (prefers-reduced-motion: reduce) {
  .rn-enter-from,
  .rn-leave-to {
    transform: none;
    filter: none;
  }
}
</style>
