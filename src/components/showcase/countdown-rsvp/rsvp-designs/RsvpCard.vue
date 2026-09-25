<template>
  <!-- A reply card laid on the invitation. It arrives the way a card is put
       down on a table: from a little lower, turned a few degrees, settling
       square — then its ornament draws. -->
  <div class="rsc" :class="{ 'is-revealed': revealed }">
    <ReplyCardFace class="rsc__card" :revealed="revealed" :mark="mark" :text-font="textFont" :khmer="khmer">
      <slot />
    </ReplyCardFace>
  </div>
</template>

<script setup lang="ts">
import ReplyCardFace from './ReplyCardFace.vue'
import type { RsvpShellProps } from '../types'

defineProps<RsvpShellProps>()
</script>

<style scoped>
.rsc {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* Narrower than the column: a card on the page, not a panel across it. The
   turn is 2.5deg — enough to read as placed by hand, and at this width its
   corners stay well inside the column, which matters on a scroller that is
   overflow-y: auto (a corner past the edge would scroll the page sideways). */
.rsc__card {
  width: min(100%, 22.5rem);
  opacity: 0;
  transform: translateY(26px) rotate(-2.5deg) scale(0.985);
  transition:
    opacity 500ms var(--crs-ease-out),
    transform 850ms cubic-bezier(0.22, 1, 0.36, 1);
}

.is-revealed .rsc__card {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .rsc__card {
    transform: none;
  }
}
</style>
