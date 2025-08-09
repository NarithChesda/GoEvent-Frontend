<template>
  <div class="absolute inset-0 z-20" :style="{ backgroundColor: primaryColor || '#000' }">
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
      
      <!-- Video without controls (non-interactive) -->
      <video
        v-if="eventVideoRef"
        :ref="eventVideoRef"
        :src="eventVideoUrl"
        autoplay
        playsinline
        @loadstart="() => {}"
        @canplay="$emit('videoCanPlay')"
        @ended="$emit('videoEnded')"
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
        @ended="$emit('videoEnded')"
        @error="$emit('videoError', $event)"
        class="absolute inset-0 w-full h-full desktop-video-sizing pointer-events-none"
      />
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

interface Props {
  eventVideoUrl?: string | null
  videoLoading: boolean
  primaryColor: string
  eventVideoRef?: any
}

defineProps<Props>()

defineEmits<{
  videoCanPlay: []
  videoEnded: []
  videoError: [Event]
}>()
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