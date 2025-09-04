<template>
  <!-- Transparent transition stage - videos are now handled by CoverStage -->
  <div class="absolute inset-0 z-20 bg-transparent">
    <!-- Simple transition message during the video sequence -->
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="text-center text-white bg-black bg-opacity-30 rounded-lg p-6" style="backdrop-filter: blur(10px);">
        <div 
          class="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" 
          :style="{ borderBottomColor: primaryColor || '#3B82F6' }"
        />
        <p 
          class="text-sm font-medium opacity-75" 
          :style="{ color: 'white' }"
        >
          Loading invitation...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

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

// Auto-complete the video stage after a brief moment
onMounted(() => {
  // Simulate video completion after 3 seconds
  setTimeout(() => {
    emit('backgroundVideoReady')
    setTimeout(() => {
      emit('videoEnded')
    }, 100)
  }, 3000)
})
</script>

<style scoped>
/* Simple transition styles */
</style>