<template>
  <div
    v-if="field.enabled && sparks.length"
    class="cover-sparks"
    :style="fieldStyle"
    aria-hidden="true"
  >
    <span
      v-for="spark in sparks"
      :key="spark.id"
      class="cover-spark"
      :class="{ 'cover-spark--glow': isGlow }"
      :style="spark.style"
    >
      <!-- A custom upload wins over any built-in shape, exactly as it does for
           the falling particles. Rendered as-is rather than recoloured: an
           uploaded spark carries its own art, and the colour setting stays with
           the built-in shapes it applies to (mirrors FallingEffect, where
           `color_source` likewise only drives the built-in SVGs). -->
      <img
        v-if="customImage"
        :src="customImage"
        class="cover-spark-art"
        alt=""
        draggable="false"
      />
      <svg v-else-if="shapePath" class="cover-spark-art" viewBox="0 0 24 24" aria-hidden="true">
        <path :d="shapePath" fill="currentColor" />
      </svg>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  SPARK_SHAPE_PATHS,
  resolveSparkField,
  type ResolvedSparkField,
} from '@/composables/showcase/useSparkField'
import type {
  CoverGildingConfig,
  SparkFieldConfig,
} from '@/services/api/types/template.types'

/**
 * The drifting spark field, mounted once by CoverStage rather than by any single
 * stage.
 *
 * Same reasoning as FallingEffect, which sits beside it for the same reason:
 * CoverStage is mounted for the whole showcase, so one field drifts unbroken
 * from the cover through the transition and on into the main content. Left
 * inside CoverGilding the motes died with the cover — and in door mode they were
 * worse than that, swinging off-screen with the leaf that carried them.
 * `zIndex` re-layers the one field instead of a second one being spawned: over
 * the cover artwork and the door panels while the cover is up, then behind the
 * main content card once that takes over.
 *
 * The field is now configured standalone via `template_assets.sparks` (see
 * useSparkField) instead of as a fifth layer of the cover gilding — it is an
 * independent decoration like the falling particles and the ambient creatures,
 * not part of the band lighting. `gilding` is still accepted purely as the
 * legacy fallback for templates saved before that split.
 *
 * The band lighting stays in CoverGilding, and stays per-leaf: a specular is
 * light on a *surface*, so it has to travel with the surface. A mote is light in
 * the air in front of it, so it does not.
 */
interface Props {
  /** Standalone spark config. Absent = fall back to `gilding`. */
  config?: SparkFieldConfig | null
  /** Legacy source for templates with no standalone `sparks` block. */
  gilding?: CoverGildingConfig | null
  primaryColor?: string
  secondaryColor?: string | null
  accentColor?: string
  /** Resolves a relative media URL (for `custom_image`). */
  getMediaUrl?: (url: string) => string
  /**
   * Stacking position within CoverStage. Changing it re-layers the live field
   * without touching the running animations, which is what lets one field cross
   * the stage boundary without the motes restarting.
   */
  zIndex?: number
  /**
   * Inset off every edge, as a % of the stage width. On the cover this keeps a
   * mote from crossing the printed border, where it reads as dirt on the frame
   * rather than as light in the air. Defaults to the gilding band's inner edge
   * so the framing is unchanged for templates that had one.
   */
  inset?: number
}

const props = withDefaults(defineProps<Props>(), { zIndex: 31 })

/**
 * The showcase stage's own width — `.showcase-container` is
 * `min(100vw, 56.25vh)`. Mote sizes are fractions of it so they keep the
 * reference artwork's proportions on any device.
 */
const STAGE_WIDTH = 'min(100vw, 56.25vh)'

/** The reference artwork's band inner edge, used when no inset is given. */
const DEFAULT_INSET = 6.9

/** Every setting populated, from the standalone config or the legacy fallback. */
const field = computed<ResolvedSparkField>(() =>
  resolveSparkField(props.config, props.gilding),
)

/** The custom mote artwork, resolved through the media URL resolver. */
const customImage = computed(() => {
  const img = field.value.customImage
  if (!img) return null
  return props.getMediaUrl ? props.getMediaUrl(img) : img
})

/** The drawn geometry, or null for `glow` (a gradient) / a custom upload. */
const shapePath = computed(() => {
  const shape = field.value.shape
  if (customImage.value || shape === 'glow') return null
  return SPARK_SHAPE_PATHS[shape] ?? null
})

/** True when the mote is the original edgeless gradient rather than artwork. */
const isGlow = computed(() => !customImage.value && !shapePath.value)

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

/** The tint the motes are made of. */
const tint = computed(() => {
  const { colorSource, customColor } = field.value
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

const INTENSITY_SCALE: Record<ResolvedSparkField['intensity'], number> = {
  subtle: 0.55,
  normal: 1,
  bright: 1.45,
}

const fieldStyle = computed<Record<string, string | number>>(() => {
  const rgb = rgbTriplet(tint.value)
  return {
    '--spark-w': STAGE_WIDTH,
    '--spark-tint-rgb': rgb,
    // Drawn shapes and custom images inherit this via `currentColor`, so one
    // value tints the gradient, the SVG fill and the image mask alike.
    color: `rgb(${rgb})`,
    '--spark-op': String(Math.min(1, 0.75 * (INTENSITY_SCALE[field.value.intensity] ?? 1))),
    '--spark-inset': `calc(${STAGE_WIDTH} * ${(props.inset ?? DEFAULT_INSET) / 100})`,
    zIndex: props.zIndex,
  }
})

/**
 * Deterministic pseudo-random field, seeded off the index.
 *
 * Not `Math.random()`: this field is the one that survives a stage change, and a
 * re-seed on any incidental re-render would teleport every mote at once.
 */
const hash = (i: number, salt: number): number => {
  const value = Math.sin(i * 5.113 + salt * 31.7) * 24634.63
  return ((value % 1) + 1) % 1
}

/**
 * How far a mote wanders, as a multiple of its own size, and the bounds that
 * multiple is clamped into (fractions of the stage width, like every other
 * measurement here).
 *
 * Tied to size rather than set flat, because that is what makes the drift read
 * as parallax instead of as noise: a big mote is a near one, and near things
 * sweep further across the eye than far ones do. The floor keeps a field of
 * deliberately tiny motes from drifting invisibly; the ceiling stops a field of
 * large ones from crossing the cover.
 */
const DRIFT_SIZE_RATIO = { min: 1.1, max: 1.9 } as const
const DRIFT_RADIUS = { min: 0.35, max: 3 } as const

/** Seconds for one full loop of the drift. Deliberately far longer than any
 *  blink cycle — at these radii it works out under 2px a second, which is
 *  nothing frame to frame and obvious if you look away and back. */
const DRIFT_PERIOD = { min: 38, max: 95 } as const

/**
 * The field: motes sized across the configured range, pulsing 2–4 times per
 * cycle (the original 12s divided by the blink-speed multiplier), and drifting
 * a slow ellipse on a period of their own.
 *
 * Size, position, rate and phase already vary per mote; `--spark-peak` adds the
 * one axis that did not. Every mote used to run the identical 0.6 → 1.5 → 0.6
 * bloom, differing only in how fast and when — so the field read as one effect
 * played at staggered offsets rather than as a population of lights at
 * different distances. The peak scales how far each mote opens up, which is
 * what a mote further into the depth of the scene would do.
 *
 * The drift's period is independent of the blink's, and deliberately so: share
 * them and every mote reaches its brightest at the same point in its loop every
 * time, which is the tell that turns a population of lights back into one
 * effect. `blink_speed` likewise does not touch it — a template that cranks the
 * pulse to a strobe should get frantic motes, not fast-flying ones.
 */
const sparks = computed(() => {
  const { count, minSize, maxSize, blinkSpeed } = field.value
  const spread = maxSize - minSize

  // The field box is the stage inset off every edge, so a drift measured in
  // stage widths covers a correspondingly larger share of the box it moves in.
  const boxFraction = Math.max(0.2, 1 - (2 * (props.inset ?? DEFAULT_INSET)) / 100)

  return Array.from({ length: count }, (_, i) => {
    const size = minSize + hash(i, 3) * spread
    const pulses = 2 + Math.floor(hash(i, 4) * 3)
    const duration = 12 / pulses / blinkSpeed
    const sizeCss = `calc(var(--spark-w) * ${(size / 100).toFixed(5)})`

    const ratio =
      DRIFT_SIZE_RATIO.min + hash(i, 7) * (DRIFT_SIZE_RATIO.max - DRIFT_SIZE_RATIO.min)
    const radius = Math.min(DRIFT_RADIUS.max, Math.max(DRIFT_RADIUS.min, size * ratio))
    // A circle for every mote would read as a carousel, so the vertical radius
    // is a fraction of the horizontal one and its sign decides which way round
    // the loop is travelled — flat ellipses and round ones, both directions.
    const dx = radius / 100
    const dy = ((radius * (0.45 + hash(i, 8) * 0.85)) / 100) * (hash(i, 9) < 0.5 ? -1 : 1)
    const driftPeriod =
      DRIFT_PERIOD.min + hash(i, 10) * (DRIFT_PERIOD.max - DRIFT_PERIOD.min)

    // Keep the whole mote, and the whole loop it travels, inside the field box.
    // Motes used to be placed across the full 0–100%, which already clipped
    // half of any mote sitting on an edge; giving them somewhere to go would
    // have had them wander out of the box entirely and vanish.
    const margin = Math.min(
      30,
      ((Math.max(Math.abs(dx), Math.abs(dy)) + size / 200) / boxFraction) * 100,
    )
    const span = 100 - margin * 2

    return {
      id: i,
      style: {
        left: `${(margin + hash(i, 1) * span).toFixed(2)}%`,
        top: `${(margin + hash(i, 2) * span).toFixed(2)}%`,
        width: sizeCss,
        height: sizeCss,
        // Two animations, in the order .cover-spark names them: the blink, then
        // the drift.
        animationDuration: `${duration.toFixed(3)}s, ${driftPeriod.toFixed(2)}s`,
        // Negative, so every mote is already mid-cycle on the first frame
        // instead of the whole field igniting — and setting off around its
        // loop — together on mount.
        animationDelay: `-${(hash(i, 5) * duration).toFixed(2)}s, -${(
          hash(i, 11) * driftPeriod
        ).toFixed(2)}s`,
        // How wide this particular mote opens at the top of its breathe. 1 is
        // the bloom the field has always drawn, so the mid-range is unchanged.
        '--spark-peak': (0.72 + hash(i, 6) * 0.56).toFixed(3),
        // Drift radii, as fractions of the stage width for the keyframes to
        // scale `--spark-w` by.
        '--spark-dx': dx.toFixed(6),
        '--spark-dy': dy.toFixed(6),
      } as Record<string, string>,
    }
  })
})
</script>

<style scoped>
.cover-sparks {
  position: absolute;
  inset: var(--spark-inset);
  overflow: hidden;
  pointer-events: none;
}

/* The blink and the drift are separate animations on separate properties, not
   one animation on `transform`. A mote breathes every few seconds and wanders
   over a minute and a half, and a single transform track cannot hold two
   periods — combining them would force the drift onto the blink's clock. CSS's
   individual transform longhands compose as translate ∘ scale, which is exactly
   what `translate(-50%, -50%) scale(...)` used to build, so the resting frame
   is unchanged. */
.cover-spark {
  position: absolute;
  display: block;
  opacity: 0;
  translate: -50% -50%;
  scale: 0.6;
  animation-name: coverSpark, coverSparkDrift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

/* The original mote: a soft radial gradient with no edge. */
.cover-spark--glow {
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(var(--spark-tint-rgb), 0.95) 0%,
    rgba(var(--spark-tint-rgb), 0) 70%
  );
}

/* Drawn shapes have hard edges where the gradient had none, so they get a glow
   of their own — without it a solid star reads as a sticker rather than light. */
.cover-spark-art {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 calc(var(--spark-w) * 0.004) rgba(var(--spark-tint-rgb), 0.85));
}

/* sin(t)^2 sampled — a soft breathe, deliberately unlike the band's corner
   glints, so the two populations don't beat against each other.

   The peak sits at 42% rather than at the exact midpoint: light arrives a
   little faster than it leaves, so the decay is the longer half. Enough to take
   the metronome out of the pulse without turning a breathe into a twinkle,
   which is the one thing this curve is deliberately not. */
@keyframes coverSpark {
  0%,
  100% {
    opacity: calc(0.12 * var(--spark-op));
    scale: 0.6;
  }
  21% {
    opacity: calc(0.42 * var(--spark-op));
    scale: calc(0.6 + 0.45 * var(--spark-peak, 1));
  }
  42% {
    opacity: calc(0.72 * var(--spark-op) * var(--spark-peak, 1));
    scale: calc(0.6 + 0.9 * var(--spark-peak, 1));
  }
  71% {
    opacity: calc(0.42 * var(--spark-op));
    scale: calc(0.6 + 0.45 * var(--spark-peak, 1));
  }
}

/* The drift: one slow ellipse, sampled every 30° so the linear interpolation
   between stops stays a curve. Twelve stops hold the radius to within 3.4% of
   true — four would have traced a diamond, and at this speed the corners are
   exactly the kind of thing the eye catches when nothing else is moving.

   `--spark-dx` / `--spark-dy` are fractions of the stage width rather than
   pixels, for the same reason the mote sizes are: an amplitude tuned on a
   laptop is half the stage on a phone. A negative dy reverses the loop. */
@keyframes coverSparkDrift {
  0%,
  100% {
    translate: calc(-50% + var(--spark-w) * var(--spark-dx)) -50%;
  }
  8.333% {
    translate: calc(-50% + var(--spark-w) * var(--spark-dx) * 0.866)
      calc(-50% + var(--spark-w) * var(--spark-dy) * 0.5);
  }
  16.667% {
    translate: calc(-50% + var(--spark-w) * var(--spark-dx) * 0.5)
      calc(-50% + var(--spark-w) * var(--spark-dy) * 0.866);
  }
  25% {
    translate: -50% calc(-50% + var(--spark-w) * var(--spark-dy));
  }
  33.333% {
    translate: calc(-50% - var(--spark-w) * var(--spark-dx) * 0.5)
      calc(-50% + var(--spark-w) * var(--spark-dy) * 0.866);
  }
  41.667% {
    translate: calc(-50% - var(--spark-w) * var(--spark-dx) * 0.866)
      calc(-50% + var(--spark-w) * var(--spark-dy) * 0.5);
  }
  50% {
    translate: calc(-50% - var(--spark-w) * var(--spark-dx)) -50%;
  }
  58.333% {
    translate: calc(-50% - var(--spark-w) * var(--spark-dx) * 0.866)
      calc(-50% - var(--spark-w) * var(--spark-dy) * 0.5);
  }
  66.667% {
    translate: calc(-50% - var(--spark-w) * var(--spark-dx) * 0.5)
      calc(-50% - var(--spark-w) * var(--spark-dy) * 0.866);
  }
  75% {
    translate: -50% calc(-50% - var(--spark-w) * var(--spark-dy));
  }
  83.333% {
    translate: calc(-50% + var(--spark-w) * var(--spark-dx) * 0.5)
      calc(-50% - var(--spark-w) * var(--spark-dy) * 0.866);
  }
  91.667% {
    translate: calc(-50% + var(--spark-w) * var(--spark-dx) * 0.866)
      calc(-50% - var(--spark-w) * var(--spark-dy) * 0.5);
  }
}

/* Sparks are ambient light, not information, so reduced motion stops them
   outright — both the blink and the drift — rather than gentling them. The
   field itself stays: a still mote still reads as a light, which is why this
   holds a visible resting frame where the petals and the creatures, which would
   read as frozen mid-air, are removed entirely. */
@media (prefers-reduced-motion: reduce) {
  .cover-spark {
    animation: none;
    opacity: calc(0.35 * var(--spark-op));
    /* Held at each mote's own bloom rather than at one shared 1.1, so the
       still field keeps the depth the moving one has. */
    translate: -50% -50%;
    scale: calc(0.55 + 0.55 * var(--spark-peak, 1));
  }
}
</style>
