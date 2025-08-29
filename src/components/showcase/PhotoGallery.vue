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
      <div v-if="featuredPhoto" class="mb-4 sm:mb-6">
        <div class="rounded-xl overflow-hidden">
          <img
            :src="getMediaUrl(featuredPhoto.image)"
            :alt="featuredPhoto.caption || 'Featured Event Photo'"
            class="w-full h-48 sm:h-56 md:h-64 object-cover cursor-pointer transition-transform hover:scale-105"
            @click="$emit('openPhoto', featuredPhoto)"
            loading="lazy"
          />
          <p
            v-if="featuredPhoto.caption"
            class="text-xs sm:text-sm mt-2 text-center"
            :style="{ color: primaryColor, opacity: '0.8' }"
          >
            {{ featuredPhoto.caption }}
          </p>
        </div>
      </div>

      <!-- Clean Photo Gallery -->
      <div class="clean-gallery-container overflow-hidden" style="margin-bottom: 0px">
        <!-- Photo strip with infinite scroll -->
        <div class="photo-strip-wrapper overflow-hidden flex items-center">
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
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`
              }"
              @click="$emit('openPhoto', photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-transform group-hover:scale-105"
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
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`
              }"
              @click="$emit('openPhoto', photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-transform group-hover:scale-105"
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
      <div class="clean-gallery-reverse overflow-hidden" style="margin-top: 0px">
        <!-- Photo strip with reverse infinite scroll -->
        <div class="photo-strip-wrapper overflow-hidden flex items-center">
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
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`
              }"
              @click="$emit('openPhoto', photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-transform group-hover:scale-105"
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
              class="photo-card flex-shrink-0 relative overflow-hidden cursor-pointer group"
              :data-photo-id="photo.id"
              :style="{
                height: windowWidth < 640 ? '188px' : windowWidth < 768 ? '150px' : '188px',
                width: `${getPhotoWidth(photo)}px`
              }"
              @click="$emit('openPhoto', photo)"
            >
              <img
                :src="getMediaUrl(photo.image)"
                :alt="photo.caption || 'Event Photo'"
                class="w-full h-full object-contain transition-transform group-hover:scale-105"
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { EventPhoto } from '../../composables/useEventShowcase'
import {
  translateRSVP,
  type SupportedLanguage
} from '../../utils/translations'

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


// Image dimensions cache for aspect ratio calculations
const imageDimensions = ref<Record<string, { width: number; height: number }>>({})

// Track window width for responsive calculations
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

// Update window width on resize
const updateWindowWidth = () => {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
  }
}

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

// Handle image load to get actual dimensions
const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  const photoId = img.closest('.floating-photo-card')?.getAttribute('data-photo-id') ||
                 img.closest('.photo-card')?.getAttribute('data-photo-id')

  if (photoId && img.naturalWidth && img.naturalHeight) {
    imageDimensions.value[photoId] = {
      width: img.naturalWidth,
      height: img.naturalHeight
    }
  }
}

// Preload image dimensions on mount
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateWindowWidth)
    updateWindowWidth()
  }

  // Preload dimensions for all photos
  allPhotosForStrip.value.forEach(photo => {
    const img = new Image()
    img.onload = () => {
      imageDimensions.value[photo.id] = {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
    }
    img.src = props.getMediaUrl(photo.image)
  })
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateWindowWidth)
  }
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

/* Pause animation on hover */
.clean-gallery-container:hover .animate-infinite-scroll,
.clean-gallery-reverse:hover .animate-infinite-scroll-reverse {
  animation-play-state: paused;
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

/* Responsive gallery heights */
@media (max-width: 768px) {
  .clean-gallery-container, .clean-gallery-reverse {
    height: 190px;
  }
}

@media (max-width: 640px) {
  .clean-gallery-container, .clean-gallery-reverse {
    height: 208px;
  }
}

/* Removed all blur effects for clean photo display */






</style>
