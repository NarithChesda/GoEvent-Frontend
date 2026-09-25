<template>
  <!-- The liquid-glass panel the info card has always drawn the RSVP on —
       2px of the template's tone, a white 2px ring, the same tinted fill
       behind a light blur — now a card of its own. The form keeps its native
       white styling; this is the one shell that does not ink it. -->
  <div class="rsg" :class="{ 'is-revealed': revealed }">
    <div class="rsg__shell">
      <div class="rsg__inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RsvpShellProps } from '../types'

defineProps<RsvpShellProps>()
</script>

<style scoped>
.rsg {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* `${background}60` in the card's own inline style: 0x60 is 37.6% alpha. */
.rsg__shell {
  width: 100%;
  padding: 2px;
  border-radius: 2rem;
  background: color-mix(in srgb, var(--crs-tone) 37.6%, transparent);
  opacity: 0;
  transform: translateY(12px) scale(0.985);
  transition:
    opacity 500ms var(--crs-ease-out),
    transform 600ms var(--crs-ease-out);
}

.rsg__inner {
  padding: 1rem 1rem 1.25rem;
  border: 2px solid white;
  border-radius: calc(2rem - 2px);
  background: color-mix(in srgb, var(--crs-tone) 37.6%, transparent);
  color: white;
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}

.is-revealed .rsg__shell {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .rsg__shell {
    transform: none;
  }
}
</style>
