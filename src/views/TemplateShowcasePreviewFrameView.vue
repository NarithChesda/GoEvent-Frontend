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
 * One stage of a sample invitation, rendered against a chosen design.
 *
 * The sibling of ShowcasePreviewFrameView, and deliberately a separate route
 * rather than a flag on it: that one is an EVENT's preview — it takes the event
 * being managed and carries the whole inline-editing apparatus for the person
 * who owns it. This one belongs to nobody: the event it draws is one the
 * catalogue page chose on its behalf (`?eventId=`, and `preview-event` when the
 * choice changes), a real published invitation flagged for the job, and it is
 * fetched through the same public showcase endpoint a guest's link uses. With
 * no such event — none published for that category, or the flag not live yet —
 * it falls back to the bundled sample (see useTemplatePreviewShowcase.ts). That
 * is what lets it be embedded on the public partner page with nothing signed
 * in. Read-only by construction: no edit contexts are provided here, so there
 * is no `?editable=1` to hand-craft.
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
import { loadTemplatePreviewShowcase } from '@/composables/showcase-preview/useTemplatePreviewShowcase'
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

/**
 * One query value, first-wins on the repeated form. A frame's URL is frozen for
 * its whole lifetime — everything that varies afterwards travels over the
 * bridge — so reading it once, at setup, is enough.
 */
const routeParam = (name: string): string | null => {
  const raw = route.query[name]
  const value = Array.isArray(raw) ? raw[0] : raw
  return value ? String(value) : null
}

const stage = computed(() => routeParam('stage') || 'cover')

const previewTemplateId = computed(() => {
  const parsed = Number(routeParam('templateId'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
})

// The bundled sample's own id, used only while there is no real preview event
// to draw. Never fetched — it keys this instance's request de-duplication — but
// it must match the JSON so anything reading `event.id` (the comment section's
// own fetch, which simply comes back empty) sees one consistent event.
const DEMO_EVENT_ID = '11111111-2222-4333-8444-555555555555'

/**
 * The invitation on screen, chosen by the catalogue page.
 *
 * Seeded from the URL so a frame that mounts already knowing it paints the
 * right event without waiting for a message, and swapped in place afterwards
 * over the bridge — never by rewriting `src`, which would re-navigate the frame.
 */
const previewEventId = ref<string | null>(routeParam('eventId'))

const showcase = useEventShowcase({
  // A getter, because the id above changes when the catalogue moves to a design
  // of another category: request keys have to follow it.
  eventId: () => previewEventId.value ?? DEMO_EVENT_ID,
  skipMetaTags: true,
  useDefaultGuestName: true,
  dataSource: (language) => loadTemplatePreviewShowcase(previewEventId.value, language),
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
// `catalogue`: the visitor has no account and is being sold the design, which is
// what earns the footer's "Your Logo" slot here and nowhere else.
provide(PreviewFrameKey, 'catalogue')

const replayKey = ref(0)

/**
 * The design currently being previewed, kept because it has to survive an event
 * swap.
 *
 * Swapping the invitation reloads the showcase, and a reload replaces exactly
 * the fields a try-on overlays — so without re-applying it here the frame would
 * quietly fall back to whatever template that event really uses, which is not
 * the design the visitor clicked.
 */
const stagedTemplate = ref<TemplateAssets | null>(null)

/**
 * The template on screen, by id.
 *
 * Always staged, never merely filled in: `setStagedTemplatePreview` is the same
 * live try-on the templates modal uses, and it swaps assets, colours and fonts
 * in place without reloading the frame. Reloading would mean a new iframe
 * navigation per click on the template menu.
 *
 * The plain `applyPreviewTemplateFallback` was wrong here even for an event
 * carrying no template of its own: it leaves the composable with no record that
 * a design is being tried on, and every later fetch — the language switch above
 * all — then answers with that event's own template and overwrites it.
 */
const applyTemplate = async (templateId: number) => {
  try {
    const response = await eventTemplateService.getPublicTemplateAssets(templateId)
    // Wire shape is `{ template_data: {...} }`, not the flat TemplateAssets the
    // service's type declares — same as the manage-page frame's fallback.
    const templateData = (response.data as unknown as { template_data?: TemplateAssets } | null)
      ?.template_data
    if (!response.success || !templateData) return
    stagedTemplate.value = templateData
    setStagedTemplatePreview(templateData)
  } catch {
    // Non-fatal — the invitation renders in the showcase's own default look.
  }
}

/** Only this frame knows which languages this invitation carries. See the bridge. */
const publishLanguages = () => {
  postShowcaseLanguagesToParent(
    availableLanguages.value.map((lang) => lang.language),
    currentLanguage.value,
  )
}

/**
 * Draw a different invitation, in place.
 *
 * A full `loadShowcase` rather than the silent refresh: this is another event
 * entirely — its own photographs, hosts and stages — and the stage machinery has
 * to be initialised for it. The language is passed explicitly, because without a
 * forced one the load falls back to the `lang` frozen into this frame's URL and
 * would undo a language the visitor has switched to since.
 */
const swapPreviewEvent = async (eventId: string | null) => {
  if (eventId === previewEventId.value) return
  previewEventId.value = eventId
  await loadShowcase(currentLanguage.value)
  if (stagedTemplate.value) setStagedTemplatePreview(stagedTemplate.value)
  publishLanguages()
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
  if (parsed.type === 'preview-template') {
    stagedTemplate.value = parsed.templateData
    setStagedTemplatePreview(parsed.templateData)
  }
  // A design of another category is being previewed, so the invitation under it
  // changes too — the page picks the event, every frame is told the same one.
  if (parsed.type === 'preview-event') void swapPreviewEvent(parsed.eventId)
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
