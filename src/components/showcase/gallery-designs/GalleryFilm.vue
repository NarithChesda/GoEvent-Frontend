<template>
  <!-- A contact sheet: two strips of film laid side by side, the second a
       little lower, with the photographs as their frames. Alternate photographs go
       to alternate strips, so reading across the sheet follows the gallery's
       order as it scrolls. -->
  <div class="fm">
    <div v-for="(strip, s) in strips" :key="s" class="fm-strip" :class="`fm-strip--${s}`">
      <span class="fm-rail fm-rail--start" aria-hidden="true" />
      <span class="fm-rail fm-rail--end" aria-hidden="true" />
      <div class="fm-frames">
        <div v-for="frame in strip" :key="frame.photo.id" class="fm-cell">
          <button
            :ref="itemRef(String(frame.photo.id))"
            type="button"
            class="fm-frame"
            :class="{ 'is-shown': isRevealed(String(frame.photo.id)) }"
            :style="{ '--fm-delay': `${delayOf(String(frame.photo.id))}s` }"
            :aria-label="frame.photo.caption || alt"
            @click="emit('openPhoto', frame.photo)"
          >
            <span class="fm-exposure">
              <GalleryFrame
                :photo="frame.photo"
                :alt="frame.photo.caption || alt"
                :load="isNear(String(frame.photo.id))"
              />
            </span>
            <span class="fm-develop" aria-hidden="true" />
          </button>
          <!-- The edge print under each frame: its number and the half-frame
             mark after it, in the orange a film maker prints them in. -->
          <span class="fm-edge" aria-hidden="true">
            <span>{{ frame.number }}</span>
            <span>▸ {{ frame.number }}A</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EventPhoto } from '@/types/showcase'
import GalleryFrame from './GalleryFrame.vue'
import { useGalleryReveal } from './useGalleryReveal'
import type { GalleryDesignEmits, GalleryDesignProps } from './types'

/**
 * `film` — a contact sheet. Each frame develops as it scrolls in, the way the
 * transition's film strip does it: rising out of the dark under a warm cast
 * that clears on a longer clock, so it emerges sepia and settles into its own
 * colours. Deliberately unlike the booth's flash — one is taken, the other
 * comes up in the tray.
 *
 * Frames are 2:3, upright: a strip of 35mm held vertically has its frames
 * standing on end, which is also the shape most phone photographs are.
 * The film base, the rails and the edge print are fixed colours — reproduced
 * artwork, like the transition's strip.
 */
const props = defineProps<GalleryDesignProps>()
const emit = defineEmits<GalleryDesignEmits>()

interface FilmFrame {
  photo: EventPhoto
  number: number
}

const strips = computed<[FilmFrame[], FilmFrame[]]>(() => {
  const out: [FilmFrame[], FilmFrame[]] = [[], []]
  props.photos.forEach((photo, index) => {
    out[index % 2].push({ photo, number: index + 1 })
  })
  return out
})

const { itemRef, isRevealed, isNear, delayOf } = useGalleryReveal({ step: 0.12, cap: 0.48 })
</script>

<style scoped>
.fm {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 5%;
  padding: 1% 2% 3%;
}

/* A strip: film base with a rail of sprocket holes down each edge. Sized in
   its own width (cqw), so the holes, the edge print and the gaps between
   frames are the same proportion of a strip on every screen. */
.fm-strip {
  position: relative;
  flex: 0 1 46%;
  min-width: 0;
  container-type: inline-size;
  border-radius: 2px;
  background: linear-gradient(90deg, #0b0a09 0%, #161412 50%, #0b0a09 100%);
  box-shadow:
    0 2px 4px rgba(10, 8, 6, 0.25),
    0 18px 34px -16px rgba(10, 8, 6, 0.5);
}

/* Offset, never tilted. A strip holding fifteen frames is several screens
   tall, and a degree of tilt about its middle swings its ends sideways by
   more than the gap between the two — tilted opposite ways they crossed. */
.fm-strip--1 {
  margin-top: 11%;
}

/* Padding lives here, not on the strip: the strip is the container its cqw
   resolve against, and an element can't size itself in its own container's
   units. */
.fm-frames {
  padding: 7cqw 14cqw 3cqw;
}

.fm-rail {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 14cqw;
  background-image: linear-gradient(
    to bottom,
    rgba(236, 230, 220, 0.84) 0 52%,
    transparent 52% 100%
  );
  background-size: 42% 9cqw;
  background-position: center 2.6cqw;
  background-repeat: repeat-y;
  pointer-events: none;
}

.fm-rail--start {
  left: 0;
}

.fm-rail--end {
  right: 0;
}

.fm-frame {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: #1c1a18;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: scale 160ms var(--gd-ease-out);
}

.fm-frame:active {
  scale: 0.97;
}

.fm-frame:focus-visible {
  outline: 2px solid #e39a4f;
  outline-offset: 2px;
}

/* Developing: the photograph comes up out of the dark slowly … */
.fm-exposure {
  position: absolute;
  inset: 0;
  opacity: 0;
  --gf-empty: #1c1a18;
}

.is-shown .fm-exposure {
  opacity: 1;
  transition: opacity 1.4s var(--gd-ease-atmos) var(--fm-delay);
}

/* … under a warm cast that clears on its own, longer clock. */
.fm-develop {
  position: absolute;
  inset: 0;
  background: #d39a5c;
  mix-blend-mode: multiply;
  opacity: 0;
  pointer-events: none;
}

.is-shown .fm-develop {
  animation: fmDevelop 2.6s var(--gd-ease-atmos) var(--fm-delay) both;
}

@keyframes fmDevelop {
  from {
    opacity: 0.72;
  }
  to {
    opacity: 0;
  }
}

.fm-edge {
  display: flex;
  justify-content: space-between;
  padding: 1.6cqw 0.5cqw 3.4cqw;
  font-family: 'Rajdhani', 'Karla', sans-serif;
  font-weight: 600;
  font-size: 6.5cqw;
  line-height: 1;
  letter-spacing: 0.04em;
  color: #e39a4f;
  opacity: 0.82;
  font-variant-numeric: tabular-nums;
  user-select: none;
}

@media (prefers-reduced-motion: reduce) {
  .is-shown .fm-develop {
    animation: none;
  }

  .is-shown .fm-exposure {
    transition-duration: 0.5s;
  }
}
</style>
