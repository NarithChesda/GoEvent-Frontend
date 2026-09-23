<template>
  <div
    class="stack-layout"
    :class="{ 'is-entered': entered, 'is-closed': closed }"
    :style="{ '--sl-band-y': `${layout.bandY}%` }"
  >
    <div class="sl-camera">
      <div
        v-for="(photo, k) in photos"
        :key="photo.id"
        class="sl-panel"
        :class="[`sl-fade-${layout.panels[k].fade}`, { 'is-shown': k < shown }]"
        :style="panelStyle(k)"
      >
        <StackPhoto
          :photo="photo"
          :index="k"
          :shown="k < shown"
          :alt="eventTitle"
          :get-media-url="getMediaUrl"
        />
      </div>
    </div>

    <!-- The band the copy is written in. The panels already fade into it, but
         they fade into the table, and the table carries whatever the cover's
         artwork is; this settles it into one calm colour just as the copy
         arrives, so no template's artwork can fight the lettering. -->
    <div class="sl-band" :style="{ background: bandGradient }" aria-hidden="true" />

    <div class="sl-copy">
      <slot name="copy" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StackPhoto from '../StackPhoto.vue'
import { splitLayout } from '../geometry'
import type { StackLayoutProps } from '../types'

/**
 * `split` — four photographs cut on a slanted seam, top pair and bottom pair,
 * each wiping open toward the seam in turn, with the Save the Date written in
 * the band where they fade into each other. The editorial one: the photographs
 * are the frame, full-bleed, rather than objects lying on a table.
 */
const props = defineProps<StackLayoutProps>()

const layout = computed(() => splitLayout(props.photos.length))

const panelStyle = (k: number): Record<string, string> => {
  const panel = layout.value.panels[k]
  return {
    left: `${panel.left}%`,
    top: `${panel.top}%`,
    width: `${panel.width}%`,
    height: `${panel.height}%`,
    '--sl-clip': panel.clip,
    '--sl-from': panel.from,
  }
}

const bandGradient = computed(() => {
  const c = props.washColor
  return `linear-gradient(to bottom, ${c}00 0%, ${c}d1 32%, ${c}e6 50%, ${c}d1 68%, ${c}00 100%)`
})
</script>

<style scoped>
.stack-layout {
  position: absolute;
  inset: 0;
}

/* The camera eases back from 1.04 over the whole stage — the frame opening
   outward, the showcase's arc — and never below 1, since the panels run to
   the stage's edges and anything smaller would show the table around them. */
.sl-camera {
  position: absolute;
  inset: 0;
  transform: scale(1.04);
  transform-origin: 50% var(--sl-band-y);
}

.is-entered .sl-camera {
  transform: scale(1);
  transition: transform 10s cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* A panel is hidden by its clip collapsed onto its outer edge, and wipes open
   to its slanted seam. Clip-path interpolates point by point, which is why the
   `from` polygons in geometry.ts keep the final polygon's point order. The
   wipe curve is the Save the Date's own centre-out wipe — slow off the mark so
   the edge is seen to start, then a long settle into the seam. */
.sl-panel {
  position: absolute;
  clip-path: var(--sl-from);
  --sp-empty: transparent;
}

.sl-panel.is-shown {
  clip-path: var(--sl-clip);
  transition: clip-path 1.2s var(--sk-ease-wipe);
}

/* Each pair fades into the band between them rather than meeting it at an
   edge, so the copy sits in the photographs rather than on a stripe laid
   across them. */
.sl-fade-down {
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 58%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, #000 58%, transparent 100%);
}

.sl-fade-up {
  -webkit-mask-image: linear-gradient(to top, #000 0%, #000 58%, transparent 100%);
  mask-image: linear-gradient(to top, #000 0%, #000 58%, transparent 100%);
}

.sl-band {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--sl-band-y) - var(--sk-w) * 0.3);
  height: calc(var(--sk-w) * 0.6);
  z-index: 4;
  opacity: 0;
  pointer-events: none;
}

.is-closed .sl-band {
  opacity: 1;
  transition: opacity 1.2s var(--sk-ease-atmos);
}

.sl-copy {
  position: absolute;
  left: 0;
  right: 0;
  top: var(--sl-band-y);
  z-index: 5;
  display: flex;
  justify-content: center;
  transform: translateY(-50%);
}

/* No wipes and no camera: each panel is already cut to its seam and simply
   fades in. */
@media (prefers-reduced-motion: reduce) {
  .sl-camera,
  .is-entered .sl-camera {
    transform: none;
  }

  .sl-panel {
    clip-path: var(--sl-clip);
    opacity: 0;
  }

  .sl-panel.is-shown {
    opacity: 1;
    transition: opacity 0.5s ease;
  }
}
</style>
