<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
    @click="closeModal"
  >
    <div class="relative max-w-6xl max-h-full mx-4">
      <!-- Close Button -->
      <button
        @click="closeModal"
        class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Previous Button -->
      <button
        v-if="canGoPrevious"
        @click.stop="goToPrevious"
        class="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
      >
        <ChevronLeft class="w-6 h-6" />
      </button>

      <!-- Next Button -->
      <button
        v-if="canGoNext"
        @click.stop="goToNext"
        class="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
      >
        <ChevronRight class="w-6 h-6" />
      </button>

      <!-- Photo Container -->
      <div 
        class="relative max-w-full max-h-full"
        @click.stop
      >
        <img
          v-if="currentPhoto"
          :src="getMediaUrl(currentPhoto.image)"
          :alt="currentPhoto.caption || 'Event Photo'"
          class="max-w-full max-h-[80vh] object-contain rounded-lg"
          loading="lazy"
        />
        
        <!-- Caption -->
        <div 
          v-if="currentPhoto?.caption" 
          class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-4 rounded-b-lg"
        >
          <p class="text-center text-sm">{{ currentPhoto.caption }}</p>
        </div>

        <!-- Photo Counter -->
        <div class="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {{ currentIndex + 1 }} / {{ photos.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { EventPhoto } from '../../composables/useEventShowcase'

interface Props {
  isOpen: boolean
  photos: EventPhoto[]
  currentPhoto: EventPhoto | null
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  navigate: [EventPhoto]
}>()

const currentIndex = computed(() => {
  if (!props.currentPhoto || props.photos.length === 0) return 0
  return props.photos.findIndex(photo => photo.id === props.currentPhoto?.id)
})

const canGoPrevious = computed(() => currentIndex.value > 0)
const canGoNext = computed(() => currentIndex.value < props.photos.length - 1)

const closeModal = () => {
  emit('close')
}

const goToPrevious = () => {
  if (canGoPrevious.value) {
    const prevPhoto = props.photos[currentIndex.value - 1]
    emit('navigate', prevPhoto)
  }
}

const goToNext = () => {
  if (canGoNext.value) {
    const nextPhoto = props.photos[currentIndex.value + 1]
    emit('navigate', nextPhoto)
  }
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) return
  
  switch (event.key) {
    case 'Escape':
      closeModal()
      break
    case 'ArrowLeft':
      goToPrevious()
      break
    case 'ArrowRight':
      goToNext()
      break
  }
}

// Add/remove event listener when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
}, { immediate: true })
</script>

<style scoped>
/* Ensure modal appears above everything */
.z-50 {
  z-index: 9999;
}
</style>