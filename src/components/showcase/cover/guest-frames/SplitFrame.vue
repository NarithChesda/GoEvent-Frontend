<template>
  <div v-if="hasArt" class="split-frame-container" :style="scaleVar" aria-hidden="true">
    <img v-if="leftUrl" :src="leftUrl" alt="" class="frame-left" v-bind="protectionAttrs" />
    <div class="frame-middle-wrapper">
      <div
        v-if="midUrl"
        class="frame-middle"
        :style="{ backgroundImage: `url(${midUrl})` }"
        v-bind="protectionAttrs"
      ></div>
    </div>
    <img v-if="rightUrl" :src="rightUrl" alt="" class="frame-right" v-bind="protectionAttrs" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import type { GuestFrameArtProps } from './types'

/**
 * The original 3-piece guest frame: fixed end caps with a middle that repeats
 * horizontally to whatever width the name needs.
 *
 * This is the default style, and the only one that ever receives the bundled
 * liquid-glass fallback images — the shell only substitutes those here, since a
 * generic banner would be wrong art for the other styles.
 */
const props = defineProps<GuestFrameArtProps>()

const { protectionAttrs } = useAssetProtection()

const hasArt = computed(() => !!(props.leftUrl || props.midUrl || props.rightUrl))

const scaleVar = computed(() => ({ '--guest-frame-scale': `${props.config.scale}` }))
</script>

<style scoped>
/* Absolutely centred behind the name. Note the entrance keyframes below repeat
   `translate(-50%, -50%)` in every step: with `fill-mode: forwards` the animated
   transform is the final one, so dropping it there would leave the frame offset
   by half its own size permanently. */
.split-frame-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc((100% + 40px) * var(--guest-frame-scale, 1));
  /* The frame graphic is the guest name's decoration, so it grows with the
     name rather than staying a fixed 75px slab around scaled-up text. Every
     px length here (and in the two media queries below) rides the same
     --cover-font-scale the text does, then the template's own frame scale. */
  min-width: calc(200px * var(--cover-font-scale, 1) * var(--guest-frame-scale, 1));
  max-width: calc(500px * var(--cover-font-scale, 1) * var(--guest-frame-scale, 1));
  height: calc(75px * var(--cover-font-scale, 1) * var(--guest-frame-scale, 1));
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  animation: frameEntrance 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 0.8s;
}

.frame-left {
  flex-shrink: 0;
  height: 100%;
  width: auto;
  display: block;
  position: relative;
  z-index: 2;
  margin-right: -2px;
}

.frame-right {
  flex-shrink: 0;
  height: 100%;
  width: auto;
  display: block;
  position: relative;
  z-index: 2;
  margin-left: -2px;
}

.frame-middle-wrapper {
  flex: 1;
  height: 100%;
  overflow: hidden;
  min-width: 20px;
  z-index: 1;
}

.frame-middle {
  width: 100%;
  height: 100%;
  background-repeat: repeat-x;
  background-size: auto 100%;
  background-position: center;
}

@keyframes frameEntrance {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scaleX(0.3) scaleY(0.8);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scaleX(1.02) scaleY(1);
  }
  75% {
    transform: translate(-50%, -50%) scaleX(0.98) scaleY(1);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scaleX(1) scaleY(1);
  }
}

/* Laptop only */
@media (min-width: 1024px) and (max-width: 1535px) {
  .split-frame-container {
    max-width: calc(400px * var(--cover-font-scale, 1) * var(--guest-frame-scale, 1));
    height: calc(50px * var(--cover-font-scale, 1) * var(--guest-frame-scale, 1));
  }
}

/* Mobile */
@media (max-width: 640px) {
  .split-frame-container {
    height: calc(60px * var(--cover-font-scale, 1) * var(--guest-frame-scale, 1));
  }
}

@media (prefers-reduced-motion: reduce) {
  .split-frame-container {
    animation-duration: 0.01ms;
  }
}
</style>
