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

/* Small laptops 13-inch (1024px-1365px) - Scale down to 67.5% (75% - 10%) */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Scale content to 67.5% without reducing container */
  h2 {
    font-size: 0.675rem !important; /* 67.5% of 1rem = 10.8px */
    line-height: 0.84375rem !important; /* 67.5% of 1.25rem */
  }

  p {
    font-size: 0.5484375rem !important; /* 67.5% of 0.8125rem = ~8.78px */
    line-height: 0.84375rem !important; /* 67.5% of 1.25rem */
  }

  .text-sm {
    font-size: 0.5484375rem !important; /* 67.5% of 0.8125rem = ~8.78px */
    line-height: 0.84375rem !important; /* 67.5% of 1.25rem */
  }

  /* Scale spacing proportionally */
  .space-y-6 > * + * {
    margin-top: 1.0125rem !important; /* 67.5% of 1.5rem */
  }

  .space-y-8 > * + * {
    margin-top: 1.35rem !important; /* 67.5% of 2rem */
  }

  .space-y-4 > * + * {
    margin-top: 0.675rem !important; /* 67.5% of 1rem */
  }

  .space-y-3 > * + * {
    margin-top: 0.50625rem !important; /* 67.5% of 0.75rem */
  }

  .space-y-2 > * + * {
    margin-top: 0.3375rem !important; /* 67.5% of 0.5rem */
  }

  /* Scale padding */
  .px-4 {
    padding-left: 0.675rem !important; /* 67.5% of 1rem */
    padding-right: 0.675rem !important;
  }

  .pt-3 {
    padding-top: 0.50625rem !important; /* 67.5% of 0.75rem */
  }

  .pb-4 {
    padding-bottom: 0.675rem !important; /* 67.5% of 1rem */
  }

  .pt-2 {
    padding-top: 0.3375rem !important; /* 67.5% of 0.5rem */
  }

  .pt-4 {
    padding-top: 0.675rem !important; /* 67.5% of 1rem */
  }

  /* Scale iframe/map container - maintain full width, scale height */
  .aspect-video {
    aspect-ratio: 16 / 10.8; /* Reduce height to 67.5% (16/9 * 0.675 = 16/10.8) */
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
