<template>
  <div
    class="preview-frame-stage"
    :class="{ 'preview-editable-mode': isEditable, 'preview-hints-on': isEditable && editHintsOn }"
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

// Persistent edit outlines. The inline-edit/edit-region affordances are
// hover-revealed, which means they simply don't exist on a touch device — so
// the parent (the mobile preview sheet) turns them on permanently there. Off
// by default so the desktop studio keeps its clean hover-to-reveal preview.
//
// The INITIAL value comes from the URL, not the bridge: a frame that mounts
// wanting hints on would otherwise depend on the parent's post arriving after
// this listener is attached but before the user looks at it. Toggling
// afterwards still goes over the bridge, so flipping it never reloads the
// frame.
const editHintsOn = ref(route.query.hints === '1')

const onFrameMessage = (msg: MessageEvent) => {
  const parsed = parsePreviewBridgeMessage(msg)
  if (!parsed) return
  if (parsed.type === 'replay') replayKey.value++
  if (parsed.type === 'refresh') refreshShowcaseData().then(loadPreviewTemplateFallback)
  if (parsed.type === 'preview-template') setStagedTemplatePreview(parsed.templateData)
  if (parsed.type === 'edit-hints-on') editHintsOn.value = true
  if (parsed.type === 'edit-hints-off') editHintsOn.value = false
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
  /* Fill the iframe's own viewport rather than a hardcoded phone box. Both
     callers already size the iframe *element* to the box they want, so this
     resolves to exactly that: 390x844 for the desktop studio's frames (which
     then scale the whole element down to fit their column), and the device's
     real viewport for the full-bleed mobile preview sheet. A fixed 390x844
     here left black bands down the right and bottom of any phone bigger than
     an iPhone 12 — the stage simply stopped before the iframe did.
     Viewport units, not 100%, so this doesn't depend on html/body/#app having
     a resolved height; nothing scrolls at document level in here (the
     showcase's own scroll container is nested inside), so there are no
     scrollbars for 100vw to overshoot. */
  width: 100vw;
  height: 100vh;
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

/* ---------------------------------------------------------------------------
   Hints mode: the edit affordances made permanent.
   InlineEditableText and EditableRegion reveal themselves on :hover, which
   simply never fires on a touch device — so the mobile preview sheet had no
   way to tell an editable part of the invitation from a decorative one. It
   asks for this mode over the bridge (edit-hints-on) or via ?hints=1.

   Defined here rather than in those two components because the
   `.preview-hints-on` hook is on THIS component's root, and :deep() is the
   only direction that compiles correctly — a child writing
   `:global(.preview-hints-on) .editable-region` gets its descendant compound
   silently dropped, leaving a bare `.preview-hints-on { ... }` that restyles
   this stage root instead. Specificity here is one class higher than each
   child's own rule (the scope attribute lands on `.preview-hints-on`), so
   these win without !important.
   --------------------------------------------------------------------------- */

/* Lighter than the hover outline on purpose: every editable region lights up
   at once, so it has to read as a hint, not a selection. */
.preview-hints-on :deep(.editable-region) {
  outline-color: rgba(30, 144, 255, 0.5);
}

/* Pencil only, no wording — N labelled badges at once would bury the
   invitation they annotate. Hovering one (a pointer device in hints mode)
   still expands it to the full label via the child's own hover rule. */
.preview-hints-on :deep(.editable-region__badge) {
  display: inline-flex;
  padding: 0.25rem;
}

.preview-hints-on :deep(.editable-region:not(:hover) .editable-region__badge-text) {
  display: none;
}

.preview-hints-on :deep(.inline-editable__display) {
  outline-color: rgba(30, 144, 255, 0.4);
}

/* The child only declares this ::after under :hover, so it's spelled out in
   full here rather than re-enabled. */
.preview-hints-on :deep(.inline-editable__display)::after {
  content: '✎';
  position: absolute;
  top: -0.4em;
  right: -0.2em;
  font-size: 0.7em;
  line-height: 1;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 0.22em;
  pointer-events: none;
}
</style>
