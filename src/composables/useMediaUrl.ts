import { computed, type ComputedRef } from 'vue'

/**
 * Composable for handling media URL resolution
 *
 * Converts relative media URLs to absolute URLs using the API base URL
 */
export function useMediaUrl() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

  /**
   * Convert a media URL (relative or absolute) to an absolute URL
   *
   * @param mediaUrl - The media URL from the API (can be relative or absolute)
   * @returns Absolute URL or undefined if no URL provided
   */
  const getMediaUrl = (mediaUrl: string | null | undefined): string | undefined => {
    if (!mediaUrl) return undefined

    // If it's already a full URL, return as is
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl
    }

    // If it's a relative URL starting with /, prepend the API base URL
    if (mediaUrl.startsWith('/')) {
      return `${API_BASE_URL}${mediaUrl}`
    }

    // If it doesn't start with /, assume it needs /media/ prefix
    return `${API_BASE_URL}/media/${mediaUrl}`
  }

  /**
   * Create a computed property for a media URL
   *
   * @param mediaUrl - Ref or getter function that returns the media URL
   * @returns Computed property that returns the absolute URL
   */
  const createMediaUrlComputed = (
    mediaUrl: () => string | null | undefined
  ): ComputedRef<string | undefined> => {
    return computed(() => getMediaUrl(mediaUrl()))
  }

  return {
    getMediaUrl,
    createMediaUrlComputed
  }
}
