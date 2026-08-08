<template>
  <svg viewBox="0 0 320 28" class="ornament-rule" aria-hidden="true" focusable="false">
    <path d="M4 14 H118" :stroke="gold" stroke-width="2" fill="none" />
    <path d="M202 14 H316" :stroke="gold" stroke-width="2" fill="none" />
    <path
      d="M160 4 C172 10 178 14 178 14 C178 14 172 18 160 24 C148 18 142 14 142 14 C142 14 148 10 160 4 Z"
      fill="none"
      :stroke="gold"
      stroke-width="2"
    />
    <circle cx="160" cy="14" r="3" :fill="goldLight" />
  </svg>
</template>

<script setup lang="ts">
/**
 * The cartouche's divider: two hairlines flanking a lozenge with a lit centre.
 * Drawn at 320×28 and scaled by the caller, so the strokes stay proportional
 * to the rule's width instead of to the viewport.
 */
interface Props {
  /** The template's metal — both hairlines and the lozenge outline. */
  gold: string
  /** Specular highlight for the centre dot. */
  goldLight: string
}

defineProps<Props>()
</script>

<style scoped>
.ornament-rule {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
</style>
