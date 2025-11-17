<template>
  <div class="absolute inset-0 z-10" :style="{ backgroundColor: primaryColor }">
    <!-- VideoContainer - stays visible for background -->
    <VideoContainer
      ref="videoContainerRef"
      :templateAssets="templateAssets"
      :templateColors="templateColors"
      :templateColor="templateColor"
      :eventTitle="eventTitle"
      :eventVideoUrl="eventVideoUrl"
      :backgroundVideoUrl="backgroundVideoUrl"
      :isCoverVideoPlaying="videoState.isCoverVideoPlaying.value"
      :currentVideoPhase="videoState.currentVideoPhase.value"
      :getMediaUrl="getMediaUrl"
      :isContentHidden="videoState.isContentHidden.value"
      @sequentialVideoEnded="videoState.handleSequentialVideoEnded"
      @sequentialVideoError="videoState.handleSequentialVideoError"
      @eventVideoPreloaded="videoState.handleEventVideoPreloaded"
      @eventVideoReady="videoState.handleEventVideoReady"
      @backgroundVideoPreloaded="videoState.handleBackgroundVideoPreloaded"
      @backgroundVideoReady="videoState.handleBackgroundVideoReady"
      @coverVideoLoaded="videoState.handleCoverVideoLoaded"
    />

    <!-- Cover Content Overlay (Stage 1) - Hidden when redirecting to main content -->
    <CoverContentOverlay
      v-if="videoState.currentVideoPhase.value === 'none' && !shouldSkipToMainContent"
      :isContentHidden="videoState.isContentHidden.value"
      :eventTitle="eventTitle"
      :eventLogo="eventLogo"
      :guestName="guestName || null"
      :templateAssets="templateAssets"
      :primaryColor="primaryColor"
      :secondaryColor="secondaryColor"
      :accentColor="accentColor"
      :backgroundColor="backgroundColor"
      :guestnameColor="guestnameColor"
      :templateColor="templateColor"
      :currentFont="currentFont"
      :primaryFont="primaryFont"
      :secondaryFont="secondaryFont"
      :eventTexts="eventTexts"
      :currentLanguage="currentLanguage"
      :shouldShowButtonLoading="videoState.shouldShowButtonLoading.value"
      :isInteractionDisabled="isEnvelopeInteractionDisabled"
      :getMediaUrl="getMediaUrl"
      :contentTopPosition="contentTopPosition"
      :coverTopDecoration="coverTopDecoration"
      :coverBottomDecoration="coverBottomDecoration"
      :coverLeftDecoration="coverLeftDecoration"
      :coverRightDecoration="coverRightDecoration"
      @openEnvelope="handleOpenEnvelope"
    />

    <!-- Main Content Overlay (Stage 3 - Background Video) -->
    <div
      v-if="videoState.currentVideoPhase.value === 'background' || shouldSkipToMainContent"
      class="absolute inset-0 z-20"
    >
      <!-- MainContentStage content will be inserted here -->
      <slot name="main-content"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import {
  useCoverStageVideo,
  type ShowcaseStage,
} from '../../composables/showcase/useCoverStageVideo'
import VideoContainer from './VideoContainer.vue'
import CoverContentOverlay from './CoverContentOverlay.vue'

export type DisplayMode = 'basic' | 'standard'

interface TemplateAssets {
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
  templateAssets?: TemplateAssets | null
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
  contentTopPosition?: number // Vertical position in vh units (0-100)
  coverTopDecoration?: string | null
  coverBottomDecoration?: string | null
  coverLeftDecoration?: string | null
  coverRightDecoration?: string | null
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

// Template refs for video elements
const videoContainerRef = ref<InstanceType<typeof VideoContainer> | null>(null)

// Compute display mode based on whether standard_cover_video exists
const displayMode = computed<DisplayMode>(() => {
  return props.templateAssets?.standard_cover_video ? 'standard' : 'basic'
})

// Disable envelope interaction in standard mode until event video is ready
const isEnvelopeInteractionDisabled = computed(() => {
  // In basic mode, never disable interaction (no video to wait for)
  if (displayMode.value === 'basic') {
    return false
  }

  // In standard mode, disable if there's an event video that's not ready yet
  if (props.eventVideoUrl && !videoState.eventVideoReady.value) {
    return true
  }

  return false
})

// Use the video management composable
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
    // Forward events from composable to parent
    ;(emit as any)(event, ...args)
  },
)

// Handle envelope opening - different behavior based on display mode
const handleOpenEnvelope = () => {
  // Always emit openEnvelope to ensure music starts playing
  emit('openEnvelope')

  if (displayMode.value === 'basic') {
    // In basic mode: skip videos, go directly to main content
    videoState.skipToMainContent()
  }
  // In standard mode: video will be started by parent component
}

// Initialize video state immediately
emit('coverStageReady')
videoState.initializeVideoState()

// Expose methods for parent component
const startEventVideo = () => {
  videoState.startEventVideo()
}

// Expose to parent via defineExpose
defineExpose({
  startEventVideo,
})

// Cleanup on component unmount
onUnmounted(() => {
  videoState.cleanupAllVideoResources()
})
</script>

<style scoped>
/* Import shared cover stage styles */
@import './cover-stage-styles.css';
</style>
