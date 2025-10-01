/**
 * Utility functions for extracting embed URLs from iframe code
 */

/**
 * Extract YouTube embed URL from iframe HTML or direct URL
 * @param input - Can be full iframe HTML or a URL
 * @returns Extracted YouTube embed URL or empty string if invalid
 */
export function extractYouTubeEmbedUrl(input: string): string {
  if (!input || typeof input !== 'string') return ''

  const trimmedInput = input.trim()

  // Check if input is already a valid YouTube embed URL
  const youtubeEmbedPattern = /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+(\?.*)?$/
  if (youtubeEmbedPattern.test(trimmedInput)) {
    return trimmedInput
  }

  // Extract src from iframe HTML
  const srcMatch = trimmedInput.match(/src=["']([^"']+)["']/)
  if (srcMatch && srcMatch[1]) {
    const extractedUrl = srcMatch[1]

    // Validate it's a YouTube embed URL
    if (youtubeEmbedPattern.test(extractedUrl)) {
      return extractedUrl
    }
  }

  return ''
}

/**
 * Extract Google Maps embed URL from iframe HTML or direct URL
 * @param input - Can be full iframe HTML or a URL
 * @returns Extracted Google Maps embed URL or empty string if invalid
 */
export function extractGoogleMapsEmbedUrl(input: string): string {
  if (!input || typeof input !== 'string') return ''

  const trimmedInput = input.trim()

  // Check if input is already a valid Google Maps embed URL
  const mapsEmbedPattern = /^https:\/\/www\.google\.com\/maps\/embed(\?.*)?$/
  if (mapsEmbedPattern.test(trimmedInput)) {
    return trimmedInput
  }

  // Extract src from iframe HTML
  const srcMatch = trimmedInput.match(/src=["']([^"']+)["']/)
  if (srcMatch && srcMatch[1]) {
    const extractedUrl = srcMatch[1]

    // Validate it's a Google Maps embed URL
    if (mapsEmbedPattern.test(extractedUrl)) {
      return extractedUrl
    }
  }

  return ''
}

/**
 * Detect embed type from input string
 * @param input - Can be full iframe HTML or a URL
 * @returns 'youtube' | 'googlemaps' | 'unknown'
 */
export function detectEmbedType(input: string): 'youtube' | 'googlemaps' | 'unknown' {
  if (!input || typeof input !== 'string') return 'unknown'

  const lowerInput = input.toLowerCase()

  if (lowerInput.includes('youtube.com/embed')) {
    return 'youtube'
  }

  if (lowerInput.includes('google.com/maps/embed')) {
    return 'googlemaps'
  }

  return 'unknown'
}
