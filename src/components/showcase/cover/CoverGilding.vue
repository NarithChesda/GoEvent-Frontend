<template>
  <!-- A fragment, deliberately: NOT one wrapper div holding the layers.
       `mix-blend-mode` blends an element with the backdrop of the nearest
       stacking context above it, and a positioned wrapper carrying the z-index
       these layers need would be exactly that — the multiply and the screens
       would blend against the wrapper's own empty box instead of against the
       cover artwork, which turns the bevel into a grey film and the specular
       into a flat white wash. With no wrapper the enclosing group is CoverStage
       (or, in a door leaf, .door-full-content) — the element the artwork itself
       is painted in. The shared custom properties ride on each layer instead of
       being inherited from one parent. -->
  <template v-if="config.enabled">
    <!-- The band's four lighting layers share one annulus clip, so the shadow
         and the highlights stay registered as light on a single surface. -->
    <div class="gild-band gild-shade" :style="layerStyle" aria-hidden="true" />
    <div class="gild-band gild-sweep" :style="layerStyle" aria-hidden="true" />
    <div class="gild-band gild-sweep gild-sweep-slow" :style="layerStyle" aria-hidden="true" />
    <div class="gild-band gild-edge" :style="layerStyle" aria-hidden="true" />

    <!-- Flat siblings rather than four children of one positioned box, for the
         same isolation reason as above: that box would need a z-index to clear
         the decorations, and a z-index on a positioned element is a stacking
         context — the glints would screen against its empty backdrop instead of
         against the border they are supposed to be catching light off. -->
    <template v-if="config.cornerFlares">
      <div
        v-for="corner in FLARE_CORNERS"
        :key="corner.id"
        class="gild-flare"
        :class="`gild-flare-${corner.id}`"
        :style="[layerStyle, { animationDelay: corner.delay }]"
        aria-hidden="true"
      />
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResolvedCoverGilding } from '@/composables/showcase/useCoverStageLayout'

interface Props {
  /** Fully resolved gilding config (see resolveCoverGilding). */
  config: ResolvedCoverGilding
  primaryColor?: string
  secondaryColor?: string | null
  accentColor?: string
  /** Fades the whole effect out — used as the cover animates away. */
  hidden?: boolean
  /**
   * Stacking position within the parent. Every layer takes the SAME value and
   * relies on DOM order for the rest, since they are siblings rather than a
   * stack inside a wrapper. The cover puts them above the decoration artwork
   * but below the cover copy (and below the ambient creatures, which fly in
   * front of the plate); a door leaf puts them below its own content layer.
   */
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  hidden: false,
  zIndex: 27,
})

// Multi-root: there is no single element for Vue to fall attributes through to.
defineOptions({ inheritAttrs: false })

/**
 * The four glints, with the reference's own phase offsets converted to negative
 * delays (offset x the 12s cycle), so each corner peaks at a different moment of
 * one shared loop rather than all four pulsing in unison.
 */
const FLARE_CORNERS = [
  { id: 'tl', delay: '-0.72s' },
  { id: 'tr', delay: '-3.6s' },
  { id: 'bl', delay: '-9.6s' },
  { id: 'br', delay: '-6.72s' },
] as const

/**
 * The showcase stage's own width. `.showcase-container` is `min(100vw, 56.25vh)`
 * — height-constrained on desktop, width-constrained on a phone — and every
 * measurement here is a fraction of it, so the band keeps the reference
 * artwork's proportions on any device. A `vh`-derived size would land ~20% large
 * against the width of a 390x844 phone, which turns a fine gold rule into a slab.
 */
const STAGE_WIDTH = 'min(100vw, 56.25vh)'

/** Normalizes to a 6-digit hex so the rgba() derivation below can't be fed junk. */
const toHex6 = (color: string | null | undefined, fallback: string): string => {
  const value = (color ?? '').trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
  return fallback
}

/** `#rrggbb` -> `r, g, b`, for splicing into rgba() with a variable alpha. */
const rgbTriplet = (hex6: string): string => {
  const channel = (at: number) => parseInt(hex6.slice(at, at + 2), 16)
  return `${channel(1)}, ${channel(3)}, ${channel(5)}`
}

/**
 * The warm tint the sparks and the corner flares' outer ring are made of.
 *
 * Only these two take the palette. The travelling speculars stay a fixed
 * near-white: any polished surface's highlight is near-white whatever the
 * metal's base hue, and tinting it to the template's accent turns light on gold
 * into a coloured wash sliding over the artwork.
 */
const tint = computed(() => {
  const { colorSource, customColor } = props.config
  switch (colorSource) {
    case 'custom':
      return toHex6(customColor, '#e0b269')
    case 'primary':
      return toHex6(props.primaryColor, '#e0b269')
    case 'secondary':
      return toHex6(props.secondaryColor || props.primaryColor, '#e0b269')
    case 'accent':
    default:
      return toHex6(props.accentColor || props.primaryColor, '#e0b269')
  }
})

/**
 * One multiplier per layer, so a template picks one word instead of balancing
 * five numbers. `subtle` is a hint of movement on artwork that already carries
 * detail; `bright` is for a plain printed border with nothing else going on.
 */
const INTENSITY_SCALE: Record<ResolvedCoverGilding['intensity'], number> = {
  subtle: 0.55,
  normal: 1,
  bright: 1.45,
}

/**
 * Everything every layer needs: the band geometry, the tint, the per-layer
 * strengths, the stacking position and the fade. One object bound to all of
 * them, since there is no wrapper left to inherit from.
 */
const layerStyle = computed<Record<string, string | number>>(() => {
  const scale = INTENSITY_SCALE[props.config.intensity] ?? 1
  // Capped rather than scaled linearly: at `bright` an uncapped shade turns the
  // band's lower corner into a smear and uncapped sweeps clip to flat white.
  const cap = (value: number) => Math.min(1, value)
  return {
    '--gild-w': STAGE_WIDTH,
    '--gild-outer': `calc(${STAGE_WIDTH} * ${props.config.bandOuter / 100})`,
    '--gild-inner': `calc(${STAGE_WIDTH} * ${props.config.bandInner / 100})`,
    '--gild-tint-rgb': rgbTriplet(tint.value),
    '--gild-shade-op': String(cap(0.55 * scale)),
    '--gild-sweep-op': String(cap(0.85 * scale)),
    '--gild-edge-op': String(cap(0.5 * scale)),
    '--gild-flare-op': String(cap(0.8 * scale)),
    // Multiplies each layer's own opacity rather than replacing it, so the fade
    // is one value across a stack whose members are all differently strong.
    '--gild-fade': props.hidden ? '0' : '1',
    zIndex: props.zIndex,
  }
})

// The drifting motes are NOT here — see CoverSparks.vue, mounted once by
// CoverStage so one field crosses the stage boundary unbroken. The band lighting
// below is light on a surface, so it belongs to the surface and travels with it
// (in door mode, with the leaf).
</script>

<style scoped>
/* ---------- The band ---------- */

/* An outer rectangle with a reversed inner rectangle punching the hole. The hole
   is what keeps every layer off the artwork's middle — a highlight that runs
   past the border and across the photograph reads as a smear on it. */
.gild-band {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: opacity 0.7s ease-out;
  clip-path: polygon(
    var(--gild-outer) var(--gild-outer),
    calc(100% - var(--gild-outer)) var(--gild-outer),
    calc(100% - var(--gild-outer)) calc(100% - var(--gild-outer)),
    var(--gild-outer) calc(100% - var(--gild-outer)),
    var(--gild-outer) var(--gild-outer),
    var(--gild-inner) var(--gild-inner),
    var(--gild-inner) calc(100% - var(--gild-inner)),
    calc(100% - var(--gild-inner)) calc(100% - var(--gild-inner)),
    calc(100% - var(--gild-inner)) var(--gild-inner),
    var(--gild-inner) var(--gild-inner)
  );
}

/* Fixed shadow raking down the lower right of the band — the half of the
   lighting model that gives the light a direction to come from. Without it the
   speculars just make the border periodically brighter, which reads as a flat
   graphic flashing rather than as a raised surface turning in the light.

   Warm graphite rather than the reference's near-black red: that wash multiplies
   to a rich shadow on its own maroon plate, but the ground here is whatever
   decoration photo the template ships and there is no reliable signal for its
   brightness. Graphite darkens toward warm shadow on a light artwork and a dark
   one alike, where a saturated wash stains the light case. */
.gild-shade {
  mix-blend-mode: multiply;
  opacity: calc(var(--gild-shade-op) * var(--gild-fade));
  background: linear-gradient(158deg, rgba(74, 52, 26, 0) 38%, rgba(58, 40, 20, 0.62) 100%);
}

/* Travelling specular. `background-size` plus an animated `background-position`
   keeps the highlight on the compositor; animating the gradient's own stops
   repaints the whole band every frame. */
.gild-sweep {
  mix-blend-mode: screen;
  opacity: calc(var(--gild-sweep-op) * var(--gild-fade));
  background-image: linear-gradient(
    118deg,
    rgba(255, 236, 190, 0) 38%,
    rgba(255, 238, 198, 0.26) 46%,
    rgba(255, 253, 240, 0.92) 50%,
    rgba(255, 238, 198, 0.26) 54%,
    rgba(255, 236, 190, 0) 62%
  );
  background-size: 260% 100%;
  background-position: 150% 0;
  animation: gildSweep 12s linear infinite;
}

/* The second sweep runs at a different angle, speed and direction on purpose:
   two highlights on the same track at the same rate read as one wide band. The
   reference's 1.7 traversals per 12s cycle is this 7.05s against the 12s above. */
.gild-sweep-slow {
  opacity: calc(var(--gild-sweep-op) * 0.55 * var(--gild-fade));
  background-image: linear-gradient(
    58deg,
    rgba(255, 236, 190, 0) 42%,
    rgba(255, 246, 216, 0.7) 50%,
    rgba(255, 236, 190, 0) 58%
  );
  animation: gildSweep 7.05s linear infinite reverse;
}

@keyframes gildSweep {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -80% 0;
  }
}

/* Static catch-light on the two vertical edges. Not animated — it is the ambient
   sky the band sits under, and the thing the moving speculars read *against*. */
.gild-edge {
  mix-blend-mode: screen;
  opacity: calc(var(--gild-edge-op) * var(--gild-fade));
  background: linear-gradient(
    100deg,
    rgba(255, 244, 214, 0.22) 0%,
    rgba(255, 244, 214, 0) 30%,
    rgba(255, 244, 214, 0) 70%,
    rgba(255, 244, 214, 0.18) 100%
  );
}

/* ---------- Corner flares ---------- */

/* Centred on the band's corner rather than the stage's: at 1.9x the outer edge
   the flare sits where a real corner ornament would be, so it lights the join
   instead of bleeding off the plate.

   Deliberately unclipped, unlike the band layers — the ring clip is expressed in
   the clipped element's OWN box, and each flare's box is a small square at a
   corner, so the same polygon would mean something different on each. The
   gradient does the work instead: it is fully transparent by 70% of the radius,
   and the radius is sized so that feathered edge lands just inside the border.
   Light bleeding a little onto the artwork is what light does anyway. */
.gild-flare {
  position: absolute;
  width: calc(var(--gild-w) * 0.11);
  height: calc(var(--gild-w) * 0.11);
  margin: calc(var(--gild-w) * -0.055) 0 0 calc(var(--gild-w) * -0.055);
  pointer-events: none;
  mix-blend-mode: screen;
  background: radial-gradient(
    circle,
    rgba(255, 250, 232, 0.85) 0%,
    rgba(var(--gild-tint-rgb), 0.42) 34%,
    rgba(var(--gild-tint-rgb), 0) 70%
  );
  opacity: calc(0.15 * var(--gild-flare-op) * var(--gild-fade));
  transform: scale(0.7);
  animation: gildFlare 12s linear infinite;
  transition: opacity 0.7s ease-out;
}

.gild-flare-tl {
  left: calc(var(--gild-outer) * 1.9);
  top: calc(var(--gild-outer) * 1.9);
}

.gild-flare-tr {
  left: calc(100% - var(--gild-outer) * 1.9);
  top: calc(var(--gild-outer) * 1.9);
}

.gild-flare-bl {
  left: calc(var(--gild-outer) * 1.9);
  top: calc(100% - var(--gild-outer) * 1.9);
}

.gild-flare-br {
  left: calc(100% - var(--gild-outer) * 1.9);
  top: calc(100% - var(--gild-outer) * 1.9);
}

/* sin(t)^6 sampled: near dark for the first quarter of the cycle, then a fast
   spike and an equally fast fall. A plain sine here reads as a slow throb; the
   sharp shoulder is what makes it a glint. */
/* `--gild-fade` is folded into every stop: an animation's own opacity keyframes
   beat the rule's base value, so a flare left to the base declaration alone
   would keep pulsing at full strength through the cover's exit. */
@keyframes gildFlare {
  0%,
  100% {
    opacity: calc(0.15 * var(--gild-flare-op) * var(--gild-fade));
    transform: scale(0.7);
  }
  20% {
    opacity: calc(0.18 * var(--gild-flare-op) * var(--gild-fade));
    transform: scale(0.72);
  }
  30% {
    opacity: calc(0.4 * var(--gild-flare-op) * var(--gild-fade));
    transform: scale(0.87);
  }
  40% {
    opacity: calc(0.71 * var(--gild-flare-op) * var(--gild-fade));
    transform: scale(1.07);
  }
  50% {
    opacity: calc(0.9 * var(--gild-flare-op) * var(--gild-fade));
    transform: scale(1.2);
  }
  60% {
    opacity: calc(0.71 * var(--gild-flare-op) * var(--gild-fade));
    transform: scale(1.07);
  }
  70% {
    opacity: calc(0.4 * var(--gild-flare-op) * var(--gild-fade));
    transform: scale(0.87);
  }
  80% {
    opacity: calc(0.18 * var(--gild-flare-op) * var(--gild-fade));
    transform: scale(0.72);
  }
}

/* The band keeps its bevel and its static catch-light — those are shading, not
   motion, and dropping them would flatten the border rather than calm it. Only
   the travelling and pulsing parts stop. */
@media (prefers-reduced-motion: reduce) {
  .gild-band {
    transition: none;
  }

  .gild-sweep {
    animation: none;
    background-position: 42% 0;
  }

  .gild-sweep-slow {
    animation: none;
    background-position: 68% 0;
  }

  .gild-flare {
    animation: none;
    opacity: calc(0.4 * var(--gild-flare-op) * var(--gild-fade));
    transform: scale(0.95);
    transition: none;
  }
}
</style>
