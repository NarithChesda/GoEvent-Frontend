<template>
  <div
    v-if="config.enabled && sparks.length"
    class="cover-sparks"
    :style="fieldStyle"
    aria-hidden="true"
  >
    <span v-for="spark in sparks" :key="spark.id" class="cover-spark" :style="spark.style" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResolvedCoverGilding } from '@/composables/showcase/useCoverStageLayout'

/**
 * The gilding's drifting motes, split out of CoverGilding and mounted once by
 * CoverStage rather than by any single stage.
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
 * The band lighting stays in CoverGilding, and stays per-leaf: a specular is
 * light on a *surface*, so it has to travel with the surface. A mote is light in
 * the air in front of it, so it does not.
 */
interface Props {
  /** Fully resolved gilding config (see resolveCoverGilding). */
  config: ResolvedCoverGilding
  primaryColor?: string
  secondaryColor?: string | null
  accentColor?: string
  /**
   * Stacking position within CoverStage. Changing it re-layers the live field
   * without touching the running animations, which is what lets one field cross
   * the stage boundary without the motes restarting.
   */
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), { zIndex: 31 })

/**
 * The showcase stage's own width — `.showcase-container` is
 * `min(100vw, 56.25vh)`. Mote sizes are fractions of it so they keep the
 * reference artwork's proportions on any device.
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

/** The warm tint the motes are made of — the same palette slot the band's corner glints use. */
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

const INTENSITY_SCALE: Record<ResolvedCoverGilding['intensity'], number> = {
  subtle: 0.55,
  normal: 1,
  bright: 1.45,
}

const fieldStyle = computed<Record<string, string | number>>(() => ({
  '--spark-w': STAGE_WIDTH,
  '--spark-tint-rgb': rgbTriplet(tint.value),
  '--spark-op': String(Math.min(1, 0.75 * (INTENSITY_SCALE[props.config.intensity] ?? 1))),
  /**
   * Inset off every edge by the band's inner radius. On the cover that keeps a
   * mote from crossing the printed border, where it reads as dirt on the frame
   * rather than as light in the air. On the main content stage there is no band,
   * and the same inset is a ~26px margin on a phone — invisible, so the one
   * field needs no re-clipping as it crosses over.
   */
  '--spark-inset': `calc(${STAGE_WIDTH} * ${props.config.bandInner / 100})`,
  zIndex: props.zIndex,
}))

/**
 * Deterministic pseudo-random field, seeded off the index.
 *
 * Not `Math.random()`: this field is now the one that survives a stage change,
 * and a re-seed on any incidental re-render would teleport every mote at once.
 */
const hash = (i: number, salt: number): number => {
  const value = Math.sin(i * 5.113 + salt * 31.7) * 24634.63
  return ((value % 1) + 1) % 1
}

/**
 * Reference field: motes over a 12s cycle, sized 5–21px on a 1080-wide plate
 * (0.46%–1.94% of the stage width) and pulsing 2–4 times per cycle.
 */
const sparks = computed(() =>
  Array.from({ length: props.config.sparkCount }, (_, i) => {
    const size = 0.46 + hash(i, 3) * 1.48
    const pulses = 2 + Math.floor(hash(i, 4) * 3)
    const duration = 12 / pulses
    const sizeCss = `calc(var(--spark-w) * ${(size / 100).toFixed(5)})`
    return {
      id: i,
      style: {
        left: `${(hash(i, 1) * 100).toFixed(2)}%`,
        top: `${(hash(i, 2) * 100).toFixed(2)}%`,
        width: sizeCss,
        height: sizeCss,
        animationDuration: `${duration}s`,
        // Negative, so every mote is already mid-cycle on the first frame
        // instead of the whole field igniting together on mount.
        animationDelay: `-${(hash(i, 5) * duration).toFixed(2)}s`,
      } as Record<string, string>,
    }
  }),
)
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
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(var(--spark-tint-rgb), 0.95) 0%,
    rgba(var(--spark-tint-rgb), 0) 70%
  );
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.6);
  animation-name: coverSpark;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
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
