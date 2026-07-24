<template>
  <div
    class="preview-frame-stage"
    :class="{ 'preview-editable-mode': isEditable }"
    :style="{ backgroundColor: backgroundColor || primaryColor || '#000' }"
  >
    <LoadingSpinner v-if="loading" :primary-color="primaryColor" message="Loading event invitation..." />

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
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useEventShowcase, type TemplateAssets } from '@/composables/useEventShowcase'
import { eventTemplateService } from '@/services/api'
import { useShowcaseEditSaves } from '@/composables/showcase-preview/useShowcaseEditSaves'
import { InlineEditKey, EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import {
  parsePreviewBridgeMessage,
  postEditIntentToParent,
} from '@/components/showcase-preview/bridge/previewBridge'
import { resolvePreviewRenderer } from '@/components/showcase-preview/renderers/resolvePreviewRenderer'
import LoadingSpinner from '@/components/showcase/LoadingSpinner.vue'
import ErrorDisplay from '@/components/showcase/ErrorDisplay.vue'

const route = useRoute()

const stage = computed(() => {
  const raw = route.query.stage
  const value = Array.isArray(raw) ? raw[0] : raw
  return value || 'main'
})

// This shell owns the data load; the resolved renderer component receives the
// whole showcase state and renders one forced stage of it. There's no real
// guest link driving this preview, so useDefaultGuestName fills in a
// translated "Honored Guest" placeholder — otherwise the cover's invite text
// + guest name rows (gated on a truthy guestName) would render empty.
const showcase = useEventShowcase({ skipMetaTags: true, useDefaultGuestName: true })
const {
  loading,
  error,
  event,
  showcaseData,
  templateAssets,
  eventPhotos,
  primaryColor,
  backgroundColor,
  currentLanguage,
  loadShowcase,
  refreshShowcaseData,
  applyPreviewTemplateFallback,
  setStagedTemplatePreview,
} = showcase

const renderer = computed(() =>
  resolvePreviewRenderer({
    event: event.value,
    templateAssets: templateAssets.value,
    hasFeaturedPhoto: eventPhotos.value?.some((p) => p.is_featured) ?? false,
    canEdit: route.query.editable === '1',
  }),
)

// ---------------------------------------------------------------------------
// Edit contexts (only when the parent manage-page tab opens this frame with
// ?editable=1, i.e. the user can edit the event). Inline text saves go through
// the same services the management forms use (useShowcaseEditSaves); media
// edits post an intent to the parent tab, which opens the matching full-size
// editor there. The API enforces permissions server-side, so a hand-crafted
// editable=1 URL can't bypass anything.
// ---------------------------------------------------------------------------
const isEditable = computed(() => route.query.editable === '1')

if (route.query.editable === '1') {
  const { save } = useShowcaseEditSaves({ event, showcaseData, currentLanguage })
  provide(InlineEditKey, { save })
  provide(EditIntentKey, { requestEdit: postEditIntentToParent })
}

// Bridge commands from the parent tab: `replay` remounts the transition
// stage's animation; `refresh` refetches after a parent-side editor save —
// silently (no loading state), so the frame updates in place instead of
// flashing a spinner and replaying every mount animation.
const replayKey = ref(0)

const onFrameMessage = (msg: MessageEvent) => {
  const parsed = parsePreviewBridgeMessage(msg)
  if (!parsed) return
  if (parsed.type === 'replay') replayKey.value++
  if (parsed.type === 'refresh') refreshShowcaseData().then(loadPreviewTemplateFallback)
  if (parsed.type === 'preview-template') setStagedTemplatePreview(parsed.templateData)
}

// Preview-only fallback: ShowcasePreviewTab passes ?templateId=<id> whenever
// the event has a template selected at all — event_template_enabled isn't a
// reliable predictor of whether the showcase endpoint (loadShowcase above)
// will actually include template_assets (it can be true with no confirmed
// Payment row yet), so this checks the real response instead. Backfills from
// the public, no-auth template-assets endpoint so the owner can see their
// pending template's look before paying — a no-op once template_assets is
// already present (paid, or refreshShowcaseData got a real one back).
//
// Known gap: the public endpoint's `assets` doesn't include the border/frame
// decoration fields (top/bottom/left/right decoration, cover_*_decoration,
// guest_title_frame_*) — only the paid showcase endpoint returns those, so
// this preview won't show edge decorations until the backend serializer adds
// them to public_template_assets too.
const previewTemplateId = computed(() => {
  const raw = route.query.templateId
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = value ? Number(value) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
})

const loadPreviewTemplateFallback = async () => {
  if (!previewTemplateId.value || event.value?.template_assets) return
  try {
    const response = await eventTemplateService.getPublicTemplateAssets(previewTemplateId.value)
    // Wire shape is `{ template_data: {...} }`, not the flat TemplateAssets
    // the service's type declares (that type was never exercised before).
    const templateData = (response.data as unknown as { template_data?: TemplateAssets } | null)
      ?.template_data
    if (response.success && templateData) {
      applyPreviewTemplateFallback(templateData)
    }
  } catch {
    // Non-fatal — preview just renders without the pending template's look.
  }
}

onMounted(() => {
  window.addEventListener('message', onFrameMessage)
  loadShowcase().then(loadPreviewTemplateFallback)
})

onUnmounted(() => {
  window.removeEventListener('message', onFrameMessage)
})
</script>

<style scoped>
.preview-frame-stage {
  position: relative;
  width: 390px;
  height: 844px;
  overflow: hidden;
}

/* The showcase's floating action menu (language/music/map crescent) is guest
   navigation chrome — inside the preview frames (editable or read-only) it
   only obscures content, so hide it here rather than in the shared showcase
   components. */
.preview-frame-stage :deep(.floating-action-menu) {
  display: none !important;
}

/* Edit mode: the parent tab drops its click shield so inline text editing can
   receive real clicks/focus — so the live interactive elements inside the
   showcase (RSVP submit, comment form, payment/map/video links, music toggle,
   the open-envelope button) must be neutralized here instead. Inline-edit
   controls (.inline-edit-control) and explicitly whitelisted regions
   ([data-preview-safe], e.g. dress-code tabs needed to reach every record)
   stay clickable — as do the EditableRegion affordances (.edit-region-control)
   that request parent-side media editors.

   The safe-region exclusion lives INSIDE this rule's :not() (as a complex
   selector) rather than relying on the re-enable rule below outranking it:
   chained :not() classes raise this rule's specificity, and a previous
   :not(.edit-region-control) addition silently pushed it above the re-enable
   rule, killing every data-preview-safe region (dress-code + agenda day tabs)
   in edit mode. Keeping the exclusion here makes the whitelist order- and
   specificity-independent. */
.preview-editable-mode :deep(:is(a, button, input, textarea, select, iframe, [role='button'], audio, video):not(.inline-edit-control, .edit-region-control, [data-preview-safe] *)) {
  pointer-events: none !important;
}

/* Belt-and-braces reinforcement of the [data-preview-safe] whitelist */
.preview-editable-mode :deep([data-preview-safe] :is(a, button, input, select, [role='button'])) {
  pointer-events: auto !important;
}
</style>
