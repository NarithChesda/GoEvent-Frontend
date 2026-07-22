<template>
  <div
    class="preview-frame-stage"
    :class="{ 'preview-editable-mode': isEditable }"
    :style="{ backgroundColor: backgroundColor || primaryColor || '#000' }"
  >
    <LoadingSpinner v-if="loading" :primary-color="primaryColor" message="Loading event invitation..." />

    <ErrorDisplay v-else-if="error" :message="error" :show-retry="true" @retry="loadShowcase" />

    <template v-else-if="event.id">
      <!-- Cover and Main Content both render through CoverStage, exactly like
           production (EventShowcaseRefactored.vue) — MainContentStage has no
           background of its own, it's visually layered on top of CoverStage's
           VideoContainer (rendered unconditionally inside CoverStage). Mounting
           MainContentStage standalone silently drops that background. Forcing
           current-showcase-stage picks which layer is visible, bypassing the
           redirect manager's "already seen main content" heuristic. -->
      <CoverStage
        v-if="stage === 'cover' || stage === 'main'"
        :template-assets="templateAssets"
        :template-colors="templateColors"
        :guest-name="guestName"
        :event-title="event.title"
        :event-logo="event.logo_one"
        :first-host-image="hosts[0]?.profile_image || null"
        :first-host-name="hosts[0]?.name || ''"
        :event-video-url="eventVideoUrl"
        :background-video-url="backgroundVideoUrl"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :background-color="backgroundColor"
        :guestname-color="guestnameColor"
        :template-color="templateColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :current-showcase-stage="stage === 'main' ? 'main_content' : 'cover'"
        :should-skip-to-main-content="false"
        :content-top-position="event.template_assets?.cover_content_top_position"
        :cover-stage-layout="event.template_assets?.cover_stage_layout"
        :cover-top-decoration="event.template_assets?.assets?.cover_top_decoration"
        :cover-bottom-decoration="event.template_assets?.assets?.cover_bottom_decoration"
        :cover-left-decoration="event.template_assets?.assets?.cover_left_decoration"
        :cover-right-decoration="event.template_assets?.assets?.cover_right_decoration"
        :animation-type="event.template_assets?.cover_stage_layout?.showcaseAnimationType"
        :use-transition-stage="isBasicWedding"
        :get-media-url="getMediaUrl"
      >
        <template #main-content>
          <MainContentStage
            v-if="stage === 'main'"
            :template-assets="templateAssets"
            :event="event"
            :event-texts="eventTexts"
            :hosts="hosts"
            :agenda-items="agendaItems"
            :event-photos="eventPhotos"
            :payment-methods="paymentMethods"
            :dress-codes="dressCodes"
            :primary-color="primaryColor"
            :secondary-color="secondaryColor"
            :accent-color="accentColor"
            :background-color="backgroundColor"
            :template-color="templateColor"
            :current-font="currentFont"
            :primary-font="primaryFont"
            :secondary-font="secondaryFont"
            :is-event-past="isEventPast"
            :get-media-url="getMediaUrl"
            :available-languages="availableLanguages"
            :current-language="currentLanguage"
            :guest-name="guestName"
            :guest-shortcode="guestShortcode"
            :is-music-playing="isMusicPlaying"
            :content-loading="contentLoading"
            :top-decoration="event.template_assets?.assets?.top_decoration || event.top_decoration"
            :bottom-decoration="event.template_assets?.assets?.bottom_decoration || event.bottom_decoration"
            :left-decoration="event.template_assets?.assets?.left_decoration || event.left_decoration"
            :right-decoration="event.template_assets?.assets?.right_decoration || event.right_decoration"
            :animation-type="event.template_assets?.cover_stage_layout?.showcaseAnimationType"
            :main-stage-layout="event.template_assets?.cover_stage_layout"
            :falling-effect="event.template_assets?.falling_effect"
            :event-details-design="event.template_assets?.event_details_design"
            :host-info-design="event.template_assets?.host_info_design"
            @open-map="openGoogleMap"
            @open-photo="openPhotoModal"
            @change-language="changeLanguage"
            @music-toggle="toggleMusic"
          />
        </template>
      </CoverStage>

      <TransitionStage
        v-else-if="stage === 'transition'"
        :key="transitionReplayKey"
        :freeze-at-peak="true"
        :event-title="event.title"
        :event-logo="event.logo_one"
        :event-photos="eventPhotos"
        :event-start-date="event.start_date"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :background-color="backgroundColor"
        :blur-effect-color="blurEffectColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :get-media-url="getMediaUrl"
        :animation-type="event.template_assets?.cover_stage_layout?.showcaseAnimationType"
      />
    </template>

    <PhotoModal
      :is-open="isPhotoModalOpen"
      :photos="eventPhotos"
      :current-photo="currentModalPhoto"
      :get-media-url="getMediaUrl"
      @close="closePhotoModal"
      @navigate="navigateToPhoto"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useEventShowcase } from '@/composables/useEventShowcase'
import {
  InlineEditKey,
  type InlineEditTarget,
} from '@/components/showcase-preview/inlineEditContext'
import { eventTextsService, agendaService, hostsService, dressCodeService } from '@/services/api'
import CoverStage from '@/components/showcase/CoverStage.vue'
import TransitionStage from '@/components/showcase/TransitionStage.vue'
import MainContentStage from '@/components/showcase/MainContentStage.vue'
import PhotoModal from '@/components/showcase/PhotoModal.vue'
import LoadingSpinner from '@/components/showcase/LoadingSpinner.vue'
import ErrorDisplay from '@/components/showcase/ErrorDisplay.vue'

const route = useRoute()

const stage = computed(() => {
  const raw = route.query.stage
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === 'cover' || value === 'transition' ? value : 'main'
})

const {
  loading,
  error,
  event,
  showcaseData,
  guestName,
  guestShortcode,
  templateAssets,
  templateColors,
  eventTexts,
  hosts,
  agendaItems,
  eventPhotos,
  paymentMethods,
  dressCodes,
  primaryColor,
  secondaryColor,
  accentColor,
  backgroundColor,
  guestnameColor,
  templateColor,
  blurEffectColor,
  currentFont,
  primaryFont,
  secondaryFont,
  isEventPast,
  eventVideoUrl,
  backgroundVideoUrl,
  availableLanguages,
  currentLanguage,
  contentLoading,
  isMusicPlaying,
  isPhotoModalOpen,
  currentModalPhoto,
  loadShowcase,
  getMediaUrl,
  openGoogleMap,
  openPhotoModal,
  closePhotoModal,
  navigateToPhoto,
  changeLanguage,
  toggleMusic,
} = useEventShowcase({ skipMetaTags: true })

// Mirrors EventShowcaseRefactored.vue's isBasicWedding — a template-capability
// check, only used here to tell CoverStage whether basic-mode decoration
// background should persist (useTransitionStage prop).
const isBasicWedding = computed(() => {
  if (!templateAssets.value) return false
  const isBasicMode = !templateAssets.value.standard_cover_video
  const categoryName = (
    event.value.category_details?.name || event.value.category_name || ''
  ).toLowerCase()
  return isBasicMode && categoryName === 'wedding'
})

// ---------------------------------------------------------------------------
// Inline editing (only when the parent manage-page tab opens this frame with
// ?editable=1, i.e. the user can edit the event). Saves go through the same
// services the management forms use; on success the local showcase data is
// mutated in place so the preview updates live without a refetch. The API
// enforces permissions server-side, so a hand-crafted editable=1 URL can't
// bypass anything.
// ---------------------------------------------------------------------------
const isEditable = computed(() => route.query.editable === '1')

const saveEventText = async (
  target: Extract<InlineEditTarget, { kind: 'eventText' }>,
  value: string,
) => {
  const eventId = event.value.id
  const language = currentLanguage.value
  const texts = showcaseData.value?.event.event_texts ?? []
  const existing = texts.find(
    (t) => t.text_type === target.textType && t.language === language,
  )

  if (existing) {
    const otherField = target.field === 'title' ? existing.content : existing.title
    if (!value && !otherField) {
      const res = await eventTextsService.deleteEventText(eventId, existing.id)
      if (res.success) texts.splice(texts.indexOf(existing), 1)
      return res
    }
    const res = await eventTextsService.patchEventText(eventId, existing.id, {
      [target.field]: value,
    })
    if (res.success) existing[target.field] = value
    return res
  }

  if (!value) return { success: true }
  const res = await eventTextsService.createEventText(eventId, {
    text_type: target.textType,
    language,
    title: target.field === 'title' ? value : '',
    content: target.field === 'content' ? value : '',
    is_active: true,
  })
  if (res.success && res.data) texts.push(res.data)
  return res
}

const handleInlineSave = async (target: InlineEditTarget, value: string) => {
  const eventId = event.value.id
  if (!eventId) return { success: false, message: 'Event not loaded' }

  try {
    switch (target.kind) {
      case 'eventText':
        return await saveEventText(target, value)
      case 'host': {
        const res = await hostsService.patchHost(eventId, target.hostId, {
          [target.field]: value,
        })
        const host = showcaseData.value?.event.hosts?.find((h) => h.id === target.hostId)
        if (res.success && host) host[target.field] = value
        return res
      }
      case 'agenda': {
        const res = await agendaService.patchAgendaItem(eventId, target.agendaId, {
          title: value,
        })
        const item = showcaseData.value?.event.agenda_items?.find(
          (a) => a.id === target.agendaId,
        )
        if (res.success && item) item.title = value
        return res
      }
      case 'dressCode': {
        const res = await dressCodeService.updateDressCode(eventId, target.dressCodeId, {
          [target.field]: value,
        })
        const code = showcaseData.value?.event.dress_codes?.find(
          (d) => d.id === target.dressCodeId,
        )
        if (res.success && code) code[target.field] = value
        return res
      }
    }
  } catch (err) {
    console.warn('Inline edit save failed:', err)
    return { success: false, message: err instanceof Error ? err.message : 'Save failed' }
  }
}

if (route.query.editable === '1') {
  provide(InlineEditKey, { save: handleInlineSave })
}

// Transition replay: the parent tab's click shield posts a same-origin message
// (see InertIframe.vue's clickMessage prop); bumping the key remounts
// TransitionStage, replaying its whole mount-driven animation timeline.
const transitionReplayKey = ref(0)

const onFrameMessage = (msg: MessageEvent) => {
  if (msg.origin !== window.location.origin) return
  if ((msg.data as { type?: string } | null)?.type === 'showcase-preview-replay') {
    transitionReplayKey.value++
  }
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
   stay clickable. */
.preview-editable-mode :deep(:is(a, button, input, textarea, select, iframe, [role='button'], audio, video)):not(.inline-edit-control) {
  pointer-events: none !important;
}

.preview-editable-mode :deep([data-preview-safe] :is(a, button, input, select, [role='button'])) {
  pointer-events: auto !important;
}
</style>
