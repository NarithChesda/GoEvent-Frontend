<template>
  <div class="text-center space-y-6 sm:space-y-8">
    <!-- Primary Content Block -->
    <div v-if="descriptionTitle || descriptionText" class="space-y-4">
      <!-- Description Title -->
      <div v-if="descriptionTitle">
        <h2
          :class="[
            'text-base sm:text-lg md:text-xl lg:text-2xl font-regular leading-tight capitalize',
            currentLanguage === 'kh' && 'khmer-text-fix',
          ]"
          :style="{
            fontFamily: primaryFont || currentFont,
            color: primaryColor,
          }"
        >
          {{ descriptionTitle }}
        </h2>
      </div>

      <!-- Description Text -->
      <div v-if="descriptionText">
        <p
          :class="[
            'text-sm sm:text-base leading-normal text-center max-w-full break-words whitespace-pre-wrap opacity-90 px-4',
            currentLanguage === 'kh' && 'khmer-text-fix',
          ]"
          :style="{
            fontFamily: secondaryFont || currentFont,
            color: primaryColor,
            wordWrap: 'break-word',
            hyphens: 'auto',
          }"
        >
          {{ capitalizedDescription }}
        </p>
      </div>
    </div>

    <!-- Event Details Block -->
    <div class="space-y-3">
      <div
        class="block relative gradient-stroke-container"
        :style="{
          background: `${primaryColor}60`,
          padding: '2px',
          borderRadius: '2rem',
        }"
      >
        <div
          class="px-4 pt-3 pb-4 backdrop-blur-sm space-y-2 relative"
          style="border-radius: calc(2rem - 2px); border: 2px solid white"
          :style="{
           background: `${primaryColor}60`,
          }"
        >
          <!-- Date Text -->
          <div class="text-sm sm:text-base font-medium leading-snug" v-if="dateText">
            <span
              :class="['text-white', currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{
                fontFamily: secondaryFont || currentFont,
              }"
            >
              {{ dateText }}
            </span>
          </div>

          <!-- Location Text -->
          <div class="text-sm sm:text-base font-medium leading-snug" v-if="locationText">
            <span
              :class="['text-white', currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{
                fontFamily: secondaryFont || currentFont,
              }"
            >
              {{ locationText }}
            </span>
          </div>

          <!-- Google Map Embed -->
          <div v-if="hasGoogleMap && googleMapEmbedLink" class="pt-2">
            <div
              class="aspect-video overflow-hidden"
              :style="{
                border: `1px solid rgba(255, 255, 255, 0.3)`,
                borderRadius: '1rem',
              }"
            >
              <iframe
                :src="googleMapEmbedLink"
                width="100%"
                height="100%"
                style="border: 0"
                :allowfullscreen="false"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <!-- RSVP Section Integrated Below Map -->
          <div v-if="showRsvp" class="pt-4">
            <slot name="rsvp"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  descriptionTitle?: string
  descriptionText?: string
  dateText?: string
  timeText?: string
  locationText?: string
  hasGoogleMap?: boolean
  googleMapEmbedLink?: string
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  currentLanguage?: string
  showRsvp?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRsvp: false
})

defineEmits<{
  openMap: []
}>()

// Computed property to ensure description starts with capital letter
const capitalizedDescription = computed(() => {
  if (!props.descriptionText) return ''
  const text = props.descriptionText.trim()
  if (text.length === 0) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
})
</script>

<style scoped>
.glass-section {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Enhanced Khmer font rendering */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
}

/* Small laptops 13-inch (1024px-1365px) - Match mobile base scale */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Title - match mobile base text-base (1rem = 16px) */
  h2 {
    font-size: 1rem !important; /* 16px - same as mobile base text-base */
    line-height: 1.25rem !important; /* tight leading */
  }

  /* Description text - match mobile base text-sm (0.875rem = 14px) */
  p {
    font-size: 0.875rem !important; /* 14px - same as mobile base text-sm */
    line-height: 1.25rem !important; /* normal leading */
  }

  /* Details text inside card - match mobile base text-sm (0.875rem = 14px) */
  .text-sm {
    font-size: 0.875rem !important; /* 14px - same as mobile base text-sm */
    line-height: 1.4rem !important; /* increased for better readability */
  }

  /* Override leading-snug for date and location text */
  .leading-snug {
    line-height: 1.4rem !important; /* increased for better readability */
  }

  /* Scale spacing to match mobile base */
  .space-y-6 > * + * {
    margin-top: 1.5rem !important; /* space-y-6 mobile base */
  }

  .space-y-8 > * + * {
    margin-top: 1.5rem !important; /* match space-y-6 for consistency */
  }

  .space-y-4 > * + * {
    margin-top: 0.25rem !important; /* Reduced from 1rem */
  }

  .space-y-3 > * + * {
    margin-top: 0.75rem !important; /* space-y-3 */
  }

  .space-y-2 > * + * {
    margin-top: 0.5rem !important; /* space-y-2 */
  }

  /* Padding - match mobile base sizes */
  .px-4 {
    padding-left: 1rem !important; /* 16px */
    padding-right: 1rem !important;
  }

  .pt-3 {
    padding-top: 0.75rem !important; /* 12px */
  }

  .pb-4 {
    padding-bottom: 1rem !important; /* 16px */
  }

  .pt-2 {
    padding-top: 0.5rem !important; /* 8px */
  }

  .pt-4 {
    padding-top: 1rem !important; /* 16px */
  }

  /* Border radius - match mobile */
  .gradient-stroke-container {
    border-radius: 2rem !important;
  }

  /* Map container - maintain aspect ratio */
  .aspect-video {
    aspect-ratio: 16 / 9; /* Standard video aspect ratio */
  }
}

/* Medium laptops 14-15 inch (1366px+) */
@media (min-width: 1366px) {
  h2 {
    font-size: 1.25rem !important; /* 20px - slightly larger */
  }

  p {
    font-size: 1rem !important; /* 16px - md:text-base */
  }

  .text-sm {
    font-size: 1rem !important; /* 16px */
  }
}

/* Large laptops 16+ inch (1536px+) */
@media (min-width: 1536px) {
  h2 {
    font-size: 1.5rem !important; /* 24px - lg:text-2xl */
  }

  p {
    font-size: 1rem !important; /* 16px */
  }

  .text-sm {
    font-size: 1rem !important; /* 16px */
  }
}
</style>
