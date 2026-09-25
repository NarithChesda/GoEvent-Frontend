<template>
  <!-- Instant-film prints tossed down the page, alternating sides, each one
       lying over the corner of the last. The pile layout of the photo-stack
       transition, spread out over the length of the invitation. -->
  <div class="pr">
    <button
      v-for="(photo, index) in photos"
      :key="photo.id"
      :ref="itemRef(keyOf(photo))"
      type="button"
      class="pr-print"
      :class="{ 'is-dealt': isRevealed(keyOf(photo)), 'is-right': index % 2 === 1 }"
      :style="printStyle(photo, index)"
      :aria-label="photo.caption || alt"
      @click="emit('openPhoto', photo)"
    >
      <!-- The shadow it casts while still falling: wide and offset, fading as
           it lands. Its own element so only its opacity animates, never an
           animated box-shadow. -->
      <span class="pr-air" aria-hidden="true" />
      <span class="pr-paper">
        <span class="pr-window">
          <GalleryFrame :photo="photo" :alt="photo.caption || alt" :load="isNear(keyOf(photo))">
            <!-- Instant film clearing: it lands a little milky and resolves.
                 Brief, so the photograph is legible from the moment it lands. -->
            <span class="pr-develop" aria-hidden="true" />
          </GalleryFrame>
        </span>
        <span v-if="caption(photo)" class="pr-caption" :class="{ 'is-khmer': isKhmer(photo) }">
          <span class="pr-caption-text">{{ caption(photo) }}</span>
        </span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { EventPhoto } from '@/types/showcase'
import GalleryFrame from './GalleryFrame.vue'
import { printPose } from './galleryLayout'
import { useGalleryReveal } from './useGalleryReveal'
import type { GalleryDesignEmits, GalleryDesignProps } from './types'

/**
 * `prints` — the photographs as instant-film prints, tossed onto the page one
 * at a time as they scroll into view. Each drops from a little above and a
 * little larger, swinging in from its own side onto its resting tilt, the way
 * the transition's pile deals them; the print beneath shows at the corner.
 *
 * The stock is fixed warm white, as it is in the pile: reproduced artwork. A
 * print tinted to the template's palette stops reading as a photograph.
 */
defineProps<GalleryDesignProps>()
const emit = defineEmits<GalleryDesignEmits>()

// 110ms apart within a batch: two or three prints land in a quick run rather
// than all at once, and the run is over before the next scroll brings more.
const { itemRef, isRevealed, isNear, delayOf } = useGalleryReveal({ step: 0.11, cap: 0.44 })

const keyOf = (photo: EventPhoto) => String(photo.id)

const printStyle = (photo: EventPhoto, index: number): Record<string, string> => {
  const pose = printPose(index)
  return {
    '--pr-r': `${pose.rotate}deg`,
    '--pr-x': `${pose.nudge}%`,
    '--pr-from': String(pose.from),
    '--pr-delay': `${delayOf(keyOf(photo))}s`,
    zIndex: String(index + 1),
  }
}

/**
 * Written on the print's foot, if the organizer gave the photo one. A file
 * name is not a caption — uploads that were never captioned sometimes carry
 * theirs — so anything shaped like one is left off.
 */
const caption = (photo: EventPhoto): string => {
  const text = photo.caption?.trim() ?? ''
  return /\.(jpe?g|png|heic|webp|gif)$/i.test(text) ? '' : text
}

const KHMER_SCRIPT = /[ក-៿᧠-᧿]/
const isKhmer = (photo: EventPhoto) => KHMER_SCRIPT.test(photo.caption ?? '')
</script>

<style scoped>
/* A print is 52% of the column wide: a 4:5 window in a 5.5% border and the
   deep foot of an instant print (20% of its width), so its height is
   0.055 + 1.25 × 0.89 + 0.20 = 1.3675 of its width, 0.711 of the column.
   Each starts 0.40 of the column below the last — a little over half a print
   — so the column advances by that and the rest overlaps (-31%, since a
   vertical margin in % resolves against the column's width). */
.pr {
  display: flex;
  flex-direction: column;
  padding: 2% 1% 4%;
}

.pr-print {
  position: relative;
  display: block;
  width: 52%;
  aspect-ratio: 1 / 1.3675;
  margin-top: -31%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  align-self: flex-start;
  /* Un-dealt: up toward the guest (1.1), swung out toward its own side and
     turned further than it will rest. Invisible. */
  opacity: 0;
  transform: translate(calc(var(--pr-x) + var(--pr-from) * 7%), -9%) rotate(calc(var(--pr-r) + var(--pr-from) * 7deg)) scale(1.1);
}

.pr-print:first-child {
  margin-top: 0;
}

.pr-print.is-right {
  align-self: flex-end;
}

/* The drop. Transform on the strong ease-out — a print laid down decelerates
   onto the one below — and opacity much faster, so it is solid for most of
   its fall instead of ghosting onto the print beneath. */
.pr-print.is-dealt {
  opacity: 1;
  transform: translate(var(--pr-x), 0) rotate(var(--pr-r)) scale(1);
  transition:
    transform 0.95s var(--gd-ease-out) var(--pr-delay),
    opacity 0.25s var(--gd-ease-out) var(--pr-delay);
}

.pr-air {
  position: absolute;
  inset: 0;
  border-radius: 2px;
  box-shadow: 0 28px 40px -14px rgba(26, 18, 10, 0.42);
}

.is-dealt .pr-air {
  opacity: 0;
  transition: opacity 1s var(--gd-ease-out) var(--pr-delay);
}

.pr-paper {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 5.5% 5.5% 0;
  border-radius: 2px;
  background: linear-gradient(165deg, #fefdf9 0%, #f8f4eb 60%, #f1ebdf 100%);
  box-shadow:
    0 0 0 0.5px rgba(26, 18, 10, 0.1),
    0 1px 1.5px rgba(26, 18, 10, 0.2),
    0 4px 10px -3px rgba(26, 18, 10, 0.2),
    0 12px 24px -12px rgba(26, 18, 10, 0.3);
  transition: scale 160ms var(--gd-ease-out);
}

.pr-print:active .pr-paper {
  scale: 0.98;
}

.pr-print:focus-visible {
  outline: none;
}

.pr-print:focus-visible .pr-paper {
  outline: 2px solid var(--gd-ink);
  outline-offset: 3px;
}

.pr-window {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  flex: none;
  --gf-empty: #e7e0d3;
}

/* The hairline where emulsion meets paper, over the photograph. */
.pr-window::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 11;
  box-shadow: inset 0 0 0 1px rgba(40, 28, 16, 0.1);
  pointer-events: none;
}

.pr-develop {
  position: absolute;
  inset: 0;
  background: #f4efe4;
  opacity: 0.55;
  pointer-events: none;
}

.is-dealt .pr-develop {
  opacity: 0;
  transition: opacity 1.2s var(--gd-ease-atmos) calc(var(--pr-delay) + 0.1s);
}

/* The caption, written in pen on the foot. The face is pinned, like the door
   stage's cartouche: a handwritten note on a print is part of the artwork,
   and Cormorant's italic reads as a hand where a template's body face would
   read as a label. The ink is a pen's, not the template's — this is a white
   print whatever the invitation's colours are. */
.pr-caption {
  display: grid;
  flex: 1;
  place-items: center;
  min-width: 0;
  padding: 0 6%;
  font-family: 'Cormorant Garamond', 'Kantumruy Pro', Georgia, serif;
  font-style: italic;
  font-size: clamp(0.72rem, 3.6cqw, 0.95rem);
  line-height: 1.15;
  color: #2d2a33;
}

.pr-caption-text {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pr-caption.is-khmer {
  font-style: normal;
  font-family: 'Kantumruy Pro', 'Cormorant Garamond', sans-serif;
  line-height: 1.5;
}

.pr-print {
  container-type: inline-size;
}

/* Fewer and gentler, not none: every print still arrives, but fades in where
   it lies. No drop, no swing, no clearing. */
@media (prefers-reduced-motion: reduce) {
  .pr-print,
  .pr-print.is-dealt {
    transform: translate(var(--pr-x), 0) rotate(var(--pr-r));
    transition: opacity 0.4s ease var(--pr-delay);
  }

  .pr-air,
  .pr-develop {
    display: none;
  }
}
</style>
