<template>
  <div class="mb-6 sm:mb-8">
    <!-- <h2
      class="leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-semibold sm:mb-4 md:mb-6 capitalize text-center"
      :style="{
        fontFamily: primaryFont || currentFont,
        color: primaryColor,
      }"
    >
      {{ galleryHeaderText }}
    </h2> -->

    <!-- No Photos Placeholder -->
    <div v-if="photos.length === 0" class="p-6 sm:p-8 rounded-xl text-center">
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        :style="{ backgroundColor: primaryColor + '20' }"
      >
        <svg
          class="w-8 h-8"
          :style="{ color: primaryColor }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          ></path>
        </svg>
      </div>
      <p class="text-sm" :style="{ color: primaryColor, opacity: '0.8' }">
        No photos available at the moment
      </p>
      <p class="text-xs mt-1" :style="{ color: primaryColor, opacity: '0.6' }">
        Photos will appear here once they're added to the event
      </p>
    </div>

    <!-- Simple Grid Gallery -->
    <div v-else class="photo-grid">
      <div
        v-for="(photo, index) in photos"
        :key="photo.id"
        :ref="(el) => setPhotoRef(el as HTMLElement | null, index)"
        class="photo-item"
        :class="{ 'photo-visible': visiblePhotos.has(index) }"
        :style="{ '--stagger-delay': `${(index % 3) * 0.08}s` }"
        @click="handlePhotoClick(photo)"
      >
        <!-- Loading Placeholder -->
        <div
          v-if="imageLoadingStates[photo.id]"
          class="photo-placeholder"
          :style="{ backgroundColor: primaryColor + '15' }"
        >
          <div class="loading-spinner" :style="{ borderTopColor: primaryColor }"></div>
        </div>

        <!-- Error Placeholder -->
        <div
          v-else-if="imageErrorStates[photo.id]"
          class="photo-error"
          :style="{ backgroundColor: primaryColor + '10', color: primaryColor }"
        >
          <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p class="text-xs mt-2 opacity-60">Failed to load</p>
        </div>

        <!-- Actual Image (optimized via ImageKit) -->
        <img
          v-show="!imageLoadingStates[photo.id] && !imageErrorStates[photo.id]"
          :data-photo-id="photo.id"
          :src="getOptimizedPhotoUrl(photo.image)"
          :alt="photo.caption || 'Event Photo'"
          :loading="index < 4 ? 'eager' : 'lazy'"
          :decoding="index < 3 ? 'sync' : 'async'"
          :fetchpriority="index < 2 ? 'high' : 'auto'"
          @load="handleImageLoad(String(photo.id))"
          @error="handleImageError(String(photo.id))"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, reactive, watch, nextTick } from 'vue'
import type { EventPhoto } from '../../composables/useEventShowcase'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import { useTemplateProcessor } from '../../composables/showcase/useTemplateProcessor'

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  photos: EventPhoto[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  getMediaUrl: (url: string) => string
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openPhoto: [EventPhoto]
}>()

// Template processor for optimized media URLs
const { getOptimizedMediaUrl } = useTemplateProcessor()

// Calculate optimal thumbnail width based on actual rendered size
// Gallery is inside a liquid-glass container with padding, so actual width is smaller than viewport
// Mobile: ~320-350px rendered width, Desktop: ~400-500px max per image
const getThumbnailWidth = () => {
  if (typeof window === 'undefined') return 400
  // Account for container padding (~48px on mobile, more on desktop)
  // and use a reasonable max for quality without over-fetching
  const containerPadding = window.innerWidth < 768 ? 48 : 80
  const availableWidth = window.innerWidth - containerPadding
  return Math.min(availableWidth, 500)
}

// Get optimized photo URL for gallery thumbnails
const getOptimizedPhotoUrl = (imageUrl: string) => {
  return getOptimizedMediaUrl(imageUrl, {
    width: getThumbnailWidth(),
    retina: 2, // Use fixed 2x for good quality without over-fetching on 3x devices
  })
}

// Image loading states
const imageLoadingStates = reactive<Record<string, boolean>>({})
const imageErrorStates = reactive<Record<string, boolean>>({})
const imageRetryCount = reactive<Record<string, number>>({})
const MAX_RETRIES = 3

// IntersectionObserver for lazy image loading states
const lazyImageObserver = ref<IntersectionObserver | null>(null)

// Scroll animation state
const visiblePhotos = ref<Set<number>>(new Set())
const photoRefs = ref<Map<number, HTMLElement>>(new Map())
const scrollAnimationObserver = ref<IntersectionObserver | null>(null)

// Set photo element refs for scroll animation
const setPhotoRef = (el: HTMLElement | null, index: number) => {
  if (el) {
    photoRefs.value.set(index, el)
  } else {
    photoRefs.value.delete(index)
  }
}

// Initialize loading states for all photos
const initializeImageStates = () => {
  props.photos.forEach((photo, index) => {
    // Only show loading state for eagerly loaded images (first 4)
    // Lazy images will be handled by browser's native lazy loading
    imageLoadingStates[photo.id] = index < 4
    imageErrorStates[photo.id] = false
    imageRetryCount[photo.id] = 0
  })
}

// Handle successful image load
const handleImageLoad = (photoId: string) => {
  imageLoadingStates[photoId] = false
  imageErrorStates[photoId] = false
}

// Handle image load error with retry mechanism
const handleImageError = (photoId: string) => {
  const retries = imageRetryCount[photoId] || 0

  if (retries < MAX_RETRIES) {
    imageRetryCount[photoId] = retries + 1
    // Retry with exponential backoff: 1s, 2s, 4s
    setTimeout(() => {
      const img = document.querySelector(`img[data-photo-id="${photoId}"]`) as HTMLImageElement
      if (img) {
        const currentSrc = img.src
        img.src = '' // Reset
        nextTick(() => {
          img.src = currentSrc // Trigger reload
        })
      }
    }, Math.pow(2, retries) * 1000)
  } else {
    // Max retries reached, show error state
    imageLoadingStates[photoId] = false
    imageErrorStates[photoId] = true
  }
}

const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (text) => text.text_type === textType && text.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  const keyMap: Record<
    string,
    keyof typeof import('../../utils/translations').rsvpTranslations.en
  > = {
    gallery_header: 'gallery_header',
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

const galleryHeaderText = computed(() => getTextContent('gallery_header', 'Photo Gallery'))

const handlePhotoClick = (photo: EventPhoto) => {
  emit('openPhoto', photo)
}

// Setup observer for lazy-loaded images
const setupLazyImageObserver = () => {
  // Find the scroll container - important for nested scrolling scenarios on mobile
  const scrollContainer = document.querySelector('.liquid-glass-card .custom-scrollbar') as Element | null

  lazyImageObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const photoId = entry.target.getAttribute('data-photo-id')
          if (photoId && !imageErrorStates[photoId]) {
            // Image is in viewport, show loading state if not already loaded
            const img = entry.target as HTMLImageElement
            if (!img.complete) {
              imageLoadingStates[photoId] = true
            }
          }
        }
      })
    },
    {
      root: scrollContainer, // Use scroll container as root for mobile nested scrolling
      threshold: 0.01,
      rootMargin: '50px' // Start loading slightly before entering viewport
    }
  )

  // Observe all lazy-loaded images (index >= 4)
  props.photos.forEach((photo, index) => {
    if (index >= 4) {
      const img = document.querySelector(`img[data-photo-id="${photo.id}"]`) as HTMLImageElement
      if (img && lazyImageObserver.value) {
        lazyImageObserver.value.observe(img)
      }
    }
  })
}

// Setup scroll animation observer for photo reveal
const setupScrollAnimationObserver = () => {
  // Disconnect existing observer
  if (scrollAnimationObserver.value) {
    scrollAnimationObserver.value.disconnect()
  }

  // Find the scroll container for proper intersection detection
  const scrollContainer = document.querySelector('.liquid-glass-card .custom-scrollbar') as Element | null

  scrollAnimationObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-photo-index') || '-1', 10)
          if (index >= 0) {
            visiblePhotos.value.add(index)
            // Unobserve after animation triggered - no need to track anymore
            scrollAnimationObserver.value?.unobserve(entry.target)
          }
        }
      })
    },
    {
      root: scrollContainer,
      threshold: 0.15, // Trigger when 15% visible
      rootMargin: '0px 0px -50px 0px', // Trigger slightly before fully in view
    }
  )

  // Observe all photo items
  photoRefs.value.forEach((el, index) => {
    el.setAttribute('data-photo-index', String(index))
    scrollAnimationObserver.value?.observe(el)
  })
}

onMounted(() => {
  // Initialize image loading states
  initializeImageStates()

  // Setup observers after DOM is ready
  setTimeout(() => {
    setupLazyImageObserver()
    setupScrollAnimationObserver()
  }, 100)
})

// Watch for photo changes to reinitialize states
watch(() => props.photos, (newPhotos, oldPhotos) => {
  if (newPhotos !== oldPhotos) {
    // Disconnect old observers
    if (lazyImageObserver.value) {
      lazyImageObserver.value.disconnect()
    }
    if (scrollAnimationObserver.value) {
      scrollAnimationObserver.value.disconnect()
    }

    // Clear old states
    Object.keys(imageLoadingStates).forEach(key => {
      delete imageLoadingStates[key]
    })
    Object.keys(imageErrorStates).forEach(key => {
      delete imageErrorStates[key]
    })
    Object.keys(imageRetryCount).forEach(key => {
      delete imageRetryCount[key]
    })

    // Reset scroll animation state
    visiblePhotos.value.clear()
    photoRefs.value.clear()

    // Initialize new states
    initializeImageStates()

    // Re-setup observers for new photos
    setTimeout(() => {
      setupLazyImageObserver()
      setupScrollAnimationObserver()
    }, 100)
  }
}, { deep: false })

onUnmounted(() => {
  // Disconnect observers
  if (lazyImageObserver.value) {
    lazyImageObserver.value.disconnect()
    lazyImageObserver.value = null
  }
  if (scrollAnimationObserver.value) {
    scrollAnimationObserver.value.disconnect()
    scrollAnimationObserver.value = null
  }

  // Clear image states
  Object.keys(imageLoadingStates).forEach(key => {
    delete imageLoadingStates[key]
  })
  Object.keys(imageErrorStates).forEach(key => {
    delete imageErrorStates[key]
  })
  Object.keys(imageRetryCount).forEach(key => {
    delete imageRetryCount[key]
  })

  // Clear scroll animation state
  visiblePhotos.value.clear()
  photoRefs.value.clear()
})
</script>

<style scoped>
.photo-grid {
  display: grid;
  gap: 1rem;
  width: 100%;
}

.photo-item {
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  border-radius: 0.5rem;
  /* Initial state for scroll animation */
  opacity: 0;
  transform: translateY(20px) scale(0.97);
  transition: opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transition-delay: var(--stagger-delay, 0s);
}

.photo-item.photo-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.photo-item img {
  width: 100%;
  height: auto;
  display: block;
  /* Optimize for mobile performance */
  image-rendering: -webkit-optimize-contrast;
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: auto;
}

.photo-placeholder,
.photo-error {
  width: 100%;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  padding: 2rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Laptop view - reduced vertical spacing */
@media (min-width: 769px) and (max-width: 1536px) {
  .photo-grid {
    gap: 0.5rem;
  }
}

/* Mobile optimizations for messaging app browsers */
@media (max-width: 768px) {
  .photo-grid {
    gap: 0.75rem;
  }

  .photo-item {
    /* Optimize paint and layout */
    contain: layout style paint;
  }

  .photo-item img {
    /* Better memory management on mobile */
    image-rendering: auto;
    /* Reduce blur during scroll */
    -webkit-transform: translateZ(0);
    -webkit-backface-visibility: hidden;
  }

  .photo-placeholder,
  .photo-error {
    min-height: 200px;
    padding: 1.5rem;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border-width: 2.5px;
  }
}

/* Reduce motion for accessibility and battery saving */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
    border-top-color: transparent;
    opacity: 0.5;
  }

  .photo-item {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .photo-item.photo-visible {
    transform: none;
  }
}

/* Very small devices - optimize further */
@media (max-width: 375px) {
  .photo-grid {
    gap: 0.5rem;
  }

  .photo-item {
    border-radius: 0.375rem;
  }

  .photo-placeholder,
  .photo-error {
    min-height: 180px;
    padding: 1rem;
  }

  .loading-spinner {
    width: 1.75rem;
    height: 1.75rem;
  }
}
</style>
