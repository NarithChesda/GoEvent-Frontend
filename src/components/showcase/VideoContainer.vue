<template>
  <div class="absolute inset-0">
    <!-- Sequential Video Container - plays all videos in order -->
    <video
      ref="sequentialVideoContainer"
      class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none desktop-video-sizing"
      style="z-index: -10"
      data-video-type="sequential"
      muted
      playsinline
      preload="auto"
      @ended="$emit('sequentialVideoEnded')"
      @error="$emit('sequentialVideoError')"
    />

    <!-- Hidden Event Video Preloader - stays visible as background while background video loads -->
    <video
      v-if="eventVideoUrl"
      ref="eventVideoPreloader"
      muted
      playsinline
      preload="none"
      class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none desktop-video-sizing"
      style="z-index: 5"
      data-video-type="event"
      @loadeddata="$emit('eventVideoPreloaded')"
      @canplaythrough="$emit('eventVideoReady')"
      @ended="$emit('sequentialVideoEnded')"
      @error="$emit('sequentialVideoError')"
    />

    <!-- Background Video Element - will replace event video when ready -->
    <video
      v-if="backgroundVideoUrl"
      ref="backgroundVideoElement"
      muted
      loop
      playsinline
      preload="none"
      class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none desktop-video-sizing"
      style="z-index: 4"
      data-video-type="background"
      @loadeddata="$emit('backgroundVideoPreloaded')"
      @canplaythrough="$emit('backgroundVideoReady')"
      @playing="handleBackgroundVideoPlaying"
    />

    <!-- Standard Cover Video Loop - Only show when not in event/background phase -->
    <video
      v-if="templateAssets?.standard_cover_video && isCoverVideoPlaying"
      ref="coverVideoElement"
      :src="getMediaUrl(templateAssets.standard_cover_video)"
      autoplay
      loop
      muted
      playsinline
      class="absolute inset-0 w-full h-full desktop-video-sizing"
      data-video-type="cover"
      style="z-index: -1"
      @loadeddata="$emit('coverVideoLoaded')"
    />

    <!-- Fallback Background Image -->
    <div
      v-if="
        templateAssets?.basic_background_photo &&
        isCoverVideoPlaying &&
        !templateAssets?.standard_cover_video
      "
      class="absolute inset-0"
      style="z-index: -1"
    >
      <img
        :src="getMediaUrl(templateAssets.basic_background_photo)"
        alt="Background"
        class="w-full h-full object-cover"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface TemplateAssets {
  standard_cover_video?: string
  basic_background_photo?: string
}

interface Props {
  templateAssets?: TemplateAssets | null
  eventTitle: string
  eventVideoUrl?: string | null
  backgroundVideoUrl?: string | null
  isCoverVideoPlaying: boolean
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sequentialVideoEnded: []
  sequentialVideoError: []
  eventVideoLoadStarted: []
  eventVideoPreloaded: []
  eventVideoReady: []
  backgroundVideoLoadStarted: []
  backgroundVideoPreloaded: []
  backgroundVideoReady: []
  backgroundVideoPlaying: []
  coverVideoLoaded: []
}>()

// Template refs for video elements
const sequentialVideoContainer = ref<HTMLVideoElement | null>(null)
const eventVideoPreloader = ref<HTMLVideoElement | null>(null)
const backgroundVideoElement = ref<HTMLVideoElement | null>(null)
const coverVideoElement = ref<HTMLVideoElement | null>(null)

// Handle background video playing event to ensure visibility and notify parent
const handleBackgroundVideoPlaying = () => {
  if (backgroundVideoElement.value) {
    // Ensure the video is visible when it starts playing
    backgroundVideoElement.value.style.opacity = '1'
    backgroundVideoElement.value.style.zIndex = '5' // Same level as event video to replace it
  }
  // Emit event to parent so it can change the video phase and show main content
  emit('backgroundVideoPlaying')
}

// Expose refs to parent component
defineExpose({
  sequentialVideoContainer,
  eventVideoPreloader,
  backgroundVideoElement,
  coverVideoElement,
})
</script>

<style scoped>
/* Responsive video sizing */
.desktop-video-sizing {
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  object-position: center;
}

/* Mobile devices - stretch height, crop width, center video */
@media (max-width: 768px) {
  .desktop-video-sizing {
    width: 100% !important;
    height: 100vh !important;
    object-fit: cover !important;
    object-position: center center !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    transform: none !important;
  }
}

/* Desktop and tablet landscape - consistent desktop treatment with 100% height */
@media (min-width: 769px) {
  .desktop-video-sizing {
    width: 100%;
    object-fit: contain;
  }
}
</style>
