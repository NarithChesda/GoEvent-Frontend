/**
 * useEventFormatters.ts
 *
 * Shared formatting utilities for event display across EventsView and ExploreView.
 * Extracts common formatting logic to eliminate code duplication.
 *
 * @module composables/useEventFormatters
 */

import { apiService, type Event } from '@/services/api'

export interface EventHost {
  name: string
  image: string | null
}

export interface DateGroup {
  date: string
  monthDay: string
  weekday: string
  events: Event[]
}

/**
 * Format event time for display
 */
export function formatEventTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Get guest count display string
 */
export function getGuestCount(event: Event): string {
  const eventWithGuests = event as Event & {
    guest_count?: number
    registrations?: unknown[]
  }
  const count =
    eventWithGuests.guest_count || eventWithGuests.registrations?.length || 0

  if (count === 0) return 'No guests'
  if (count === 1) return '1 guest'
  return `${count} guests`
}

/**
 * Convert API server media URL to ImageKit proxy URL
 * Rewrites api.goevent.online/media/... to ik.imagekit.io/goevent/media/...
 */
export function toImageKitUrl(url: string): string {
  // Rewrite api.goevent.online URLs to ImageKit proxy
  if (url.includes('api.goevent.online/media/')) {
    return url.replace(
      'https://api.goevent.online/media/',
      'https://ik.imagekit.io/goevent/media/'
    )
  }
  return url
}

/**
 * Apply ImageKit.io transformation to resize image
 * For ImageKit URLs, inserts transformation params after the base path
 * Also converts API server URLs to ImageKit proxy URLs
 * @param url - Original image URL
 * @param width - Target width in pixels
 * @param height - Target height in pixels (optional)
 */
export function applyImageKitTransform(
  url: string | null,
  width: number,
  height?: number
): string | null {
  if (!url) return null

  // Convert API server URLs to ImageKit proxy URLs
  let imageKitUrl = toImageKitUrl(url)

  // Only transform ImageKit URLs
  if (!imageKitUrl.includes('ik.imagekit.io')) {
    return url
  }

  // Build transformation string
  const transform = height ? `tr:w-${width},h-${height}` : `tr:w-${width}`

  // Insert transformation after the ImageKit base path
  // URL format: https://ik.imagekit.io/{imagekit_id}/path/to/image.ext
  // Transformed: https://ik.imagekit.io/{imagekit_id}/tr:w-240,h-126/path/to/image.ext
  const imagekitRegex = /(https:\/\/ik\.imagekit\.io\/[^/]+)(\/.*)/
  const match = imageKitUrl.match(imagekitRegex)

  if (match) {
    return `${match[1]}/${transform}${match[2]}`
  }

  return imageKitUrl
}

/**
 * Get event image URL
 */
export function getEventImage(event: Event): string | null {
  if (event.banner_image) {
    return apiService.getProfilePictureUrl(event.banner_image)
  }
  if (event.photos && event.photos.length > 0) {
    return apiService.getProfilePictureUrl(event.photos[0].image)
  }
  return null
}

/**
 * Get event thumbnail image URL (optimized for event cards)
 * Display size is 176x112 (w-44 h-28), using 3x for retina = 528x336
 */
export function getEventThumbnail(event: Event): string | null {
  const imageUrl = getEventImage(event)
  return applyImageKitTransform(imageUrl, 528, 336)
}

/**
 * Get event thumbnail for mobile (square crop)
 * Display size is 80x80 (w-20 h-20), using 2x for retina = 160x160
 */
export function getEventThumbnailMobile(event: Event): string | null {
  const imageUrl = getEventImage(event)
  if (!imageUrl) return null

  // Convert API server URLs to ImageKit proxy URLs
  const imageKitUrl = toImageKitUrl(imageUrl)

  if (!imageKitUrl.includes('ik.imagekit.io')) {
    return imageUrl
  }

  // Use fo-auto for smart focus cropping, 160x160 for 2x retina
  const imagekitRegex = /(https:\/\/ik\.imagekit\.io\/[^/]+)(\/.*)/
  const match = imageKitUrl.match(imagekitRegex)

  if (match) {
    return `${match[1]}/tr:w-160,h-160,fo-auto${match[2]}`
  }

  return imageKitUrl
}

/**
 * Get optimized host avatar URL
 * Display size is 16-20px, using 2x for retina = 40x40
 */
function getHostAvatarUrl(profileImage: string | null | undefined): string | null {
  if (!profileImage) return null

  const url = apiService.getProfilePictureUrl(profileImage)
  if (!url) return null

  // Convert and transform through ImageKit
  const imageKitUrl = toImageKitUrl(url)

  if (!imageKitUrl.includes('ik.imagekit.io')) {
    return url
  }

  const imagekitRegex = /(https:\/\/ik\.imagekit\.io\/[^/]+)(\/.*)/
  const match = imageKitUrl.match(imagekitRegex)

  if (match) {
    return `${match[1]}/tr:w-40,h-40,fo-auto${match[2]}`
  }

  return imageKitUrl
}

/**
 * Get event hosts with profile images
 */
export function getEventHosts(event: Event): EventHost[] {
  const hosts: EventHost[] = []
  const eventWithHosts = event as Event & {
    hosts?: Array<{ name: string; profile_image?: string }>
  }

  if (eventWithHosts.hosts && eventWithHosts.hosts.length > 0) {
    eventWithHosts.hosts.forEach((host) => {
      hosts.push({
        name: host.name,
        image: getHostAvatarUrl(host.profile_image),
      })
    })
  }

  return hosts
}

/**
 * Format host names for display
 */
export function formatHostNames(event: Event): string {
  const hosts = getEventHosts(event)
  if (hosts.length === 0) return ''
  if (hosts.length === 1) return hosts[0].name
  if (hosts.length === 2) return `${hosts[0].name}, ${hosts[1].name}`
  return `${hosts[0].name}, ${hosts[1].name} & ${hosts.length - 2} other${hosts.length - 2 > 1 ? 's' : ''}`
}

/**
 * Get event category name
 */
export function getEventCategory(event: Event): string | null {
  const eventWithCategory = event as Event & {
    category?: { name?: string } | number | string | null
    category_name?: string
  }

  // Check for category_name field first
  if (eventWithCategory.category_name) {
    return eventWithCategory.category_name
  }

  // Check for category object with name
  if (
    eventWithCategory.category &&
    typeof eventWithCategory.category === 'object'
  ) {
    const categoryObj = eventWithCategory.category as { name?: string }
    if (categoryObj.name) {
      return categoryObj.name
    }
  }

  return null
}

/**
 * Group events by date
 *
 * @param events - Array of events to group
 * @param sortOrder - Sort order for events ('asc' or 'desc'), or 'preserve' to keep original order
 */
export function groupEventsByDate(
  events: Event[],
  sortOrder: 'asc' | 'desc' | 'preserve' = 'asc'
): DateGroup[] {
  const groups: DateGroup[] = []

  // Sort events by start_date unless preserveOrder is true
  const sortedEvents =
    sortOrder === 'preserve'
      ? events
      : [...events].sort((a, b) => {
          const dateA = new Date(a.start_date).getTime()
          const dateB = new Date(b.start_date).getTime()
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })

  sortedEvents.forEach((event) => {
    const eventDate = new Date(event.start_date)
    const dateKey = eventDate.toISOString().split('T')[0]

    // Format date parts
    const monthDay = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'long' })

    const existingGroup = groups.find((g) => g.date === dateKey)
    if (existingGroup) {
      existingGroup.events.push(event)
    } else {
      groups.push({
        date: dateKey,
        monthDay,
        weekday,
        events: [event],
      })
    }
  })

  return groups
}

/**
 * Composable hook for event formatters
 */
export function useEventFormatters() {
  return {
    formatEventTime,
    getGuestCount,
    getEventImage,
    getEventThumbnail,
    getEventThumbnailMobile,
    applyImageKitTransform,
    getEventHosts,
    formatHostNames,
    getEventCategory,
    groupEventsByDate,
  }
}
