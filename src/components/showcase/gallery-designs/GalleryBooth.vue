<template>
  <!-- Photo-booth strips, three frames each, laid side by side at a tilt with
       the right-hand strips a little lower, as a handful of strips would lie
       on a table. -->
  <div class="bt">
    <div v-for="(column, c) in columns" :key="c" class="bt-col">
      <div
        v-for="strip in column"
        :key="strip.key"
        :ref="itemRef(strip.key)"
        class="bt-strip"
        :class="{ 'is-in': isRevealed(strip.key) }"
        :style="{ '--bt-r': `${strip.tilt}deg`, '--bt-delay': `${delayOf(strip.key)}s` }"
      >
        <button
          v-for="(photo, f) in strip.photos"
          :key="photo.id"
          type="button"
          class="bt-frame"
          :class="{
            'is-flashed': shotAt(strip.key, f) !== null,
            'is-quiet': shotAt(strip.key, f)?.quiet,
          }"
          :style="{ '--bt-flash': `${shotAt(strip.key, f)?.at ?? 0}s` }"
          :aria-label="photo.caption || alt"
          @click="emit('openPhoto', photo)"
        >
          <span class="bt-shot">
            <GalleryFrame :photo="photo" :alt="photo.caption || alt" :load="isNear(strip.key)" />
          </span>
          <span class="bt-flash" aria-hidden="true" />
        </button>
        <span class="bt-foot" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { EventPhoto } from '@/types/showcase'
import GalleryFrame from './GalleryFrame.vue'
import { BOOTH_FLASH_GAP_S, BOOTH_FRAMES, boothTilt, chunk } from './galleryLayout'
import { prefersReducedMotion, useGalleryReveal } from './useGalleryReveal'
import type { GalleryDesignEmits, GalleryDesignProps } from './types'

/**
 * `booth` — the photographs as photo-booth strips. A strip rises onto the
 * page as it scrolls in, and its frames are taken one by one: each revealed
 * by uncovering, as the transition's booth does it — a white flash up in
 * under a tenth of a second, the photograph swapped in under its peak, and
 * the flash decaying over it. Never a crossfade, which reads as a slideshow.
 *
 * The birthday and party design. The paper is the same fixed warm stock the
 * prints use, for the same reason: it is reproduced artwork.
 */
const props = defineProps<GalleryDesignProps>()
const emit = defineEmits<GalleryDesignEmits>()

const reducedMotion = prefersReducedMotion()

interface Strip {
  key: string
  photos: EventPhoto[]
  tilt: number
}

/** Strips in gallery order. */
const strips = computed<Strip[]>(() =>
  chunk(props.photos, BOOTH_FRAMES).map((photos, index) => ({
    // Keyed by its first photograph, so a strip keeps its flash when a photo
    // further down is removed in the studio.
    key: `strip-${photos[0].id}`,
    photos,
    tilt: boothTilt(index),
  })),
)

/** Alternating columns: strip 0 left, strip 1 right, … */
const columns = computed<[Strip[], Strip[]]>(() => [
  strips.value.filter((_, index) => index % 2 === 0),
  strips.value.filter((_, index) => index % 2 === 1),
])

// Two strips entering together rise a beat apart; their flashes are spaced by
// the flash clock below, not by this.
const { itemRef, isRevealed, isNear, delayOf } = useGalleryReveal({ step: 0.18, cap: 0.36 })

interface Shot {
  /** Seconds from the moment the strip's class flips — when the CSS starts counting. */
  at: number
  /** Developed without a flash, because its turn on the flash clock was too far off. */
  quiet: boolean
}

/**
 * One flash clock for the whole gallery. Every frame's flash is booked on it
 * as its strip arrives, at least BOOTH_FLASH_GAP_S after the last one booked
 * anywhere — so two strips scrolling in a moment apart take turns rather than
 * firing six flashes inside a second (see BOOTH_FLASH_GAP_S).
 *
 * A frame whose turn would come more than MAX_FLASH_WAIT_S late is taken
 * quietly instead: the photograph simply fades in on its own beat. A guest
 * scrolling fast brings in four strips at once, and twelve flashes in a queue
 * left the last strip as blank paper for four seconds — which reads as broken,
 * not as a photo booth. The frames the guest arrived on still flash; the ones
 * they are scrolling past don't hold up the clock or wait on it.
 */
const shots = ref<Record<string, Shot[]>>({})
let nextFlashAt = 0

/** The strip rises for this long before its first frame is taken. */
const FIRST_FLASH_AFTER_S = 0.45
const MAX_FLASH_WAIT_S = 1.2
/** Between quiet frames in one strip, so they still come up one by one. */
const QUIET_GAP_S = 0.15

const bookShots = (strip: Strip) => {
  const now = performance.now() / 1000
  const earliest = delayOf(strip.key) + FIRST_FLASH_AFTER_S
  const booked: Shot[] = []
  strip.photos.forEach((_, frame) => {
    const own = earliest + frame * QUIET_GAP_S
    const turn = Math.max(now + earliest, nextFlashAt) - now
    if (reducedMotion || turn - own > MAX_FLASH_WAIT_S) {
      booked.push({ at: own, quiet: true })
      return
    }
    booked.push({ at: turn, quiet: false })
    nextFlashAt = now + turn + BOOTH_FLASH_GAP_S
  })
  shots.value = { ...shots.value, [strip.key]: booked }
}

// In gallery order, so a batch of strips is taken in the order it reads.
watch(
  () => strips.value.filter((strip) => isRevealed(strip.key)),
  (arrived) => {
    for (const strip of arrived) {
      if (!shots.value[strip.key]) bookShots(strip)
    }
  },
)

/** When the frame is taken, and how — or null until its strip has arrived. */
const shotAt = (stripKey: string, frame: number): Shot | null =>
  shots.value[stripKey]?.[frame] ?? null
</script>

<style scoped>
.bt {
  display: flex;
  align-items: flex-start;
  gap: 7%;
  padding: 1% 4% 3%;
}

.bt-col {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 1.75rem;
}

/* The right column lies a little lower, so the strips read as dropped, not
   filed. */
.bt-col:nth-child(2) {
  padding-top: 22%;
}

/* A strip: the frames in a 7% border of paper, a deeper foot. Arrives by
   rising from a little below and turning onto its tilt. */
.bt-strip {
  display: flex;
  flex-direction: column;
  padding: 7% 7% 0;
  border-radius: 2px;
  background: linear-gradient(170deg, #fefdf9 0%, #f8f4eb 65%, #f0eadd 100%);
  box-shadow:
    0 0 0 0.5px rgba(26, 18, 10, 0.1),
    0 1px 1.5px rgba(26, 18, 10, 0.18),
    0 5px 12px -4px rgba(26, 18, 10, 0.2),
    0 16px 28px -14px rgba(26, 18, 10, 0.32);
  opacity: 0;
  transform: translateY(28px) rotate(calc(var(--bt-r) * 0.3));
}

.bt-strip.is-in {
  opacity: 1;
  transform: rotate(var(--bt-r));
  transition:
    transform 0.9s var(--gd-ease-out) var(--bt-delay),
    opacity 0.35s var(--gd-ease-out) var(--bt-delay);
}

.bt-frame {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: #d8d1c4;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: scale 160ms var(--gd-ease-out);
}

/* In % of the strip's width, as a margin: a percentage gap in a column
   whose height is its content has nothing to resolve against. */
.bt-frame + .bt-frame {
  margin-top: 5%;
}

.bt-frame:active {
  scale: 0.97;
}

.bt-frame:focus-visible {
  outline: 2px solid var(--gd-ink);
  outline-offset: 2px;
}

/* The frame before it is taken is blank booth paper — not a spinner, and not
   the photograph faintly showing through. */
.bt-shot {
  position: absolute;
  inset: 0;
  opacity: 0;
  --gf-empty: #d8d1c4;
}

/* Swapped in under the flash's peak, which is ~90ms in: a 0s transition
   delayed to that moment, so it is simply there when the white clears. */
.is-flashed .bt-shot {
  opacity: 1;
  transition: opacity 0s linear calc(var(--bt-flash) + 0.09s);
}

.bt-flash {
  position: absolute;
  inset: 0;
  background: #fffdf8;
  opacity: 0;
  pointer-events: none;
}

.is-flashed .bt-flash {
  animation: btFlash 0.8s var(--gd-ease-out) var(--bt-flash) both;
}

/* Up in ~90ms, down over the rest: a flash, not a pulse. Its peak stops short
   of pure white so the swap underneath it is covered, not blinding. */
@keyframes btFlash {
  0% {
    opacity: 0;
  }
  11% {
    opacity: 0.94;
  }
  100% {
    opacity: 0;
  }
}

.bt-foot {
  display: block;
  height: 0;
  padding-bottom: 20%;
}

/* A frame taken quietly fades in where it lies: no flash, no swap. */
.is-flashed.is-quiet .bt-flash {
  animation: none;
}

.is-flashed.is-quiet .bt-shot {
  transition: opacity 0.5s var(--gd-ease-atmos) var(--bt-flash);
}

/* No flash at all: a flash is exactly what this setting asks to be spared.
   The frames fade in one after another, and the strips don't travel. */
@media (prefers-reduced-motion: reduce) {
  .bt-strip,
  .bt-strip.is-in {
    transform: rotate(var(--bt-r));
    transition: opacity 0.4s ease var(--bt-delay);
  }

  .is-flashed .bt-flash {
    animation: none;
  }

  .is-flashed .bt-shot {
    transition: opacity 0.4s ease var(--bt-flash);
  }
}
</style>
