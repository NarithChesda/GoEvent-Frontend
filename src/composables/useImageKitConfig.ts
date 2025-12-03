import { ref, readonly } from 'vue'

/**
 * ImageKit Configuration Composable
 *
 * Provides a centralized toggle for ImageKit image optimization.
 * Useful for development when you want to switch between:
 * - ImageKit CDN with resizing (production-like)
 * - Original source URLs (faster local development)
 *
 * Configuration priority:
 * 1. localStorage override (if set) - for quick toggling during development
 * 2. Environment variable VITE_IMAGEKIT_ENABLED
 * 3. Default: true in production, true in development
 *
 * @example
 * // In browser console during development:
 * localStorage.setItem('imagekit_enabled', 'false')  // Disable ImageKit
 * localStorage.setItem('imagekit_enabled', 'true')   // Enable ImageKit
 * localStorage.removeItem('imagekit_enabled')        // Use env default
 *
 * // Then refresh the page to see the change
 *
 * @example
 * // In .env file:
 * VITE_IMAGEKIT_ENABLED=false  # Disable ImageKit by default
 */

const STORAGE_KEY = 'imagekit_enabled'

/**
 * Get the initial enabled state based on localStorage and env vars
 */
function getInitialState(): boolean {
  // Check localStorage first (for dev overrides)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
  }

  // Check environment variable
  const envValue = import.meta.env.VITE_IMAGEKIT_ENABLED
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === true
  }

  // Default: enabled
  return true
}

// Shared reactive state across all composable instances
const isEnabled = ref(getInitialState())

/**
 * ImageKit configuration composable
 *
 * @returns Object with ImageKit configuration state and methods
 */
export function useImageKitConfig() {
  /**
   * Enable ImageKit optimization
   */
  const enable = () => {
    isEnabled.value = true
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  /**
   * Disable ImageKit optimization
   */
  const disable = () => {
    isEnabled.value = false
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'false')
    }
  }

  /**
   * Toggle ImageKit optimization
   */
  const toggle = () => {
    if (isEnabled.value) {
      disable()
    } else {
      enable()
    }
  }

  /**
   * Reset to default (use env variable or default value)
   */
  const reset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    isEnabled.value = getInitialState()
  }

  /**
   * Check if override is active (localStorage has a value)
   */
  const hasOverride = (): boolean => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) !== null
    }
    return false
  }

  return {
    /** Whether ImageKit optimization is enabled (readonly reactive ref) */
    isEnabled: readonly(isEnabled),
    /** Enable ImageKit optimization */
    enable,
    /** Disable ImageKit optimization */
    disable,
    /** Toggle ImageKit optimization */
    toggle,
    /** Reset to default (env variable or default value) */
    reset,
    /** Check if localStorage override is active */
    hasOverride,
  }
}

// Export a simple function to check if ImageKit is enabled
// This can be used in non-reactive contexts
export function isImageKitEnabled(): boolean {
  return isEnabled.value
}
