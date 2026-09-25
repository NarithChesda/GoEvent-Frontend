<template>
  <!-- One photograph across the full width of the card, cut into three tall
       stripes, with the days, hours and minutes set at the foot of each. It
       runs edge to edge like a photo band (the stage hands down the card's
       negative margins as `bleedClass`), so it reads as the section's
       background, cut in three — not as three pictures on the page.

       It is one print, not three: every stripe is a window onto the same
       full-frame image, clipped to its own column, so the gaps read as cuts
       through a single photograph. -->
  <div class="cds" :class="[bleedClass, { 'is-revealed': revealed, 'has-photo': !!src }]">
    <!-- The outline is drawn inside: at full bleed the card clips anything
         drawn outside the band's sides (the photo band's arrangement). -->
    <EditableRegion :intent="photoIntent" class="cds__region" style="outline-offset: -3px">
      <div ref="frameRef" class="cds__frame" :style="frameStyle">
        <div
          v-for="index in STRIP_COUNT"
          :key="index"
          class="cds__strip"
          :class="`cds__strip--${index - 1}`"
          :style="{ '--i': index - 1 }"
          aria-hidden="true"
        >
          <img
            v-if="src"
            :src="src"
            alt=""
            class="cds__img"
            :style="imgStyle"
            loading="lazy"
            decoding="async"
            draggable="false"
            v-bind="protectionAttrs"
            @load="onLoad"
          />
          <span class="cds__scrim" />
        </div>

        <div class="cds__figures">
          <div
            v-for="(unit, index) in units"
            :key="unit.key"
            class="cds__figure"
            :style="{ '--i': index }"
          >
            <span
              class="cds__num"
              :class="[{ 'is-long': [...unit.value].length > 2 }, src ? fx('primary') : []]"
              :style="{ fontFamily: displayFont }"
            >
              <RollingNumber :value="unit.value" />
            </span>
            <span
              class="cds__unit"
              :class="{ 'is-khmer': khmer }"
              :style="{ fontFamily: textFont, color: unitInk ?? undefined }"
            >
              {{ unit.label }}
            </span>
          </div>
        </div>
      </div>
    </EditableRegion>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import type { EditIntent } from '@/components/showcase-preview/edit/editContext'
import { PHOTO_DELIVERY, useTemplateProcessor } from '@/composables/showcase/useTemplateProcessor'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import { useTextEffect, useTextEffectMarkInk } from '@/composables/showcase/useTextEffects'
import { cropCentre, cropToCoverGeometry, resolvePhotoCrop, type Size } from '@/utils/photoCrop'
import RollingNumber from '../RollingNumber.vue'
import { stripesShapeMask } from '../countdownRsvp'
import type { CountdownDesignProps } from '../types'

const props = defineProps<CountdownDesignProps>()

const STRIP_COUNT = 3

/** Width ÷ height of the band — portrait, like a photo band. */
const STRIPS_ASPECT = 4 / 5

/**
 * The cut between two stripes: a share of the band's width, held between a
 * hairline that still reads as a cut and a gap that would start to read as
 * three separate pictures. Resolved here rather than in CSS because the
 * studio's framing editor draws the same gaps, and has to be told how wide
 * they are.
 */
const gapFor = (width: number): number => Math.min(8, Math.max(4, width * 0.016))

const { getOptimizedMediaUrl } = useTemplateProcessor()
const { protectionAttrs } = useAssetProtection()

// Full width, so a wider delivery than the gallery grid's; all three stripes
// share the URL — three copies of one decoded image, not three files.
const src = computed(() =>
  props.photo?.image
    ? getOptimizedMediaUrl(props.photo.image, { ...PHOTO_DELIVERY, width: 1080, retina: 1 })
    : '',
)

/**
 * The figures are this design's display type, in the primary slot — gilded
 * when the template struck that slot in a metal, as the other designs' are.
 * The unit labels beside them are too small to carry the fill, so they take a
 * solid tone of the same metal instead of white: the pale side of it, because
 * they sit on the scrim, not on a card.
 *
 * Only over a photograph. Without one the stripes are plain ink, and on a
 * gold template the ink is itself pale gold — metal on it would be no figure
 * at all — so there the figures keep the paper measured against the ink.
 */
const fx = useTextEffect()
const markInk = useTextEffectMarkInk()
const unitInk = computed(() => (src.value ? markInk('primary', 'dark') : null))

const frameRef = ref<HTMLElement | null>(null)
const naturalSize = ref<Size | null>(null)
const frameSize = ref<Size | null>(null)

const onLoad = (event: globalThis.Event) => {
  const image = event.target as HTMLImageElement
  if (image.naturalWidth && image.naturalHeight) {
    naturalSize.value = { width: image.naturalWidth, height: image.naturalHeight }
  }
}

watch(src, () => {
  naturalSize.value = null
})

// Layout values rather than getBoundingClientRect: the studio preview CSS-scales
// the whole frame, and a scaled rect would shrink the geometry.
const measure = () => {
  const frame = frameRef.value
  if (frame?.clientWidth && frame.clientHeight) {
    frameSize.value = { width: frame.clientWidth, height: frame.clientHeight }
  }
}

let observer: ResizeObserver | null = null

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && frameRef.value) {
    observer = new ResizeObserver(measure)
    observer.observe(frameRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

const gap = computed(() => (frameSize.value ? gapFor(frameSize.value.width) : null))

// Until measured, CSS's own estimate of the same rule stands in.
const frameStyle = computed(() =>
  gap.value === null ? {} : { '--cds-gap': `${gap.value.toFixed(2)}px` },
)

/**
 * Tapping the stripes in the studio opens the countdown's own photo editor,
 * told the band's real shape: its aspect, and the three columns with the gaps
 * between them, so the photo is chosen and framed against the cuts.
 */
const photoIntent = computed((): EditIntent => {
  const frame = frameSize.value
  const aspect = frame ? frame.width / frame.height : STRIPS_ASPECT
  const gapShare = frame && gap.value !== null ? gap.value / frame.width : 0.016
  return { kind: 'countdownPhoto', frameAspect: aspect, shape: stripesShapeMask(gapShare, STRIP_COUNT) }
})

/**
 * The whole print laid out across the whole band, framed by the photo's own
 * `crop_*` region like every other photograph on the showcase (all of what the
 * organizer framed shows). Each stripe then clips this same layout to its own
 * column, which is what keeps the three reading as one picture.
 */
const imgStyle = computed((): Record<string, string> => {
  const crop = resolvePhotoCrop(props.photo)
  const centre = cropCentre(crop)
  const frame = frameSize.value
  const geometry = cropToCoverGeometry(crop, naturalSize.value, frame)
  if (!geometry || !frame) return { objectPosition: `${centre.x}% ${centre.y}%` }
  return {
    left: `${(geometry.left / frame.width) * 100}%`,
    top: `${(geometry.top / frame.height) * 100}%`,
    width: `${(geometry.width / frame.width) * 100}%`,
    height: `${(geometry.height / frame.height) * 100}%`,
  }
})
</script>

<style scoped>
/* No width: at full bleed the stage's negative margins widen it past the
   content column, which an explicit width would cancel. */
.cds {
  display: block;
}

.cds__region {
  display: block;
}

/* Portrait like a photo band, and capped in dvh for the same reason: a
   desktop's wide card must not hand one countdown most of a screen. The
   geometry adapts to whatever shape that leaves. */
.cds__frame {
  --cds-gap: clamp(4px, 1.6vw, 8px);
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  max-height: 70dvh;
  overflow: hidden;
}

/* ---- The stripes ---------------------------------------------------------
   Each layer covers the whole band and is clipped to one column; the insets
   are the column's edges. With three columns of width s = (100% − 2g) / 3:
   the first's right edge sits (200% + 2g) / 3 in from the band's right, the
   middle's are (100% + g) / 3 in from both sides, the last mirrors the first.
   Square-cut: at full bleed the outer two meet the card's edges, where a
   rounded corner would read as a notch.

   The reveal is the clip itself — the outer two open upward from their foot,
   the middle one downward from its head, so the picture assembles rather than
   rising as one block. --cds-t / --cds-b are the open edges; clip-path
   transitions when they change because the computed clip-path changes. */
.cds__strip {
  --cds-t: 100%;
  --cds-b: 0%;
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(
    170deg,
    color-mix(in srgb, var(--crs-ink) 72%, transparent),
    var(--crs-ink)
  );
  clip-path: inset(var(--cds-t) var(--cds-r) var(--cds-b) var(--cds-l));
  transition: clip-path 1050ms var(--crs-ease-out) calc(var(--i) * 110ms);
}

.cds__strip--0 {
  --cds-l: 0%;
  --cds-r: calc((200% + 2 * var(--cds-gap)) / 3);
}

.cds__strip--1 {
  --cds-l: calc((100% + var(--cds-gap)) / 3);
  --cds-r: calc((100% + var(--cds-gap)) / 3);
  --cds-t: 0%;
  --cds-b: 100%;
}

.cds__strip--2 {
  --cds-l: calc((200% + 2 * var(--cds-gap)) / 3);
  --cds-r: 0%;
}

.is-revealed .cds__strip {
  --cds-t: 0%;
  --cds-b: 0%;
}

/* The ink is only the no-photograph fallback. Under a photograph it would
   show as a dark hairline down every cut, where the clip's anti-aliasing
   blends the two. */
.cds.has-photo .cds__strip {
  background: none;
}

/* A plain cover until the geometry is known; the inline box then places the
   whole print. The print settles from a slight enlargement as its stripe
   opens, which reads as the picture coming into focus rather than sliding in.
   `max-width: none` because Tailwind's preflight caps images at their
   container, and the framed print is often wider than the band. */
.cds__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
  transform: scale(1.1);
  transition: transform 1600ms var(--crs-ease-out) calc(var(--i) * 110ms);
}

.is-revealed .cds__img {
  transform: none;
}

/* Light figures — white, or the pale side of a metal — need a dark foot to
   stand on, whatever the photograph is. */
.cds__scrim {
  position: absolute;
  inset: auto 0 0;
  height: 52%;
  background: linear-gradient(
    to top,
    rgb(14 11 9 / 0.66),
    rgb(14 11 9 / 0.3) 48%,
    transparent
  );
}

.cds:not(.has-photo) .cds__scrim {
  display: none;
}

/* ---- The figures ----------------------------------------------------------
   One column per stripe, on the same gap, so each figure is centred on its
   own stripe. */
.cds__figures {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: var(--cds-gap);
  pointer-events: none;
}

.cds__figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  padding: 0 0.25rem clamp(1.1rem, 7%, 2rem);
  color: #fff;
  text-align: center;
  opacity: 0;
  transform: translateY(14px);
  transition:
    opacity 600ms var(--crs-ease-out) calc(560ms + var(--i) * 90ms),
    transform 600ms var(--crs-ease-out) calc(560ms + var(--i) * 90ms);
}

/* Without a photograph the stripes are plain ink, and white on a pale ink is
   no figure at all — so the figures take the paper measured against it. */
.cds:not(.has-photo) .cds__figure {
  color: var(--crs-paper);
}

.is-revealed .cds__figure {
  opacity: 1;
  transform: none;
}

/* The halo is for white type only: a finish resets it on its ink span and
   brings its own depth (text-effects.css). */
.cds__num {
  font-size: clamp(2.5rem, 12.5vw, 3.75rem);
  line-height: 1;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 14px rgb(0 0 0 / 0.28);
}

/* Three digits — an invitation sent more than 99 days out — step down, or
   Khmer numerals, which run wide, overflow their stripe. */
.cds__num.is-long {
  font-size: clamp(1.8rem, 9vw, 2.7rem);
}

.cds__unit {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  line-height: 1.4;
  opacity: 0.86;
}

.cds__unit.is-khmer {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.7;
}

@media (prefers-reduced-motion: reduce) {
  .cds__strip,
  .is-revealed .cds__strip {
    --cds-t: 0%;
    --cds-b: 0%;
  }

  .cds__strip {
    opacity: 0;
    transition: opacity 400ms ease;
  }

  .is-revealed .cds__strip {
    opacity: 1;
  }

  .cds__img,
  .cds__figure {
    transform: none;
  }
}
</style>
