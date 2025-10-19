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
        :ref="(el) => setPhotoRef(el, index)"
        class="photo-item"
        @click="handlePhotoClick(photo)"
      >
        <img
          :src="getMediaUrl(photo.image)"
          :alt="photo.caption || 'Event Photo'"
          loading="lazy"
          :decoding="index < 3 ? 'sync' : 'async'"
          :fetchpriority="index < 2 ? 'high' : 'auto'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { EventPhoto } from '../../composables/useEventShowcase'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

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

// Scroll animation with Intersection Observer
const photoRefs = ref<(Element | null)[]>([])
const observer = ref<IntersectionObserver | null>(null)

const setPhotoRef = (el: any, index: number) => {
  if (el) {
    photoRefs.value[index] = el as Element
  }
}

onMounted(() => {
  // Use Intersection Observer for scroll animations - optimized for mobile
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('photo-visible')
          // Unobserve after animation to improve performance
          observer.value?.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.1, // Trigger when 10% visible
      rootMargin: '50px', // Start animation slightly before entering viewport
    }
  )

  // Observe all photo items
  photoRefs.value.forEach((ref) => {
    if (ref) {
      observer.value?.observe(ref)
    }
  })
})

onUnmounted(() => {
  // Clean up observer
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
  photoRefs.value = []
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
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.photo-item.photo-visible {
  opacity: 1;
  transform: translateY(0);
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

/* Mobile optimizations for messaging app browsers */
@media (max-width: 768px) {
  .photo-grid {
    gap: 0.75rem;
  }

  .photo-item {
    /* Lighter animation on mobile for better performance */
    transform: translateY(10px);
    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
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
}

/* Reduce motion for accessibility and battery saving */
@media (prefers-reduced-motion: reduce) {
  .photo-item {
    transform: none;
    transition: opacity 0.3s ease;
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
}
</style>
