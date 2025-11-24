<template>
  <div v-if="thankYouMessage || sorryMessage" class="text-center space-y-6 sm:space-y-8">
    <!-- Thank You Message -->
    <div v-if="thankYouMessage" class="space-y-4">
      <!-- Thank You Message Title -->
      <div v-if="thankYouMessage.title">
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
          {{ thankYouMessage.title }}
        </h2>
      </div>

      <!-- Thank You Message Content -->
      <div v-if="thankYouMessage.content">
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
          {{ thankYouMessage.content }}
        </p>
      </div>
    </div>

    <!-- Sorry Message -->
    <div v-if="sorryMessage" class="space-y-4">
      <!-- Sorry Message Title -->
      <div v-if="sorryMessage.title">
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
          {{ sorryMessage.title }}
        </h2>
      </div>

      <!-- Sorry Message Content -->
      <div v-if="sorryMessage.content">
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
          {{ sorryMessage.content }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EventText } from '../../types/showcase'

interface Props {
  eventTexts: EventText[]
  currentLanguage?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
}

const props = defineProps<Props>()

/**
 * Get thank you message from event texts
 */
const thankYouMessage = computed(() => {
  if (!props.eventTexts?.length || !props.currentLanguage) {
    return null
  }

  return props.eventTexts.find(
    (text) => text.text_type === 'thank_you_message' && text.language === props.currentLanguage,
  ) || null
})

/**
 * Get sorry message from event texts
 */
const sorryMessage = computed(() => {
  if (!props.eventTexts?.length || !props.currentLanguage) {
    return null
  }

  return props.eventTexts.find(
    (text) => text.text_type === 'sorry_message' && text.language === props.currentLanguage,
  ) || null
})
</script>

<style scoped>
.khmer-text-fix {
  line-height: 1.8 !important;
  letter-spacing: 0.02em;
}

/* Small laptops 13-inch (1024px-1365px) - Match EventInfo description styling exactly */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Title - match EventInfo h2 title text size */
  h2 {
    font-size: 0.7rem !important; /* 11.2px - match EventInfo description title */
    line-height: 1.25rem !important; /* tight leading */
  }

  /* Description text - match EventInfo description text */
  p,
  p.text-sm,
  p.sm\:text-base {
    font-size: 0.6rem !important; /* 9.6px - match EventInfo description text */
    line-height: 1.125rem !important; /* normal leading */
  }

  /* Match EventInfo spacing - reduced for tighter layout */
  .space-y-6 > * + * {
    margin-top: 1rem !important; /* Match EventInfo spacing */
  }

  .space-y-8 > * + * {
    margin-top: 1rem !important; /* Match EventInfo spacing */
  }

  .space-y-4 > * + * {
    margin-top: 0.25rem !important; /* Match EventInfo spacing */
  }
}

/* Medium laptops 14-15 inch (1366px+) - Match EventInfo description styling */
@media (min-width: 1366px) {
  h2 {
    font-size: 1rem !important; /* Match EventInfo h2 title size for medium laptops */
  }

  p,
  p.text-sm,
  p.sm\:text-base {
    font-size: 0.875rem !important; /* Match EventInfo description text for medium laptops */
  }
}

/* Large laptops 16+ inch (1536px+) - Match EventInfo description styling */
@media (min-width: 1536px) {
  h2 {
    font-size: 1.25rem !important; /* Match EventInfo h2 title size for large laptops/desktop */
  }

  p,
  p.text-sm,
  p.sm\:text-base {
    font-size: 0.875rem !important; /* Match EventInfo description text for large laptops/desktop */
  }
}
</style>
