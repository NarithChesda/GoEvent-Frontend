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
 * Matches Google Maps embed URLs on any Google host users realistically copy
 * from — `www.google.com`, regional domains (`google.com.kh`), and
 * `maps.google.com` — covering both the `/maps/embed?pb=` share links and the
 * documented Maps Embed API (`/maps/embed/v1/place?...`).
 */
const MAPS_EMBED_PATTERN =
  /^https:\/\/(?:www\.|maps\.)?google\.(?:com?)(?:\.[a-z]{2})?\/maps\/embed(?:\/v1\/(?:place|view|directions|streetview|search))?(?:\?.*)?$/i

/**
 * Whether a string is a Google Maps embed URL safe to place in an iframe src.
 */
export function isGoogleMapsEmbedUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false
  return MAPS_EMBED_PATTERN.test(input.trim())
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
  if (isGoogleMapsEmbedUrl(trimmedInput)) {
    return trimmedInput
  }

  // Extract src from iframe HTML
  const srcMatch = trimmedInput.match(/src=["']([^"']+)["']/)
  if (srcMatch && srcMatch[1]) {
    const extractedUrl = srcMatch[1]

    // Validate it's a Google Maps embed URL
    if (isGoogleMapsEmbedUrl(extractedUrl)) {
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
