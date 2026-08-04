<template>
  <div
    v-if="visibleCorners.length"
    class="corner-frame-container"
    :style="containerVars"
    aria-hidden="true"
  >
    <img
      v-for="corner in visibleCorners"
      :key="corner.id"
      :src="corner.url"
      alt=""
      class="corner-art"
      :class="`corner-${corner.id}`"
      :style="corner.style"
      v-bind="protectionAttrs"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import { GUEST_FRAME_CORNER_IDS } from '@/composables/showcase/useCoverStageLayout'
import type { GuestFrameCornerId } from '@/services/api/types/template.types'
import type { GuestFrameArtProps } from './types'

/**
 * Corner ornaments bracketing the name, with nothing drawn along the edges.
 *
 * Only two upload slots feed four positions: corner art is symmetric under
 * reflection, so each position names a source (`left`/`right`/`none`) and its own
 * flips. One upload pointed at all four corners with flips gives a closed frame;
 * the default config uses both uploads unflipped on top and mirrored on the
 * bottom, which is how partners naturally draw the pair.
 */
const props = defineProps<GuestFrameArtProps>()

const { protectionAttrs } = useAssetProtection()

interface VisibleCorner {
  id: GuestFrameCornerId
  url: string
  style: Record<string, string>
}

const visibleCorners = computed<VisibleCorner[]>(() => {
  const out: VisibleCorner[] = []

  for (const id of GUEST_FRAME_CORNER_IDS) {
    const corner = props.config.corners[id]
    // A position set to `none`, or pointed at a slot the template never filled,
    // simply isn't drawn — a partial frame is a valid design, and an <img> with
    // no src would render a broken-image glyph over the name.
    const url =
      corner.source === 'left' ? props.leftUrl : corner.source === 'right' ? props.rightUrl : null
    if (!url) continue

    const flips = [corner.flipX ? 'scaleX(-1)' : '', corner.flipY ? 'scaleY(-1)' : '']
      .filter(Boolean)
      .join(' ')

    out.push({ id, url, style: flips ? { transform: flips } : {} })
  }

  return out
})

const containerVars = computed(() => ({
  // Multiplied here rather than in CSS so the two knobs stay one number each in
  // the stored config, and the stylesheet just places what it's handed.
  '--corner-size': `${props.config.cornerSize * props.config.scale}%`,
  '--corner-inset': `${props.config.cornerInset}%`,
}))
</script>

<style scoped>
/* Fills the name block's padding box exactly, so the corners bracket the text at
   whatever size it has rendered — no fixed height band like the split style, and
   no --cover-font-scale term, because the box has already grown with the text. */
.corner-frame-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  animation: cornerFrameEntrance 0.8s ease-out forwards;
  animation-delay: 0.8s;
}

/* Entrance is opacity-only on the container, deliberately: every corner's own
   `transform` is carrying its flips, and an animated transform with
   `fill-mode: forwards` would overwrite them once the animation settled. */
@keyframes cornerFrameEntrance {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.corner-art {
  position: absolute;
  width: var(--corner-size, 28%);
  height: auto;
  max-width: none;
  display: block;
}

/* Inset percentages resolve per axis against the box — horizontally against its
   width, vertically against its height, as CSS normally does. */
.corner-topLeft {
  top: var(--corner-inset, 0%);
  left: var(--corner-inset, 0%);
}

.corner-topRight {
  top: var(--corner-inset, 0%);
  right: var(--corner-inset, 0%);
}

.corner-bottomLeft {
  bottom: var(--corner-inset, 0%);
  left: var(--corner-inset, 0%);
}

.corner-bottomRight {
  bottom: var(--corner-inset, 0%);
  right: var(--corner-inset, 0%);
}

@media (prefers-reduced-motion: reduce) {
  .corner-frame-container {
    animation-duration: 0.01ms;
  }
}
</style>
