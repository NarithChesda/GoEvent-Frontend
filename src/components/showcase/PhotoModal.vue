<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
    @click="closeModal"
  >
    <div class="relative max-w-6xl max-h-full w-full">
      <!-- Close Button - Minimalist Design -->
      <button
        @click="closeModal"
        class="modal-control close-button"
        aria-label="Close photo viewer"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Previous Button - Hidden on mobile, subtle on desktop -->
      <button
        v-if="canGoPrevious"
        @click.stop="goToPrevious"
        class="modal-control nav-button left-button"
        aria-label="Previous photo"
      >
        <ChevronLeft class="w-6 h-6" />
      </button>

      <!-- Next Button - Hidden on mobile, subtle on desktop -->
      <button
        v-if="canGoNext"
        @click.stop="goToNext"
        class="modal-control nav-button right-button"
        aria-label="Next photo"
      >
        <ChevronRight class="w-6 h-6" />
      </button>

      <!-- Photo Container -->
      <div
        class="relative max-w-full max-h-full px-4 sm:px-0 flex flex-col items-center"
        @click.stop
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <img
          v-if="currentPhoto"
          :src="getMediaUrl(currentPhoto.image)"
          :alt="currentPhoto.caption || 'Event Photo'"
          :style="{ transform: `translateX(${swipeOffset}px)` }"
          class="photo-image"
          loading="lazy"
          draggable="false"
        />

        <!-- Caption -->
        <div v-if="currentPhoto?.caption" class="photo-caption">
          <p class="text-center text-sm">{{ currentPhoto.caption }}</p>
        </div>

        <!-- Photo Counter - Below Photo -->
        <div class="modal-counter">
          {{ currentIndex + 1 }} / {{ photos.length }}
        </div>
      </div>

      <!-- Swipe Indicator for Mobile -->
      <div class="swipe-indicator">
        <span v-if="canGoPrevious" class="swipe-hint left">‹</span>
        <span class="swipe-hint-text">Swipe to navigate</span>
        <span v-if="canGoNext" class="swipe-hint right">›</span>
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
  return props.photos.findIndex((photo) => photo.id === props.currentPhoto?.id)
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

// Enhanced touch handlers for mobile swipe support with visual feedback
const touchStartX = ref(0)
const touchStartY = ref(0)
const swipeOffset = ref(0)
const minSwipeDistance = 50
const isSwiping = ref(false)

const handleTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0].clientX
  touchStartY.value = event.touches[0].clientY
  isSwiping.value = false
  swipeOffset.value = 0
}

const handleTouchMove = (event: TouchEvent) => {
  if (!event.touches.length) return

  const touchCurrentX = event.touches[0].clientX
  const touchCurrentY = event.touches[0].clientY

  const deltaX = touchCurrentX - touchStartX.value
  const deltaY = touchCurrentY - touchStartY.value

  // Only track horizontal swipes
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
    isSwiping.value = true
    // Apply resistance at boundaries
    const maxOffset = 100
    swipeOffset.value = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.5))
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  if (!event.changedTouches.length) return

  const touchEndX = event.changedTouches[0].clientX
  const touchEndY = event.changedTouches[0].clientY

  const deltaX = touchEndX - touchStartX.value
  const deltaY = touchEndY - touchStartY.value

  // Reset swipe offset with animation
  swipeOffset.value = 0

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

  isSwiping.value = false
}

// Add/remove event listener when modal opens/closes
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)
</script>

<style scoped>
/* Ensure modal appears above everything */
.z-50 {
  z-index: 9999;
}

/* Minimalist Modal Controls */
.modal-control {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Close Button - Top Right, Minimal Overlay */
.close-button {
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background-color: rgba(0, 0, 0, 0.2);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  opacity: 0.6;
  transition: all 0.2s ease;
}

.close-button:active {
  background-color: rgba(0, 0, 0, 0.5);
  transform: scale(0.95);
  opacity: 1;
}

/* Photo Counter - Below Photo, No Overlay */
.modal-counter {
  margin-top: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  font-weight: 400;
  text-align: center;
  pointer-events: none;
}

/* Navigation Buttons - Hidden on Mobile */
.nav-button {
  top: 50%;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background-color: rgba(0, 0, 0, 0.3);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  opacity: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: opacity 0.3s ease, background-color 0.2s ease;
}

.left-button {
  left: 1rem;
}

.right-button {
  right: 1rem;
}

/* Show nav buttons on hover (desktop only) */
@media (hover: hover) and (pointer: fine) {
  .nav-button:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .close-button:hover {
    background-color: rgba(0, 0, 0, 0.6);
  }
}

/* Photo Image with Swipe Animation */
.photo-image {
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 0.5rem;
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.2s ease-out;
}

/* Caption */
.photo-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4));
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: white;
  padding: 1.5rem 1rem 1rem;
  border-radius: 0 0 0.5rem 0.5rem;
}

/* Swipe Indicator for Mobile Only - Auto-hide after 3s */
.swipe-indicator {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(0, 0, 0, 0.25);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  color: rgba(255, 255, 255, 0.9);
  padding: 0.4rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  animation: fadeInOut 4s ease-in-out;
  pointer-events: none;
}

/* Hide swipe indicator on desktop/tablet - they have arrow buttons */
@media (min-width: 769px) {
  .swipe-indicator {
    display: none;
  }
}

.swipe-hint {
  font-size: 1.25rem;
  line-height: 1;
  opacity: 0.7;
}

.swipe-hint-text {
  opacity: 0.8;
  font-weight: 400;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
  }
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .close-button {
    width: 2rem;
    height: 2rem;
    top: 0.5rem;
    right: 0.5rem;
    background-color: rgba(0, 0, 0, 0.15);
    opacity: 0.5;
  }

  .close-button:active {
    opacity: 1;
  }

  .modal-counter {
    margin-top: 0.5rem;
    font-size: 0.7rem;
  }

  /* Hide navigation buttons on mobile - swipe only */
  .nav-button {
    display: none;
  }

  .photo-image {
    max-height: 75vh;
    border-radius: 0.375rem;
  }

  .photo-caption {
    padding: 1rem 0.75rem 0.75rem;
    font-size: 0.875rem;
  }

  .swipe-indicator {
    bottom: 1rem;
  }
}

/* Very Small Devices */
@media (max-width: 375px) {
  .close-button {
    width: 1.75rem;
    height: 1.75rem;
    top: 0.375rem;
    right: 0.375rem;
    opacity: 0.4;
  }

  .modal-counter {
    margin-top: 0.375rem;
    font-size: 0.65rem;
  }

  .photo-caption {
    padding: 0.75rem 0.5rem 0.5rem;
  }
}

/* Tablet - Show nav buttons with some opacity */
@media (min-width: 769px) and (max-width: 1024px) {
  .nav-button {
    opacity: 0.5;
  }

  .nav-button:hover {
    opacity: 1;
  }
}

/* Desktop - Show nav buttons, full opacity on hover */
@media (min-width: 1025px) {
  .modal-counter {
    margin-top: 1rem;
    font-size: 0.875rem;
  }

  .close-button {
    width: 3rem;
    height: 3rem;
  }

  .nav-button {
    opacity: 0.6;
  }

  .nav-button:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.6);
  }
}
</style>
