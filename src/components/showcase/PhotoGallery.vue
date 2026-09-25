<template>
  <div class="gd mb-6 sm:mb-8" :class="`gd--${designType}`" :style="contractStyle">
    <!-- Gallery Header. Deliberately identical in markup and type scale to the
         video section's header: the film and the photographs come from the same
         shoot, and every other section on the invitation announces itself, so
         the gallery arriving unnamed read as an appendix rather than a chapter. -->
    <div
      v-if="photos.length > 0"
      class="text-center laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8 laptop-sm:-mt-2 laptop-md:-mt-2 laptop-lg:-mt-3"
    >
      <h2
        :class="[
          'leading-tight text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular sm:mb-4 md:mb-6 capitalize gallery-header',
          currentLanguage === 'kh' && 'khmer-text-fix',
          fx('primary'),
        ]"
        :style="{
          fontFamily: primaryFont || currentFont,
          color: primaryColor,
        }"
      >
        <span class="tfx-ink">{{ galleryHeaderText }}</span>
      </h2>
    </div>

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

    <!-- The photographs, in the template's chosen composition. The design owns
         how they are laid down and how each one arrives; this owns the header
         above them and the colours they are drawn in (contractStyle). -->
    <component
      :is="designComponent"
      v-else
      :photos="photos"
      :primary-color="primaryColor"
      :bleed-class="bleedClass"
      :alt="photoAlt"
      @open-photo="emit('openPhoto', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTextEffect } from '@/composables/showcase/useTextEffects'
import type { EventPhoto } from '../../composables/useEventShowcase'
import type {
  GalleryDesignConfig,
  GalleryDesignType,
} from '@/services/api/types/template.types'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

import GalleryColumn from './gallery-designs/GalleryColumn.vue'
import GalleryReel from './gallery-designs/GalleryReel.vue'
import GalleryPrints from './gallery-designs/GalleryPrints.vue'
import GalleryMosaic from './gallery-designs/GalleryMosaic.vue'
import GalleryBooth from './gallery-designs/GalleryBooth.vue'
import GalleryFilm from './gallery-designs/GalleryFilm.vue'

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
  /** The template's chosen composition. Absent or unknown renders `column`. */
  galleryDesign?: GalleryDesignConfig | null
  /** The stage's edge-to-edge margins; only the reel spends them. */
  bleedClass?: string
}

const props = defineProps<Props>()

// Metallic lettering for the section heading, if the template struck its
// primary slot in one (see useTextEffects.ts).
const fx = useTextEffect()

const emit = defineEmits<{
  openPhoto: [EventPhoto]
}>()

// ---------------------------------------------------------------------------
// Design selection
// ---------------------------------------------------------------------------

const DESIGNS = {
  column: GalleryColumn,
  reel: GalleryReel,
  prints: GalleryPrints,
  mosaic: GalleryMosaic,
  booth: GalleryBooth,
  film: GalleryFilm,
} as const

/**
 * `column` for anything absent or unrecognised — the gallery every event has
 * always had, so a template that never set the field and one naming a design
 * this build doesn't ship both render something sensible.
 */
const designType = computed<GalleryDesignType>(() => {
  const type = props.galleryDesign?.type
  return type && type in DESIGNS ? type : 'column'
})

const designComponent = computed(() => DESIGNS[designType.value])

/**
 * The contract every design reads. A design never takes a template colour as
 * a prop; it reads these, so all five draw from one decision:
 *
 *   --gd-ink       the template's primary: mats, outlines, focus rings, the
 *                  dark a mosaic tile surfaces from.
 *   --gd-accent    the template's accent, for the one mark a design may spend
 *                  it on.
 *   --gd-ease-*    the showcase's curves, declared here so a design renders
 *                  identically inside a preview frame, which mounts sections
 *                  outside `.showcase-container`.
 */
const contractStyle = computed(() => ({
  '--gd-ink': props.primaryColor,
  '--gd-accent': props.accentColor,
  '--gd-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
  '--gd-ease-atmos': 'cubic-bezier(0.33, 1, 0.68, 1)',
}))

// Header copy: organizer-authored `gallery_header` text when present, otherwise
// the shipped translation. Same resolution order as every other section header.
const galleryHeaderText = computed(() => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (t) => t.text_type === 'gallery_header' && t.language === props.currentLanguage,
    )
    if (text?.content) return text.content
  }
  return translateRSVP('gallery_header', (props.currentLanguage as SupportedLanguage) || 'en')
})

/** What a photograph without a caption is announced as — the column's words. */
const photoAlt = 'Event Photo'
</script>

<style scoped>
/* Header scale ladder, copied verbatim from .video-header so the two headers
   stay the same size on every laptop breakpoint. */
@media (min-width: 1024px) and (max-width: 1365px) {
  .gallery-header {
    font-size: 1.265625rem !important; /* 1.875rem * 0.675 - exact mobile ratio */
    line-height: 1.25 !important;
    padding-top: 0rem !important;
    padding-bottom: 0.3375rem !important;
    margin-bottom: 1.0125rem !important;
  }
}

@media (min-width: 1366px) and (max-width: 1535px) {
  .gallery-header {
    font-size: 1.40625rem !important; /* 1.875rem * 0.75 - exact mobile ratio */
    line-height: 1.25 !important;
    padding-top: 0rem !important;
    padding-bottom: 0.375rem !important;
    margin-bottom: 1.125rem !important;
  }
}

@media (min-width: 1536px) {
  .gallery-header {
    font-size: 1.875rem !important; /* 30px - text-3xl */
  }
}
</style>
