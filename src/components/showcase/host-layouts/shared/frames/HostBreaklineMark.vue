<template>
  <div
    v-if="isDrawn"
    class="host-breakline"
    :class="{ 'is-animated': animated }"
    :style="rootStyle"
    aria-hidden="true"
  >
    <!-- A partner's own artwork. It replaces the drawn rule outright rather
         than sitting inside it: the file *is* the ornament, and a hairline
         running out of both ends of someone else's drawing is a seam, not a
         frame. Same precedence `falling_effect.custom_image` and the spark
         field's mote image already have over their built-in shapes. -->
    <img v-if="imageSrc" :src="imageSrc" class="host-breakline__art" alt="" />

    <!-- One drawing, edge to edge. The only style that is a stroke rather than
         a rule with a mark on it, so it takes the whole width itself. -->
    <svg
      v-else-if="resolvedStyle === 'flourish'"
      class="host-breakline__flourish"
      :viewBox="BREAKLINE_VIEWBOX"
      fill="none"
      preserveAspectRatio="none"
      focusable="false"
    >
      <path
        :d="BREAKLINE_FLOURISH_PATH"
        stroke="currentColor"
        stroke-width="1.1"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <circle
        v-for="(dot, i) in BREAKLINE_FLOURISH_DOTS"
        :key="i"
        :cx="dot.cx"
        :cy="dot.cy"
        r="1.6"
        fill="currentColor"
      />
    </svg>

    <!-- Two half-rules with a mark between them. Authored as halves rather than
         as one rule with the motif laid over it so each half fades *into* the
         mark: at this weight a continuous line shows through the drawing, and
         the mark then reads as a bead threaded on the line. -->
    <template v-else-if="motif">
      <span class="host-breakline__rule host-breakline__rule--left"></span>
      <!-- The lotus gets its ink bounds; the lozenge was authored to the box.
           See BLOOM_TIGHT_VIEWBOX — a mark on a rule has to be centred ON the
           rule, which a square box full of empty space is not. -->
      <svg
        class="host-breakline__motif"
        :viewBox="motif === 'lotus' ? BLOOM_TIGHT_VIEWBOX : ORNAMENT_VIEWBOX"
        fill="none"
        focusable="false"
      >
        <template v-if="motif === 'diamond'">
          <path
            :d="BREAKLINE_DIAMOND_PATH"
            stroke="currentColor"
            :stroke-width="STROKE_WIDTH"
            stroke-linejoin="round"
          />
          <path
            :d="BREAKLINE_DIAMOND_INNER_PATH"
            stroke="currentColor"
            :stroke-width="STROKE_WIDTH * 0.75"
            stroke-linejoin="round"
            opacity="0.55"
          />
        </template>
        <template v-else>
          <path
            v-for="(petal, i) in BLOOM_PATHS"
            :key="i"
            :d="petal"
            stroke="currentColor"
            :stroke-width="STROKE_WIDTH * 0.85"
            stroke-linejoin="round"
            :opacity="i === 0 ? 1 : 0.78"
          />
        </template>
      </svg>
      <span class="host-breakline__rule host-breakline__rule--right"></span>
    </template>

    <!-- One rule, fading out at both ends so it reads as stationery rather than
         as a table border. -->
    <span v-else class="host-breakline__rule host-breakline__rule--full"></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HostBreaklineStyle } from '@/services/api/types/template.types'
import {
  ORNAMENT_VIEWBOX,
  BLOOM_PATHS,
  BLOOM_TIGHT_VIEWBOX,
  BREAKLINE_VIEWBOX,
  BREAKLINE_FLOURISH_PATH,
  BREAKLINE_FLOURISH_DOTS,
  BREAKLINE_DIAMOND_PATH,
  BREAKLINE_DIAMOND_INNER_PATH,
} from './ornamentPaths'

/**
 * The horizontal breakline that closes the `crest` design's host block.
 *
 * Distinct from `CoupleOrnamentMark`, which draws a small motif *between* the
 * two hosts. This one runs under both of them and ends the block, which is why
 * the two can be on at once without competing — and why this is the one piece
 * of chrome a partner can both restyle and replace with a file of their own.
 *
 * Everything is drawn in `currentColor` and sized off two custom properties, so
 * the caller owns the palette and the width and this component owns the shapes.
 */
interface Props {
  /**
   * Which drawn breakline. Named `breakline` rather than `style` because Vue
   * reserves `class` and `style`: a prop called `style` is swallowed as a
   * fallthrough attribute on the root element and never reaches the component.
   */
  breakline?: HostBreaklineStyle | null
  /**
   * A partner's uploaded breakline. Present wins over `breakline` outright —
   * see the template comment. Null/empty falls back to the drawn styles.
   */
  imageSrc?: string | null
  /** Usually the template's accent — the same slot the other drawn chrome uses. */
  color: string
  animated?: boolean
  animationDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  breakline: 'rule',
  imageSrc: null,
  animated: false,
  animationDelay: 0,
})

/**
 * One stroke weight for both centre motifs, in viewBox units — they share a box
 * and render at the same size, so a per-motif weight would make one read
 * heavier than the other for no reason a guest could name. Matches
 * CoupleOrnamentMark's.
 */
const STROKE_WIDTH = 3.2

const resolvedStyle = computed<HostBreaklineStyle>(() => props.breakline ?? 'rule')

/**
 * An uploaded file is still drawn on `none`. "None" is a statement about the
 * *drawn* rule — the partner who attached artwork has already said they want
 * something there, and silently discarding their file would leave the upload
 * control looking broken.
 */
const isDrawn = computed(() => !!props.imageSrc || resolvedStyle.value !== 'none')

/** Which centre mark, if any. `rule` and `flourish` have none. */
const motif = computed<'diamond' | 'lotus' | null>(() => {
  if (props.imageSrc) return null
  if (resolvedStyle.value === 'diamond') return 'diamond'
  if (resolvedStyle.value === 'lotus') return 'lotus'
  return null
})

const rootStyle = computed(() => ({
  color: props.color,
  animationDelay: `${props.animationDelay}s`,
}))
</script>

<style scoped>
.host-breakline {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Set by the caller: the breakline's width is a share of the host block, and
     only the block knows how wide that is. */
  width: var(--hb-width, 50%);
  opacity: 0.85;
}

/* The rule stays a hairline at every width. Scaling it with the breakline would
   turn a generous ornament into a bar, and the size control is about how much
   of the block the ornament claims, not how heavy its line is. */
.host-breakline__rule {
  height: 1px;
  flex: 1 1 auto;
  min-width: 0;
  background: linear-gradient(
    to right,
    transparent 0%,
    currentColor 18%,
    currentColor 82%,
    transparent 100%
  );
}

/* Each half fades only at its outer end, so the pair runs *into* the motif
   instead of pinching away from it on both sides. */
.host-breakline__rule--left {
  background: linear-gradient(to right, transparent 0%, currentColor 85%, currentColor 100%);
}

.host-breakline__rule--right {
  background: linear-gradient(to right, currentColor 0%, currentColor 15%, transparent 100%);
}

.host-breakline__motif {
  display: block;
  /* Never shrink: it is a flex item between two rules that both want to grow,
     and a motif left flexible is squeezed to nothing rather than overflowing —
     silently, with no layout error to notice. */
  flex: none;
  width: clamp(1rem, 5vw, 1.5rem);
  height: auto;
  margin: 0 0.45rem;
  overflow: visible;
}

/* `preserveAspectRatio: none` plus a non-scaling stroke: the flourish has to
   stretch to whatever width the partner chose — a curve that keeps its aspect
   would set the height instead and grow a decorative line into a band — while
   the stroke itself stays the same hairline the rules are. */
.host-breakline__flourish {
  display: block;
  width: 100%;
  height: clamp(0.9rem, 4vw, 1.4rem);
  overflow: visible;
}

/* The artwork's own aspect decides the height; the caller's width decides the
   rest. `max-width` is restated because Tailwind's preflight pins every `img`
   at 100% of its container and this one is sized by its parent instead. */
.host-breakline__art {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  object-fit: contain;
}

/* Draws itself in rather than appearing: the couple above arrives on its own
   stagger, and a rule that simply exists under them reads as a border instead
   of as the last beat of the same gesture. */
.host-breakline.is-animated {
  opacity: 0;
  animation: hostBreaklineDraw 0.7s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes hostBreaklineDraw {
  from {
    opacity: 0;
    transform: scaleX(0.7);
  }
  to {
    opacity: 0.85;
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .host-breakline.is-animated {
    animation: hostBreaklineFade 0.4s ease forwards;
  }

  @keyframes hostBreaklineFade {
    to {
      opacity: 0.85;
    }
  }
}
</style>
