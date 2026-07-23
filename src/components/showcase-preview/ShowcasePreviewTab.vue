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

    <div v-else-if="event?.id" class="showcase-preview-tab__frames">
      <!-- The frame list comes from the resolved preview renderer (V1's
           cover/transition/main today — a V2 renderer will declare its own
           pages). Editable frames are interactive when the user can edit:
           clicks go into the frame for click-to-edit text and edit-intent
           regions, while the frame page itself neutralizes live
           buttons/links (RSVP, envelope, music…). -->
      <template v-for="frame in renderer.frames" :key="frame.id">
        <PreviewFrame v-if="isFrameVisible(frame)" :label="t(frame.labelKey)">
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
import { onMounted, computed } from 'vue'
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

const frameUrl = (frame: PreviewFrameDescriptor) => {
  const params = new URLSearchParams({ stage: frame.id, lang: currentLanguage.value })
  if (props.canEdit && frame.editable) params.set('editable', '1')
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

.showcase-preview-tab__frames {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  padding-bottom: 2rem;
}

.showcase-preview-tab__transition-note {
  font-size: 0.8125rem;
  color: rgb(148 163 184);
  padding: 1.5rem 0;
}
</style>
