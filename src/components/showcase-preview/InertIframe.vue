<template>
  <div class="inert-iframe">
    <iframe
      ref="iframeRef"
      class="inert-iframe__frame"
      :class="{ 'inert-iframe__frame--interactive': interactive }"
      :src="src"
    />
    <!-- Transparent shield: blocks clicks/taps from reaching the live showcase
         page inside the iframe (real RSVP submission, comments, map/video
         links, etc. — this is a view-only preview, not the interactive guest
         experience) while still letting the admin scroll to see everything.
         The showcase's own scroll container is a nested `overflow-y-auto` div
         (not the iframe's document/window — the outer stage is deliberately
         `overflow: hidden`), so wheel/touch deltas are forwarded to whichever
         scrollable ancestor sits under the cursor inside the iframe.
         In `interactive` mode (inline editing) the shield is dropped entirely —
         the frame page itself neutralizes dangerous elements via CSS instead
         (see ShowcasePreviewFrameView's .preview-editable-mode rules) and
         native scrolling/focus work directly. -->
    <div
      v-if="!interactive"
      class="inert-iframe__shield"
      :class="{ 'inert-iframe__shield--clickable': clickMessage }"
      @wheel="onWheel"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @click="onShieldClick"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  src: string
  /** When set, clicking the shield posts `{ type: clickMessage }` to the
   *  iframe's window (same-origin) — the frame page decides what to do with
   *  it (e.g. replaying the transition animation). All other interaction
   *  stays blocked. */
  clickMessage?: string
  /** Drop the shield and let the iframe receive pointer/keyboard input
   *  directly — used for inline-editable frames, where the frame page itself
   *  disables its dangerous interactive elements. */
  interactive?: boolean
}

const props = defineProps<Props>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

const onShieldClick = () => {
  if (!props.clickMessage) return
  iframeRef.value?.contentWindow?.postMessage(
    { type: props.clickMessage },
    window.location.origin,
  )
}

// The iframe is visually shrunk by PreviewFrame's `transform: scale(...)`, so
// screen-space pointer coordinates must be converted back to the iframe's own
// (unscaled) coordinate space before calling elementFromPoint on its document.
const toIframeLocalPoint = (clientX: number, clientY: number) => {
  const iframe = iframeRef.value
  if (!iframe) return null
  const rect = iframe.getBoundingClientRect()
  const scale = rect.width / (iframe.clientWidth || rect.width) || 1
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  }
}

const findScrollableAncestor = (
  doc: Document,
  start: Element | null,
): Element | null => {
  const view = doc.defaultView
  let el = start
  while (el && el !== doc.documentElement) {
    const style = view?.getComputedStyle(el)
    const canScrollY =
      style &&
      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      el.scrollHeight > el.clientHeight + 1
    if (canScrollY) return el
    el = el.parentElement
  }
  return doc.scrollingElement
}

const scrollAtPoint = (clientX: number, clientY: number, deltaY: number) => {
  const iframe = iframeRef.value
  const doc = iframe?.contentDocument
  if (!doc) return
  const point = toIframeLocalPoint(clientX, clientY)
  if (!point) return
  const target = doc.elementFromPoint(point.x, point.y)
  const scrollable = findScrollableAncestor(doc, target)
  scrollable?.scrollBy(0, deltaY)
}

const onWheel = (event: WheelEvent) => {
  event.preventDefault()
  scrollAtPoint(event.clientX, event.clientY, event.deltaY)
}

let lastTouch: { x: number; y: number } | null = null

const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0]
  lastTouch = touch ? { x: touch.clientX, y: touch.clientY } : null
}

const onTouchMove = (event: TouchEvent) => {
  event.preventDefault()
  const touch = event.touches[0]
  if (!touch || !lastTouch) return
  const deltaY = lastTouch.y - touch.clientY
  scrollAtPoint(touch.clientX, touch.clientY, deltaY)
  lastTouch = { x: touch.clientX, y: touch.clientY }
}
</script>

<style scoped>
.inert-iframe {
  position: relative;
  width: 100%;
  height: 100%;
}

.inert-iframe__frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  /* Belt-and-suspenders: the shield already intercepts every pointer event,
     but keep the iframe itself inert too. */
  pointer-events: none;
}

.inert-iframe__frame--interactive {
  pointer-events: auto;
}

.inert-iframe__shield {
  position: absolute;
  inset: 0;
  background: transparent;
  touch-action: none;
  cursor: default;
}

.inert-iframe__shield--clickable {
  cursor: pointer;
}
</style>
