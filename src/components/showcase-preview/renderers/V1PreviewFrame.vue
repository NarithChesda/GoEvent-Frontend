<template>
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
    :disable-envelope-interaction="true"
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
    :key="replayKey"
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

  <PhotoModal
    :is-open="isPhotoModalOpen"
    :photos="eventPhotos"
    :current-photo="currentModalPhoto"
    :get-media-url="getMediaUrl"
    @close="closePhotoModal"
    @navigate="navigateToPhoto"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { useEventShowcase } from '@/composables/useEventShowcase'
import { isBasicWeddingShowcase } from './resolvePreviewRenderer'
import CoverStage from '@/components/showcase/CoverStage.vue'
import TransitionStage from '@/components/showcase/TransitionStage.vue'
import MainContentStage from '@/components/showcase/MainContentStage.vue'
import PhotoModal from '@/components/showcase/PhotoModal.vue'

interface Props {
  /** The frame shell's loaded showcase state — shared, not refetched here. */
  showcase: ReturnType<typeof useEventShowcase>
  /** Which of this renderer's declared frames to show (see the registry). */
  stage: string
  /** Bumped by the shell on a bridge `replay` command — remounts the
   *  transition stage so its whole mount animation runs again. */
  replayKey: number
}

const props = defineProps<Props>()

// Top-level refs so the template unwraps them like production does.
const {
  event,
  templateAssets,
  templateColors,
  eventTexts,
  hosts,
  agendaItems,
  eventPhotos,
  paymentMethods,
  dressCodes,
  guestName,
  guestShortcode,
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
  getMediaUrl,
  openGoogleMap,
  openPhotoModal,
  closePhotoModal,
  navigateToPhoto,
  changeLanguage,
  toggleMusic,
} = props.showcase

// Same template-capability check EventShowcaseRefactored.vue uses — tells
// CoverStage whether the basic-mode decoration background should persist.
const isBasicWedding = computed(() =>
  isBasicWeddingShowcase({
    event: event.value,
    templateAssets: templateAssets.value,
    hasFeaturedPhoto: false,
  }),
)
</script>
