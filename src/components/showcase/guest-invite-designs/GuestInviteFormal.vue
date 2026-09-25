<template>
  <!-- The quiet one. The invite line is set small and tracked between two
       hairlines, the same stationery language as the dress code's period
       headings and the engraved info card, and the name is the only large
       thing — no surface, no ornament to compete with it. -->
  <div class="gif" :class="{ 'is-revealed': revealed }">
    <div class="gif__head">
      <span class="gif__rule gif__rule--lead" aria-hidden="true" />
      <div class="gif__invite"><slot name="invite" /></div>
      <span class="gif__rule gif__rule--trail" aria-hidden="true" />
    </div>
    <div class="gif__name"><slot name="name" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ revealed: boolean }>()
</script>

<style scoped>
.gif {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 22rem;
  margin-inline: auto;
}

.gif__head {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
}

.gif__invite {
  flex: 0 1 auto;
  max-width: 72%;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  line-height: 1.5;
  opacity: 0;
  transition: opacity 500ms var(--gid-ease-out);
}

/* Tracked capitals at 11px are right for a Latin label and illegible for
   Khmer, which has neither capitals nor room to be spaced out. */
.gif__invite :deep(.gid-khmer) {
  font-size: 0.875rem;
  font-weight: 400;
}

/* Each rule grows OUT from the label and fades toward its far end, so the
   pair reads as drawn from the words rather than as two bars beside them. */
.gif__rule {
  flex: 1 1 1.5rem;
  min-width: 1.5rem;
  height: 1px;
  transition: clip-path 800ms var(--gid-ease-out) 150ms;
}

/* Full strength for the half nearest the words and only then fading: a rule
   that fades along its whole length is invisible at 1px on a pale card. */
.gif__rule {
  --gif-rule: color-mix(in srgb, var(--gid-ink) 48%, transparent);
}

.gif__rule--lead {
  background: linear-gradient(90deg, transparent, var(--gif-rule) 55%);
  clip-path: inset(0 0 0 100%);
}

.gif__rule--trail {
  background: linear-gradient(90deg, var(--gif-rule) 45%, transparent);
  clip-path: inset(0 100% 0 0);
}

.gif__name {
  margin-top: 0.625rem;
  padding-inline: 0.25rem;
  font-size: calc(clamp(1.75rem, 1.3rem + 2.4vw, 2.5rem) * var(--gid-name-scale, 1));
  line-height: 1.25;
}

/* Word by word, on the cascade the rest of the invitation's headings use:
   small stagger, capped, so a long household name still lands in under a
   second. */
.gif__name :deep(.gid-word) {
  opacity: 0;
  transform: translateY(0.3em);
  transition:
    opacity 500ms var(--gid-ease-out),
    transform 600ms var(--gid-ease-out);
  transition-delay: calc(320ms + min(var(--gid-i, 0) * 60ms, 540ms));
}

.is-revealed .gif__invite {
  opacity: 0.78;
}

.is-revealed .gif__rule {
  clip-path: inset(0);
}

.is-revealed .gif__name :deep(.gid-word) {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .gif__rule,
  .is-revealed .gif__rule {
    clip-path: none;
  }

  .gif__name :deep(.gid-word) {
    transform: none;
    transition: opacity 400ms ease;
  }
}
</style>
