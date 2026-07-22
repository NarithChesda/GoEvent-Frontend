<template>
  <div class="preview-frame">
    <div class="preview-frame__label">{{ label }}</div>
    <div ref="scalerRef" class="preview-frame__scaler" :style="scalerStyle">
      <div class="preview-frame__native" :style="nativeStyle">
        <slot />
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
  /** Vertical space reserved outside the frame itself (label, gaps, page
   *  chrome above/below) when fitting the frame to the viewport height. */
  reservedHeight?: number
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
  reservedHeight: 160,
})

const scalerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(props.maxWidth)
const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 900)

// Fit to whichever dimension is tighter — available width (from the tab
// panel's own layout) or available height (from the browser viewport) — so
// the whole phone-shaped frame is always visible without needing to scroll
// just to see one frame's bottom edge.
const scale = computed(() => {
  const widthScale = containerWidth.value / props.width
  const heightScale = Math.max(viewportHeight.value - props.reservedHeight, 200) / props.height
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

const updateViewportHeight = () => {
  viewportHeight.value = window.innerHeight
}

onMounted(() => {
  const el = scalerRef.value?.parentElement
  if (!el) return

  const updateWidth = () => {
    const available = el.clientWidth
    containerWidth.value = Math.min(props.maxWidth, available)
  }

  updateWidth()
  resizeObserver = new ResizeObserver(updateWidth)
  resizeObserver.observe(el)

  updateViewportHeight()
  window.addEventListener('resize', updateViewportHeight)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', updateViewportHeight)
})
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

.preview-frame__scaler {
  position: relative;
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
