<template>
  <!-- One host's portrait on the arch design: the photograph in a drawn frame,
       or in the partner's own. Rules and geometry live in archPhotoFrame.ts;
       where the frame sits, and how it arrives, is the design's business. -->
  <div class="arch-frame" :class="frameClasses" :style="frameStyle">
    <!-- The pointed window is the one shape border-radius can't draw, so its
         two hairlines are drawn as the same path the photo is cut to. -->
    <svg
      v-if="drawsPointedRules"
      class="arch-rule arch-rule--outer"
      :viewBox="POINTED_FRAME_VIEWBOX"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path :d="POINTED_FRAME_PATH" />
    </svg>

    <div class="arch-photo" :style="photoStyle">
      <img v-if="photo" :src="photo" :alt="alt" loading="lazy" />
      <span v-else class="arch-monogram" :style="{ fontFamily: monogramFont }">{{ initial }}</span>
      <svg
        v-if="drawsPointedRules"
        class="arch-rule arch-rule--inner"
        :viewBox="POINTED_FRAME_VIEWBOX"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path :d="POINTED_FRAME_PATH" />
      </svg>
    </div>

    <!-- The partner's artwork, always over the photograph: fitted around it
         when it has a window of its own, laid over the drawn shape when it
         doesn't. Rendered while it is still being measured too, hidden with
         the rest of the frame, so it is loading in the meantime. -->
    <img
      v-if="art"
      :src="art.url"
      alt=""
      class="arch-art"
      :class="art.mode === 'window' ? 'arch-art--placed' : 'arch-art--over'"
      :style="artStyle"
      draggable="false"
      v-bind="protectionAttrs"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HostPhotoFrame } from '@/services/api/types/template.types'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import {
  POINTED_FRAME_MASK,
  POINTED_FRAME_PATH,
  POINTED_FRAME_VIEWBOX,
  type ArchFrameArt,
  type PercentBox,
} from './archPhotoFrame'

interface Props {
  /** The photograph, already a full URL. Absent draws the monogram. */
  photo?: string
  /** The photograph's alt text: the host's name. */
  alt: string
  /** Drawn in place of a missing photograph. */
  initial: string
  shape: HostPhotoFrame
  /** The partner's own frame, resolved once by the design for every card. Null draws `shape`. */
  art?: ArchFrameArt | null
  /** What a missing photograph's frame is filled with. */
  groundColor: string
  monogramFont: string
}

const props = withDefaults(defineProps<Props>(), { photo: undefined, art: null })

const { protectionAttrs } = useAssetProtection()

const percentBox = (box: PercentBox): Record<string, string> => ({
  left: `${box.left}%`,
  top: `${box.top}%`,
  width: `${box.width}%`,
  height: `${box.height}%`,
})

const frameClasses = computed(() => {
  const mode = props.art?.mode
  // Fitted art has a shape of its own; the drawn one doesn't apply at all.
  if (mode === 'window') return ['arch-frame--art']
  return [
    `arch-frame--${props.shape}`,
    { 'arch-frame--pending': mode === 'pending', 'arch-frame--overlaid': mode === 'overlay' },
  ]
})

/** The partner's artwork replaces the drawn hairlines in either mode. */
const drawsPointedRules = computed(() => props.shape === 'pointed' && !props.art)

const frameStyle = computed((): Record<string, string> => {
  const art = props.art
  if (art?.mode === 'window') return { aspectRatio: `${art.layout.aspect}` }
  if (props.shape === 'pointed') return { '--arch-pointed-mask': POINTED_FRAME_MASK }
  return {}
})

const photoStyle = computed<Record<string, string>>(() => {
  const art = props.art
  if (art?.mode !== 'window') return { background: props.groundColor }
  const mask = `url("${art.mask}")`
  return {
    ...percentBox(art.layout.opening),
    background: props.groundColor,
    maskImage: mask,
    WebkitMaskImage: mask,
  }
})

const artStyle = computed<Record<string, string>>(() =>
  props.art?.mode === 'window' ? percentBox(props.art.layout.image) : {},
)
</script>

<style scoped>
/* ============================================================
   Two hairlines and the air between them: an outer line tracing
   the frame and an inner one riding on the photo, which is how a
   portrait is mounted on printed stationery. Every drawn shape
   keeps both, so changing the shape never changes the material.
   ============================================================ */
.arch-frame {
  position: relative;
}

/* The outer hairline. It stands `--arch-frame-outset` off the photo, a value
   the design owns because its stage has to reserve exactly that much room for
   it at the column's edges. */
.arch-frame::after {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--arch-frame-outset, 6px));
  border: 1px solid color-mix(in srgb, var(--arch-accent, currentColor) 70%, transparent);
  border-radius: var(--arch-mat-radius);
  pointer-events: none;
}

.arch-photo {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: var(--arch-photo-radius);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 26px rgba(62, 58, 54, 0.16);
}

.arch-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* The inner hairline, riding on the photo. */
.arch-photo::after {
  content: '';
  position: absolute;
  inset: 7px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: inherit;
  pointer-events: none;
}

.arch-monogram {
  font-size: clamp(30px, 9vw, 52px);
  line-height: 1;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
}

/* ---------- the drawn shapes ----------
   Each is a pair of radii — the photo's and its mat's — so the two hairlines
   stay concentric. The mat's is the photo's plus the outset wherever that
   reads as a parallel line; on the round ones a percentage already is. */
.arch-frame--arch {
  --arch-photo-radius: 999px 999px 10px 10px;
  --arch-mat-radius: 999px 999px 14px 14px;
}

.arch-frame--oval,
.arch-frame--circle {
  --arch-photo-radius: 50%;
  --arch-mat-radius: 50%;
}

/* The medallion is the one square shape. Shorter than the rest by a fifth,
   which the cards' own rows simply take up. */
.arch-frame--circle .arch-photo {
  aspect-ratio: 1 / 1;
}

/* A print in its mount: square enough to read as cut paper, softened only so
   the corners don't alias into steps at a phone's size. */
.arch-frame--rectangle {
  --arch-photo-radius: 2px;
  --arch-mat-radius: 4px;
}

/* The pointed window: cut by a mask instead of a radius. A mask clips the
   element's own box-shadow along with it, so the shadow moves up a level to a
   drop-shadow on the frame, which follows the cut edge. */
.arch-frame--pointed {
  filter: drop-shadow(0 12px 13px rgba(62, 58, 54, 0.16));
}

.arch-frame--pointed::after,
.arch-frame--pointed .arch-photo::after {
  content: none;
}

.arch-frame--pointed .arch-photo {
  border-radius: 0;
  box-shadow: none;
  -webkit-mask-image: var(--arch-pointed-mask);
  mask-image: var(--arch-pointed-mask);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

/* Absolutely placed SVGs don't stretch to their insets the way a box does —
   they keep their intrinsic 300×150 — so both are sized outright. */
.arch-rule {
  position: absolute;
  overflow: visible;
  fill: none;
  pointer-events: none;
}

.arch-rule path {
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.arch-rule--outer {
  left: calc(-1 * var(--arch-frame-outset, 6px));
  top: calc(-1 * var(--arch-frame-outset, 6px));
  width: calc(100% + 2 * var(--arch-frame-outset, 6px));
  height: calc(100% + 2 * var(--arch-frame-outset, 6px));
  stroke: color-mix(in srgb, var(--arch-accent, currentColor) 70%, transparent);
}

.arch-rule--inner {
  left: 7px;
  top: 7px;
  width: calc(100% - 14px);
  height: calc(100% - 14px);
  stroke: rgba(255, 255, 255, 0.5);
}

/* ---------- the partner's own frame ---------- */

/* Not drawn until it has been measured: the drawn shape holds its place,
   invisibly, so the caption doesn't jump when the artwork arrives. */
.arch-frame--pending {
  visibility: hidden;
}

/* Their artwork stands in for both hairlines and for the shadow: how the
   frame sits on the card is part of what they drew. */
.arch-frame--overlaid::after,
.arch-frame--overlaid .arch-photo::after,
.arch-frame--art::after,
.arch-frame--art .arch-photo::after {
  content: none;
}

.arch-frame--overlaid {
  filter: none;
}

.arch-frame--overlaid .arch-photo {
  box-shadow: none;
}

/* Fitted: the box is the artwork's inked area, and the photograph is cut to
   the window the artwork encloses. Its own shadow would fall on the frame's
   inside edge, which the artwork is drawn over anyway. */
.arch-frame--art {
  width: 100%;
}

.arch-frame--art .arch-photo {
  position: absolute;
  aspect-ratio: auto;
  border-radius: 0;
  box-shadow: none;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

/* `max-width: none`: preflight's `img { max-width: 100% }` would squash the
   artwork back into the box it is deliberately larger than. */
.arch-art {
  position: absolute;
  z-index: 1;
  display: block;
  max-width: none;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.arch-art--over {
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
