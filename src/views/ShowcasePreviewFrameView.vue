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
import { useEventShowcase } from '@/composables/useEventShowcase'
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
// whole showcase state and renders one forced stage of it.
const showcase = useEventShowcase({ skipMetaTags: true })
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
} = showcase

const renderer = computed(() =>
  resolvePreviewRenderer({
    event: event.value,
    templateAssets: templateAssets.value,
    hasFeaturedPhoto: eventPhotos.value?.some((p) => p.is_featured) ?? false,
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
  if (parsed.type === 'refresh') refreshShowcaseData()
}

onMounted(() => {
  loadShowcase()
  window.addEventListener('message', onFrameMessage)
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

/* Edit mode: the parent tab drops its click shield so inline text editing can
   receive real clicks/focus — so the live interactive elements inside the
   showcase (RSVP submit, comment form, payment/map/video links, music toggle,
   the open-envelope button) must be neutralized here instead. Inline-edit
   controls (.inline-edit-control) and explicitly whitelisted regions
   ([data-preview-safe], e.g. dress-code tabs needed to reach every record)
   stay clickable — as do the EditableRegion affordances (.edit-region-control)
   that request parent-side media editors. */
.preview-editable-mode :deep(:is(a, button, input, textarea, select, iframe, [role='button'], audio, video)):not(.inline-edit-control):not(.edit-region-control) {
  pointer-events: none !important;
}

.preview-editable-mode :deep([data-preview-safe] :is(a, button, input, select, [role='button'])) {
  pointer-events: auto !important;
}
</style>
