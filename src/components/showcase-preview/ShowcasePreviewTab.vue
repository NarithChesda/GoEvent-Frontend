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
          v-if="layoutMode === 1 && visibleFrames.length > 1"
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

        <!-- Layout switch: how many frames to show at once, so the whole
             preview can fit on screen without scrolling. -->
        <div
          v-if="visibleFrames.length > 1"
          class="showcase-preview-tab__layout-switch"
          role="group"
          :aria-label="t('management.showcasePreview.layoutSwitchLabel')"
        >
          <button
            v-for="opt in layoutOptions"
            :key="opt.count"
            type="button"
            class="showcase-preview-tab__layout-btn"
            :class="{ 'is-active': layoutMode === opt.count }"
            :title="t(opt.labelKey)"
            :aria-label="t(opt.labelKey)"
            @click="layoutMode = opt.count"
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
        class="showcase-preview-tab__frames"
        :class="`showcase-preview-tab__frames--cols-${layoutMode}`"
      >
        <template v-for="frame in renderer.frames" :key="frame.id">
          <PreviewFrame
            v-if="isFrameVisible(frame)"
            v-show="layoutMode === 1 ? activeFrameId === frame.id : true"
            :ref="(el) => setPreviewFrameRef(frame.id, el)"
            :label="t(frame.labelKey)"
          >
            <InertIframe
              :ref="(el) => setFrameRef(frame.id, el)"
              :src="frameUrl(frame)"
              :interactive="frame.editable && canEdit"
              :click-message="frame.clickMessage"
            />
          </PreviewFrame>
          <div v-else-if="frame.hiddenNoteKey" class="showcase-preview-tab__transition-note">
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
import { onMounted, computed, ref, nextTick, watch } from 'vue'
import { Smartphone, Columns2, Columns3 } from 'lucide-vue-next'
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
// Layout switch: how many frames are shown at once. Single-frame focus mode
// (the default) needs a picker to choose which frame is showing since the
// others are hidden; 2/3-up modes lay every visible frame out side by side
// instead so the whole set fits without scrolling.
// ---------------------------------------------------------------------------
const LAYOUT_OPTIONS = [
  { count: 1 as const, icon: Smartphone, labelKey: 'management.showcasePreview.layoutSingle' },
  { count: 2 as const, icon: Columns2, labelKey: 'management.showcasePreview.layoutDouble' },
  { count: 3 as const, icon: Columns3, labelKey: 'management.showcasePreview.layoutTriple' },
]

const layoutMode = ref<1 | 2 | 3>(1)
const activeFrameId = ref<string>('cover')

const layoutOptions = computed(() =>
  LAYOUT_OPTIONS.filter((opt) => opt.count <= Math.max(visibleFrames.value.length, 1)),
)

watch(
  visibleFrames,
  (frames) => {
    if (!frames.length) return
    if (!frames.some((f) => f.id === activeFrameId.value)) activeFrameId.value = frames[0].id
    if (layoutMode.value > frames.length) layoutMode.value = Math.max(frames.length, 1) as 1 | 2 | 3
  },
  { immediate: true },
)

type PreviewFrameInstance = InstanceType<typeof PreviewFrame>

const previewFrameRefs = new Map<string, PreviewFrameInstance>()

const setPreviewFrameRef = (id: string, el: unknown) => {
  if (el) previewFrameRefs.set(id, el as PreviewFrameInstance)
  else previewFrameRefs.delete(id)
}

// Re-fit every mounted frame after a layout change — switching how many
// frames show per row (or which one is focused) changes each frame's
// available width/height, which PreviewFrame can't detect on its own.
const remeasurePreviewFrames = () => {
  nextTick(() => {
    for (const inst of previewFrameRefs.values()) inst.measure()
  })
}

watch(layoutMode, remeasurePreviewFrames)
watch(activeFrameId, remeasurePreviewFrames)

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
