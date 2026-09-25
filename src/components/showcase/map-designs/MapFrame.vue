<template>
  <!-- The frame the venue map is set in (`info_card_design.map_style`). The
       map itself — the embed inside its edit region — arrives in the default
       slot; this owns the frame and its arrival.

       It is drawn in the invitation's stationery (stationery.ts): the same
       hairline the calendar and the countdown rule with, the same accent the
       date spends on its day, and — for the one frame that is an object, the
       polaroid — the same paper, corner and lift as the calendar card and the
       reply card. A frame never brings a material of its own.

       Every frame leaves the embed's bottom edge square and uncovered: Google's
       logo and terms sit in its bottom corners, and the Maps embed terms do not
       allow them to be hidden. -->
  <div
    class="mf"
    :class="[`mf--${variant}`, { 'is-revealed': revealed, 'is-light': light }]"
    :style="frameStyle"
  >
    <!-- A window onto the map, on the page: the paper's corner and one soft
         hairline, nothing round it. Only drawn with the venue on the page —
         inside the info card, the card's own window stands. -->
    <template v-if="variant === 'window'">
      <div class="mf__plate">
        <div class="mf__window mf__window--plate">
          <div class="mf__embed"><slot /></div>
        </div>
      </div>
    </template>

    <!-- An arched window. The dome is a true semicircle (see .mf__window), with
         a hairline arch drawn around it a few pixels out, the way a window is
         set in its stone. -->
    <template v-else-if="variant === 'arch'">
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
               shading that makes a rose read as a star rather than a cross.
               The north point takes the accent — the frame's one mark. -->
          <g v-for="angle in [0, 90, 180, 270]" :key="angle" :transform="`rotate(${angle})`">
            <polygon class="mf__rose-fill" :class="{ 'is-north': angle === 0 }" points="0,-40 6,-6 0,0" />
            <polygon class="mf__rose-open" points="0,-40 -6,-6 0,0" />
          </g>
          <circle class="mf__rose-hub" r="3" />
          <text class="mf__rose-n" y="-43" text-anchor="middle">N</text>
        </svg>
      </div>
    </template>

    <!-- An instant print laid on the page: the invitation's paper, a square
         window, the venue written in the wide bottom margin, a strip of tape in
         the accent across the top. -->
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
import { computed } from 'vue'
import type { InfoCardMapStyle } from '@/services/api/types/template.types'
import { inkOnPaper, stationeryPaper, type StationeryPaper } from '../stationery'

const props = withDefaults(
  defineProps<{
    variant: InfoCardMapStyle
    /** On the glass card, whose type is white: lines are drawn in white. */
    light?: boolean
    /** The block's own reveal flag; the frame arrives with the map. */
    revealed: boolean
    /** Seconds — the map's slot in the block's reveal timeline. */
    delay?: number
    /** The polaroid's caption face. */
    captionFont?: string
    khmer?: boolean
    /** The template's ink, for the polaroid's caption to be measured against its paper. */
    ink?: string
    /** The invitation's shared paper. Absent = the default stock. */
    stationery?: StationeryPaper | null
    /** The date design's marker colour: the tape, the rose's north point. */
    accent?: string | null
  }>(),
  {
    light: false,
    delay: 0,
    captionFont: undefined,
    khmer: false,
    ink: undefined,
    stationery: null,
    accent: null,
  },
)

const stock = computed(() => props.stationery ?? stationeryPaper({}))

const frameStyle = computed(() => ({
  '--mf-delay': `${props.delay}s`,
  '--mf-paper': stock.value.paper,
  '--mf-paper-ink': inkOnPaper(props.ink, stock.value.paper),
  '--mf-radius': `${stock.value.radius}px`,
  '--mf-paper-shadow': stock.value.shadow,
  ...(props.accent ? { '--mf-accent': props.accent } : {}),
}))
</script>

<style scoped>
/* Line and ink follow what the frame sits on: white on the glass card, whose
   type is white; the ink (currentColor, the template's primary) everywhere
   else. The hairline is the stationery's 32% — the weight the countdown's
   rules and the calendar's cells are drawn at — with a softer 18% for a line
   that sits against the map itself. */
.mf {
  --mf-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --mf-ink: currentColor;
  --mf-line: color-mix(in srgb, currentColor 32%, transparent);
  --mf-line-soft: color-mix(in srgb, currentColor 18%, transparent);
  width: 100%;
}

.mf.is-light {
  --mf-ink: #fff;
  --mf-line: rgb(255 255 255 / 0.6);
  --mf-line-soft: rgb(255 255 255 / 0.35);
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

/* ---- window (on the page) ----------------------------------------------- */

/* 4:3 rather than the card's 16:9: on the page there is no card height to
   save, and a phone-width 16:9 map is a strip too short to find a street in. */
.mf__plate {
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 600ms var(--mf-ease) var(--mf-delay),
    transform 700ms var(--mf-ease) var(--mf-delay);
}

.mf__window--plate {
  aspect-ratio: 4 / 3;
  border-radius: var(--mf-radius);
  box-shadow: 0 0 0 1px var(--mf-line-soft);
}

.is-revealed .mf__plate {
  opacity: 1;
  transform: none;
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
   width: a true semicircle, not an ellipse. The sill takes the paper's corner. */
.mf__window--arch {
  aspect-ratio: 4 / 5;
  border-radius: 50% 50% var(--mf-radius) var(--mf-radius) / 40% 40% var(--mf-radius) var(--mf-radius);
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
  border-radius:
    50% 50% calc(var(--mf-radius) + 7px) calc(var(--mf-radius) + 7px) /
    40% 40% calc(var(--mf-radius) + 7px) calc(var(--mf-radius) + 7px);
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

/* Centred and full width; the rose overhangs into the column's own margin
   (every treatment has at least 0.875rem of it), never past it. */
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

.mf__rose-fill.is-north {
  fill: var(--mf-accent, var(--mf-ink));
}

/* The open halves need a ground, or the map shows through the star: the
   invitation's paper, so the rose is printed on the same stock as the rest. */
.mf:not(.is-light) .mf__rose {
  --rose-ground: var(--mf-paper);
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

/* A print, so it is the invitation's paper whatever the card is made of —
   the calendar card's stock and lift when the template has one — and its
   caption is inked to read on that paper. Its corner is the paper's, capped:
   a print with a round corner the size of a card's reads as a sticker. The
   tilt is 1.6deg: placed by hand, and at 86% of the column its corners stay
   inside it (the scroller is overflow-y: auto; a corner past the edge scrolls
   the page). */
.mf__print {
  position: relative;
  width: 86%;
  margin: 1rem auto 0.25rem;
  padding: 0.65rem 0.65rem 0;
  border-radius: min(var(--mf-radius), 6px);
  background: var(--mf-paper);
  color: var(--mf-paper-ink);
  box-shadow: var(--mf-paper-shadow);
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
  border-radius: max(0px, calc(min(var(--mf-radius), 6px) - 4px));
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

/* Tape across the top edge, a little crooked the other way, in the accent
   at a translucency tape has. */
.mf__tape {
  position: absolute;
  top: -0.7rem;
  left: 50%;
  z-index: 1;
  width: 5.5rem;
  height: 1.45rem;
  margin-left: -2.75rem;
  border-radius: 2px;
  background: color-mix(in srgb, var(--mf-accent, #e8dcc4) 70%, transparent);
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
  .mf__plate,
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
