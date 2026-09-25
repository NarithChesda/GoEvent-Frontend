<template>
  <!-- Two columns of rounded tiles, the right one starting lower so the two
       never line up into rows. The photo-stack's mosaic, left open. -->
  <div class="ms">
    <div v-for="(column, c) in columns" :key="c" class="ms-col">
      <span v-if="c === 1" class="ms-offset" aria-hidden="true" />
      <button
        v-for="tile in column"
        :key="photos[tile.index].id"
        :ref="itemRef(keyAt(tile.index))"
        type="button"
        class="ms-tile"
        :class="{ 'is-in': isRevealed(keyAt(tile.index)) }"
        :style="{
          aspectRatio: `1 / ${tile.ratio}`,
          '--ms-delay': `${delayOf(keyAt(tile.index))}s`,
        }"
        :aria-label="photos[tile.index].caption || alt"
        @click="emit('openPhoto', photos[tile.index])"
      >
        <GalleryFrame
          :photo="photos[tile.index]"
          :alt="photos[tile.index].caption || alt"
          :load="isNear(keyAt(tile.index))"
        >
          <!-- The dark it surfaces out of. -->
          <span class="ms-dark" aria-hidden="true" />
        </GalleryFrame>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GalleryFrame from './GalleryFrame.vue'
import { MOSAIC_OFFSET, mosaicColumns } from './galleryLayout'
import { useGalleryReveal } from './useGalleryReveal'
import type { GalleryDesignEmits, GalleryDesignProps } from './types'

/**
 * `mosaic` — rounded tiles in two staggered columns, each surfacing out of the
 * dark as it scrolls in: a slight rise, the dark lifting off it, and the
 * photograph settling from a touch close into its frame.
 *
 * The quietest of the designs — no paper, no tilt, nothing a memorial would
 * find frivolous — and the densest, so thirty photographs are a short scroll.
 * Tiles are cut to a fixed rhythm of shapes rather than each photo's own (see
 * MOSAIC_RATIOS for why), so the columns lay out once and never reshuffle as
 * images arrive; the photo's own framing decides what shows in its tile.
 */
const props = defineProps<GalleryDesignProps>()
const emit = defineEmits<GalleryDesignEmits>()

const columns = computed(() => mosaicColumns(props.photos.length))

// Tiles that enter together surface alternately left and right, the order
// the reveal reads them in — so the stagger crosses the two columns.
const { itemRef, isRevealed, isNear, delayOf } = useGalleryReveal({ step: 0.09, cap: 0.45 })

const keyAt = (index: number) => String(props.photos[index]?.id ?? index)

const offsetRatio = `1 / ${MOSAIC_OFFSET}`
</script>

<style scoped>
/* A fixed gap: the columns are laid out down the page, and a percentage gap
   in a column whose height is its content has nothing to resolve against. */
.ms {
  --ms-gap: 0.625rem;
  display: flex;
  align-items: flex-start;
  gap: var(--ms-gap);
}

.ms-col {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: var(--ms-gap);
}

/* The right column's head start, as a spacer in the column's own width so it
   stays the share MOSAIC_OFFSET says it is at every size. The gap after it is
   subtracted back, or the stagger would grow by one gap. */
.ms-offset {
  display: block;
  aspect-ratio: v-bind(offsetRatio);
  margin-bottom: calc(var(--ms-gap) * -1);
}

.ms-tile {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 16px;
  overflow: hidden;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  opacity: 0;
  transform: translateY(18px);
  /* Settles into the frame as the dark lifts: close to start, the photograph
     is drawn back to its framing. */
  --gf-zoom: 1.07;
  --gf-zoom-duration: 1.8s;
}

.ms-tile.is-in {
  opacity: 1;
  transform: none;
  --gf-zoom: 1;
  transition:
    transform 1s var(--gd-ease-out) var(--ms-delay),
    opacity 0.6s var(--gd-ease-atmos) var(--ms-delay),
    scale 160ms var(--gd-ease-out);
}

/* The hairline mat, in the ink, as the column draws it. */
.ms-tile::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 20;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gd-ink) 18%, transparent);
  pointer-events: none;
}

.ms-tile:active {
  scale: 0.98;
}

.ms-tile:focus-visible {
  outline: 2px solid var(--gd-ink);
  outline-offset: 3px;
}

/* Deep, and the ink's own dark rather than black, so a tile on a warm
   template comes up out of a warm shadow. */
.ms-dark {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--gd-ink) 55%, #0b0a09);
  opacity: 0.92;
  pointer-events: none;
}

.is-in .ms-dark {
  opacity: 0;
  transition: opacity 1.3s var(--gd-ease-atmos) calc(var(--ms-delay) + 0.1s);
}

@media (prefers-reduced-motion: reduce) {
  .ms-tile,
  .ms-tile.is-in {
    transform: none;
    --gf-zoom: 1;
    transition: opacity 0.4s ease var(--ms-delay);
  }

  .ms-dark {
    display: none;
  }
}
</style>
