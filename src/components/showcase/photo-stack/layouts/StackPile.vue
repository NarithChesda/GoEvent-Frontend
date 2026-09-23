<template>
  <div class="stack-layout" :class="{ 'is-closed': closed, 'is-dissolving': dissolving }">
    <!-- The camera pulls back (transition) and keeps drifting back (keyframes)
         on two elements, so the drift composes with the pull-back instead of
         replacing it. Both scale about the pile's own centre. -->
    <div class="pl-camera" :style="{ '--pl-spread-scale': String(layout.spreadScale) }">
      <div class="pl-drift">
        <div class="pl-pile">
          <div
            v-for="(photo, k) in photos"
            :key="photo.id"
            class="pl-print"
            :class="{ 'is-dealt': k < shown }"
            :style="printStyle(k)"
          >
            <!-- The shadow a print casts while it is still falling: wide and
                 offset, fading as it lands. A separate element so only its
                 opacity animates — never an animated box-shadow. -->
            <div class="pl-print-air" />
            <div class="pl-print-paper">
              <div class="pl-print-window">
                <StackPhoto
                  :photo="photo"
                  :index="k"
                  :shown="k < shown"
                  :alt="eventTitle"
                  :get-media-url="getMediaUrl"
                >
                  <!-- Instant film clearing: the print lands a little milky and
                       resolves. Brief enough that the photograph is legible from
                       the moment it lands — it settles, it doesn't develop. -->
                  <div class="pl-print-develop" />
                </StackPhoto>
              </div>
              <div class="pl-print-dim" :style="{ opacity: dimOf(k) }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pl-copy">
      <slot name="copy" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StackPhoto from '../StackPhoto.vue'
import { pileLayout, type PrintPose } from '../geometry'
import type { StackLayoutProps } from '../types'

/**
 * `pile` — instant-film prints dealt one at a time onto a pile; then the camera
 * pulls back while the pile spreads so every photograph shows, and the Save the
 * Date is written underneath.
 */
const props = defineProps<StackLayoutProps>()

const layout = computed(() => pileLayout(props.photos.length))

const pose = (prefix: string, p: PrintPose): Record<string, string> => ({
  [`--pr-${prefix}x`]: `${p.x}%`,
  [`--pr-${prefix}y`]: `${p.y}%`,
  [`--pr-${prefix}r`]: `${p.r}deg`,
})

/** Every pose a print can take, set on the print itself — its transform reads
 *  its own variables, never a parent's, so a state change restyles one element
 *  per print rather than recalculating the whole subtree. */
const printStyle = (k: number): Record<string, string> => ({
  ...pose('d', layout.value.drop[k]),
  ...pose('r', layout.value.pile[k]),
  ...pose('s', layout.value.spread[k]),
  '--pr-k': String(k),
  zIndex: String(k + 1),
})

/**
 * Each print below the top one sinks a little further into shadow, so the one
 * just dealt reads as lifted off the pile. Cleared by the spread: at that point
 * every photograph is meant to be seen, not only the last.
 */
const dimOf = (k: number): number => {
  if (props.closed || k >= props.shown) return 0
  return Math.min((props.shown - 1 - k) * 0.08, 0.24)
}
</script>

<style scoped>
.stack-layout {
  position: absolute;
  inset: 0;
  /* A print: 60% of the stage wide, with a 4:5 window inside a 5.5% border and
     the deep foot of an instant-film print (22% of its width). Its height is
     therefore 0.055 + 1.25 × 0.89 + 0.22 = 1.3875 widths. */
  --pl-print-w: calc(var(--sk-w) * 0.6);
  --pl-print-h: calc(var(--pl-print-w) * 1.3875);
  /* Where the pile sits. Above centre, so the Save the Date has the foot of the
     frame to itself at every stage shape — even before the pull-back and even
     under reduced motion, where the pile never moves. */
  --pl-pile-y: 45%;
  /* How far the camera rises on the pull-back — see .is-closed .pl-camera. */
  --pl-rise: calc(5% - var(--sk-w) * 0.205);
}

.pl-camera,
.pl-drift {
  position: absolute;
  inset: 0;
  transform-origin: 50% var(--pl-pile-y);
}

/* The pull-back: the whole table shrinks about the pile and rises to make room
   for the copy. The same duration and curve as each print's move to its spread
   place, so the two read as one camera move rather than a zoom and a shuffle.

   The spread and the Save the Date under it are laid out as ONE block centred
   in the stage (--pl-rise here, .pl-copy's `top` below). Pinning the copy to the
   foot instead left a dead band between the two on any phone taller than 9:16
   — a fifth of a 390×844 screen. The block is measured in stage widths, since
   everything in it is sized in them: the spread is ±0.39w about its centre at
   every print count, the copy starts 0.11w below it (the rotated corners of
   the lower prints reach past that ±0.39w, so less than this and the first
   rule draws right under them), and the script block is ~0.30w tall. Centring
   that block puts the spread's centre at 50% − 0.205w of the stage height; the
   pile sits at 45%, so the camera rises by the difference. `translateY(%)`
   resolves against the camera's own box, which is the stage. */
.is-closed .pl-camera {
  transform: translateY(var(--pl-rise)) scale(var(--pl-spread-scale));
  transition: transform 1.4s var(--sk-ease-in-out);
}

/* And out: the table contracts as it dissolves, converging with the
   invitation's ornaments flying inward — the showcase's arc closing. No edge
   budget to spend: nothing on the camera is full-bleed. */
.is-dissolving .pl-camera {
  transform: translateY(var(--pl-rise)) scale(calc(var(--pl-spread-scale) * 0.96));
  transition: transform 1.2s var(--sk-ease-atmos);
}

/* The camera never quite stops: a slow drift back, started WITH the pull-back
   rather than after it. Started after, the pull-back's ease-in-out would come to
   a full stop and the drift would begin from rest — two moves with a visible
   stop between them. Started together, the drift is a fraction of the motion
   while the spread runs and all of it afterwards. */
.is-closed .pl-drift {
  animation: plDrift 7s var(--sk-ease-atmos) forwards;
}

@keyframes plDrift {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(0.965);
  }
}

.pl-pile {
  position: absolute;
  left: calc(50% - var(--pl-print-w) / 2);
  top: calc(var(--pl-pile-y) - var(--pl-print-h) / 2);
  width: var(--pl-print-w);
  height: var(--pl-print-h);
}

/* Un-dealt: up toward the camera (1.14) and swung out to one side, invisible. */
.pl-print {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translate(var(--pr-dx), var(--pr-dy)) rotate(var(--pr-dr)) scale(1.14);
}

/* The drop. Transform on the strong ease-out — a print laid down decelerates
   into the pile — and opacity much faster, so it is solid for most of its fall
   instead of ghosting down onto the one below. At 0.35s the print underneath
   still showed through the window of the one landing on it. */
.pl-print.is-dealt {
  opacity: 1;
  transform: translate(var(--pr-rx), var(--pr-ry)) rotate(var(--pr-rr)) scale(1);
  transition:
    transform 1s var(--sk-ease-out),
    opacity 0.25s var(--sk-ease-out);
}

/* The spread, staggered 50ms per print from the bottom of the pile up — the
   print underneath everything starts first, as a hand spreading a pile would. */
.is-closed .pl-print.is-dealt {
  transform: translate(var(--pr-sx), var(--pr-sy)) rotate(var(--pr-sr)) scale(1);
  transition:
    transform 1.4s var(--sk-ease-in-out) calc(var(--pr-k) * 50ms),
    opacity 0.25s var(--sk-ease-out);
}

.pl-print-air {
  position: absolute;
  inset: 0;
  border-radius: 2px;
  box-shadow: 0 30px 46px -12px rgba(26, 18, 10, 0.42);
}

.is-dealt .pl-print-air {
  opacity: 0;
  transition: opacity 1s var(--sk-ease-out);
}

/* Instant-film stock: a warm white, fixed rather than template-driven — it is
   reproduced artwork, like the door stage's near-white specular, and a print
   tinted to the template's palette stops reading as a photograph. The window
   sits in a 5.5% border (padding % resolves against width on every side), and
   the deep foot is whatever height is left. */
.pl-print-paper {
  position: absolute;
  inset: 0;
  padding: 5.5% 5.5% 0;
  border-radius: 2px;
  background: linear-gradient(165deg, #fefdf9 0%, #f8f4eb 60%, #f1ebdf 100%);
  box-shadow:
    0 0 0 0.5px rgba(26, 18, 10, 0.1),
    0 1px 1.5px rgba(26, 18, 10, 0.22),
    0 3px 8px -2px rgba(26, 18, 10, 0.22),
    0 10px 22px -10px rgba(26, 18, 10, 0.3);
}

.pl-print-window {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  --sp-empty: #e7e0d3;
}

/* The hairline where emulsion meets paper — on top of the photograph, so it
   frames it rather than hiding under it. */
.pl-print-window::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 0 1px rgba(40, 28, 16, 0.1);
  pointer-events: none;
}

.pl-print-develop {
  position: absolute;
  inset: 0;
  background: #f4efe4;
  opacity: 0.5;
  pointer-events: none;
}

.is-dealt .pl-print-develop {
  opacity: 0;
  transition: opacity 1.1s var(--sk-ease-atmos) 0.1s;
}

.pl-print-dim {
  position: absolute;
  inset: 0;
  border-radius: 2px;
  background: #1a120a;
  pointer-events: none;
  transition: opacity 0.9s var(--sk-ease-out);
}

/* Directly under the spread — the second half of the centred block described
   at .is-closed .pl-camera: the spread's foot is at 50% + 0.185w, and the copy
   starts 0.11w below it. */
.pl-copy {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(50% + var(--sk-w) * 0.295);
  z-index: 5;
  display: flex;
  justify-content: center;
}

/* Fewer and gentler, not none: every photograph still arrives, but fades in
   where it lies. No drop, no swing, no drift, no pull-back — the pile stays
   put, so the copy can't sit where the spread would have ended (it would run
   into the pile's foot) and takes the foot of the stage instead. */
@media (prefers-reduced-motion: reduce) {
  .pl-print,
  .pl-print.is-dealt,
  .is-closed .pl-print.is-dealt {
    transform: translate(var(--pr-rx), var(--pr-ry)) rotate(var(--pr-rr));
    transition: opacity 0.4s ease;
  }

  .is-closed .pl-camera,
  .is-dissolving .pl-camera {
    transform: none;
  }

  .is-closed .pl-drift {
    animation: none;
  }

  .pl-print-air {
    display: none;
  }

  .pl-copy {
    top: auto;
    bottom: 0;
    padding-bottom: calc(var(--sk-w) * 0.17);
  }
}
</style>
