<template>
  <div class="text-center space-y-6 sm:space-y-8">
    <!-- Primary Content Block -->
    <div v-if="descriptionTitle || descriptionText" class="space-y-4">
      <!-- Description Title -->
      <div v-if="descriptionTitle">
        <h2
          class="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold leading-tight uppercase khmer-text-fix"
          :style="{
            fontFamily: primaryFont || currentFont,
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }"
        >
          {{ descriptionTitle }}
        </h2>
      </div>

      <!-- Description Text -->
      <div v-if="descriptionText">
        <p
          class="text-sm px-4 sm:text-base md:text-lg leading-normal text-center max-w-full break-words whitespace-pre-wrap opacity-90 khmer-text-fix"
          :style="{
            fontFamily: secondaryFont || currentFont,
            color: primaryColor,
            wordWrap: 'break-word',
            hyphens: 'auto'
          }"
        >
          {{ capitalizedDescription }}
        </p>
      </div>
    </div>

    <!-- Event Details Block -->
    <div class="space-y-3">
      <div
        class="inline-block px-4 py-3 rounded-lg backdrop-blur-sm border border-opacity-20 space-y-2"
        :style="{
          backgroundColor: `${primaryColor}10`,
          borderColor: primaryColor
        }"
      >
        <!-- Date Text -->
        <div class="text-sm sm:text-base font-medium leading-snug" v-if="dateText">
          <span
            class="khmer-text-fix"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: secondaryFont || currentFont
            }"
          >
            {{ dateText }}
          </span>
        </div>

        <!-- Time Text -->
        <div class="text-sm sm:text-base font-medium leading-snug" v-if="timeText">
          <span
            class="khmer-text-fix"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: secondaryFont || currentFont
            }"
          >
            {{ timeText }}
          </span>
        </div>

        <!-- Location Text -->
        <div class="text-sm sm:text-base font-medium leading-snug" v-if="locationText">
          <span
            class="khmer-text-fix"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: secondaryFont || currentFont
            }"
          >
            {{ locationText }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, Clock, MapPin } from 'lucide-vue-next'

interface Props {
  descriptionTitle?: string
  descriptionText?: string
  dateText?: string
  timeText?: string
  locationText?: string
  hasGoogleMap?: boolean
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
}

const props = defineProps<Props>()

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
  background: rgba(255, 255, 255, 0.20);
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
  ;
}
</style>
