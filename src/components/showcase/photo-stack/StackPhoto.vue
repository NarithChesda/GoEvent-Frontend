<template>
  <div class="sp" :class="{ 'is-shown': shown }">
    <img
      :src="getMediaUrl(photo.image)"
      :alt="index === 0 ? alt : ''"
      class="sp-img"
      :class="{ 'is-loaded': loaded }"
      :style="{ objectPosition: focus, transformOrigin: focus }"
      @load="loaded = true"
    />
    <slot />
    <!-- Manage-page preview: the lead photograph is the featured one, so it
         opens that picker; the rest follow the gallery's order, so they open
         the gallery. -->
    <EditableRegion v-if="editIntentCtx" :intent="intent" class="sp-edit" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { EventPhoto } from '@/types/showcase'
import { EditIntentKey, type EditIntent } from '@/components/showcase-preview/edit/editContext'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import { printFocus } from './photoStack'

/**
 * One photograph in a photo-stack layout, filling whatever frame the layout
 * gives it — a print's window, a panel, a tile.
 *
 * The same in every layout, so it lives once: anchored on the organizer's crop,
 * faded into its frame when it arrives late rather than popping in over its own
 * reveal, and drifting in toward its focal point for as long as it is on screen
 * from the moment it is `shown` — memories coming slightly alive. How the frame
 * itself arrives (a drop, a wipe, a flash) is the layout's; the layout's
 * default slot draws over the photograph for exactly that.
 *
 * `--sp-empty` is the frame before its photograph arrives: paper for a print,
 * unexposed black for film.
 */
const props = defineProps<{
  photo: EventPhoto
  /** Position in the reveal order — 0 is the featured photograph. */
  index: number
  shown: boolean
  alt: string
  getMediaUrl: (url: string) => string
}>()

const editIntentCtx = inject(EditIntentKey, undefined)

const loaded = ref(false)
const focus = computed(() => printFocus(props.photo))
const intent = computed<EditIntent>(() =>
  props.index === 0 ? { kind: 'featuredPhoto' } : { kind: 'photos' },
)
</script>

<style scoped>
.sp {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--sp-empty, #e7e0d3);
}

.sp-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Tailwind Preflight caps images at their container; the drift scales past it. */
  max-width: none;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.08);
  transition:
    opacity 0.5s var(--sk-ease-atmos, cubic-bezier(0.33, 1, 0.68, 1)),
    transform 6s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.sp-img.is-loaded {
  opacity: 1;
}

.is-shown .sp-img {
  transform: scale(1);
}

/* The stage root is pointer-events:none; the edit region opts back in. */
.sp-edit {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .sp-img,
  .is-shown .sp-img {
    transform: none;
  }
}
</style>
