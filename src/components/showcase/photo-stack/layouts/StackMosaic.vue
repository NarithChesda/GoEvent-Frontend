<template>
  <div
    class="stack-layout"
    :class="{
      'is-entered': entered,
      'is-closed': closed,
      'is-dissolving': dissolving,
      'is-complete': shown >= photos.length,
    }"
  >
    <div class="mo-card">
      <div class="mo-grid">
        <div
          v-for="(photo, k) in photos"
          :key="photo.id"
          class="mo-tile"
          :class="[`mo-${tiles[k].column}`, { 'is-shown': k < shown }]"
          :style="{ top: `${tiles[k].top}%`, height: `${tiles[k].height}%` }"
        >
          <div class="mo-tile-inner">
            <StackPhoto
              :photo="photo"
              :index="k"
              :shown="k < shown"
              :alt="eventTitle"
              :get-media-url="getMediaUrl"
            />
          </div>
        </div>

        <!-- Where the columns meet: the couple ornament's heart, drawn not
             filled (at this size a filled heart reads as a button). -->
        <div v-if="photos.length > 1" class="mo-heart" aria-hidden="true">
          <svg :viewBox="ORNAMENT_VIEWBOX" fill="none" :stroke="accentColor" stroke-width="5">
            <path :d="HEART_PATH" stroke-linejoin="round" />
            <path :d="HEART_INNER_PATH" stroke-linejoin="round" stroke-width="3" opacity="0.6" />
          </svg>
        </div>
      </div>
    </div>

    <div class="mo-copy">
      <slot name="copy" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StackPhoto from '../StackPhoto.vue'
import { mosaicTiles } from '../geometry'
import type { StackLayoutProps } from '../types'
import {
  HEART_INNER_PATH,
  HEART_PATH,
  ORNAMENT_VIEWBOX,
} from '@/components/showcase/host-layouts/shared/frames/ornamentPaths'

/**
 * `mosaic` — the lights go down and the photographs surface out of the dark
 * one at a time, in two staggered columns, alternating sides. Once they are all
 * up, a heart closes the centre and the camera pulls back until the mosaic is a
 * keepsake card lying on the table, with the Save the Date beneath it.
 */
const props = defineProps<StackLayoutProps>()

const tiles = computed(() => mosaicTiles(props.photos.length))
</script>

<style scoped>
.stack-layout {
  position: absolute;
  inset: 0;
  --mo-gap: calc(var(--sk-w) * 0.022);
  --mo-radius: calc(var(--sk-w) * 0.04);
}

/* Full-bleed and dark to begin with. Fading a full-screen slab in over the
   cover would normally be the thing to avoid — here it is the point: the house
   lights going down before the memories light up.

   The pull-back scales it to 0.66 and lifts it by 0.19w, which centres the card
   and the copy under it as one block at any stage height: the card's foot lands
   at 83% − 0.19w, and the copy starts 0.08w below (see .mo-copy). The corners
   round as it goes — a full-bleed rectangle has no corners to round, and a card
   that kept the stage's square ones would read as a cropped screen. */
.mo-card {
  position: absolute;
  inset: 0;
  background: #15120e;
  opacity: 0;
  border-radius: 0;
}

.is-entered .mo-card {
  opacity: 1;
  transition: opacity 1.1s var(--sk-ease-atmos);
}

.is-closed .mo-card {
  transform: translateY(calc(var(--sk-w) * -0.19)) scale(0.66);
  border-radius: calc(var(--sk-w) * 0.07);
  box-shadow: 0 24px 60px -18px rgba(10, 8, 6, 0.55);
  transition:
    transform 1.4s var(--sk-ease-in-out),
    border-radius 1.4s var(--sk-ease-in-out),
    box-shadow 1.4s var(--sk-ease-in-out);
}

.is-dissolving .mo-card {
  transform: translateY(calc(var(--sk-w) * -0.19)) scale(calc(0.66 * 0.96));
  transition:
    transform 1.2s var(--sk-ease-atmos),
    border-radius 1.2s var(--sk-ease-atmos);
}

/* Half a gap of padding here plus half a gap around every tile makes every
   gutter, inner and outer, the same width. */
.mo-grid {
  position: absolute;
  inset: calc(var(--mo-gap) / 2);
}

.mo-tile {
  position: absolute;
  padding: calc(var(--mo-gap) / 2);
}

.mo-left {
  left: 0;
  width: 50%;
}

.mo-right {
  left: 50%;
  width: 50%;
}

.mo-full {
  left: 0;
  width: 100%;
}

/* Surfacing: a slight rise out of the dark, on the strong ease-out. The drift
   inside the frame (StackPhoto) carries on long after the tile has landed. */
.mo-tile-inner {
  width: 100%;
  height: 100%;
  border-radius: var(--mo-radius);
  overflow: hidden;
  opacity: 0;
  transform: translateY(4%) scale(0.965);
  --sp-empty: #221d17;
}

.is-shown .mo-tile-inner {
  opacity: 1;
  transform: none;
  transition:
    transform 1s var(--sk-ease-out),
    opacity 0.7s var(--sk-ease-out);
}

.mo-heart {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  width: calc(var(--sk-w) * 0.13);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #15120e;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

.mo-heart svg {
  width: 56%;
  height: 56%;
}

/* After the last tile has surfaced, not with it. */
.is-complete .mo-heart {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  transition:
    transform 0.6s var(--sk-ease-out) 0.5s,
    opacity 0.6s var(--sk-ease-out) 0.5s;
}

.mo-copy {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(83% - var(--sk-w) * 0.11);
  z-index: 5;
  display: flex;
  justify-content: center;
}

/* The card is a card from the start — it never pulls back, so it has to be
   in its final place for the copy to have room — and the tiles fade in. */
@media (prefers-reduced-motion: reduce) {
  .mo-card,
  .is-closed .mo-card,
  .is-dissolving .mo-card {
    transform: translateY(calc(var(--sk-w) * -0.19)) scale(0.66);
    border-radius: calc(var(--sk-w) * 0.07);
    transition: opacity 0.4s ease;
  }

  .mo-tile-inner,
  .is-shown .mo-tile-inner {
    transform: none;
  }

  .is-complete .mo-heart {
    transform: translate(-50%, -50%);
    transition: opacity 0.4s ease;
  }
}
</style>
