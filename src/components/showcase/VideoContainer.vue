<template>
  <div class="absolute inset-0">
    <!-- Sequential Video Container - plays all videos in order -->
    <video
      ref="sequentialVideoContainer"
      v-bind="videoProtectionAttrs"
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
      v-bind="videoProtectionAttrs"
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
      v-bind="videoProtectionAttrs"
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

    <!-- COVER STAGE BACKGROUND (when decoration is visible, i.e., NOT isContentHidden) -->
    <!-- Background Color Layer for Cover Stage - templateColor or white fallback -->
    <div
      v-if="!isContentHidden && !templateAssets?.standard_cover_video"
      class="absolute inset-0"
      :style="{ backgroundColor: decorationBackgroundColor, zIndex: -2 }"
    />

    <!-- Decoration Photo (optimized via ImageKit) - Shows in Cover Stage, swipes up to reveal main content -->
    <!-- For door animation: don't apply swipe-up, just hide instantly when content is hidden -->
    <div
      v-if="optimizedDecorationPhotoUrl && !templateAssets?.standard_cover_video"
      class="absolute inset-0 transition-all duration-700 ease-out"
      :class="{ 'swipe-up-hidden': isContentHidden && isDecorationAnimation }"
      :style="{ zIndex: 0, opacity: isContentHidden && !isDecorationAnimation ? 0 : 1 }"
    >
      <img
        :src="optimizedDecorationPhotoUrl"
        alt="Decoration"
        class="w-full h-full object-cover"
        loading="eager"
        v-bind="protectionAttrs"
      />
    </div>

    <!-- MAIN CONTENT STAGE BACKGROUND (when decoration is hidden, i.e., isContentHidden) -->
    <!-- Background Photo Layer (optimized via ImageKit) for Main Content Stage -->
    <div
      v-if="isContentHidden && optimizedBackgroundPhotoUrl && !templateAssets?.standard_cover_video"
      class="absolute inset-0"
      style="z-index: -1"
    >
      <img
        :src="optimizedBackgroundPhotoUrl"
        alt="Background"
        class="w-full h-full object-cover"
        loading="eager"
        v-bind="protectionAttrs"
      />
    </div>

    <!-- Fallback 1: Template Color for Main Content Stage when no background photo -->
    <div
      v-if="isContentHidden && !optimizedBackgroundPhotoUrl && templateColor && !templateAssets?.standard_cover_video"
      class="absolute inset-0"
      :style="{ backgroundColor: templateColor, zIndex: -1 }"
    />

    <!-- Fallback 2: Use Decoration Photo when no background photo AND no templateColor -->
    <div
      v-if="isContentHidden && !optimizedBackgroundPhotoUrl && !templateColor && optimizedDecorationPhotoUrl && !templateAssets?.standard_cover_video"
      class="absolute inset-0"
      style="z-index: -1"
    >
      <img
        :src="optimizedDecorationPhotoUrl"
        alt="Background"
        class="w-full h-full object-cover"
        loading="eager"
        v-bind="protectionAttrs"
      />
    </div>

    <!-- Fallback 3: White color when no background photo, no templateColor, and no decoration photo -->
    <div
      v-if="isContentHidden && !optimizedBackgroundPhotoUrl && !templateColor && !optimizedDecorationPhotoUrl && !templateAssets?.standard_cover_video"
      class="absolute inset-0"
      style="background-color: #ffffff; z-index: -1"
    />

    <!-- Standard Cover Video Loop - Only show when not in event/background phase and no decoration photo -->
    <video
      v-if="
        templateAssets?.standard_cover_video &&
        isCoverVideoPlaying &&
        !templateAssets?.basic_decoration_photo
      "
      ref="coverVideoElement"
      v-bind="videoProtectionAttrs"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOptimizedBackgrounds } from '../../composables/showcase/useOptimizedDecorations'
import { useAssetProtection } from '../../composables/showcase/useAssetProtection'
import { getAnimationType, type ShowcaseAnimationType } from '../../composables/showcase/useShowcaseAnimation'

// Asset protection (production-only)
const { protectionAttrs, videoProtectionAttrs } = useAssetProtection()

interface TemplateAssets {
  standard_cover_video?: string
  basic_background_photo?: string
  basic_decoration_photo?: string
}

interface TemplateColor {
  id?: number
  hex_color_code?: string
  hex_code?: string
  name?: string
}

type VideoPhase = 'none' | 'event' | 'background'

interface Props {
  templateAssets?: TemplateAssets | null
  templateColors?: TemplateColor[] | null
  templateColor?: string | null
  eventTitle: string
  eventVideoUrl?: string | null
  backgroundVideoUrl?: string | null
  isCoverVideoPlaying: boolean
  currentVideoPhase?: VideoPhase
  isContentHidden?: boolean
  getMediaUrl: (url: string) => string
  /** Animation type for cover-to-content transition */
  animationType?: ShowcaseAnimationType
}

const props = defineProps<Props>()

// Animation type detection - only apply swipe-up for decoration animation
const isDecorationAnimation = computed(() => getAnimationType(props.animationType) === 'decoration')

// Optimized background/decoration photo URLs using reactive window dimensions
const { optimizedDecorationPhotoUrl, optimizedBackgroundPhotoUrl } = useOptimizedBackgrounds(
  computed(() => props.templateAssets?.basic_decoration_photo ?? null),
  computed(() => props.templateAssets?.basic_background_photo ?? null)
)

// Compute the background color for decoration photo
const decorationBackgroundColor = computed(() => {
  // Use templateColor, then white as final fallback
  return props.templateColor || '#ffffff'
})

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
/* Swipe Up Animation */
.swipe-up-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

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

/* Small laptops 13-inch (1024px-1365px) - Use mobile video sizing */
@media (min-width: 1024px) and (max-width: 1365px) {
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
