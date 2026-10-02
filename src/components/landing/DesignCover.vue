<template>
  <!-- One invitation design's cover, as an object: the hero's tile material
       (see `.tile` in EventsLandingHero.vue) cut to the invitation's own 9:16,
       so the designs below the hero read as more of what the wall above it is
       made of rather than as a second visual language. A bezel, not a phone:
       no notch, no buttons — the capture is the invitation, not a device.

       With no `src` yet it is its own skeleton, the same shape the cover will
       arrive in, so nothing moves when it does. -->
  <div class="design-cover">
    <div class="design-cover__art" :class="{ 'is-waiting': !src || !loaded }">
      <img
        v-if="src && !failed"
        :key="src"
        :src="src"
        alt=""
        width="337"
        height="600"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        draggable="false"
        class="design-cover__img"
        :class="{ 'is-loaded': loaded }"
        @load="loaded = true"
        @error="failed = true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  /** The cover capture. Absent while the catalogue is still answering. */
  src?: string
  /** For a cover that is on screen as soon as the section is. */
  eager?: boolean
}>()

const loaded = ref(false)
const failed = ref(false)

watch(
  () => props.src,
  () => {
    loaded.value = false
    failed.value = false
  },
)
</script>

<style scoped>
/* Fixed bezel and radii rather than percentages of the width: a percentage
   radius on a 9:16 box resolves against each axis separately and draws
   elliptical corners. Covers here run ~140–300px, a range one bezel suits. */
.design-cover {
  padding: 0.3125rem;
  border-radius: 1rem;
  background: linear-gradient(168deg, #ffffff 0%, #ffffff 42%, #eef2f7 100%);
  box-shadow:
    inset 0 1.5px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1.5px 0 rgba(15, 23, 42, 0.07),
    0 0 0 1px rgba(15, 23, 42, 0.07),
    0 1px 2px rgba(15, 23, 42, 0.06),
    0 6px 12px -6px rgba(15, 23, 42, 0.22),
    0 18px 30px -12px rgba(15, 23, 42, 0.3);
}

.design-cover__art {
  position: relative;
  aspect-ratio: 9 / 16;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #e2e8f0; /* slate-200 */
}

/* The recess, over the art — an inset shadow on the image itself would paint
   behind it, a replaced element covering its own box. */
.design-cover__art::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px rgba(15, 23, 42, 0.12),
    inset 0 2px 5px -1px rgba(15, 23, 42, 0.3);
  pointer-events: none;
}

.design-cover__art.is-waiting {
  animation: cover-wait 1.6s ease-in-out infinite;
}

.design-cover__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 320ms cubic-bezier(0.23, 1, 0.32, 1);
}

.design-cover__img.is-loaded {
  opacity: 1;
}

@keyframes cover-wait {
  50% {
    background-color: #f1f5f9; /* slate-100 */
  }
}

@media (prefers-reduced-motion: reduce) {
  .design-cover__art.is-waiting {
    animation: none;
  }
  .design-cover__img {
    transition-duration: 1ms;
  }
}
</style>
