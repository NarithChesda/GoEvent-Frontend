<template>
  <div class="absolute inset-0 z-20" :style="{ backgroundColor: primaryColor || '#000' }">
    <!-- Hidden background video - preload and prepare -->
    <video
      v-if="backgroundVideoUrl"
      ref="backgroundVideoElement"
      :src="backgroundVideoUrl"
      autoplay
      loop
      muted
      playsinline
      class="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
    />
    
    <template v-if="eventVideoUrl">
      <!-- Loading indicator while video loads -->
      <div v-if="videoLoading" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div 
            class="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
            :style="{ borderBottomColor: primaryColor || '#3B82F6' }"
          />
          <p 
            class="text-xl font-medium" 
            :style="{ color: primaryColor || '#FFFFFF' }"
          >
            Loading video...
          </p>
        </div>
      </div>
      
      <!-- Use preloaded video if available, otherwise create new one -->
      <template v-if="!usingPreloadedVideo">
        <!-- Event Video without controls (non-interactive) -->
        <video
          v-if="eventVideoRef"
          :ref="eventVideoRef"
          :src="eventVideoUrl"
          autoplay
          playsinline
          @loadstart="() => {}"
          @canplay="$emit('videoCanPlay')"
          @ended="handleVideoEnded"
          @timeupdate="handleTimeUpdate"
          @error="$emit('videoError', $event)"
          class="absolute inset-0 w-full h-full desktop-video-sizing pointer-events-none"
        />
        <video
          v-else
          :src="eventVideoUrl"
          autoplay
          playsinline
          @loadstart="() => {}"
          @canplay="$emit('videoCanPlay')"
          @ended="handleVideoEnded"
          @timeupdate="handleTimeUpdate"
          @error="$emit('videoError', $event)"
          class="absolute inset-0 w-full h-full desktop-video-sizing pointer-events-none"
        />
      </template>
      
      <!-- Preloaded video is already in DOM and ready to play -->
      <div v-else class="text-center absolute bottom-4 left-0 right-0 text-white text-sm opacity-75">
        Using preloaded video for instant playback
      </div>
    </template>
    
    <!-- No video available - auto proceed -->
    <div v-else class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <p 
          class="text-xl font-medium" 
          :style="{ color: primaryColor || '#FFFFFF' }"
        >
          Preparing your invitation...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { ref, watch, onMounted, nextTick } from 'vue'

interface Props {
  eventVideoUrl?: string | null
  backgroundVideoUrl?: string | null
  videoLoading: boolean
  primaryColor: string
  eventVideoRef?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  videoCanPlay: []
  videoEnded: []
  videoError: [Event]
  backgroundVideoReady: []
}>()

const backgroundVideoElement = ref<HTMLVideoElement | null>(null)
const backgroundVideoReady = ref(false)
const preloadedEventVideo = ref<HTMLVideoElement | null>(null)
const usingPreloadedVideo = ref(false)

const handleVideoEnded = () => {
  // Make background video visible just before emitting ended
  if (backgroundVideoElement.value && backgroundVideoReady.value) {
    backgroundVideoElement.value.style.opacity = '1'
    backgroundVideoElement.value.style.zIndex = '1'
  }
  emit('videoEnded')
}

const handleTimeUpdate = (event: Event) => {
  const video = event.target as HTMLVideoElement
  if (video.duration && video.currentTime) {
    const timeLeft = video.duration - video.currentTime
    // When 0.5 seconds left, ensure background video is ready
    if (timeLeft <= 0.5 && backgroundVideoElement.value && !backgroundVideoReady.value) {
      backgroundVideoReady.value = true
      emit('backgroundVideoReady')
    }
  }
}

// Check for preloaded event video from CoverStage
onMounted(async () => {
  await nextTick()
  // Look for preloaded event video in the DOM
  const preloadedVideos = document.querySelectorAll('video[src*="event_video"]')
  for (const video of preloadedVideos) {
    const videoElement = video as HTMLVideoElement
    if (videoElement.style.zIndex === '-10' && videoElement.readyState >= 4) {
      preloadedEventVideo.value = videoElement
      usingPreloadedVideo.value = true
      
      // Set up event handlers for preloaded video
      videoElement.addEventListener('ended', handleVideoEnded)
      videoElement.addEventListener('timeupdate', handleTimeUpdate)
      videoElement.addEventListener('error', (event) => emit('videoError', event))
      
      // Make the preloaded video visible and active
      videoElement.style.opacity = '1'
      videoElement.style.zIndex = '1'
      videoElement.muted = false
      videoElement.classList.remove('pointer-events-none')
      videoElement.classList.add('desktop-video-sizing')
      
      // Start playing and emit ready event
      videoElement.play().then(() => {
        emit('videoCanPlay')
      })
      break
    }
  }
})

// Watch for background video ready state
watch(backgroundVideoElement, (element) => {
  if (element) {
    const checkReady = () => {
      if (element.readyState >= 4) { // HAVE_ENOUGH_DATA
        backgroundVideoReady.value = true
        emit('backgroundVideoReady')
      } else {
        element.addEventListener('canplaythrough', () => {
          backgroundVideoReady.value = true
          emit('backgroundVideoReady')
        }, { once: true })
      }
    }
    checkReady()
  }
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