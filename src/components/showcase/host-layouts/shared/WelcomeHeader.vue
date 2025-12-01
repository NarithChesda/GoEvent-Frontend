<template>
  <div class="welcome-row">
    <div class="welcome-content mt-2">
      <h2
        :class="[
          'text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular leading-tight',
          textClass,
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          fontFamily: fontFamily,
          color: color,
        }"
      >
        <!-- Animated words mode -->
        <template v-if="animated">
          <span
            v-for="(word, index) in words"
            :key="`welcome-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${baseDelay + index * wordDelay}s` }"
          >{{ word }}{{ index < words.length - 1 ? '\u00A0' : '' }}</span>
        </template>
        <!-- Static text mode -->
        <template v-else>
          {{ displayMessage }}
        </template>
      </h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { splitToWords, ANIMATION_CONSTANTS } from '@/composables/showcase/useHostInfoUtils'

interface Props {
  message?: string
  defaultMessage?: string
  color: string
  fontFamily: string
  currentLanguage?: string
  animated?: boolean
  baseDelay?: number
  textClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultMessage: 'Welcome to Our Event',
  animated: false,
  baseDelay: 0.1,
  textClass: '',
})

const displayMessage = computed(() => props.message || props.defaultMessage)

const words = computed(() => splitToWords(displayMessage.value))

const wordDelay = ANIMATION_CONSTANTS.WORD_DELAY
</script>

<style scoped>
.welcome-row {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}

.welcome-content {
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

/* Word-by-word reveal animation */
.bounce-word {
  display: inline-block;
  opacity: 0;
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

/* Small laptops 13-inch (1024px-1365px) - Match agenda header sizing */
@media (min-width: 1024px) and (max-width: 1365px) {
  h2 {
    font-size: 1.25rem !important; /* 20px - match agenda header */
    line-height: 1.25 !important;
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) - Match agenda header sizing */
@media (min-width: 1366px) and (max-width: 1535px) {
  h2 {
    font-size: 1.25rem !important; /* 20px - match agenda header */
    line-height: 1.25 !important;
  }
}

/* Desktop (1536px+) - Match agenda header sizing */
@media (min-width: 1536px) {
  h2 {
    font-size: 1.875rem !important; /* 30px - text-3xl */
  }
}

@media (prefers-reduced-motion: reduce) {
  .bounce-word {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
