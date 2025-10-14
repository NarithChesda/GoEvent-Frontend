/**
 * Device Detection Utilities
 *
 * Centralized device detection to avoid duplication and ensure consistency
 * across the application. Uses singleton pattern for performance.
 */

// Cache detection results to avoid repeated checks
let cachedIsMobile: boolean | null = null
let cachedIsLowMemory: boolean | null = null

/**
 * Detects if the current device is a mobile device
 * Uses user agent and pointer type detection
 */
export function isMobileDevice(): boolean {
  if (cachedIsMobile !== null) {
    return cachedIsMobile
  }

  const mobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
  const hasCoarsePointer =
    window.screen?.width <= 768 && window.matchMedia('(pointer: coarse)').matches

  cachedIsMobile = mobileUserAgent || hasCoarsePointer
  return cachedIsMobile
}

/**
 * Detects if the device has limited memory or processing power
 * Useful for enabling performance optimizations
 */
export function isLowMemoryDevice(): boolean {
  if (cachedIsLowMemory !== null) {
    return cachedIsLowMemory
  }

  // Device Memory API is not in TypeScript definitions yet
  const nav = navigator as Navigator & { deviceMemory?: number }
  const deviceMemory = nav.deviceMemory
  const hardwareConcurrency = navigator.hardwareConcurrency || 4

  cachedIsLowMemory = deviceMemory ? deviceMemory <= 4 : hardwareConcurrency <= 2
  return cachedIsLowMemory
}

/**
 * Resets cached device detection values
 * Useful for testing or when device characteristics change
 */
export function resetDeviceDetectionCache(): void {
  cachedIsMobile = null
  cachedIsLowMemory = null
}

/**
 * Gets comprehensive device information
 */
export function getDeviceInfo() {
  const nav = navigator as Navigator & { deviceMemory?: number }

  return {
    isMobile: isMobileDevice(),
    isLowMemory: isLowMemoryDevice(),
    deviceMemory: nav.deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    screenWidth: window.screen?.width || 'unknown',
    screenHeight: window.screen?.height || 'unknown',
    userAgent: navigator.userAgent,
  }
}
