<template>
  <div class="text-center space-y-6 sm:space-y-8">
    <!-- Primary Content Block -->
    <div v-if="descriptionTitle || descriptionText" class="space-y-4">
      <!-- Description Title -->
      <div v-if="descriptionTitle">
        <h2
          :class="[
            'text-base sm:text-lg md:text-xl lg:text-2xl font-semibold leading-tight capitalize',
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
            'text-xs px-4 sm:text-sm md:text-base leading-normal text-center max-w-full break-words whitespace-pre-wrap opacity-90',
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

/* Small laptops 13-inch (1024px-1365px) - Keep mobile sizes */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Override Tailwind's lg:text-2xl for description title - match RSVP */
  h2 {
    font-size: 1rem !important; /* 16px - same as RSVP text-lg in collapsed */
  }

  /* Keep description text at mobile size */
  p {
    font-size: 0.8125rem !important; /* 13px - same as RSVP text-sm */
  }

  /* Keep event details text at mobile size */
  .text-sm {
    font-size: 0.8125rem !important; /* 13px - same as RSVP text-sm */
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
