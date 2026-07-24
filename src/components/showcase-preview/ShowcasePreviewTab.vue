<template>
  <div class="showcase-preview-tab">
    <div class="showcase-preview-tab__header">
      <div>
        <h2 class="showcase-preview-tab__title">{{ t('management.showcasePreview.title') }}</h2>
        <p class="showcase-preview-tab__subtitle">{{ t('management.showcasePreview.subtitle') }}</p>
      </div>

      <div v-if="availableLanguages.length > 1" class="showcase-preview-tab__lang-switcher">
        <button
          v-for="lang in availableLanguages"
          :key="lang.language"
          type="button"
          class="showcase-preview-tab__lang-btn"
          :class="{ 'is-active': currentLanguage === lang.language }"
          @click="currentLanguage = lang.language"
        >
          {{ lang.language_display }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="showcase-preview-tab__loading">
      <div class="showcase-preview-tab__spinner" />
      <span>{{ t('management.media.loading') }}</span>
    </div>

    <div v-else-if="error" class="showcase-preview-tab__error">{{ error }}</div>

    <div v-else-if="event?.id" class="showcase-preview-tab__viewer">
      <div class="showcase-preview-tab__toolbar">
        <!-- Frame picker: only meaningful in single-frame focus mode, where
             the other frames are hidden and need some way to switch to. -->
        <div
          v-if="viewMode === 'single' && visibleFrames.length > 1"
          class="showcase-preview-tab__frame-tabs"
        >
          <button
            v-for="frame in visibleFrames"
            :key="frame.id"
            type="button"
            class="showcase-preview-tab__frame-tab"
            :class="{ 'is-active': activeFrameId === frame.id }"
            @click="activeFrameId = frame.id"
          >
            {{ t(frame.labelKey) }}
          </button>
        </div>

        <!-- Layout switch: single-frame focus vs. every visible frame side
             by side (2 or 3, however many this event actually has). -->
        <div
          v-if="visibleFrames.length > 1"
          class="showcase-preview-tab__layout-switch"
          role="group"
          :aria-label="t('management.showcasePreview.layoutSwitchLabel')"
        >
          <button
            v-for="opt in VIEW_MODE_OPTIONS"
            :key="opt.value"
            type="button"
            class="showcase-preview-tab__layout-btn"
            :class="{ 'is-active': viewMode === opt.value }"
            :title="t(opt.labelKey)"
            :aria-label="t(opt.labelKey)"
            @click="viewMode = opt.value"
          >
            <component :is="opt.icon" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- The frame list comes from the resolved preview renderer (V1's
           cover/transition/main today — a V2 renderer will declare its own
           pages). Editable frames are interactive when the user can edit:
           clicks go into the frame for click-to-edit text and edit-intent
           regions, while the frame page itself neutralizes live
           buttons/links (RSVP, envelope, music…). -->
      <div
        :ref="setFramesContainerRef"
        class="showcase-preview-tab__frames"
        :class="framesLayoutClass"
      >
        <template v-for="frame in renderer.frames" :key="frame.id">
          <PreviewFrame
            v-if="isFrameVisible(frame)"
            v-show="viewMode === 'single' ? activeFrameId === frame.id : true"
            :ref="(el) => setPreviewFrameRef(frame.id, el)"
            :label="t(frame.labelKey)"
            :fit-height="viewMode === 'single' || !isNarrowViewport"
            :width-override="viewMode === 'multiple' ? sharedColumnWidth : undefined"
          >
            <InertIframe
              :ref="(el) => setFrameRef(frame.id, el)"
              :src="frameUrl(frame)"
              :interactive="frame.editable && canEdit"
              :click-message="frame.clickMessage"
            />
          </PreviewFrame>
          <!-- Multiple mode: skip entirely rather than rendering this note —
               it's a direct sibling of the PreviewFrames inside the grid, so
               it would occupy its own grid cell and push the next real frame
               into a wrapped second row (exactly the scroll-required bug this
               view exists to avoid). Grid columns are already sized off
               visibleFrames (which excludes this frame), so the remaining
               frames simply sit side by side with nothing in between. -->
          <div
            v-else-if="frame.hiddenNoteKey && viewMode === 'single'"
            class="showcase-preview-tab__transition-note"
          >
            {{ t(frame.hiddenNoteKey) }}
          </div>
        </template>
      </div>
    </div>

    <!-- Parent-side editors for edit intents posted by the frames (logo
         replace, gmap embed, host image, photo uploads) — full-size here in
         the manage page, reusing the forms tab's own components. -->
    <PreviewEditorHost
      v-if="canEdit && event?.id"
      :event-id="eventId"
      :event-data="eventData"
      @saved="onEditorSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, nextTick, watch } from 'vue'
import { Smartphone, LayoutGrid } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useEventShowcase } from '@/composables/useEventShowcase'
import type { Event } from '@/services/api'
import PreviewFrame from './PreviewFrame.vue'
import InertIframe from './InertIframe.vue'
import PreviewEditorHost from './editors/PreviewEditorHost.vue'
import {
  resolvePreviewRenderer,
  type PreviewFrameDescriptor,
} from './renderers/resolvePreviewRenderer'

interface Props {
  eventId: string
  canEdit: boolean
  /** The manage page's event record, for the parent-side editors. */
  eventData?: Event
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** A preview editor changed event-level data — lets EventManageView keep
   *  its copy (and the other tabs) fresh, same contract as EventMediaTab. */
  'event-updated': [event: Event]
}>()

const { t } = useAppLanguage()

// Only used here to resolve the renderer/frame visibility and drive the
// language switcher/loading/error chrome — the actual stage rendering happens
// inside each <iframe>'s own ShowcasePreviewFrameView instance (each with a
// genuine mobile-viewport browsing context, since the showcase components
// rely on real vh/vw units that a plain scaled-down div can't satisfy).
const {
  loading,
  error,
  event,
  templateAssets,
  eventPhotos,
  availableLanguages,
  currentLanguage,
  loadShowcase,
  refreshShowcaseData,
} = useEventShowcase({ eventId: props.eventId, skipMetaTags: true })

const rendererContext = computed(() => ({
  event: event.value,
  templateAssets: templateAssets.value,
  hasFeaturedPhoto: eventPhotos.value?.some((p) => p.is_featured) ?? false,
  canEdit: props.canEdit,
}))

const renderer = computed(() => resolvePreviewRenderer(rendererContext.value))

const isFrameVisible = (frame: PreviewFrameDescriptor) =>
  frame.isVisible ? frame.isVisible(rendererContext.value) : true

const visibleFrames = computed(() => renderer.value.frames.filter(isFrameVisible))

// ---------------------------------------------------------------------------
// View mode: single-frame focus (default — needs a picker to choose which
// frame is showing, since the others are hidden) vs. every visible frame
// (2 or 3, whatever this event actually has — never a fixed count) laid out
// side by side so the whole set fits without scrolling.
// ---------------------------------------------------------------------------
const VIEW_MODE_OPTIONS = [
  { value: 'single' as const, icon: Smartphone, labelKey: 'management.showcasePreview.layoutSingle' },
  { value: 'multiple' as const, icon: LayoutGrid, labelKey: 'management.showcasePreview.layoutMultiple' },
]

const viewMode = ref<'single' | 'multiple'>('single')
const activeFrameId = ref<string>('cover')

watch(
  visibleFrames,
  (frames) => {
    if (!frames.length) return
    if (!frames.some((f) => f.id === activeFrameId.value)) activeFrameId.value = frames[0].id
  },
  { immediate: true },
)

const framesLayoutClass = computed(() =>
  viewMode.value === 'multiple' ? `showcase-preview-tab__frames--cols-${visibleFrames.value.length}` : '',
)

type PreviewFrameInstance = InstanceType<typeof PreviewFrame>

const previewFrameRefs = new Map<string, PreviewFrameInstance>()

const setPreviewFrameRef = (id: string, el: unknown) => {
  if (el) previewFrameRefs.set(id, el as PreviewFrameInstance)
  else previewFrameRefs.delete(id)
}

// Re-fit every mounted frame after a layout change — switching view modes
// (or which frame is focused) changes each frame's available width/height,
// which PreviewFrame can't detect on its own.
const remeasurePreviewFrames = () => {
  nextTick(() => {
    for (const inst of previewFrameRefs.values()) inst.measure()
  })
}

watch(viewMode, remeasurePreviewFrames)
watch(activeFrameId, remeasurePreviewFrames)

// ---------------------------------------------------------------------------
// Shared column width for "multiple" mode: each PreviewFrame used to
// self-measure its own DOM parent via its own ResizeObserver, and those N
// independent observers could settle at slightly different widths depending
// on timing (worst case, one frame mid-layout reads a stale/tiny value and
// gets stuck there) — so frames in the same row ended up visibly different
// sizes. Measuring the shared frames container once here and handing every
// frame the same computed column width keeps them pixel-identical. The
// column count always matches how many frames there are (2 or 3), so the
// grid never wraps to a second row.
// ---------------------------------------------------------------------------
const FRAMES_GRID_GAP_PX = 24 // matches the `gap: 1.5rem` on --cols-2/--cols-3

const framesContainerWidth = ref(0)
let framesResizeObserver: ResizeObserver | null = null

const setFramesContainerRef = (el: unknown) => {
  framesResizeObserver?.disconnect()
  framesResizeObserver = null
  const element = el as HTMLElement | null
  if (!element) return
  framesContainerWidth.value = element.clientWidth
  framesResizeObserver = new ResizeObserver(() => {
    framesContainerWidth.value = element.clientWidth
  })
  framesResizeObserver.observe(element)
}

// Below this width the `--cols-2`/`--cols-3` CSS falls back to stacking
// full-width (not enough room for real phone-sized frames side by side —
// see the `max-width: 768px` rule below); the column-width override must
// stand down there too, or it'd still hand each frame a divided width while
// CSS gives it the whole row.
const NARROW_VIEWPORT_PX = 768
const isNarrowViewport = ref(typeof window !== 'undefined' ? window.innerWidth <= NARROW_VIEWPORT_PX : false)
const updateIsNarrowViewport = () => {
  isNarrowViewport.value = window.innerWidth <= NARROW_VIEWPORT_PX
}

const sharedColumnWidth = computed(() => {
  if (viewMode.value !== 'multiple' || isNarrowViewport.value) return undefined
  const cols = Math.max(visibleFrames.value.length, 1)
  return Math.max((framesContainerWidth.value - FRAMES_GRID_GAP_PX * (cols - 1)) / cols, 0)
})

const frameUrl = (frame: PreviewFrameDescriptor) => {
  const params = new URLSearchParams({ stage: frame.id, lang: currentLanguage.value })
  if (props.canEdit && frame.editable) params.set('editable', '1')
  // Always pass the selected template id when one exists — `event_template_enabled`
  // isn't a reliable predictor of whether the showcase endpoint will actually
  // include template_assets (it can be true with no confirmed Payment row yet),
  // so let the frame's own check of the real showcase response decide whether
  // the public-assets fallback is needed instead of gating it here.
  if (props.eventData?.event_template) {
    params.set('templateId', String(props.eventData.event_template))
  }
  return `/events/${props.eventId}/showcase-preview-frame?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Frame refs + post-save refresh: when a parent-side editor saves, every
// frame refetches its showcase data (bridge `refresh`), this tab refreshes
// its own copy (frame visibility, languages), and event-level updates
// propagate up to EventManageView.
// ---------------------------------------------------------------------------
type InertIframeInstance = InstanceType<typeof InertIframe>

const frameRefs = new Map<string, InertIframeInstance>()

const setFrameRef = (id: string, el: unknown) => {
  if (el) frameRefs.set(id, el as InertIframeInstance)
  else frameRefs.delete(id)
}

const onEditorSaved = (updated?: Event) => {
  for (const frame of frameRefs.values()) frame.post('refresh')
  // Silent refresh: this tab's `loading` flag gates the whole frames block,
  // so a full loadShowcase() here would unmount and reload every iframe —
  // exactly the "page refresh" jank the silent path exists to avoid.
  refreshShowcaseData()
  if (updated) emit('event-updated', updated)
}

onMounted(() => {
  loadShowcase()
  window.addEventListener('resize', updateIsNarrowViewport)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsNarrowViewport)
})
</script>

<style scoped>
.showcase-preview-tab {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.showcase-preview-tab__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.showcase-preview-tab__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(15 23 42);
}

.showcase-preview-tab__subtitle {
  font-size: 0.875rem;
  color: rgb(100 116 139);
  margin-top: 0.25rem;
}

.showcase-preview-tab__lang-switcher {
  display: flex;
  gap: 0.375rem;
  padding: 0.25rem;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 0.75rem;
}

.showcase-preview-tab__lang-btn {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 0.5rem;
  color: rgb(100 116 139);
  transition: all 0.2s ease;
}

.showcase-preview-tab__lang-btn.is-active {
  background: white;
  color: rgb(15 23 42);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}

.showcase-preview-tab__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 0;
  color: rgb(100 116 139);
  font-size: 0.875rem;
}

.showcase-preview-tab__spinner {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 2px solid rgba(30, 144, 255, 0.2);
  border-bottom-color: #1e90ff;
  animation: showcase-preview-spin 0.8s linear infinite;
}

@keyframes showcase-preview-spin {
  to {
    transform: rotate(360deg);
  }
}

.showcase-preview-tab__error {
  padding: 2rem;
  text-align: center;
  color: rgb(220 38 38);
  background: rgba(254, 226, 226, 0.5);
  border-radius: 1rem;
}

.showcase-preview-tab__viewer {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.showcase-preview-tab__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.showcase-preview-tab__frame-tabs {
  display: flex;
  gap: 0.375rem;
  padding: 0.25rem;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 0.75rem;
}

.showcase-preview-tab__frame-tab {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 0.5rem;
  color: rgb(100 116 139);
  transition: all 0.2s ease;
}

.showcase-preview-tab__frame-tab.is-active {
  background: white;
  color: rgb(15 23 42);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}

/* Step-style segmented control: square icon buttons in a single connected
   pill, the active step filled with the brand gradient. */
.showcase-preview-tab__layout-switch {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  margin-left: auto;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 0.75rem;
}

.showcase-preview-tab__layout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  color: rgb(100 116 139);
  transition: all 0.2s ease;
}

.showcase-preview-tab__layout-btn:hover {
  color: rgb(51 65 85);
  background: rgba(255, 255, 255, 0.7);
}

.showcase-preview-tab__layout-btn.is-active {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: white;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
}

.showcase-preview-tab__frames {
  display: flex;
  flex-direction: column;
  /* stretch, not center: a centered flex item shrink-wraps to its own
     content width, which is circular with PreviewFrame measuring that same
     width to decide how big to render its content — and locks onto a wrong,
     tiny size the first time a frame that mounted hidden (display: none)
     gets shown. Stretching gives each frame a stable, real width to measure;
     PreviewFrame's own internal `align-items: center` still centers the
     (narrower, max-width-capped) phone mockup within it. */
  align-items: stretch;
  gap: 3rem;
  padding-bottom: 2rem;
}

.showcase-preview-tab__frames--cols-2,
.showcase-preview-tab__frames--cols-3 {
  display: grid;
  align-items: start;
  gap: 1.5rem;
}

.showcase-preview-tab__frames--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.showcase-preview-tab__frames--cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

/* Not enough width for real phone-sized frames side by side below tablet
   width — fall back to single-column stacking instead of squeezing them. */
@media (max-width: 768px) {
  .showcase-preview-tab__frames--cols-2,
  .showcase-preview-tab__frames--cols-3 {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
}

.showcase-preview-tab__transition-note {
  font-size: 0.8125rem;
  color: rgb(148 163 184);
  padding: 1.5rem 0;
}
</style>
