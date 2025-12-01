<template>
  <div
    v-if="thankYouMessage || sorryMessage"
    ref="containerRef"
    :key="`host-message-${currentLanguage}`"
    class="text-center space-y-6 sm:space-y-8"
    :class="{ 'animate-active': isVisible }"
  >
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
          <span
            v-for="(word, index) in splitToWords(thankYouMessage.title)"
            :key="`thank-title-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${animationDelays.thankYouTitle + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(thankYouMessage.title).length - 1 ? '\u00A0' : '' }}</span>
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
          <span
            v-for="(word, index) in splitToWords(thankYouMessage.content)"
            :key="`thank-content-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${animationDelays.thankYouContent + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(thankYouMessage.content).length - 1 ? '\u00A0' : '' }}</span>
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
          <span
            v-for="(word, index) in splitToWords(sorryMessage.title)"
            :key="`sorry-title-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${animationDelays.sorryTitle + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(sorryMessage.title).length - 1 ? '\u00A0' : '' }}</span>
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
          <span
            v-for="(word, index) in splitToWords(sorryMessage.content)"
            :key="`sorry-content-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${animationDelays.sorryContent + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(sorryMessage.content).length - 1 ? '\u00A0' : '' }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { EventText } from '../../types/showcase'
import {
  splitToWords,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
} from '@/composables/showcase/useHostInfoUtils'

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

const WORD_DELAY = ANIMATION_CONSTANTS.WORD_DELAY
const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Intersection Observer for scroll-triggered animations
const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
        }
      })
    },
    {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px',
    }
  )

  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
}

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// Re-setup observer and reset visibility when language changes
watch(
  () => props.currentLanguage,
  async () => {
    isVisible.value = false
    await nextTick()
    setTimeout(() => {
      setupObserver()
      if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect()
        const windowHeight = window.innerHeight
        if (rect.top < windowHeight - 100 && rect.bottom > 0) {
          isVisible.value = true
        }
      }
    }, 100)
  }
)

/**
 * Get thank you message from event texts
 * Falls back to any available language if current language doesn't have one
 */
const thankYouMessage = computed(() => {
  if (!props.eventTexts?.length) {
    return null
  }

  // Try to find message in current language first
  if (props.currentLanguage) {
    const currentLangMessage = props.eventTexts.find(
      (text) => text.text_type === 'thank_you_message' && text.language === props.currentLanguage,
    )
    if (currentLangMessage) {
      return currentLangMessage
    }
  }

  // Fallback: use any available thank you message
  return props.eventTexts.find((text) => text.text_type === 'thank_you_message') || null
})

/**
 * Get sorry message from event texts
 * Falls back to any available language if current language doesn't have one
 */
const sorryMessage = computed(() => {
  if (!props.eventTexts?.length) {
    return null
  }

  // Try to find message in current language first
  if (props.currentLanguage) {
    const currentLangMessage = props.eventTexts.find(
      (text) => text.text_type === 'sorry_message' && text.language === props.currentLanguage,
    )
    if (currentLangMessage) {
      return currentLangMessage
    }
  }

  // Fallback: use any available sorry message
  return props.eventTexts.find((text) => text.text_type === 'sorry_message') || null
})

// Animation delays calculation
const animationDelays = computed(() => {
  let currentDelay = 0.1

  const getNextDelay = (text: string | null | undefined, skipIfEmpty = true): number => {
    if (skipIfEmpty && !text) return currentDelay
    const startDelay = currentDelay
    const duration = getTextAnimationDuration(text)
    currentDelay = startDelay + duration + ELEMENT_GAP
    return startDelay
  }

  // Calculate delays for thank you message (if present)
  const thankYouTitle = getNextDelay(thankYouMessage.value?.title)
  const thankYouContent = getNextDelay(thankYouMessage.value?.content)

  // Calculate delays for sorry message (if present)
  const sorryTitle = getNextDelay(sorryMessage.value?.title)
  const sorryContent = getNextDelay(sorryMessage.value?.content)

  return {
    thankYouTitle,
    thankYouContent,
    sorryTitle,
    sorryContent,
  }
})
</script>

<style scoped>
/* Word-by-word reveal animation - only active when in view */
.bounce-word {
  display: inline-block;
  opacity: 0;
}

.animate-active .bounce-word {
  animation: revealWord 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes revealWord {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(10px);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

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

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .bounce-word {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
