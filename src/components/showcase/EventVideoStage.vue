<template>
  <div class="absolute inset-0 z-20 bg-black">
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
        :ref="eventVideoRef"
        :src="eventVideoUrl"
        autoplay
        playsinline
        @loadstart="() => {}"
        @canplay="$emit('videoCanPlay')"
        @ended="$emit('videoEnded')"
        @error="$emit('videoError', $event)"
        class="absolute inset-0 w-full h-full object-contain pointer-events-none"
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
  eventVideoRef: Ref<HTMLVideoElement | null>
}

defineProps<Props>()

defineEmits<{
  videoCanPlay: []
  videoEnded: []
  videoError: [Event]
}>()
</script>