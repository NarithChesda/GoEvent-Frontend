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
    <div v-else ref="gridRef" class="photo-grid">
      <div
        v-for="(photo, index) in photos"
        :key="photo.id"
        :ref="(el) => setPhotoRef(el as HTMLElement | null, index)"
        class="photo-item"
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
        <div class="relative">
          <img
            v-show="!imageLoadingStates[photo.id] && !imageErrorStates[photo.id]"
            :data-photo-id="photo.id"
            :src="getOptimizedPhotoUrl(photo.image)"
            :srcset="getPhotoSrcset(photo.image)"
            :sizes="photoSizes"
            :alt="photo.caption || 'Event Photo'"
            :loading="index < 4 ? 'eager' : 'lazy'"
            :decoding="index < 3 ? 'sync' : 'async'"
            :fetchpriority="index < 2 ? 'high' : 'auto'"
            class="pointer-events-none"
            v-bind="protectionAttrs"
            @load="handleImageLoad(String(photo.id))"
            @error="handleImageError(String(photo.id))"
          />
          <!-- Transparent protection overlay (production-only) -->
          <div
            v-if="isProduction && !imageLoadingStates[photo.id] && !imageErrorStates[photo.id]"
            class="absolute inset-0 z-10"
            @contextmenu.prevent
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, reactive, watch, nextTick } from 'vue'
import type { EventPhoto } from '../../composables/useEventShowcase'
import {
  useTemplateProcessor,
  PHOTO_DELIVERY,
} from '../../composables/showcase/useTemplateProcessor'
import { useAssetProtection } from '../../composables/showcase/useAssetProtection'
import { registerScrollProgress, refreshScrollProgress } from '@/composables/showcase/useScrollProgress'

// Asset protection (production-only)
const { isProduction, protectionAttrs } = useAssetProtection()

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
const { getOptimizedMediaUrl, getOptimizedMediaSrcset } = useTemplateProcessor()

/**
 * The photo's rendered CSS width, fed to `sizes` so the browser can pick a
 * `srcset` rung. Measured rather than derived from the viewport: `.photo-grid`
 * is a single column inside the 85vw liquid-glass card, whose padding moves
 * across six breakpoints and whose width changes again in wide mode — and the
 * whole showcase also renders inside a phone-sized preview iframe, where any
 * `vw` estimate would describe the wrong box.
 *
 * The initial guess only has to survive until the ResizeObserver fires on mount;
 * it is deliberately generous, because guessing high costs one rung of bytes
 * while guessing low costs visible sharpness.
 */
const gridRef = ref<HTMLElement | null>(null)
const measuredPhotoWidth = ref(
  typeof window === 'undefined' ? 1080 : Math.round(window.innerWidth * 0.85),
)
const photoSizes = computed(() => `${measuredPhotoWidth.value}px`)

let gridResizeObserver: ResizeObserver | null = null

const observeGridWidth = () => {
  if (!gridRef.value || typeof ResizeObserver === 'undefined') return
  gridResizeObserver = new ResizeObserver((entries) => {
    const width = Math.round(entries[0]?.contentRect.width ?? 0)
    // Only ever grow. A card mid-transition (scaled, or briefly zero-width
    // while the stage animates in) would otherwise report a small box and
    // demote every photo already on screen to a lower rung.
    if (width > measuredPhotoWidth.value) measuredPhotoWidth.value = width
  })
  gridResizeObserver.observe(gridRef.value)
}

/**
 * `src` is the fallback for browsers without srcset support and the candidate
 * the parser uses before `sizes` is resolved; keep it mid-ladder so neither
 * case is badly served.
 */
const getOptimizedPhotoUrl = (imageUrl: string) =>
  getOptimizedMediaUrl(imageUrl, { ...PHOTO_DELIVERY, width: 1080, retina: 1 })

const getPhotoSrcset = (imageUrl: string) =>
  getOptimizedMediaSrcset(imageUrl, PHOTO_DELIVERY) || undefined

// Image loading states
const imageLoadingStates = reactive<Record<string, boolean>>({})
const imageErrorStates = reactive<Record<string, boolean>>({})
const imageRetryCount = reactive<Record<string, number>>({})
const MAX_RETRIES = 3

// IntersectionObserver for lazy image loading states
const lazyImageObserver = ref<IntersectionObserver | null>(null)

// Scroll-driven zoom animation state
const photoRefs = ref<Map<number, HTMLElement>>(new Map())

// Scroll-driven scale/fade is measured by the shared useScrollProgress
// registry — one listener and one rAF for every registered element on the page,
// with reads batched ahead of writes.
const disposers = new Map<number, () => void>()

// Set photo element refs for scroll animation. Registration happens here rather
// than in a deferred setup pass so a photo that mounts late (or has its element
// swapped on re-render) is tracked from its first frame instead of being missed
// by a one-time snapshot.
const setPhotoRef = (el: HTMLElement | null, index: number) => {
  disposers.get(index)?.()
  disposers.delete(index)

  if (el) {
    photoRefs.value.set(index, el)
    el.style.setProperty('--scroll-progress', '0')
    disposers.set(index, registerScrollProgress(el))
  } else {
    photoRefs.value.delete(index)
  }
}

const setupScrollListener = () => {
  refreshScrollProgress()
}

const teardownScrollListener = () => {
  disposers.forEach((dispose) => dispose())
  disposers.clear()
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

onMounted(() => {
  initializeImageStates()
  observeGridWidth()

  // Wait for DOM/layout, then attach observers and scroll listener
  setTimeout(() => {
    setupLazyImageObserver()
    setupScrollListener()
  }, 100)
})

// Watch for photo changes to reinitialize states
watch(() => props.photos, (newPhotos, oldPhotos) => {
  if (newPhotos !== oldPhotos) {
    if (lazyImageObserver.value) {
      lazyImageObserver.value.disconnect()
    }
    teardownScrollListener()

    Object.keys(imageLoadingStates).forEach(key => {
      delete imageLoadingStates[key]
    })
    Object.keys(imageErrorStates).forEach(key => {
      delete imageErrorStates[key]
    })
    Object.keys(imageRetryCount).forEach(key => {
      delete imageRetryCount[key]
    })

    photoRefs.value.clear()

    initializeImageStates()

    setTimeout(() => {
      setupLazyImageObserver()
      setupScrollListener()
    }, 100)
  }
}, { deep: false })

onUnmounted(() => {
  gridResizeObserver?.disconnect()
  gridResizeObserver = null

  if (lazyImageObserver.value) {
    lazyImageObserver.value.disconnect()
    lazyImageObserver.value = null
  }
  teardownScrollListener()

  Object.keys(imageLoadingStates).forEach(key => {
    delete imageLoadingStates[key]
  })
  Object.keys(imageErrorStates).forEach(key => {
    delete imageErrorStates[key]
  })
  Object.keys(imageRetryCount).forEach(key => {
    delete imageRetryCount[key]
  })

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
  --scroll-progress: 0;
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  border-radius: 0.5rem;
  /* Scroll-driven zoom, matched to AgendaItem. Kept to a narrow range: a
     0.68→1 scale rasterizes the photo at a fractional size for most of its time
     on screen, and the symmetric mapping shrank photos away at the top edge
     while they were still being looked at.
     No `will-change`: a 30-photo gallery would hold 30 permanent compositor
     layers on a phone, above a backdrop-filtered card. */
  opacity: calc(0.55 + 0.45 * var(--scroll-progress));
  transform: scale(calc(0.94 + 0.06 * var(--scroll-progress)));
  transform-origin: center center;
}

.photo-item img {
  width: 100%;
  height: auto;
  display: block;
  /* No `image-rendering` override. Blink treats -webkit-optimize-contrast as
     crisp-edges, i.e. a nearest-neighbour-ish filter, which aliases at any
     scale factor other than 1 — and the served image never lands on exactly 1,
     since srcset picks the nearest rung above the box. The mobile block below
     used to reset it to auto, which was the tell: it was only ever "optimizing"
     desktop, where the upscale was worst. */
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
    --scroll-progress: 1;
    opacity: 1;
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
