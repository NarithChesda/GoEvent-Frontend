<template>
  <!-- The reply card coming out of its envelope. The envelope lands closed,
       its flap lifts toward the guest and folds back over the top, and the
       card is drawn up out of the pocket — resting with its foot still tucked
       inside, so the envelope stays under it as the thing it came from.

       Four layers, back to front: the envelope's inside and its open flap
       (behind the card), the card, then the pocket front and the closed flap
       (in front of it). The card is in flow and sets the height; the envelope
       is laid under its foot. -->
  <div class="rse" :class="{ 'is-revealed': revealed, 'is-settled': settled }">
    <div class="rse__stage">
      <span class="rse__inside" aria-hidden="true" />
      <svg class="rse__flap rse__flap--open" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
        <polygon points="0,50 100,50 50,14" />
      </svg>

      <ReplyCardFace
        class="rse__card"
        :revealed="settled"
        :mark="mark"
        :text-font="textFont"
        :khmer="khmer"
        :ornament-delay="80"
      >
        <slot />
      </ReplyCardFace>

      <svg class="rse__pocket" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
        <!-- The face, with its mouth cut in a shallow V where the two side
             flaps meet; then the bottom flap folded up over it. -->
        <polygon class="rse__face" points="0,0 50,16 100,0 100,50 0,50" />
        <polygon class="rse__bottom" points="0,50 50,22 100,50" />
        <polyline class="rse__fold" points="0,0 50,16 100,0" />
        <polyline class="rse__fold" points="0,50 50,22 100,50" />
      </svg>

      <svg class="rse__flap rse__flap--closed" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
        <polygon points="0,0 100,0 50,32" />
        <polyline class="rse__fold" points="0,0 50,32 100,0" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import ReplyCardFace from './ReplyCardFace.vue'
import type { RsvpShellProps } from '../types'

const props = defineProps<RsvpShellProps>()

/**
 * The card is clipped while it rises (that is what hides the part still in the
 * pocket), and a clip-path clips the card's shadow too — so once the card has
 * landed the clip is dropped and the shadow comes up. One number with the CSS
 * below: envelope in, flap over, card up.
 */
const SETTLE_MS = 2050

const settled = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.revealed,
  (revealed) => {
    if (!revealed || settled.value) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    timer = setTimeout(() => (settled.value = true), reduced ? 0 : SETTLE_MS)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
/* The envelope is tinted from the template's accent into the card stock, so
   it is a coloured envelope holding a pale card — the way these are sold —
   and every fold is a shade of that one colour. */
.rse {
  --rse-env: color-mix(in srgb, var(--crs-accent) 32%, var(--crs-card-paper));
  --rse-h: clamp(6.5rem, 30vw, 8.25rem);
  /* How far the card's foot stays inside. Deeper than the mouth's V (0.32 of
     the height at the centre), so the card's bottom edge never shows in it. */
  --rse-tuck: calc(var(--rse-h) * 0.44);
  display: flex;
  justify-content: center;
  width: 100%;
}

.rse__stage {
  position: relative;
  width: min(100%, 24rem);
  padding-bottom: calc(var(--rse-h) - var(--rse-tuck));
  perspective: 900px;
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 500ms var(--crs-ease-out),
    transform 600ms var(--crs-ease-out);
}

.is-revealed .rse__stage {
  opacity: 1;
  transform: none;
}

/* ---- Behind the card ---------------------------------------------------- */

.rse__inside {
  position: absolute;
  inset: auto 0 0;
  height: var(--rse-h);
  border-radius: 3px;
  background: color-mix(in srgb, var(--rse-env) 80%, black);
}

.rse__flap {
  position: absolute;
  left: 0;
  width: 100%;
  height: var(--rse-h);
  overflow: visible;
}

.rse__flap polygon {
  fill: color-mix(in srgb, var(--rse-env) 90%, black);
}

/* Open: pointing up from the hinge, behind the card. It swings up into place
   from edge-on, continuing the closed flap's turn. */
.rse__flap--open {
  bottom: var(--rse-h);
  transform-origin: 50% 100%;
  transform: rotateX(-90deg);
  transition: transform 340ms cubic-bezier(0.2, 0.9, 0.3, 1) 830ms;
}

.is-revealed .rse__flap--open {
  transform: none;
}

/* ---- The card ----------------------------------------------------------- */

/* Extra paper under the form, for the part that stays in the pocket. */
.rse__card {
  --rcf-pad-bottom: calc(var(--rse-tuck) + 1.35rem);
  --rcf-shadow: 0;
  position: relative;
  z-index: 1;
  width: 88%;
  margin: 0 auto;
  /* Drawn up out of the pocket: the card and its clip move together, so the
     visible part always ends at the same line inside the envelope and the
     rest of the card seems to be still in it. */
  transform: translateY(88%);
  clip-path: inset(0 0 88% 0);
  transition:
    transform 950ms cubic-bezier(0.22, 1, 0.36, 1) 1060ms,
    clip-path 950ms cubic-bezier(0.22, 1, 0.36, 1) 1060ms;
}

.is-revealed .rse__card {
  transform: none;
  clip-path: inset(0 0 0 0);
}

.is-settled .rse__card {
  --rcf-shadow: 1;
  clip-path: none;
}

/* ---- In front of the card ----------------------------------------------- */

.rse__pocket {
  position: absolute;
  inset: auto 0 0;
  z-index: 2;
  width: 100%;
  height: var(--rse-h);
  overflow: visible;
  filter: drop-shadow(0 12px 18px rgb(0 0 0 / 0.16));
}

.rse__face {
  fill: var(--rse-env);
}

.rse__bottom {
  fill: color-mix(in srgb, var(--rse-env) 92%, white);
}

.rse__fold {
  fill: none;
  stroke: rgb(0 0 0 / 0.14);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

/* Closed: hanging from the hinge over the mouth. It lifts toward the guest —
   the tip comes forward as it rises — and is gone at edge-on, where the open
   flap behind the card takes the rest of the turn. This half eases in and
   that half eases out, so the whole turn is one ease-in-out, as the flip
   board's two flaps are. */
.rse__flap--closed {
  bottom: 0;
  z-index: 3;
  transform-origin: 50% 0%;
  transition: transform 300ms cubic-bezier(0.55, 0, 0.9, 0.45) 530ms;
}

.rse__flap--closed polygon {
  fill: color-mix(in srgb, var(--rse-env) 96%, white);
}

/* Edge-on is a line, not nothing: its fold would stay drawn across the mouth
   as a hairline. So it goes the instant it gets there. */
.is-revealed .rse__flap--closed {
  transform: rotateX(90deg);
  opacity: 0;
  transition:
    transform 300ms cubic-bezier(0.55, 0, 0.9, 0.45) 530ms,
    opacity 0ms linear 830ms;
}

/* Reduced motion keeps the envelope's fade and drops every movement: the flap
   is already open and the card already out. */
@media (prefers-reduced-motion: reduce) {
  .rse__stage {
    transform: none;
  }

  .rse__card,
  .rse__flap--open {
    transform: none;
    transition-duration: 0ms;
  }

  .rse__card {
    clip-path: none;
  }

  .rse__flap--closed {
    display: none;
  }
}
</style>
