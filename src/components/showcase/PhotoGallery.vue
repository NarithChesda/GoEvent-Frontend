<template>
  <div class="mb-6 sm:mb-8">
    <h2
      class="leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-semibold sm:mb-4 md:mb-6 uppercase text-center"
      :style="{
        fontFamily: primaryFont || currentFont,
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }"
    >
      {{ galleryHeaderText }}
    </h2>

    <!-- No Photos Placeholder -->
    <div v-if="photos.length === 0" class="p-6 sm:p-8 rounded-xl text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" :style="{ backgroundColor: primaryColor + '20' }">
        <svg class="w-8 h-8" :style="{ color: primaryColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
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
        :ref="el => setupPhotoAnimation(el, 'featured-photo', 0)"
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
        :ref="el => setupPhotoAnimation(el, 'photo-gallery', 1)"
      >
        <!-- Photo strip with infinite scroll -->
        <div class="photo-strip-wrapper overflow-hidden flex items-center enhanced-scroll">
          <div
            class="photo-strip flex animate-infinite-scroll items-center"
            style="gap: var(--gallery-spacing, 16px)"
            :style="{
              '--strip-width': `${stripWidth}px`,
              animationDuration: `${animationDuration}s`
            }"
          >
            <!-- First set of photos -->
            <div
              v-for="photo in allPhotosForStrip"
              :key="`first-${photo.id}`"
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group enhanced-photo-card"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`
              }"
              @click="handlePhotoClick(photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
                @load="onImageLoad"
              />

              <!-- Caption overlay -->
              <div
                v-if="photo.caption"
                class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ photo.caption }}
              </div>
            </div>

            <!-- Duplicate set for seamless infinite scroll -->
            <div
              v-for="photo in allPhotosForStrip"
              :key="`second-${photo.id}`"
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group enhanced-photo-card"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`
              }"
              @click="handlePhotoClick(photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
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
        :ref="el => setupPhotoAnimation(el, 'reverse-gallery', 2)"
      >
        <!-- Photo strip with reverse infinite scroll -->
        <div class="photo-strip-wrapper overflow-hidden flex items-center enhanced-scroll">
          <div
            class="photo-strip flex animate-infinite-scroll-reverse items-center"
            style="gap: var(--gallery-spacing, 16px)"
            :style="{
              '--strip-width': `${stripWidth}px`,
              animationDuration: `${reverseAnimationDuration}s`
            }"
          >
            <!-- First set of photos (reversed order) -->
            <div
              v-for="photo in reversePhotosForStrip"
              :key="`reverse-first-${photo.id}`"
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group enhanced-photo-card"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`
              }"
              @click="handlePhotoClick(photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
                @load="onImageLoad"
              />

              <!-- Caption overlay -->
              <div
                v-if="photo.caption"
                class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ photo.caption }}
              </div>
            </div>

            <!-- Duplicate set for seamless infinite scroll (reversed) -->
            <div
              v-for="photo in reversePhotosForStrip"
              :key="`reverse-second-${photo.id}`"
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group enhanced-photo-card"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`
              }"
              @click="handlePhotoClick(photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
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
import { computed, ref, onMounted, onUnmounted, getCurrentInstance, nextTick } from 'vue'
import type { EventPhoto } from '../../composables/useEventShowcase'
import {
  translateRSVP,
  type SupportedLanguage
} from '../../utils/translations'
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

defineEmits<{
  openPhoto: [EventPhoto]
}>()

// Animation setup for staggered photo reveals
const { observeStaggerElement } = useStaggerAnimation({
  animationType: 'scaleIn',
  duration: ANIMATION_CONSTANTS.DURATION.NORMAL,
  staggerDelay: 80,
  easing: ANIMATION_CONSTANTS.EASING.EXPO,
  threshold: 0.3
})

// Enhanced momentum scrolling for smoother gallery experience
const { scrollToElement, isScrolling } = useMomentumScroll({
  friction: 0.95,
  acceleration: 0.08,
  maxVelocity: 30
})

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(text =>
      text.text_type === textType && text.language === props.currentLanguage
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
  const keyMap: Record<string, keyof typeof import('../../utils/translations').rsvpTranslations.en> = {
    'gallery_header': 'gallery_header'
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

const galleryHeaderText = computed(() =>
  getTextContent('gallery_header', 'Photo Gallery')
)

// Gallery spacing constant - must match CSS custom property
const GALLERY_SPACING = 16

const featuredPhoto = computed(() =>
  props.photos.find(photo => photo.is_featured)
)

const nonFeaturedPhotos = computed(() =>
  props.photos.filter(photo => !photo.is_featured)
)


// Performance utilities with automatic cleanup
const {
  addCleanup,
  addEventListener,
  addTimeout,
  requestAnimationFrame,
  cancelAnimationFrame,
  deduplicateRequest,
  cleanup: cleanupPerformance
} = usePerformance()

// Image dimensions cache for aspect ratio calculations - using WeakMap for better memory management
const imageDimensions = ref<Record<string, { width: number; height: number }>>({})
const imageCache = new WeakMap<HTMLImageElement, { width: number; height: number }>()

// Track window width for responsive calculations
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

// Throttled resize handler to prevent excessive recalculations
const updateWindowWidth = useAdvancedThrottleFn(() => {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
  }
}, 100, { trailing: true, useRAF: true })

// Animation frame IDs for cleanup
const activeAnimationFrames = new Set<number>()
const preloadedImages = new Set<HTMLImageElement>()

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

// Calculate strip width for animation
const stripWidth = computed((): number => {
  let totalWidth = 0
  allPhotosForStrip.value.forEach(photo => {
    totalWidth += getPhotoWidth(photo) + GALLERY_SPACING // Consistent spacing throughout gallery
  })
  return totalWidth
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

// Enhanced image load handler with memory management
const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  const photoId = img.closest('.floating-photo-card')?.getAttribute('data-photo-id') ||
                 img.closest('.photo-card')?.getAttribute('data-photo-id')

  if (photoId && img.naturalWidth && img.naturalHeight) {
    const dimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight
    }
    
    // Store in both reactive ref and WeakMap cache
    imageDimensions.value[photoId] = dimensions
    imageCache.set(img, dimensions)
    
    // Clean up the reference after use to prevent memory leaks
    addTimeout(() => {
      // Only remove from cache if image is no longer in DOM
      if (!img.isConnected) {
        imageCache.delete(img)
      }
    }, 5000)
  }
}

// Optimized image preloading with proper cleanup
const preloadImageDimensions = async (photos: EventPhoto[]) => {
  // Cancel any existing preload operations
  preloadedImages.forEach(img => {
    img.onload = null
    img.onerror = null
  })
  preloadedImages.clear()

  const preloadPromises = photos.map(photo => {
    return deduplicateRequest(`preload-${photo.id}`, async () => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        preloadedImages.add(img)
        
        img.onload = () => {
          if (img.naturalWidth && img.naturalHeight) {
            imageDimensions.value[photo.id] = {
              width: img.naturalWidth,
              height: img.naturalHeight
            }
            imageCache.set(img, imageDimensions.value[photo.id])
          }
          resolve()
        }
        
        img.onerror = () => {
          console.warn(`Failed to preload image: ${photo.image}`)
          resolve()
        }
        
        // Add cleanup for the image reference
        addCleanup(() => {
          img.onload = null
          img.onerror = null
          imageCache.delete(img)
          preloadedImages.delete(img)
        })
        
        img.src = props.getMediaUrl(photo.image)
      })
    })
  })

  try {
    await Promise.allSettled(preloadPromises)
  } catch (error) {
    console.warn('Error during image preloading:', error)
  }
}

// Enhanced photo click with momentum scroll and proper cleanup
const handlePhotoClick = (photo: EventPhoto) => {
  // Add a subtle scroll animation before opening photo
  if (!isScrolling.value) {
    const instance = getCurrentInstance()
    const emit = instance?.emit
    if (emit) {
      // Use managed timeout instead of raw setTimeout
      addTimeout(() => {
        emit('openPhoto', photo)
      }, 50)
    }
  }
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
    updateWindowWidth()
  }

  // Preload dimensions for all photos with proper cleanup
  await preloadImageDimensions(allPhotosForStrip.value)

  // Setup gallery animations after mount
  await nextTick()
  // Additional animation setup can go here
})

onUnmounted(() => {
  // Cancel throttled functions
  updateWindowWidth.cancel()
  
  // Clean up preloaded images
  preloadedImages.forEach(img => {
    img.onload = null
    img.onerror = null
  })
  preloadedImages.clear()
  
  // Clear image dimensions cache
  imageDimensions.value = {}
  
  // Cancel any active animation frames
  activeAnimationFrames.forEach(frameId => {
    cancelAnimationFrame(frameId)
  })
  activeAnimationFrames.clear()
  
  // Use the performance utility's comprehensive cleanup
  cleanupPerformance()
})
</script>

<style scoped>
:root {
  --gallery-spacing: 16px;
}


/* ===== CLEAN GALLERY DESIGN ===== */

/* Infinite Scroll Keyframes */
@keyframes infinite-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-50%));
  }
}

@keyframes infinite-scroll-reverse {
  0% {
    transform: translateX(calc(-50%));
  }
  100% {
    transform: translateX(0);
  }
}

.animate-infinite-scroll {
  animation: infinite-scroll linear infinite;
  will-change: transform;
}

.animate-infinite-scroll-reverse {
  animation: infinite-scroll-reverse linear infinite;
  will-change: transform;
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

/* Enhanced gallery containers */
.momentum-scroll-container {
  contain: layout style paint;
  height: 208px;
}

/* Clean Gallery Styles */
.clean-gallery-container, .clean-gallery-reverse {
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

/* Enhanced performance optimizations */
.photo-strip {
  contain: layout style paint;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.enhanced-photo-card img {
  will-change: transform, filter;
  backface-visibility: hidden;
}

/* Responsive gallery heights */
@media (max-width: 768px) {
  .clean-gallery-container, .clean-gallery-reverse,
  .momentum-scroll-container {
    height: 190px;
  }
}

@media (max-width: 640px) {
  .clean-gallery-container, .clean-gallery-reverse,
  .momentum-scroll-container {
    height: 208px;
  }
}






</style>
