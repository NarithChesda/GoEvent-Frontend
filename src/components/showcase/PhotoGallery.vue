<template>
  <div class="mb-6 sm:mb-8">
    <h2
      class="leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-semibold sm:mb-4 md:mb-6 uppercase text-center"
      :style="{
        fontFamily: primaryFont || currentFont,
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }"
    >
      {{ galleryHeaderText }}
    </h2>

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

    <!-- Photos Content -->
    <div v-else>
      <!-- Featured Photo -->
      <div
        v-if="featuredPhoto"
        class="mb-4 sm:mb-6 featured-photo-container"
        :ref="(el) => setupPhotoAnimation(el, 'featured-photo', 0)"
      >
        <div class="rounded-xl overflow-hidden photo-reveal-container">
          <img
            :src="getMediaUrl(featuredPhoto.image)"
            :alt="featuredPhoto.caption || 'Featured Event Photo'"
            class="w-full h-48 sm:h-56 md:h-64 object-cover cursor-pointer transition-all duration-500 hover:scale-105 hover:brightness-110"
            @click="handlePhotoClick(featuredPhoto)"
            loading="lazy"
          />
          <p
            v-if="featuredPhoto.caption"
            class="text-xs sm:text-sm mt-2 text-center transition-all duration-300"
            :style="{ color: primaryColor, opacity: '0.8' }"
          >
            {{ featuredPhoto.caption }}
          </p>
        </div>
      </div>

      <!-- Clean Photo Gallery -->
      <div
        class="clean-gallery-container overflow-hidden momentum-scroll-container"
        style="margin-bottom: 0px"
        :ref="(el) => setupPhotoAnimation(el, 'photo-gallery', 1)"
      >
        <!-- Photo strip with optimized infinite scroll -->
        <div class="photo-strip-wrapper overflow-hidden flex items-center enhanced-scroll">
          <div
            class="photo-strip flex animate-infinite-scroll items-center"
            style="gap: var(--gallery-spacing, 16px)"
            :style="{
              '--strip-width': `${stripWidth}px`,
              animationDuration: `${animationDuration}s`,
            }"
          >
            <!-- First set of photos (virtualized) -->
            <div
              v-for="photo in visiblePhotos"
              :key="`first-${photo.id}`"
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group enhanced-photo-card"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`,
              }"
              @click="handlePhotoClick(photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
                @load="onImageLoad"
                :data-optimized-id="`opt-${photo.id}`"
              />

              <!-- Caption overlay -->
              <div
                v-if="photo.caption"
                class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ photo.caption }}
              </div>
            </div>

            <!-- Duplicate set for seamless infinite scroll (reuses cached images) -->
            <div
              v-for="photo in visiblePhotos"
              :key="`second-${photo.id}`"
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group enhanced-photo-card"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`,
              }"
              @click="handlePhotoClick(photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
                :data-optimized-id="`opt-dup-${photo.id}`"
              />

              <!-- Caption overlay -->
              <div
                v-if="photo.caption"
                class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ photo.caption }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reverse Scroll Gallery -->
      <div
        class="clean-gallery-reverse overflow-hidden momentum-scroll-container"
        style="margin-top: 0px"
        :ref="(el) => setupPhotoAnimation(el, 'reverse-gallery', 2)"
      >
        <!-- Photo strip with optimized reverse infinite scroll -->
        <div class="photo-strip-wrapper overflow-hidden flex items-center enhanced-scroll">
          <div
            class="photo-strip flex animate-infinite-scroll-reverse items-center"
            style="gap: var(--gallery-spacing, 16px)"
            :style="{
              '--strip-width': `${stripWidth}px`,
              animationDuration: `${reverseAnimationDuration}s`,
            }"
          >
            <!-- First set of photos (reversed order, virtualized) -->
            <div
              v-for="photo in visibleReversePhotos"
              :key="`reverse-first-${photo.id}`"
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group enhanced-photo-card"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`,
              }"
              @click="handlePhotoClick(photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
                @load="onImageLoad"
                :data-optimized-id="`opt-rev-${photo.id}`"
              />

              <!-- Caption overlay -->
              <div
                v-if="photo.caption"
                class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ photo.caption }}
              </div>
            </div>

            <!-- Duplicate set for seamless infinite scroll (reuses cached images) -->
            <div
              v-for="photo in visibleReversePhotos"
              :key="`reverse-second-${photo.id}`"
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group enhanced-photo-card"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`,
              }"
              @click="handlePhotoClick(photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
                :data-optimized-id="`opt-rev-dup-${photo.id}`"
              />

              <!-- Caption overlay -->
              <div
                v-if="photo.caption"
                class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ photo.caption }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { EventPhoto } from '../../composables/useEventShowcase'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import { useStaggerAnimation } from '../../composables/useAdvancedAnimations'
import { useMomentumScroll } from '../../composables/useAdvancedAnimations'
import { ANIMATION_CONSTANTS } from '../../composables/useScrollAnimations'
import { usePerformance, useAdvancedThrottleFn } from '../../utils/performance'

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

// Animation setup for staggered photo reveals
const { observeStaggerElement } = useStaggerAnimation({
  animationType: 'scaleIn',
  duration: ANIMATION_CONSTANTS.DURATION.NORMAL,
  staggerDelay: 80,
  easing: ANIMATION_CONSTANTS.EASING.EXPO,
  threshold: 0.3,
})

// Enhanced momentum scrolling for smoother gallery experience
const { scrollToElement, isScrolling } = useMomentumScroll({
  friction: 0.95,
  acceleration: 0.08,
  maxVelocity: 30,
})

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (text) => text.text_type === textType && text.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
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

// Gallery spacing constant - must match CSS custom property
const GALLERY_SPACING = 16

const featuredPhoto = computed(() => props.photos.find((photo) => photo.is_featured))

const nonFeaturedPhotos = computed(() => props.photos.filter((photo) => !photo.is_featured))

// Performance utilities with automatic cleanup
const {
  addCleanup,
  addEventListener,
  addTimeout,
  requestAnimationFrame,
  cancelAnimationFrame,
  deduplicateRequest,
  cleanup: cleanupPerformance,
} = usePerformance()

// Single Image Cache System - eliminates 4× duplicate network requests
class SingleImageCache {
  private cache = new Map<string, HTMLImageElement>()
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>()

  async getImage(src: string): Promise<HTMLImageElement> {
    // Return cached image immediately if available
    if (this.cache.has(src)) {
      return this.cache.get(src)!.cloneNode(false) as HTMLImageElement
    }

    // Return existing promise if image is already loading
    if (this.loadingPromises.has(src)) {
      const originalImg = await this.loadingPromises.get(src)!
      return originalImg.cloneNode(false) as HTMLImageElement
    }

    // Start loading new image
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.cache.set(src, img)
        this.loadingPromises.delete(src)
        resolve(img)
      }
      img.onerror = () => {
        this.loadingPromises.delete(src)
        reject(new Error(`Failed to load image: ${src}`))
      }
      img.src = src
    })

    this.loadingPromises.set(src, loadPromise)
    const originalImg = await loadPromise
    return originalImg.cloneNode(false) as HTMLImageElement
  }

  preload(src: string): Promise<void> {
    return this.getImage(src).then(() => void 0)
  }

  getDimensions(src: string): { width: number; height: number } | null {
    const img = this.cache.get(src)
    if (img && img.naturalWidth && img.naturalHeight) {
      return {
        width: img.naturalWidth,
        height: img.naturalHeight,
      }
    }
    return null
  }

  clear(): void {
    this.cache.clear()
    this.loadingPromises.clear()
  }
}

// Global image cache instance
const globalImageCache = new SingleImageCache()

// Image dimensions cache for aspect ratio calculations
const imageDimensions = ref<Record<string, { width: number; height: number }>>({})

// Track window width for responsive calculations
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

// Throttled resize handler to prevent excessive recalculations
const updateWindowWidth = useAdvancedThrottleFn(
  () => {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth
    }
  },
  100,
  { trailing: true, useRAF: true },
)

// Animation frame IDs for cleanup
const activeAnimationFrames = new Set<number>()

// Photos for infinite scroll - use all photos if we have enough, otherwise repeat them
const allPhotosForStrip = computed(() => {
  const photos = nonFeaturedPhotos.value
  if (photos.length === 0) return []

  // If we have less than 8 photos, repeat them to ensure smooth scrolling
  if (photos.length < 8) {
    const repeats = Math.ceil(8 / photos.length)
    return Array(repeats).fill(photos).flat()
  }

  return photos
})

// Calculate photo width based on aspect ratio, maintaining fixed height
const getPhotoWidth = (photo: EventPhoto): number => {
  // Use responsive height based on container size
  let fixedHeight = 188 // Default desktop height (25% increase from 150px)

  if (windowWidth.value < 640) {
    fixedHeight = 188 // Mobile height (88% total increase)
  } else if (windowWidth.value < 768) {
    fixedHeight = 150 // Tablet height (25% increase)
  }

  const dimensions = imageDimensions.value[photo.id]

  if (dimensions) {
    const aspectRatio = dimensions.width / dimensions.height
    // Ensure minimum and maximum widths for better layout
    const calculatedWidth = Math.round(fixedHeight * aspectRatio)
    return Math.min(Math.max(calculatedWidth, fixedHeight * 0.6), fixedHeight * 2.5)
  }

  // Default width for square aspect ratio while loading
  return fixedHeight
}

// Calculate strip width for animation (using visible photos for performance)
const stripWidth = computed((): number => {
  let totalWidth = 0
  visiblePhotos.value.forEach((photo) => {
    totalWidth += getPhotoWidth(photo) + GALLERY_SPACING // Consistent spacing throughout gallery
  })
  return totalWidth || 1000 // Fallback width to prevent division by zero
})

// Animation duration based on number of photos (faster animation)
const animationDuration = computed((): number => {
  const baseSpeed = 60 // pixels per second (doubled for faster scroll)
  return Math.max(stripWidth.value / baseSpeed, 8) // minimum 8 seconds
})

// Reverse photos for the second film strip (reversed order)
const reversePhotosForStrip = computed(() => {
  const photos = [...allPhotosForStrip.value].reverse()
  return photos
})

// Reverse animation duration (slightly different speed for visual variety)
const reverseAnimationDuration = computed((): number => {
  const baseSpeed = 55 // slightly slower than the first strip for variety
  return Math.max(stripWidth.value / baseSpeed, 9) // minimum 9 seconds
})

// Virtual Scrolling Implementation
const BUFFER_SIZE = 3 // Number of photos to render outside visible area
const visiblePhotos = ref<EventPhoto[]>([])
const visibleReversePhotos = ref<EventPhoto[]>([])
const containerWidth = ref(1024) // Default width

// Calculate visible photos based on current animation progress and container width
const calculateVisiblePhotos = (photos: EventPhoto[], isReverse = false): EventPhoto[] => {
  if (photos.length === 0) return []

  // For infinite scroll, we need to show enough photos to fill the visible area plus buffer
  const averagePhotoWidth = 200 // Approximate average photo width
  const photosNeededForVisibleArea = Math.ceil(containerWidth.value / averagePhotoWidth)
  const totalPhotosToRender = Math.min(photos.length, photosNeededForVisibleArea + BUFFER_SIZE * 2)

  // Always show at least the minimum needed for smooth animation
  const minPhotos = Math.min(photos.length, 8)
  const photosToShow = Math.max(totalPhotosToRender, minPhotos)

  // For performance, limit maximum photos rendered at once
  const maxPhotos = Math.min(photos.length, 16)
  const finalCount = Math.min(photosToShow, maxPhotos)

  return photos.slice(0, finalCount)
}

// Throttled update function for virtual scrolling
const updateVisiblePhotos = useAdvancedThrottleFn(
  () => {
    visiblePhotos.value = calculateVisiblePhotos(allPhotosForStrip.value, false)
    visibleReversePhotos.value = calculateVisiblePhotos(reversePhotosForStrip.value, true)
  },
  100,
  { trailing: true, useRAF: true },
)

// Update container width on resize
const updateContainerWidth = useAdvancedThrottleFn(
  () => {
    if (typeof window !== 'undefined') {
      containerWidth.value = window.innerWidth
      updateVisiblePhotos()
    }
  },
  100,
  { trailing: true, useRAF: true },
)

// Memory cleanup with intersection observer
const photoIntersectionObserver = ref<IntersectionObserver | null>(null)
const observedPhotoElements = new WeakMap<
  Element,
  { photoId: string; cleanupTimer: number | null }
>()

// Clean up resources for photos that scroll out of view
const createPhotoIntersectionObserver = () => {
  if (photoIntersectionObserver.value) {
    photoIntersectionObserver.value.disconnect()
  }

  photoIntersectionObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const photoData = observedPhotoElements.get(entry.target)
        if (!photoData) return

        if (entry.isIntersecting) {
          // Photo is visible - cancel any pending cleanup
          if (photoData.cleanupTimer) {
            clearTimeout(photoData.cleanupTimer)
            photoData.cleanupTimer = null
          }
        } else {
          // Photo scrolled out of view - schedule cleanup after delay
          photoData.cleanupTimer = addTimeout(() => {
            const imgElement = entry.target.querySelector('img')
            if (imgElement && !imgElement.closest('.photo-strip')?.contains(imgElement)) {
              // Photo is definitely out of view, perform cleanup
              imgElement.src = '' // Clear src to stop any pending loads
              imgElement.removeAttribute('data-optimized-id')

              // Remove from observed elements
              observedPhotoElements.delete(entry.target)
              photoIntersectionObserver.value?.unobserve(entry.target)
            }
          }, 5000) // 5 second delay before cleanup
        }
      })
    },
    {
      root: null,
      rootMargin: '100px', // Start observing 100px before element enters/exits viewport
      threshold: 0.1,
    },
  )
}

// Observe photo element for memory cleanup
const observePhotoForCleanup = (element: Element, photoId: string) => {
  if (photoIntersectionObserver.value && element) {
    observedPhotoElements.set(element, {
      photoId,
      cleanupTimer: null,
    })
    photoIntersectionObserver.value.observe(element)
  }
}

// Enhanced image load handler using centralized cache
const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  const photoId =
    img.closest('.floating-photo-card')?.getAttribute('data-photo-id') ||
    img.closest('.photo-card')?.getAttribute('data-photo-id')

  if (photoId && img.naturalWidth && img.naturalHeight) {
    const dimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    }

    // Store dimensions for aspect ratio calculations
    imageDimensions.value[photoId] = dimensions
  }
}

// Smart preloading system - loads images in priority batches
const preloadedPhotoIds = new Set<string>()
const preloadQueue = ref<EventPhoto[]>([])
const isPreloading = ref(false)

// Preload images in batches based on priority
const smartPreloadImages = async (
  photos: EventPhoto[],
  priority: 'high' | 'medium' | 'low' = 'medium',
) => {
  if (isPreloading.value && priority === 'low') return // Skip low priority if already preloading

  const photosToPreload = photos.filter((photo) => !preloadedPhotoIds.has(photo.id))
  if (photosToPreload.length === 0) return

  // Batch size based on priority
  const batchSize = priority === 'high' ? photosToPreload.length : priority === 'medium' ? 6 : 3
  const batches = []

  for (let i = 0; i < photosToPreload.length; i += batchSize) {
    batches.push(photosToPreload.slice(i, i + batchSize))
  }

  isPreloading.value = true

  try {
    // Process batches sequentially to avoid overwhelming the network
    for (const batch of batches) {
      const batchPromises = batch.map((photo) =>
        deduplicateRequest(`smart-preload-${photo.id}`, async () => {
          try {
            const src = props.getMediaUrl(photo.image)
            await globalImageCache.preload(src)

            // Mark as preloaded
            preloadedPhotoIds.add(photo.id)

            // Get dimensions from cache and store for aspect ratio calculations
            const dimensions = globalImageCache.getDimensions(src)
            if (dimensions) {
              imageDimensions.value[photo.id] = dimensions
            }
          } catch (error) {
            console.debug(`Failed to preload image for photo ${photo.id}:`, error)
          }
        }),
      )

      await Promise.allSettled(batchPromises)

      // Add small delay between batches to prevent blocking
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, priority === 'high' ? 50 : 100))
      }
    }
  } finally {
    isPreloading.value = false
  }
}

// Legacy function for compatibility
const preloadImageDimensions = (photos: EventPhoto[]) => {
  return smartPreloadImages(photos, 'high')
}

// Preload next batch of photos intelligently
const preloadNextBatch = useAdvancedThrottleFn(
  async () => {
    if (isPreloading.value) return

    const allPhotos = allPhotosForStrip.value
    const visibleCount = visiblePhotos.value.length
    const nextBatchStart = visibleCount
    const nextBatchSize = Math.min(8, allPhotos.length - nextBatchStart)

    if (nextBatchSize > 0) {
      const nextBatch = allPhotos.slice(nextBatchStart, nextBatchStart + nextBatchSize)
      await smartPreloadImages(nextBatch, 'low')
    }
  },
  2000,
  { trailing: true },
) // 2 second throttle for low priority preloading

// Enhanced photo click with immediate response
const handlePhotoClick = (photo: EventPhoto) => {
  // Emit photo open event immediately for better user experience
  emit('openPhoto', photo)
}

// Setup photo animation for staggered reveals
const setupPhotoAnimation = (el: any, id: string, index: number) => {
  if (el && typeof el === 'object' && 'tagName' in el) {
    nextTick(() => {
      observeStaggerElement(el, id, 'photo-gallery')
    })
  }
}

// Enhanced mount with proper resource management
onMounted(async () => {
  if (typeof window !== 'undefined') {
    // Use the performance utility's addEventListener for automatic cleanup
    addEventListener(window, 'resize', updateWindowWidth, { passive: true })
    addEventListener(window, 'resize', updateContainerWidth, { passive: true })
    updateWindowWidth()
    updateContainerWidth()
  }

  // Initialize virtual scrolling
  updateVisiblePhotos()

  // Initialize intersection observer for memory cleanup
  createPhotoIntersectionObserver()

  // Preload visible photos with high priority
  await smartPreloadImages(visiblePhotos.value, 'high')

  // Start background preloading of next batch
  preloadNextBatch()

  // Setup gallery animations after mount
  await nextTick()
  // Additional animation setup can go here
})

onUnmounted(() => {
  // Cancel throttled functions
  updateWindowWidth.cancel()
  updateVisiblePhotos.cancel()
  updateContainerWidth.cancel()
  preloadNextBatch.cancel()

  // Clean up intersection observer and photo elements
  if (photoIntersectionObserver.value) {
    photoIntersectionObserver.value.disconnect()
    photoIntersectionObserver.value = null
  }

  // Clear any pending cleanup timers
  observedPhotoElements.forEach((photoData) => {
    if (photoData.cleanupTimer) {
      clearTimeout(photoData.cleanupTimer)
    }
  })

  // Clear image dimensions cache
  imageDimensions.value = {}

  // Clear virtual scrolling data
  visiblePhotos.value = []
  visibleReversePhotos.value = []

  // Cancel any active animation frames
  activeAnimationFrames.forEach((frameId) => {
    cancelAnimationFrame(frameId)
  })
  activeAnimationFrames.clear()

  // Use the performance utility's comprehensive cleanup
  cleanupPerformance()

  // Clear the global image cache when component unmounts
  // Note: In production, you might want to keep cache across components
  // globalImageCache.clear()
})
</script>

<style scoped>
:root {
  --gallery-spacing: 16px;
}

/* ===== CLEAN GALLERY DESIGN ===== */

/* Infinite Scroll Keyframes - optimized with translate3d for GPU acceleration */

.animate-infinite-scroll {
  animation: infinite-scroll linear infinite;
  will-change: transform;
  /* Optimize for smooth 60fps animation */
  animation-fill-mode: both;
  backface-visibility: hidden;
  perspective: 1000px;
}

.animate-infinite-scroll-reverse {
  animation: infinite-scroll-reverse linear infinite;
  will-change: transform;
  /* Optimize for smooth 60fps animation */
  animation-fill-mode: both;
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Optimize animation performance with compositor layers */
@keyframes infinite-scroll {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}

@keyframes infinite-scroll-reverse {
  0% {
    transform: translate3d(-50%, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}

/* Enhanced Gallery Animation Styles */
.featured-photo-container,
.momentum-scroll-container {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  will-change: opacity, transform;
}

.featured-photo-container.is-visible,
.momentum-scroll-container.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Enhanced photo reveal with scale animation */
.photo-reveal-container {
  transform: scale(0.95);
  transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}

.featured-photo-container.is-visible .photo-reveal-container {
  transform: scale(1);
}

/* Enhanced photo cards with micro-interactions */
.enhanced-photo-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  overflow: hidden;
  transform: translateZ(0);
}

.enhanced-photo-card:hover {
  transform: translateY(-4px) translateZ(0);
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.15);
}

/* Smooth momentum scrolling */
.enhanced-scroll {
  scroll-behavior: smooth;
  overflow-scrolling: touch;
}

/* Pause animation on hover with smooth transition */
.clean-gallery-container:hover .animate-infinite-scroll,
.clean-gallery-reverse:hover .animate-infinite-scroll-reverse {
  animation-play-state: paused;
  transition: filter 0.3s ease;
  filter: brightness(1.1);
}

/* Enhanced gallery containers with performance optimizations */
.momentum-scroll-container {
  contain: layout style paint;
  height: 208px;
  /* Optimize for smooth scrolling */
  transform: translateZ(0);
  will-change: scroll-position;
}

/* Photo strip containers optimized for animation performance */
.photo-strip-wrapper {
  /* Enable hardware acceleration */
  transform: translateZ(0);
  backface-visibility: hidden;
  /* Optimize container for scrolling content */
  contain: layout style paint;
  /* Prevent unnecessary reflows */
  overflow: hidden;
}

/* Clean Gallery Styles */
.clean-gallery-container,
.clean-gallery-reverse {
  height: 208px;
}

/* Photo strip wrapper for clean design */
.photo-strip-wrapper {
  height: 100%;
  width: 100%;
}

/* Clean photo card styling - minimal effects only */
.photo-card {
  overflow: hidden;
}

/* Responsive motion adjustments */
@media (max-width: 640px) {
  .featured-photo-container,
  .momentum-scroll-container {
    transform: translateY(20px);
  }

  .enhanced-photo-card:hover {
    transform: translateY(-2px) translateZ(0);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .featured-photo-container,
  .momentum-scroll-container {
    transition: opacity 0.3s ease;
    transform: none !important;
  }

  .featured-photo-container.is-visible,
  .momentum-scroll-container.is-visible {
    opacity: 1;
    transform: none !important;
  }

  .photo-reveal-container {
    transform: none !important;
    transition: none;
  }

  .enhanced-photo-card {
    transition: box-shadow 0.2s ease;
  }

  .enhanced-photo-card:hover {
    transform: none !important;
  }

  .animate-infinite-scroll,
  .animate-infinite-scroll-reverse {
    animation-duration: 60s !important; /* Slower for reduced motion */
  }
}

/* Enhanced performance optimizations with GPU acceleration */
.photo-strip {
  contain: layout style paint;
  transform: translateZ(0);
  backface-visibility: hidden;
  /* Optimize for continuous animation */
  will-change: transform;
}

.enhanced-photo-card {
  /* Force GPU layer creation */
  transform: translateZ(0);
  backface-visibility: hidden;
  /* Optimize rendering */
  contain: layout style paint;
}

.enhanced-photo-card img {
  /* Optimized for hover animations */
  will-change: auto;
  backface-visibility: hidden;
  /* Improve image rendering quality during animations */
  image-rendering: optimizeQuality;
}

.enhanced-photo-card:hover img {
  will-change: transform, filter;
}

/* Remove will-change after hover ends to save GPU memory */
.enhanced-photo-card:not(:hover) img {
  will-change: auto;
  transition-delay: 300ms; /* Delay removing will-change until animation completes */
}

/* Optimized image loading performance */
.enhanced-photo-card img[data-optimized-id] {
  /* Force browser to cache and reuse identical src images */
  image-rendering: optimizeQuality;
  /* Optimize for repeated use */
  image-orientation: from-image;
  /* GPU acceleration for smooth scrolling */
  transform: translateZ(0);
}

/* Memory optimization for duplicate images with content-visibility */
.enhanced-photo-card img[data-optimized-id^='opt-dup-'],
.enhanced-photo-card img[data-optimized-id^='opt-rev-dup-'] {
  /* Second instances should leverage cached images */
  content-visibility: auto;
  contain-intrinsic-size: 188px 188px;
}

/* Virtual scrolling optimizations - use content-visibility for off-screen elements */
.photo-card {
  /* Improve rendering performance for scrollable content */
  content-visibility: auto;
  contain-intrinsic-size: 188px 188px;
  /* Optimize for translation animations */
  transform: translateZ(0);
}

/* Optimize featured photo for immediate visibility */
.featured-photo-container {
  /* Ensure featured photo gets priority rendering */
  content-visibility: visible;
  contain: layout style paint;
}

/* Responsive gallery heights */
@media (max-width: 768px) {
  .clean-gallery-container,
  .clean-gallery-reverse,
  .momentum-scroll-container {
    height: 190px;
  }
}

@media (max-width: 640px) {
  .clean-gallery-container,
  .clean-gallery-reverse,
  .momentum-scroll-container {
    height: 208px;
  }
}
</style>
