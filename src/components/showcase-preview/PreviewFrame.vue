<template>
  <div class="preview-frame">
    <!-- Skipped when the caller names the stage elsewhere (the gallery's stage
         picker sits above the frame and already says which screen this is) — an
         empty label box would still cost the column's 0.75rem gap. -->
    <div v-if="label" class="preview-frame__label">{{ label }}</div>
    <div ref="frameWrapRef" class="preview-frame__frame-wrap">
      <!-- Anchor is sized to exactly match the scaler's own box (not the
           wider, centered frame-wrap column) so the leading slot's
           absolutely-positioned control — anchored to *this* element —
           tracks the phone mockup's real edge instead of drifting when the
           column's available width changes (e.g. the Studio side panel
           opening/closing). Lives outside the scaler (which clips to the
           phone shape) so it can still sit half-outside the frame. -->
      <div class="preview-frame__anchor" :style="scalerStyle">
        <slot name="leading" />
        <div ref="scalerRef" class="preview-frame__scaler">
          <div class="preview-frame__native" :style="nativeStyle">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  label: string
  width?: number
  height?: number
  maxWidth?: number
  /** Extra space to always leave below the frame (bottom page padding, a
   *  fixed mobile tab bar) when fitting the frame to the viewport height. */
  bottomReserve?: number
  /** Whether to also cap scale so the frame's full height fits the viewport
   *  without scrolling. Only correct for a frame that's alone on its "row" —
   *  a grid item that has wrapped to a second row sits much further down the
   *  page, so measuring *its own* distance from the viewport top and
   *  reserving space below it there would shrink it to near-nothing even
   *  though scrolling a bit to see row 2 is completely normal. Multi-column
   *  layouts should pass `false` and just fit width. */
  fitHeight?: boolean
  /** When set, use this as the available width instead of self-measuring
   *  the parent element. Every frame in a multi-column row independently
   *  self-measuring via its own ResizeObserver can settle at slightly (or,
   *  mid-transition, wildly) different values depending on timing — passing
   *  down one shared, parent-computed column width keeps every frame in the
   *  row pixel-identical instead. */
  widthOverride?: number
}

// Native size matches a real mobile viewport (iPhone 12/13/14 CSS px) rather
// than an arbitrary design-canvas resolution — the showcase components rely
// on real vh/vw units, so rendering at an actual phone width/height is what
// makes the preview match what a guest sees on their phone, not just the
// same aspect ratio scaled down from a much larger canvas.
const props = withDefaults(defineProps<Props>(), {
  width: 390,
  height: 844,
  maxWidth: 390,
  bottomReserve: 40,
  fitHeight: true,
})

const frameWrapRef = ref<HTMLElement | null>(null)
const scalerRef = ref<HTMLElement | null>(null)
const measuredWidth = ref(props.maxWidth)
const containerWidth = computed(() =>
  props.widthOverride != null ? Math.min(props.maxWidth, props.widthOverride) : measuredWidth.value,
)
const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 900)
// Measured live from the frame's own position, rather than a fixed guess at
// how much page chrome (top bar, tab header, toolbar) sits above it — a
// hardcoded number silently goes stale the moment that chrome changes height.
const topOffset = ref(0)

// Fit to whichever dimension is tighter — available width (from the tab
// panel's own layout) or available height (from the browser viewport) — so
// the whole phone-shaped frame is always visible without needing to scroll
// just to see one frame's bottom edge.
const scale = computed(() => {
  const widthScale = containerWidth.value / props.width
  if (!props.fitHeight) return widthScale
  const availableHeight = Math.max(
    viewportHeight.value - topOffset.value - props.bottomReserve,
    200,
  )
  const heightScale = availableHeight / props.height
  return Math.min(widthScale, heightScale)
})

const scalerStyle = computed(() => ({
  width: `${props.width * scale.value}px`,
  height: `${props.height * scale.value}px`,
}))

const nativeStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `scale(${scale.value})`,
}))

let resizeObserver: ResizeObserver | null = null

// Re-measures container width, viewport height, and this frame's own
// distance from the top of the viewport. Exposed so the parent can force a
// re-measure after a layout change it makes (e.g. switching how many frames
// are shown per row) that this component itself can't observe.
const measure = () => {
  // Measured off frame-wrap (the true available column width), not the
  // anchor — the anchor's own width is set *from* this same measurement
  // (via scalerStyle), so reading it back would be circular and never
  // reflect a column resize.
  if (frameWrapRef.value) {
    measuredWidth.value = Math.min(props.maxWidth, frameWrapRef.value.clientWidth)
  }
  // Measured off the scaler itself, not its parent — the label sits above it
  // within the same parent, so using the parent's top would over-reserve by
  // the label's own height.
  if (scalerRef.value) {
    topOffset.value = scalerRef.value.getBoundingClientRect().top
  }
  viewportHeight.value = window.innerHeight
}

onMounted(() => {
  measure()
  if (frameWrapRef.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(frameWrapRef.value)
  }
  window.addEventListener('resize', measure)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', measure)
})

defineExpose({ measure })
</script>

<style scoped>
.preview-frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.preview-frame__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

.preview-frame__frame-wrap {
  position: relative;
  /* .preview-frame uses align-items: center for its own children (label +
     this wrap), which would otherwise shrink-wrap this wrap to the scaler's
     own explicit width — circular with measure() reading this element's
     clientWidth as "available width". Forcing full width here keeps that
     measurement identical to when the scaler was a direct child of
     .preview-frame (a flex item stretched by its own parent's layout). */
  width: 100%;
  display: flex;
  justify-content: center;
}

.preview-frame__anchor {
  /* Sized to exactly match the scaler (via :style="scalerStyle" in the
     template) and centered by frame-wrap's flex layout same as the scaler
     alone used to be — so the phone mockup's on-screen position is
     unchanged, but the leading slot's absolute positioning now has a
     same-size, non-clipping reference box to anchor against. */
  position: relative;
}

.preview-frame__scaler {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 1.5rem;
  box-shadow:
    0 20px 40px -10px rgba(15, 23, 42, 0.25),
    0 0 0 1px rgba(15, 23, 42, 0.06);
  background: #000;
}

.preview-frame__native {
  position: relative;
  transform-origin: top left;
  overflow: hidden;
}
</style>
