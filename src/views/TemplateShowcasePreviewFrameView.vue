<template>
  <div
    class="preview-frame-stage"
    :style="{ backgroundColor: backgroundColor || primaryColor || '#000' }"
  >
    <LoadingSpinner v-if="loading" :primary-color="primaryColor" message="Loading preview..." />

    <ErrorDisplay v-else-if="error" :message="error" :show-retry="true" @retry="loadShowcase" />

    <component
      :is="renderer.FrameComponent"
      v-else-if="event.id"
      :showcase="showcase"
      :stage="stage"
      :replay-key="replayKey"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * One stage of the sample invitation, rendered against a chosen template.
 *
 * The sibling of ShowcasePreviewFrameView, and deliberately a separate route
 * rather than a flag on it: that one is an EVENT's preview — it takes an event
 * id, fetches that event's showcase, and carries the whole inline-editing
 * apparatus for the person who owns it. This one has no event and no viewer
 * with permissions. It renders the bundled sample invitation (see
 * useDemoShowcase.ts) against a template picked by id from the public
 * catalogue, so it can be embedded on the public partner page with nothing
 * signed in. Read-only by construction: no edit contexts are provided here, so
 * there is no `?editable=1` to hand-craft.
 *
 * The path keeps the `showcase-preview-frame` segment on purpose — that is what
 * `isPreviewFrameDocument()` matches, and it is what lets these iframes skip
 * the app-shell startup work they would otherwise each pay for (see
 * utils/previewFrameContext.ts).
 */
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useEventShowcase, type TemplateAssets } from '@/composables/useEventShowcase'
import { eventTemplateService } from '@/services/api'
import { loadDemoShowcase } from '@/composables/showcase-preview/useDemoShowcase'
import { PreviewFrameKey } from '@/components/showcase-preview/previewContext'
import {
  parsePreviewBridgeMessage,
  postFrameReadyToParent,
  postShowcaseLanguagesToParent,
} from '@/components/showcase-preview/bridge/previewBridge'
import { resolvePreviewRenderer } from '@/components/showcase-preview/renderers/resolvePreviewRenderer'
import { warmV1StageChunks } from '@/components/showcase-preview/renderers/v1StageComponents'
import LoadingSpinner from '@/components/showcase/LoadingSpinner.vue'
import ErrorDisplay from '@/components/showcase/ErrorDisplay.vue'

const route = useRoute()

const stage = computed(() => {
  const raw = route.query.stage
  const value = Array.isArray(raw) ? raw[0] : raw
  return value || 'cover'
})

const previewTemplateId = computed(() => {
  const raw = route.query.templateId
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = value ? Number(value) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
})

// The sample id the demo data carries. Never fetched — it only keys this
// instance's request de-duplication — but it must match the JSON so anything
// reading `event.id` (the comment section's own fetch, which simply comes back
// empty) sees one consistent event.
const DEMO_EVENT_ID = '11111111-2222-4333-8444-555555555555'

const showcase = useEventShowcase({
  eventId: DEMO_EVENT_ID,
  skipMetaTags: true,
  useDefaultGuestName: true,
  dataSource: loadDemoShowcase,
})

const {
  loading,
  error,
  event,
  templateAssets,
  eventPhotos,
  primaryColor,
  backgroundColor,
  currentLanguage,
  loadShowcase,
  updateLanguageContent,
  availableLanguages,
  applyPreviewTemplateFallback,
  setStagedTemplatePreview,
} = showcase

const renderer = computed(() =>
  resolvePreviewRenderer({
    event: event.value,
    templateAssets: templateAssets.value,
    hasFeaturedPhoto: eventPhotos.value?.some((p) => p.is_featured) ?? false,
    canEdit: false,
  }),
)

// This is a preview, so slots the template defines but the sample has not
// filled still render. Never an editor — no InlineEditKey / EditIntentKey here.
provide(PreviewFrameKey, true)

const replayKey = ref(0)

/**
 * The template on screen, by id.
 *
 * `applyPreviewTemplateFallback` on the first one (the sample event has no
 * template of its own, so there is nothing to overwrite) and
 * `setStagedTemplatePreview` on every one after — that is the same live try-on
 * the templates modal uses, and it swaps assets, colours and fonts in place
 * without reloading the frame. Reloading would mean a new iframe navigation per
 * click on the template menu.
 */
const applyTemplate = async (templateId: number) => {
  try {
    const response = await eventTemplateService.getPublicTemplateAssets(templateId)
    // Wire shape is `{ template_data: {...} }`, not the flat TemplateAssets the
    // service's type declares — same as the manage-page frame's fallback.
    const templateData = (response.data as unknown as { template_data?: TemplateAssets } | null)
      ?.template_data
    if (!response.success || !templateData) return
    if (event.value?.template_assets) setStagedTemplatePreview(templateData)
    else applyPreviewTemplateFallback(templateData)
  } catch {
    // Non-fatal — the sample renders in the showcase's own default look.
  }
}

/** Only this frame knows which languages the sample carries. See the bridge. */
const publishLanguages = () => {
  postShowcaseLanguagesToParent(
    availableLanguages.value.map((lang) => lang.language),
    currentLanguage.value,
  )
}

const onFrameMessage = (msg: MessageEvent) => {
  const parsed = parsePreviewBridgeMessage(msg)
  if (!parsed) return
  if (parsed.type === 'replay') replayKey.value++
  if (parsed.type === 'set-language') {
    void updateLanguageContent(parsed.language).finally(publishLanguages)
  }
  // The parent pushes a template it has already fetched, so switching templates
  // costs one request for the whole row of frames rather than one per frame.
  if (parsed.type === 'preview-template') setStagedTemplatePreview(parsed.templateData)
}

onMounted(() => {
  warmV1StageChunks(stage.value)
  window.addEventListener('message', onFrameMessage)
  postFrameReadyToParent()
  loadShowcase()
    .then(() => (previewTemplateId.value ? applyTemplate(previewTemplateId.value) : undefined))
    .then(publishLanguages)
})

onUnmounted(() => {
  window.removeEventListener('message', onFrameMessage)
})
</script>

<style scoped>
/* Fills the iframe's own viewport; the host element is sized to the phone box
   it wants and scales this from the outside. Same contract as
   ShowcasePreviewFrameView — see the note there. */
.preview-frame-stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* Guest navigation chrome — inside a preview it only covers the invitation. */
.preview-frame-stage :deep(.floating-action-menu) {
  display: none !important;
}
</style>
