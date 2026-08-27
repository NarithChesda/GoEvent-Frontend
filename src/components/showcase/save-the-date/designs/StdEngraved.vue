<template>
  <div class="std std-engraved" :class="{ 'is-revealed': revealed }">
    <div class="eng-ornament eng-ornament-top">
      <OrnamentRule :gold="inkColor" :gold-light="hotColor" />
    </div>

    <p class="std-eyebrow eng-label std-wipe" :class="inkClass">{{ label }}</p>

    <p v-if="numericDate" class="eng-numeric std-wipe" :class="inkClass">{{ numericDate }}</p>

    <p v-if="longDate" class="std-longdate eng-long std-wipe" :class="inkClass">{{ longDate }}</p>

    <div class="eng-ornament eng-ornament-bottom">
      <OrnamentRule :gold="inkColor" :gold-light="hotColor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import OrnamentRule from '../../transition/OrnamentRule.vue'
import type { SaveTheDateDesignProps } from '../types'

/**
 * `engraved` — the door transition's original composition, unchanged.
 *
 * Its gesture is the **centre-out wipe**: every line is uncovered from its own
 * middle outward, the way a plate is struck, and the ornament rules bracketing
 * the block draw the same way. The beats below are the door stage's own,
 * rebased so the block's first one lands at `--std-t0` — which that stage sets
 * to 1000ms, the moment its leaves have gathered and its frame has drawn.
 */
const props = defineProps<SaveTheDateDesignProps>()

const inkClass = computed(() => (props.ink === 'metal' ? 'std-metal' : 'std-solid'))
</script>

<style scoped>
.std-engraved {
  gap: calc(var(--std-w) * 0.024);
  padding-inline: 6%;
  font-family: var(--std-display);
}

/* Both rules draw outward from the centre. Width is stage-relative rather than
   a percentage of this block, so the block's own padding can't widen it. */
.eng-ornament {
  width: calc(var(--std-w) * 0.407);
  transform: scaleX(0);
  opacity: 0;
}

.is-revealed .eng-ornament-top {
  animation: engRuleDraw 700ms cubic-bezier(0.22, 1, 0.36, 1) var(--std-t0) forwards;
}

.is-revealed .eng-ornament-bottom {
  animation: engRuleDraw 800ms cubic-bezier(0.22, 1, 0.36, 1) calc(var(--std-t0) + 1800ms) forwards;
}

@keyframes engRuleDraw {
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

/* Every line arrives on the wipe, then the sheen travels across it. Both
   animations are declared together per line: they run on the same element, so
   two `animation` shorthands would silently drop the first. */
.is-revealed .eng-label {
  animation:
    stdWipe 850ms var(--std-ease-wipe) calc(var(--std-t0) + 500ms) forwards,
    stdSheen 2.3s ease-in-out calc(var(--std-t0) + 1700ms) forwards;
}

.is-revealed .eng-numeric {
  animation:
    stdWipe 850ms var(--std-ease-wipe) calc(var(--std-t0) + 1050ms) forwards,
    stdSheen 2.3s ease-in-out calc(var(--std-t0) + 1700ms) forwards;
}

.is-revealed .eng-long {
  animation:
    stdWipe 800ms var(--std-ease-wipe) calc(var(--std-t0) + 1500ms) forwards,
    stdSheen 2.3s ease-in-out calc(var(--std-t0) + 1700ms) forwards;
}

/* Sizes, tracking and weights are the reference artwork's own, as ratios of the
   stage width (its 50 / 104 / 38 against 1080). They are tuned for the display
   face set on the block — its 600 is another face's 400. */
.eng-label {
  font-size: calc(var(--std-w) * 0.0463);
  letter-spacing: 0.34em;
  padding-left: 0.34em;
  line-height: 1.3;
}

/* The reference's cartouche form: day · month · year, the hero of the block. */
.eng-numeric {
  font-size: calc(var(--std-w) * 0.0963);
  letter-spacing: 0.08em;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  /* Resolve by roughly a second, holding the reading order but not the wait. */
  .is-revealed .eng-ornament-top {
    animation-duration: 400ms;
    animation-delay: 0ms;
  }

  .is-revealed .eng-ornament-bottom {
    animation-duration: 400ms;
    animation-delay: 600ms;
  }

  .is-revealed .eng-label,
  .is-revealed .eng-numeric,
  .is-revealed .eng-long {
    animation:
      stdWipe 400ms ease forwards,
      stdSheen 1ms linear forwards;
  }

  .is-revealed .eng-label {
    animation-delay: 200ms, 0ms;
  }

  .is-revealed .eng-numeric {
    animation-delay: 350ms, 0ms;
  }

  .is-revealed .eng-long {
    animation-delay: 500ms, 0ms;
  }
}
</style>
