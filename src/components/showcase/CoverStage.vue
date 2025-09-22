<template>
  <div class="absolute inset-0 z-10" :style="{ backgroundColor: primaryColor }">
    <VideoContainer
      ref="videoContainerRef"
      :templateAssets="templateAssets"
      :eventTitle="eventTitle"
      :eventVideoUrl="eventVideoUrl"
      :backgroundVideoUrl="backgroundVideoUrl"
      :isCoverVideoPlaying="videoState.isCoverVideoPlaying.value"
      :getMediaUrl="getMediaUrl"
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
      :currentFont="currentFont"
      :primaryFont="primaryFont"
      :secondaryFont="secondaryFont"
      :eventTexts="eventTexts"
      :currentLanguage="currentLanguage"
      :shouldShowButtonLoading="videoState.shouldShowButtonLoading.value"
      :getMediaUrl="getMediaUrl"
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
import { ref, onUnmounted } from 'vue'
import {
  useCoverStageVideo,
  type ShowcaseStage,
} from '../../composables/showcase/useCoverStageVideo'
import VideoContainer from './VideoContainer.vue'
import CoverContentOverlay from './CoverContentOverlay.vue'

interface TemplateAssets {
  standard_cover_video?: string
  basic_background_photo?: string
  open_envelope_button?: string
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  templateAssets?: TemplateAssets | null
  guestName: string
  eventTitle: string
  eventLogo?: string | null
  eventVideoUrl?: string | null
  backgroundVideoUrl?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
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
  },
  (event, ...args) => {
    // Forward events from composable to parent
    ;(emit as any)(event, ...args)
  },
)

// Handle envelope opening - emit to parent first, parent will handle music and then trigger video
const handleOpenEnvelope = () => {
  emit('openEnvelope')
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
