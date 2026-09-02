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
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @click="onShieldClick"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  parsePreviewBridgeMessage,
  postToFrame,
  postEventPatchToFrame,
  postTemplatePreviewToFrame,
  postSetLanguageToFrame,
  postPreviewEventToFrame,
  postCoverLayoutSelection,
  type EventFieldPatch,
  type ParentToFrameType,
} from './bridge/previewBridge'
import type { TemplateAssets } from '@/composables/useEventShowcase'
import type { CoverElementBoxes, CoverElementId } from '@/services/api/types/template.types'

interface Props {
  src: string
  /** When set, clicking the shield posts this bridge command to the iframe's
   *  window (same-origin) — the frame page decides what to do with it (e.g.
   *  `replay` re-runs the transition animation). All other interaction stays
   *  blocked. */
  clickMessage?: ParentToFrameType
  /** Drop the shield and let the iframe receive pointer/keyboard input
   *  directly — used for inline-editable frames, where the frame page itself
   *  disables its dangerous interactive elements. */
  interactive?: boolean
  /** Report horizontal drags as `swipe`. Opt-in: only a parent that puts the
   *  frame's siblings left and right of it (the gallery's stage picker) has
   *  anywhere for a swipe to go — everywhere else it is a gesture with no
   *  destination. */
  swipeable?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** This frame has subscribed to the bridge, so state the parent holds (a
   *  staged template, edit hints) can finally be delivered. Anything posted
   *  before this is dropped silently — postMessage does not queue. */
  ready: []
  /** The frame reported which languages this event has and which one it is
   *  currently showing — after its initial load, and after every language
   *  switch. Parents can't derive this themselves (see
   *  postShowcaseLanguagesToParent). */
  languages: [languages: string[], currentLanguage: string]
  /** A cover block was dragged or resized inside the frame. `commit` is false
   *  for every frame of the gesture and true on release. */
  coverLayoutChange: [elements: CoverElementBoxes, commit: boolean]
  /** A cover block was selected (or deselected) inside the frame. */
  coverLayoutSelect: [elementId: CoverElementId | null]
  /** A horizontal drag cleared the distance or velocity threshold. `swipeable`
   *  only. The direction is the finger's, so 'left' means "next". */
  swipe: [direction: 'left' | 'right']
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

// The frame announces itself (see postFrameReadyToParent); the iframe's own
// `load` event deliberately isn't used for this, because it fires while the
// lazily imported frame route is still being fetched — well before anything in
// there is listening. Matching on `event.source` is what makes this per-frame:
// every mounted InertIframe hears every frame's announcement, and only the one
// that owns the sending window reacts.
const onWindowMessage = (event: MessageEvent) => {
  if (event.source !== iframeRef.value?.contentWindow) return
  const parsed = parsePreviewBridgeMessage(event)
  if (!parsed) return
  if (parsed.type === 'frame-ready') emit('ready')
  if (parsed.type === 'showcase-languages') emit('languages', parsed.languages, parsed.currentLanguage)
  if (parsed.type === 'cover-layout-change') emit('coverLayoutChange', parsed.elements, parsed.commit)
  if (parsed.type === 'cover-layout-select') emit('coverLayoutSelect', parsed.elementId)
}

onMounted(() => window.addEventListener('message', onWindowMessage))
onUnmounted(() => window.removeEventListener('message', onWindowMessage))

// A drag that ends over the shield is not a tap on it. A browser suppresses the
// synthetic click after a gesture this handler cancelled, but not after one it
// handed to the page — so measure how far the finger travelled rather than
// trusting that.
const onShieldClick = () => {
  if (gestureMoved) {
    gestureMoved = false
    return
  }
  if (!props.clickMessage) return
  postToFrame(iframeRef.value?.contentWindow, props.clickMessage)
}

// Lets the parent tab push bridge commands (e.g. `refresh` after a
// parent-side media save) into this frame.
defineExpose({
  post: (type: ParentToFrameType) => postToFrame(iframeRef.value?.contentWindow, type),
  postEventPatch: (fields: EventFieldPatch) =>
    postEventPatchToFrame(iframeRef.value?.contentWindow, fields),
  postTemplatePreview: (templateData: TemplateAssets) =>
    postTemplatePreviewToFrame(iframeRef.value?.contentWindow, templateData),
  postSetLanguage: (language: string) =>
    postSetLanguageToFrame(iframeRef.value?.contentWindow, language),
  postPreviewEvent: (eventId: string | null) =>
    postPreviewEventToFrame(iframeRef.value?.contentWindow, eventId),
  postCoverLayoutSelect: (elementId: CoverElementId | null) =>
    postCoverLayoutSelection(iframeRef.value?.contentWindow, elementId),
})

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

/** The scrollable the finger/cursor is over, and whether it can still move that way. */
const scrollableAtPoint = (clientX: number, clientY: number): Element | null => {
  const doc = iframeRef.value?.contentDocument
  if (!doc) return null
  const point = toIframeLocalPoint(clientX, clientY)
  if (!point) return null
  return findScrollableAncestor(doc, doc.elementFromPoint(point.x, point.y))
}

const canScrollBy = (element: Element | null, deltaY: number): boolean => {
  if (!element) return false
  const max = element.scrollHeight - element.clientHeight
  if (max <= 1) return false
  return deltaY < 0 ? element.scrollTop > 0 : element.scrollTop < max - 1
}

const scrollAtPoint = (clientX: number, clientY: number, deltaY: number) => {
  scrollableAtPoint(clientX, clientY)?.scrollBy(0, deltaY)
}

const onWheel = (event: WheelEvent) => {
  event.preventDefault()
  scrollAtPoint(event.clientX, event.clientY, event.deltaY)
}

/**
 * Who owns this drag: the preview, or the page it sits on.
 *
 * The shield used to `preventDefault()` every touchmove and forward the whole
 * delta inward, which is right on a stage that scrolls and a dead end on one
 * that doesn't — a cover fills its viewport exactly, so dragging it moved
 * nothing at all while also denying the gesture to the page. On a phone, where
 * the frame is most of the screen, that reads as a page that has frozen.
 *
 * So ownership is decided ONCE, on the first move of each gesture, and it has
 * to be: `touch-action: pan-y` lets the browser start its own pan, and only
 * that first touchmove is still cancelable — after it the decision cannot be
 * revisited either way. Claim the gesture only when something under the finger
 * can actually travel in the direction it is going; otherwise let go and the
 * page scrolls natively, exactly as it would beside the frame.
 */
type GestureOwner = 'undecided' | 'frame' | 'page' | 'swipe'

const SWIPE_DISTANCE_PX = 48
/** px/ms — a flick is enough on its own; see the momentum rule in Sonner. */
const SWIPE_VELOCITY = 0.35
/** Past this the gesture was a drag, and the tap it ends in is not a tap. */
const TAP_SLOP_PX = 10

let gestureOwner: GestureOwner = 'undecided'
let lastTouch: { x: number; y: number } | null = null
let startTouch: { x: number; y: number; at: number } | null = null
let gestureMoved = false

const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0]
  gestureOwner = 'undecided'
  gestureMoved = false
  lastTouch = touch ? { x: touch.clientX, y: touch.clientY } : null
  startTouch = touch ? { x: touch.clientX, y: touch.clientY, at: Date.now() } : null
}

const onTouchMove = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch || !lastTouch || !startTouch) return

  const deltaY = lastTouch.y - touch.clientY
  const totalX = touch.clientX - startTouch.x
  const totalY = touch.clientY - startTouch.y
  if (Math.abs(totalX) > TAP_SLOP_PX || Math.abs(totalY) > TAP_SLOP_PX) gestureMoved = true

  if (gestureOwner === 'undecided') {
    if (props.swipeable && Math.abs(totalX) > Math.abs(totalY)) {
      gestureOwner = 'swipe'
    } else {
      const scrollable = scrollableAtPoint(touch.clientX, touch.clientY)
      gestureOwner = canScrollBy(scrollable, deltaY) ? 'frame' : 'page'
    }
  }

  // Released: the browser owns the pan from here, and nothing this handler does
  // can take it back.
  if (gestureOwner === 'page') return

  if (event.cancelable) event.preventDefault()
  if (gestureOwner === 'frame') scrollAtPoint(touch.clientX, touch.clientY, deltaY)
  lastTouch = { x: touch.clientX, y: touch.clientY }
}

const onTouchEnd = () => {
  const start = startTouch
  const end = lastTouch
  startTouch = null
  lastTouch = null
  if (gestureOwner !== 'swipe' || !start || !end) {
    gestureOwner = 'undecided'
    return
  }
  gestureOwner = 'undecided'

  const distance = end.x - start.x
  // Distance OR velocity: a deliberate drag and a quick flick both count, so a
  // short confident swipe is not silently ignored.
  const velocity = Math.abs(distance) / Math.max(Date.now() - start.at, 1)
  if (Math.abs(distance) < SWIPE_DISTANCE_PX && velocity < SWIPE_VELOCITY) return
  emit('swipe', distance < 0 ? 'left' : 'right')
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
  /* Not `none`. The browser has to be *able* to pan the page, so a gesture this
     shield declines — nothing under the finger can travel that way — still
     moves the page instead of dying on the frame. See the ownership rule in
     onTouchMove. Horizontal is withheld either way: nothing inside the frame
     consumes it, and a `swipeable` parent reads it itself. */
  touch-action: pan-y;
  cursor: default;
}

.inert-iframe__shield--clickable {
  cursor: pointer;
}
</style>
