import { ref, onUnmounted } from 'vue'

export interface TouchGestureConfig {
  /** Minimum pixels to trigger swipe (default: 50) */
  minSwipeDistance?: number
  /** Maximum movement to consider as tap (default: 10) */
  tapThreshold?: number
  /** Callback when swipe up or tap is detected */
  onSwipeUpOrTap?: () => void
  /** Whether interaction is disabled */
  isDisabled?: () => boolean
}

export interface TouchGestureReturn {
  /** Whether current device is touch-enabled */
  isTouchDevice: Readonly<ReturnType<typeof ref<boolean>>>
  /** Handle touch start event */
  handleTouchStart: (e: TouchEvent) => void
  /** Handle touch move event */
  handleTouchMove: (e: TouchEvent) => void
  /** Handle touch end event */
  handleTouchEnd: (e: TouchEvent) => void
  /** Handle click for non-touch devices */
  handleClick: () => void
}

/**
 * Composable for handling touch gestures (swipe up and tap detection)
 *
 * @example
 * ```ts
 * const { handleTouchStart, handleTouchMove, handleTouchEnd, handleClick, isTouchDevice } = useTouchGesture({
 *   onSwipeUpOrTap: () => emit('openEnvelope'),
 *   isDisabled: () => props.isInteractionDisabled
 * })
 * ```
 */
export function useTouchGesture(config: TouchGestureConfig = {}): TouchGestureReturn {
  const {
    minSwipeDistance = 50,
    tapThreshold = 10,
    onSwipeUpOrTap,
    isDisabled = () => false,
  } = config

  const touchStartY = ref(0)
  const touchEndY = ref(0)
  const isTouchDevice = ref(false)

  const handleTouchStart = (e: TouchEvent) => {
    isTouchDevice.value = true
    touchStartY.value = e.touches[0].clientY
  }

  const handleTouchMove = (e: TouchEvent) => {
    touchEndY.value = e.touches[0].clientY
  }

  const handleTouchEnd = (e: TouchEvent) => {
    const swipeDistance = touchStartY.value - touchEndY.value
    const isSwipeUp = swipeDistance > minSwipeDistance
    const isTap = Math.abs(swipeDistance) < tapThreshold

    if ((isSwipeUp || isTap) && !isDisabled()) {
      e.preventDefault()
      onSwipeUpOrTap?.()
    }

    // Reset values
    touchStartY.value = 0
    touchEndY.value = 0
  }

  const handleClick = () => {
    if (!isTouchDevice.value && !isDisabled()) {
      onSwipeUpOrTap?.()
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    touchStartY.value = 0
    touchEndY.value = 0
  })

  return {
    isTouchDevice,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
  }
}
