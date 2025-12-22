import { computed, ref, onMounted, onUnmounted, watch, nextTick, type Ref } from 'vue'

export interface GuestNameConfig {
  /** Guest name text */
  guestName: Ref<string | null | undefined>
  /** Primary font family */
  primaryFont?: Ref<string | undefined>
  /** Current/fallback font family */
  currentFont: Ref<string>
  /** Guest name color */
  guestnameColor?: Ref<string | null | undefined>
  /** Primary color as fallback */
  primaryColor: Ref<string>
}

export interface GuestNameReturn {
  /** Formatted guest name with proper capitalization */
  formattedGuestName: ReturnType<typeof computed<string>>
  /** Individual characters for English name animation */
  guestNameChars: ReturnType<typeof computed<string[]>>
  /** Words for Khmer/non-English name animation */
  guestNameWords: ReturnType<typeof computed<string[]>>
  /** Whether guest name is English/Latin text */
  isEnglishGuestName: ReturnType<typeof computed<boolean>>
  /** Text style for guest name */
  guestNameTextStyle: ReturnType<typeof computed<Record<string, string>>>
  /** Scale value for auto-fit (0.4 to 1) */
  guestNameScale: Ref<number>
  /** Style object with transform scale */
  guestNameAutoFitStyle: ReturnType<typeof computed<{ transform: string; transformOrigin: string }>>
  /** Ref for the guest name element */
  guestNameRef: Ref<HTMLElement | null>
  /** Ref for the container element */
  guestContainerRef: Ref<HTMLElement | null>
  /** Recalculate scale (call after DOM updates) */
  calculateGuestNameScale: () => void
}

/**
 * Composable for guest name text handling and auto-fit scaling
 *
 * Features:
 * - Detects English vs Khmer/other language text
 * - Uses Great Vibes font for English names
 * - Auto-scales text to fit within 60% of container width
 * - Provides character/word arrays for bounce animations
 *
 * @example
 * ```ts
 * const {
 *   formattedGuestName,
 *   isEnglishGuestName,
 *   guestNameTextStyle,
 *   guestNameRef,
 *   guestContainerRef,
 * } = useGuestNameText({
 *   guestName: toRef(props, 'guestName'),
 *   primaryColor: toRef(props, 'primaryColor'),
 *   currentFont: toRef(props, 'currentFont'),
 * })
 * ```
 */
export function useGuestNameText(config: GuestNameConfig): GuestNameReturn {
  const { guestName, primaryFont, currentFont, guestnameColor, primaryColor } = config

  // Element refs
  const guestNameRef = ref<HTMLElement | null>(null)
  const guestContainerRef = ref<HTMLElement | null>(null)
  const guestNameScale = ref(1)

  // Resize observer for responsive scaling
  let resizeObserver: ResizeObserver | null = null

  // Check if text is English/Latin characters only
  const isEnglishGuestName = computed(() => {
    return guestName.value ? /^[a-zA-Z\s\-'.,()&]+$/.test(guestName.value.trim()) : false
  })

  // Capitalize first letter of each word for English names
  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const formattedGuestName = computed(() => {
    if (!guestName.value) return ''
    return isEnglishGuestName.value ? capitalizeWords(guestName.value) : guestName.value
  })

  // Split for character-by-character animation (English)
  const guestNameChars = computed(() => formattedGuestName.value?.split('') || [])

  // Split for word-by-word animation (Khmer/other)
  const guestNameWords = computed(() => formattedGuestName.value?.split(/\s+/).filter(Boolean) || [])

  // Text style with Great Vibes for English names
  const guestNameTextStyle = computed(() => {
    const fontFamily = isEnglishGuestName.value
      ? '"Great Vibes", cursive'
      : primaryFont?.value || currentFont.value

    return {
      fontFamily,
      color: guestnameColor?.value || primaryColor.value,
      fontWeight: isEnglishGuestName.value ? '400' : 'normal',
      background: 'none',
      backgroundColor: 'transparent',
    }
  })

  // Calculate scale to fit guest name within 60% of container width
  const calculateGuestNameScale = () => {
    if (!guestNameRef.value || !guestContainerRef.value) return

    // Reset scale to measure natural width
    guestNameScale.value = 1

    nextTick(() => {
      if (!guestNameRef.value || !guestContainerRef.value) return

      const containerWidth = guestContainerRef.value.offsetWidth
      const maxWidth = containerWidth * 0.6 // 60% of container width
      const textWidth = guestNameRef.value.scrollWidth

      if (textWidth > maxWidth && textWidth > 0) {
        const scale = maxWidth / textWidth
        // Clamp scale between 0.4 and 1
        guestNameScale.value = Math.max(0.4, Math.min(1, scale))
      } else {
        guestNameScale.value = 1
      }
    })
  }

  const guestNameAutoFitStyle = computed(() => ({
    transform: `scale(${guestNameScale.value})`,
    transformOrigin: 'center center',
  }))

  // Setup resize observer on mount
  onMounted(() => {
    nextTick(() => {
      calculateGuestNameScale()
    })

    if (guestContainerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        calculateGuestNameScale()
      })
      resizeObserver.observe(guestContainerRef.value)
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  // Watch for guest name changes
  watch(guestName, () => {
    nextTick(() => {
      calculateGuestNameScale()
    })
  })

  return {
    formattedGuestName,
    guestNameChars,
    guestNameWords,
    isEnglishGuestName,
    guestNameTextStyle,
    guestNameScale,
    guestNameAutoFitStyle,
    guestNameRef,
    guestContainerRef,
    calculateGuestNameScale,
  }
}
