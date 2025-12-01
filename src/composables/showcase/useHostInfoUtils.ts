/**
 * Shared utilities for host info layout components
 * Reduces code duplication across Wedding, Housewarming, Birthday, and Default layouts
 */
import { computed, type Ref } from 'vue'
import { apiService } from '@/services/api'
import fallbackLogoSvg from '@/assets/temp-showcase-logo.svg?raw'

/**
 * Get full URL for media assets
 */
export function getMediaUrl(mediaUrl: string | null | undefined): string | undefined {
  return apiService.getProfilePictureUrl(mediaUrl) || undefined
}

/**
 * Split text into words for animation
 */
export function splitToWords(text: string | null | undefined): string[] {
  if (!text) return []
  return text.split(/\s+/).filter(Boolean)
}

/**
 * Animation timing constants
 */
export const ANIMATION_CONSTANTS = {
  WORD_DELAY: 0.08, // delay between each word
  ELEMENT_GAP: 0.08, // gap between elements
  LOGO_DURATION: 0.25, // logo animation time + gap
  PROFILE_GAP: 0.15, // gap between profile pictures
  STARTING_DELAY: 0.1, // initial delay
}

/**
 * Calculate animation duration for a text based on its word count
 */
export function getTextAnimationDuration(text: string | null | undefined): number {
  if (!text) return 0
  const wordCount = splitToWords(text).length
  return wordCount * ANIMATION_CONSTANTS.WORD_DELAY
}

/**
 * Composable for fallback logo handling
 */
export function useFallbackLogo(primaryColor: Ref<string> | string) {
  const fallbackLogoSvgContent = computed(() => {
    // Add fill="currentColor" to all <path> elements
    return fallbackLogoSvg.replace(/<path /g, '<path fill="currentColor" ')
  })

  const fallbackLogoStyle = computed(() => {
    const color = typeof primaryColor === 'string' ? primaryColor : primaryColor.value
    return {
      color,
      filter: `drop-shadow(0 4px 20px ${color}40)`,
    }
  })

  return {
    fallbackLogoSvgContent,
    fallbackLogoStyle,
  }
}

/**
 * Composable for sequential animation delays
 * Used by Wedding layout for word-by-word animations
 */
export function useAnimatedDelays() {
  const createDelayCalculator = (startingDelay = ANIMATION_CONSTANTS.STARTING_DELAY) => {
    let currentDelay = startingDelay

    const getNextDelay = (text: string | null | undefined, skipIfEmpty = true): number => {
      if (skipIfEmpty && !text) return currentDelay
      const startDelay = currentDelay
      const duration = getTextAnimationDuration(text)
      currentDelay = startDelay + duration + ANIMATION_CONSTANTS.ELEMENT_GAP
      return startDelay
    }

    const addFixedDelay = (duration: number): number => {
      const startDelay = currentDelay
      currentDelay += duration
      return startDelay
    }

    const getCurrentDelay = () => currentDelay

    return {
      getNextDelay,
      addFixedDelay,
      getCurrentDelay,
    }
  }

  return { createDelayCalculator }
}

/**
 * Get Khmer text class if current language is Khmer
 */
export function getKhmerClass(currentLanguage: string | undefined): string {
  return currentLanguage === 'kh' ? 'khmer-text-fix' : ''
}

/**
 * Check if current language is Khmer
 */
export function isKhmerLanguage(currentLanguage: string | undefined): boolean {
  return currentLanguage === 'kh'
}

/**
 * Common text style generator
 */
export function getTextStyle(
  color: string,
  fontFamily: string,
  additionalStyles?: Record<string, string>
): Record<string, string> {
  return {
    color,
    fontFamily,
    ...additionalStyles,
  }
}

/**
 * Get font family with fallback
 */
export function getFontFamily(
  primaryFont?: string,
  secondaryFont?: string,
  currentFont?: string
): string {
  return primaryFont || secondaryFont || currentFont || 'inherit'
}
