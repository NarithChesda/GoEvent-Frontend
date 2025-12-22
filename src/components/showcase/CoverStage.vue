<template>
  <div
    class="absolute inset-0 z-10 transition-opacity duration-700 ease-out"
    :class="{ 'opacity-0': shouldSkipToMainContent }"
    :style="{ backgroundColor: primaryColor }"
  >
    <!-- VideoContainer - stays visible for background -->
    <VideoContainer
      ref="videoContainerRef"
      :template-assets="templateAssets"
      :template-colors="templateColors"
      :template-color="templateColor"
      :event-title="eventTitle"
      :event-video-url="eventVideoUrl"
      :background-video-url="backgroundVideoUrl"
      :is-cover-video-playing="videoState.isCoverVideoPlaying.value"
      :current-video-phase="videoState.currentVideoPhase.value"
      :get-media-url="getMediaUrl"
      :is-content-hidden="videoState.isContentHidden.value"
      :animation-type="animationType"
      @sequential-video-ended="videoState.handleSequentialVideoEnded"
      @sequential-video-error="videoState.handleSequentialVideoError"
      @event-video-preloaded="videoState.handleEventVideoPreloaded"
      @event-video-ready="videoState.handleEventVideoReady"
      @background-video-preloaded="videoState.handleBackgroundVideoPreloaded"
      @background-video-ready="videoState.handleBackgroundVideoReady"
      @cover-video-loaded="videoState.handleCoverVideoLoaded"
    />

    <!-- Cover Content Overlay (Stage 1) -->
    <CoverContentOverlay
      v-if="shouldShowCoverContent"
      :is-content-hidden="videoState.isContentHidden.value"
      :event-title="eventTitle"
      :event-logo="eventLogo"
      :guest-name="guestName || null"
      :template-assets="templateAssets"
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
      :should-show-button-loading="videoState.shouldShowButtonLoading.value"
      :is-interaction-disabled="isEnvelopeInteractionDisabled"
      :get-media-url="getMediaUrl"
      :content-top-position="contentTopPosition"
      :cover-stage-layout="coverStageLayout"
      :cover-top-decoration="coverTopDecoration"
      :cover-bottom-decoration="coverBottomDecoration"
      :cover-left-decoration="coverLeftDecoration"
      :cover-right-decoration="coverRightDecoration"
      :animation-type="animationType"
      @open-envelope="handleOpenEnvelope"
    />

    <!-- Main Content Overlay (Stage 3 - Background Video) -->
    <div
      v-if="shouldShowMainContent"
      class="absolute inset-0 z-20"
    >
      <slot name="main-content"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useCoverStageVideo, type ShowcaseStage } from '@/composables/showcase/useCoverStageVideo'
import { useDoorAnimation } from '@/composables/showcase/useDoorAnimation'
import type { CoverStageLayout } from '@/services/api/types/template.types'
import type { ShowcaseAnimationType } from '@/composables/showcase/useShowcaseAnimation'
import VideoContainer from './VideoContainer.vue'
import CoverContentOverlay from './CoverContentOverlay.vue'

export type DisplayMode = 'basic' | 'standard'

// Local interface for template assets used by this component
interface CoverStageTemplateAssets {
  standard_cover_video?: string
  basic_background_photo?: string
  basic_decoration_photo?: string
  open_envelope_button?: string
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface TemplateColor {
  id?: number
  hex_color_code?: string
  hex_code?: string
  name?: string
}

interface Props {
  templateAssets?: CoverStageTemplateAssets | null
  templateColors?: TemplateColor[] | null
  guestName: string
  eventTitle: string
  eventLogo?: string | null
  eventVideoUrl?: string | null
  backgroundVideoUrl?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  guestnameColor?: string | null
  templateColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  isEnvelopeButtonReady?: boolean
  currentShowcaseStage?: ShowcaseStage
  shouldSkipToMainContent?: boolean
  videoStatePreserved?: boolean
  getMediaUrl: (url: string) => string
  /** @deprecated Use coverStageLayout.contentTopPosition instead */
  contentTopPosition?: number
  coverStageLayout?: CoverStageLayout
  coverTopDecoration?: string | null
  coverBottomDecoration?: string | null
  coverLeftDecoration?: string | null
  coverRightDecoration?: string | null
  animationType?: ShowcaseAnimationType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openEnvelope: []
  coverStageReady: []
  eventVideoLoadStarted: []
  eventVideoPreloaded: []
  eventVideoReady: []
  backgroundVideoLoadStarted: []
  sequentialVideoReady: []
  sequentialVideoEnded: []
  playEventVideo: []
  playBackgroundVideo: []
}>()

// Template ref for video container
const videoContainerRef = ref<InstanceType<typeof VideoContainer> | null>(null)

// Display mode based on whether standard_cover_video exists
const displayMode = computed<DisplayMode>(() => {
  return props.templateAssets?.standard_cover_video ? 'standard' : 'basic'
})

// Video state management composable
const videoState = useCoverStageVideo(
  {
    eventVideoPreloader: () => videoContainerRef.value?.eventVideoPreloader || null,
    sequentialVideoContainer: () => videoContainerRef.value?.sequentialVideoContainer || null,
    coverVideoElement: () => videoContainerRef.value?.coverVideoElement || null,
    backgroundVideoElement: () => videoContainerRef.value?.backgroundVideoElement || null,
  },
  {
    eventVideoUrl: props.eventVideoUrl,
    backgroundVideoUrl: props.backgroundVideoUrl,
    currentShowcaseStage: props.currentShowcaseStage,
    shouldSkipToMainContent: props.shouldSkipToMainContent,
    videoStatePreserved: props.videoStatePreserved,
    templateAssets: props.templateAssets,
    displayMode: displayMode.value,
  },
  (event, ...args) => {
    (emit as any)(event, ...args)
  },
)

// Door animation state management
const { isDoorAnimation, isDoorAnimationInProgress, startDoorAnimation, clearAfterTimeout } = useDoorAnimation({
  animationType: computed(() => props.animationType),
  currentVideoPhase: videoState.currentVideoPhase,
})

// Computed visibility flags
const shouldShowCoverContent = computed(() => {
  return (videoState.currentVideoPhase.value === 'none' || isDoorAnimationInProgress.value)
    && !props.shouldSkipToMainContent
})

const shouldShowMainContent = computed(() => {
  return videoState.currentVideoPhase.value === 'background'
    || props.shouldSkipToMainContent
    || isDoorAnimationInProgress.value
})

// Disable envelope interaction in standard mode until event video is ready
const isEnvelopeInteractionDisabled = computed(() => {
  if (displayMode.value === 'basic') {
    return false
  }
  return props.eventVideoUrl ? !videoState.eventVideoReady.value : false
})

// Handle envelope opening - different behavior based on display mode
const handleOpenEnvelope = () => {
  emit('openEnvelope')

  if (isDoorAnimation.value) {
    videoState.isContentHidden.value = true
    startDoorAnimation()

    if (displayMode.value === 'basic') {
      videoState.skipToMainContent()
    } else {
      clearAfterTimeout()
    }
  } else if (displayMode.value === 'basic') {
    videoState.skipToMainContent()
  }
}

// Expose methods for parent component
const startEventVideo = () => {
  videoState.startEventVideo()
}

defineExpose({
  startEventVideo,
})

// Initialize video state and notify parent
emit('coverStageReady')
videoState.initializeVideoState()

// Cleanup on unmount
onUnmounted(() => {
  videoState.cleanupAllVideoResources()
})
</script>

<style scoped>
@import './cover-stage-styles.css';
</style>
