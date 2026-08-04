<template>
  <img
    v-if="midUrl"
    :src="midUrl"
    alt=""
    class="single-frame"
    :style="scaleVar"
    aria-hidden="true"
    v-bind="protectionAttrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import type { GuestFrameArtProps } from './types'

/**
 * One image IS the whole frame — a closed ornament (a flourish banner, a wreath)
 * that can't be cut into tiling pieces.
 *
 * Reads `guest_title_frame_mid` because that is the slot the split style already
 * uses for its full-width piece, so a partner switching styles keeps the upload
 * that is most likely to be the right art.
 */
const props = defineProps<GuestFrameArtProps>()

const { protectionAttrs } = useAssetProtection()

const scaleVar = computed(() => ({ '--guest-frame-scale': `${props.config.scale}` }))
</script>

<style scoped>
/* Width-driven with `height: auto`, so the artwork never distorts: it tracks the
   name box horizontally and takes whatever height its own aspect ratio implies.
   That means a wide banner gets tall on a long name — the template's own frame
   scale is the knob for pulling that back.

   No --cover-font-scale term here, unlike the split style: this frame is sized
   from the name box, which a free-placed block's fontScale has already grown. */
.single-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc((100% + 40px) * var(--guest-frame-scale, 1));
  height: auto;
  max-width: none;
  display: block;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  animation: singleFrameEntrance 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 0.8s;
}

/* `translate(-50%, -50%)` is repeated in every step so the forwards-filled
   transform keeps the frame centred once the animation settles. */
@keyframes singleFrameEntrance {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.88);
  }
  60% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .single-frame {
    animation-duration: 0.01ms;
  }
}
</style>
