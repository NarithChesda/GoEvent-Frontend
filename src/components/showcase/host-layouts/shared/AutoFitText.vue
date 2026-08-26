<template>
  <div ref="containerRef" class="auto-fit-text-container">
    <!-- Hidden measurement element - measures text at base font size -->
    <span
      ref="measureRef"
      class="auto-fit-text-measure"
      :style="measureStyle"
      aria-hidden="true"
    >{{ text }}</span>
    <!-- Visible animated text -->
    <span
      ref="textRef"
      class="auto-fit-text"
      :style="textStyle"
    >
      <span
        v-for="(word, index) in words"
        :key="`${keyPrefix}-${index}`"
        class="bounce-word"
        :style="{ animationDelay: `${baseDelay + cappedDelay(index)}s` }"
      >{{ word }}{{ index < words.length - 1 ? '\u00A0' : '' }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { splitToWords, ANIMATION_CONSTANTS } from '@/composables/showcase/useHostInfoUtils'

interface Props {
  text: string
  color?: string
  fontFamily?: string
  baseDelay?: number
  wordDelay?: number
  keyPrefix?: string
  minScale?: number
  baseFontSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'inherit',
  fontFamily: 'inherit',
  baseDelay: 0,
  wordDelay: ANIMATION_CONSTANTS.WORD_DELAY,
  keyPrefix: 'word',
  minScale: 0.5,
  baseFontSize: 0, // 0 means inherit from parent
})

const containerRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)
const textRef = ref<HTMLElement | null>(null)
const calculatedFontSize = ref<number | null>(null)

const words = computed(() => splitToWords(props.text))

/**
 * Word-cascade delay, ceilinged like wordCascadeDelay(). Kept local rather than
 * delegated because `wordDelay` here is a caller-supplied rate, not the shared
 * constant — the ceiling still has to apply whatever rate is passed in.
 */
const cappedDelay = (index: number): number =>
  Math.min(index * props.wordDelay, ANIMATION_CONSTANTS.WORD_CASCADE_MAX)

// Style for hidden measurement element
const measureStyle = computed(() => ({
  fontFamily: props.fontFamily,
  fontSize: props.baseFontSize > 0 ? `${props.baseFontSize}px` : 'inherit',
}))

// Style for visible text - uses calculated font size
const textStyle = computed(() => ({
  color: props.color,
  fontFamily: props.fontFamily,
  fontSize: calculatedFontSize.value !== null ? `${calculatedFontSize.value}px` : 'inherit',
}))

const calculateFontSize = () => {
  if (!containerRef.value || !measureRef.value) return

  nextTick(() => {
    if (!containerRef.value || !measureRef.value) return

    const containerWidth = containerRef.value.offsetWidth
    const measureWidth = measureRef.value.offsetWidth

    // Get the computed font size of the measure element
    const computedStyle = window.getComputedStyle(measureRef.value)
    const baseFontSize = parseFloat(computedStyle.fontSize)

    if (measureWidth > containerWidth && containerWidth > 0 && baseFontSize > 0) {
      // Calculate the scale factor needed
      const scaleFactor = Math.max(props.minScale, containerWidth / measureWidth)
      // Apply scale to font size
      calculatedFontSize.value = baseFontSize * scaleFactor
    } else {
      // Use base font size or inherit
      calculatedFontSize.value = baseFontSize > 0 ? baseFontSize : null
    }
  })
}

// Observe container resize
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  // Small delay to ensure fonts are loaded
  setTimeout(calculateFontSize, 50)

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      calculateFontSize()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// Recalculate when text changes
watch(() => props.text, () => {
  nextTick(calculateFontSize)
})

// Recalculate when font family changes
watch(() => props.fontFamily, () => {
  nextTick(calculateFontSize)
})
</script>

<style scoped>
.auto-fit-text-container {
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.auto-fit-text-measure {
  position: absolute;
  visibility: hidden;
  white-space: nowrap;
  pointer-events: none;
}

.auto-fit-text {
  white-space: nowrap;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

/* Word-by-word reveal animation */
.bounce-word {
  display: inline-block;
  opacity: 0;
  animation: revealWord 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes revealWord {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .bounce-word {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
