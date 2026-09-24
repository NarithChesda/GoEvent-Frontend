<template>
  <!-- The frame the venue map is set in (`info_card_design.map_style`), for
       every style but `window`, which EventInfo still draws as it always has.
       The map itself — the embed inside its edit region — arrives in the
       default slot; this owns the frame and its arrival.

       Every frame leaves the embed's bottom edge square and uncovered: Google's
       logo and terms sit in its bottom corners, and the Maps embed terms do not
       allow them to be hidden. -->
  <div
    class="mf"
    :class="[`mf--${variant}`, { 'is-revealed': revealed, 'is-light': light }]"
    :style="{ '--mf-delay': `${delay}s` }"
  >
    <!-- An arched window. The dome is a true semicircle (see .mf__window), with
         a hairline arch drawn around it a few pixels out, the way a window is
         set in its stone. -->
    <template v-if="variant === 'arch'">
      <div class="mf__arch">
        <span class="mf__arch-line" aria-hidden="true" />
        <div class="mf__window mf__window--arch">
          <div class="mf__embed mf__embed--arch"><slot /></div>
        </div>
      </div>
    </template>

    <!-- An old map's border: a neatline of alternating bars round the map, and
         a compass rose that swings round to north as it lands on the corner. -->
    <template v-else-if="variant === 'atlas'">
      <div class="mf__atlas">
        <div class="mf__neatline">
          <div class="mf__window mf__window--atlas">
            <div class="mf__embed"><slot /></div>
          </div>
        </div>
        <svg class="mf__rose" viewBox="-50 -50 100 100" aria-hidden="true">
          <circle class="mf__rose-ring" r="30" />
          <g class="mf__rose-minor">
            <polygon points="0,-24 5,-5 0,0" transform="rotate(45)" />
            <polygon points="0,-24 5,-5 0,0" transform="rotate(135)" />
            <polygon points="0,-24 5,-5 0,0" transform="rotate(225)" />
            <polygon points="0,-24 5,-5 0,0" transform="rotate(315)" />
          </g>
          <!-- Each cardinal point in two halves, one filled and one open: the
               shading that makes a rose read as a star rather than a cross. -->
          <g v-for="angle in [0, 90, 180, 270]" :key="angle" :transform="`rotate(${angle})`">
            <polygon class="mf__rose-fill" points="0,-40 6,-6 0,0" />
            <polygon class="mf__rose-open" points="0,-40 -6,-6 0,0" />
          </g>
          <circle class="mf__rose-hub" r="3" />
          <text class="mf__rose-n" y="-43" text-anchor="middle">N</text>
        </svg>
      </div>
    </template>

    <!-- An instant print laid on the card: paper, a square window, the venue
         written in the wide bottom margin, a strip of tape across the top. -->
    <template v-else>
      <div class="mf__print">
        <span class="mf__tape" aria-hidden="true" />
        <div class="mf__window mf__window--print">
          <div class="mf__embed"><slot /></div>
        </div>
        <div v-if="$slots.caption" class="mf__caption" :class="{ 'is-khmer': khmer }" :style="{ fontFamily: captionFont }">
          <slot name="caption" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { InfoCardMapStyle } from '@/services/api/types/template.types'

withDefaults(
  defineProps<{
    variant: Exclude<InfoCardMapStyle, 'window'>
    /** On the glass card, whose type is white: lines are drawn in white. */
    light?: boolean
    /** The card's own reveal flag; the frame arrives with the map. */
    revealed: boolean
    /** Seconds — the map's slot in the card's reveal timeline. */
    delay?: number
    /** The polaroid's caption face. */
    captionFont?: string
    khmer?: boolean
  }>(),
  { light: false, delay: 0, captionFont: undefined, khmer: false },
)
</script>

<style scoped>
/* Line and ink follow the card: white on the glass card, whose type is white;
   the card's own ink (currentColor, the template's primary) on engraved and
   frosted. */
.mf {
  --mf-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --mf-ink: currentColor;
  --mf-line: color-mix(in srgb, currentColor 46%, transparent);
  width: 100%;
}

.mf.is-light {
  --mf-ink: #fff;
  --mf-line: rgb(255 255 255 / 0.6);
}

.mf__window {
  position: relative;
  overflow: hidden;
  /* Safari will not clip an iframe to a rounded or clipped parent unless the
     parent is its own compositing layer. */
  isolation: isolate;
  transform: translateZ(0);
}

/* The slotted edit region and the embed fill the window. */
.mf__embed,
.mf__embed > :deep(*) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mf__embed :deep(iframe) {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

/* ---- arch --------------------------------------------------------------- */

.mf__arch {
  position: relative;
  width: min(100%, 17.5rem);
  margin: 0.5rem auto 0;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 600ms var(--mf-ease) var(--mf-delay),
    transform 700ms var(--mf-ease) var(--mf-delay);
}

/* 4:5, so the dome's vertical radius (40% of the height) is exactly half the
   width: a true semicircle, not an ellipse. */
.mf__window--arch {
  aspect-ratio: 4 / 5;
  border-radius: 50% 50% 0.6rem 0.6rem / 40% 40% 0.6rem 0.6rem;
}

/* The embed opens with a place card in its top-left corner, which the dome
   would cut in half. Lifting the embed tucks the card up out of the window
   (the floating menu's map button still opens the full map) while its bottom
   edge, where Google's attribution is, stays in place. */
.mf__embed--arch {
  top: -6rem;
  height: calc(100% + 6rem);
}

/* The outline a few px out, drawn up from the sill as the window lands. */
.mf__arch-line {
  position: absolute;
  inset: -7px;
  border: 1px solid var(--mf-line);
  border-radius: 50% 50% 0.9rem 0.9rem / 40% 40% 0.9rem 0.9rem;
  pointer-events: none;
  clip-path: inset(100% 0 0 0);
  transition: clip-path 1100ms var(--mf-ease) calc(var(--mf-delay) + 200ms);
}

.is-revealed .mf__arch {
  opacity: 1;
  transform: none;
}

/* Only the line takes the clip. On the arch itself an inset(0) would clip its
   own children to its box — and the line sits 7px outside it. */
.is-revealed .mf__arch-line {
  clip-path: inset(0 0 0 0);
}

/* ---- atlas -------------------------------------------------------------- */

/* Centred and full width; the rose overhangs into the card's own padding
   (every treatment has at least 0.875rem of it), never past the card. */
.mf__atlas {
  position: relative;
  width: 100%;
  margin: 1rem auto 0;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 600ms var(--mf-ease) var(--mf-delay),
    transform 700ms var(--mf-ease) var(--mf-delay);
}

/* The neatline: a hairline, a band of alternating bars, a hairline. Four
   background layers, each a run of bars sized to one edge of the band. */
.mf__neatline {
  --mf-bar: 5px;
  --mf-bars-x: repeating-linear-gradient(90deg, var(--mf-ink) 0 11px, transparent 11px 22px);
  --mf-bars-y: repeating-linear-gradient(180deg, var(--mf-ink) 0 11px, transparent 11px 22px);
  padding: var(--mf-bar);
  border: 1px solid var(--mf-ink);
  background:
    var(--mf-bars-x) top / 100% var(--mf-bar) no-repeat,
    var(--mf-bars-x) bottom / 100% var(--mf-bar) no-repeat,
    var(--mf-bars-y) left / var(--mf-bar) 100% no-repeat,
    var(--mf-bars-y) right / var(--mf-bar) 100% no-repeat;
}

.mf__window--atlas {
  aspect-ratio: 4 / 3;
  box-shadow: 0 0 0 1px var(--mf-ink);
}

/* Over the top-right corner, where the embed draws nothing. It swings round
   to north as it lands — a compass settling — once the map is down. */
.mf__rose {
  position: absolute;
  top: -1.45rem;
  right: -0.6rem;
  width: 4rem;
  height: 4rem;
  overflow: visible;
  opacity: 0;
  transform: rotate(-110deg) scale(0.8);
  transition:
    opacity 500ms var(--mf-ease) calc(var(--mf-delay) + 350ms),
    transform 1300ms cubic-bezier(0.16, 1, 0.3, 1) calc(var(--mf-delay) + 350ms);
}

.mf__rose-ring {
  fill: none;
  stroke: var(--mf-ink);
  stroke-width: 1;
}

.mf__rose-minor polygon,
.mf__rose-open {
  fill: var(--rose-ground, transparent);
  stroke: var(--mf-ink);
  stroke-width: 1;
  stroke-linejoin: round;
}

.mf__rose-fill,
.mf__rose-hub {
  fill: var(--mf-ink);
}

/* The open halves need a ground, or the map shows through the star. */
.mf:not(.is-light) .mf__rose {
  --rose-ground: color-mix(in srgb, currentColor 8%, white);
}

.mf.is-light .mf__rose {
  --rose-ground: rgb(255 255 255 / 0.18);
  filter: drop-shadow(0 2px 6px rgb(0 0 0 / 0.25));
}

.mf__rose-n {
  fill: var(--mf-ink);
  font-size: 11px;
  font-weight: 700;
  font-family: Georgia, 'Times New Roman', serif;
}

.is-revealed .mf__atlas,
.is-revealed .mf__rose {
  opacity: 1;
  transform: none;
}

/* ---- polaroid ----------------------------------------------------------- */

/* A print, so its paper is paper whatever the card is made of, and the
   caption is printed in a near-black that reads on it. The tilt is 1.6deg:
   placed by hand, and at 86% of the column its corners stay inside it (the
   scroller is overflow-y: auto; a corner past the edge scrolls the page). */
.mf__print {
  position: relative;
  width: 86%;
  margin: 1rem auto 0.25rem;
  padding: 0.65rem 0.65rem 0;
  border-radius: 2px;
  background: #fbfaf6;
  color: #2a2118;
  box-shadow:
    0 18px 36px -22px rgb(0 0 0 / 0.5),
    0 2px 6px -2px rgb(0 0 0 / 0.18);
  opacity: 0;
  transform: translateY(-14px) rotate(-6deg);
  transition:
    opacity 450ms var(--mf-ease) var(--mf-delay),
    transform 950ms cubic-bezier(0.22, 1, 0.36, 1) var(--mf-delay);
}

.is-revealed .mf__print {
  opacity: 1;
  transform: rotate(-1.6deg);
}

.mf__window--print {
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
}

.mf__caption {
  padding: 0.7rem 0.5rem 0.95rem;
  min-height: 3.25rem;
  font-size: 1.0625rem;
  line-height: 1.35;
  text-align: center;
  overflow-wrap: break-word;
}

.mf__caption.is-khmer {
  font-size: 0.9375rem;
  line-height: 1.75;
}

/* Tape across the top edge, a little crooked the other way, in the template's
   accent at a translucency tape has. */
.mf__tape {
  position: absolute;
  top: -0.7rem;
  left: 50%;
  z-index: 1;
  width: 5.5rem;
  height: 1.45rem;
  margin-left: -2.75rem;
  border-radius: 2px;
  background: color-mix(in srgb, var(--mf-tape, #e8dcc4) 70%, transparent);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
  opacity: 0;
  transform: rotate(3deg) scale(0.85);
  transition:
    opacity 300ms var(--mf-ease) calc(var(--mf-delay) + 550ms),
    transform 400ms var(--mf-ease) calc(var(--mf-delay) + 550ms);
}

.is-revealed .mf__tape {
  opacity: 1;
  transform: rotate(3deg);
}

@media (prefers-reduced-motion: reduce) {
  .mf__arch,
  .mf__atlas,
  .mf__rose {
    transform: none;
  }

  .mf__arch-line {
    clip-path: none;
  }

  .mf__print,
  .is-revealed .mf__print {
    transform: rotate(-1.6deg);
  }

  .mf__tape {
    transform: rotate(3deg);
  }
}
</style>
