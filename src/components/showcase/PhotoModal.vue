<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center px-2 sm:px-4"
    @click="closeModal"
  >
    <div class="relative max-w-6xl max-h-full w-full">
      <!-- Close Button -->
      <button
        @click="closeModal"
        class="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70 transition-all touch-manipulation"
        aria-label="Close photo viewer"
      >
        <X class="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <!-- Previous Button -->
      <button
        v-if="canGoPrevious"
        @click.stop="goToPrevious"
        class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70 transition-all touch-manipulation"
        aria-label="Previous photo"
      >
        <ChevronLeft class="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <!-- Next Button -->
      <button
        v-if="canGoNext"
        @click.stop="goToNext"
        class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70 transition-all touch-manipulation"
        aria-label="Next photo"
      >
        <ChevronRight class="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <!-- Photo Container -->
      <div 
        class="relative max-w-full max-h-full"
        @click.stop
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <img
          v-if="currentPhoto"
          :src="getMediaUrl(currentPhoto.image)"
          :alt="currentPhoto.caption || 'Event Photo'"
          class="w-full max-w-full h-auto max-h-[80vh] sm:max-h-[85vh] object-contain rounded-lg select-none"
          loading="lazy"
          draggable="false"
        />
        
        <!-- Caption -->
        <div 
          v-if="currentPhoto?.caption" 
          class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-4 rounded-b-lg"
        >
          <p class="text-center text-sm">{{ currentPhoto.caption }}</p>
        </div>

        <!-- Photo Counter -->
        <div class="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black bg-opacity-50 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
          {{ currentIndex + 1 }} / {{ photos.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
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

// Keyboard navigation with additional shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) return
  
  switch (event.key) {
    case 'Escape':
    case 'Backspace':
      closeModal()
      break
    case 'ArrowLeft':
    case 'KeyA':
      event.preventDefault()
      goToPrevious()
      break
    case 'ArrowRight':
    case 'KeyD':
      event.preventDefault()
      goToNext()
      break
    case 'Home':
      event.preventDefault()
      if (props.photos.length > 0) {
        emit('navigate', props.photos[0])
      }
      break
    case 'End':
      event.preventDefault()
      if (props.photos.length > 0) {
        emit('navigate', props.photos[props.photos.length - 1])
      }
      break
  }
}

// Touch handlers for mobile swipe support
const touchStartX = ref(0)
const touchStartY = ref(0)
const minSwipeDistance = 50

const handleTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0].clientX
  touchStartY.value = event.touches[0].clientY
}

const handleTouchEnd = (event: TouchEvent) => {
  if (!event.changedTouches.length) return
  
  const touchEndX = event.changedTouches[0].clientX
  const touchEndY = event.changedTouches[0].clientY
  
  const deltaX = touchEndX - touchStartX.value
  const deltaY = touchEndY - touchStartY.value
  
  // Only process horizontal swipes (ignore vertical scrolling)
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    event.preventDefault()
    
    if (deltaX > 0) {
      // Swipe right - go to previous
      goToPrevious()
    } else {
      // Swipe left - go to next
      goToNext()
    }
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