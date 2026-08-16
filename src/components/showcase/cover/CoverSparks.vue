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
 * The field: motes sized across the configured range and pulsing 2–4 times per
 * cycle, where the cycle is the original 12s divided by the blink-speed
 * multiplier.
 */
const sparks = computed(() => {
  const { count, minSize, maxSize, blinkSpeed } = field.value
  const spread = maxSize - minSize
  return Array.from({ length: count }, (_, i) => {
    const size = minSize + hash(i, 3) * spread
    const pulses = 2 + Math.floor(hash(i, 4) * 3)
    const duration = 12 / pulses / blinkSpeed
    const sizeCss = `calc(var(--spark-w) * ${(size / 100).toFixed(5)})`
    return {
      id: i,
      style: {
        left: `${(hash(i, 1) * 100).toFixed(2)}%`,
        top: `${(hash(i, 2) * 100).toFixed(2)}%`,
        width: sizeCss,
        height: sizeCss,
        animationDuration: `${duration.toFixed(3)}s`,
        // Negative, so every mote is already mid-cycle on the first frame
        // instead of the whole field igniting together on mount.
        animationDelay: `-${(hash(i, 5) * duration).toFixed(2)}s`,
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

.cover-spark {
  position: absolute;
  display: block;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.6);
  animation-name: coverSpark;
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
   glints, so the two populations don't beat against each other. */
@keyframes coverSpark {
  0%,
  100% {
    opacity: calc(0.12 * var(--spark-op));
    transform: translate(-50%, -50%) scale(0.6);
  }
  25% {
    opacity: calc(0.42 * var(--spark-op));
    transform: translate(-50%, -50%) scale(1.05);
  }
  50% {
    opacity: calc(0.72 * var(--spark-op));
    transform: translate(-50%, -50%) scale(1.5);
  }
  75% {
    opacity: calc(0.42 * var(--spark-op));
    transform: translate(-50%, -50%) scale(1.05);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-spark {
    animation: none;
    opacity: calc(0.35 * var(--spark-op));
    transform: translate(-50%, -50%) scale(1.1);
  }
}
</style>
