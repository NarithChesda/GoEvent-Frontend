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
      :keep-decoration-background="keepDecorationBackground"
      :skip-decoration-slide-up="skipDecorationSlideUp"
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
      :ambient-creatures="props.ambientCreatures"
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
import type { CoverStageLayout, AmbientCreaturesConfig } from '@/services/api/types/template.types'
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
  /** Showcase animation type from template_assets.showcase_animation_type */
  animationType?: ShowcaseAnimationType
  /** Ambient creature effect config from template_assets. Only renders when provided. */
  ambientCreatures?: AmbientCreaturesConfig | null
  /** When true, basic mode will only animate decorations out without transitioning to main content */
  useTransitionStage?: boolean
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

// Animation type from prop with fallback to 'decoration'
const animationType = computed<ShowcaseAnimationType>(() => {
  return props.animationType || 'decoration'
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
  animationType,
  currentVideoPhase: videoState.currentVideoPhase,
})

// Keep decoration photo background during transition stage
const keepDecorationBackground = computed(() => {
  return props.useTransitionStage && props.currentShowcaseStage === 'transition'
})

// Skip slide-up animation for decoration photo when using transition stage
// (after transition completes, hide instantly instead of sliding up)
const skipDecorationSlideUp = computed(() => {
  return props.useTransitionStage === true
})

// Computed visibility flags
const shouldShowCoverContent = computed(() => {
  // During door animation, keep cover content (including door panels) visible
  // so the CSS 3D rotation transition can complete, regardless of showcase stage.
  // The doors are at z-28 and will visually hide main content at z-20 behind them.
  if (isDoorAnimation.value && isDoorAnimationInProgress.value) return true
  // Hide cover once the main content stage is active
  if (props.currentShowcaseStage === 'main_content') return false
  return (videoState.currentVideoPhase.value === 'none' || isDoorAnimationInProgress.value)
    && !props.shouldSkipToMainContent
})

const shouldShowMainContent = computed(() => {
  // Always show main content when stage has already transitioned
  if (props.currentShowcaseStage === 'main_content') return true
  // When transition stage is responsible for revealing main content, don't render
  // main content during the door animation — TransitionStage sits at z-35 above
  // CoverStage (z-10) but starts transparent, so rendering main content here would
  // show through it as the door opens.
  if (props.useTransitionStage && isDoorAnimationInProgress.value) return false
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

// Handle envelope opening - different behavior based on display mode and animation type
const handleOpenEnvelope = () => {
  emit('openEnvelope')

  if (isDoorAnimation.value) {
    // Door animation: set content hidden to trigger door opening animation
    videoState.isContentHidden.value = true
    startDoorAnimation()

    if (displayMode.value === 'basic') {
      if (!props.useTransitionStage) {
        videoState.skipToMainContent()
      }
    } else {
      clearAfterTimeout()
    }
  } else {
    // Decoration animation behavior differs by display mode
    if (displayMode.value === 'basic') {
      // Basic mode: set content hidden immediately to animate decorations out
      videoState.isContentHidden.value = true

      // When using transition stage, only animate decorations out
      // Do NOT skip to main content — the transition stage handles timing
      if (!props.useTransitionStage) {
        videoState.skipToMainContent()
      }
    }
    // Standard mode: DO NOT set isContentHidden here!
    // The video will be started by parent via startEventVideo(), and
    // isContentHidden will be set AFTER the video starts playing
    // to ensure smooth animation with no visual gap
  }
}

// Expose methods for parent component
const startEventVideo = () => {
  videoState.startEventVideo()
}

// Reveal main content (used after transition stage completes)
const revealMainContent = () => {
  videoState.skipToMainContent()
}

defineExpose({
  startEventVideo,
  revealMainContent,
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
