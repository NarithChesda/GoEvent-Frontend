/**
 * useEventFormatters.ts
 *
 * Shared formatting utilities for event display across EventsView and ExploreView.
 * Extracts common formatting logic to eliminate code duplication.
 *
 * @module composables/useEventFormatters
 */

import { apiService, type Event } from '@/services/api'
import { i18n } from '@/i18n'
import { imagekitUrl, toImageKitProxy } from '@/utils/mediaUrl'
import { buildEventCoverDataUri } from '@/utils/eventCoverPlaceholder'

export interface EventHost {
  name: string
  image: string | null
}

/**
 * Get the default cover for an event with no banner image.
 *
 * Returns generated, category-themed SVG art rather than a photograph — see
 * utils/eventCoverPlaceholder.ts for why. The seed keeps a given event's cover
 * stable across renders and surfaces while varying it between neighbours.
 *
 * @param event - Event object to get a cover for
 * @returns An `image/svg+xml` data URI, safe to use as any `<img>` src
 */
export function getEventFallbackImage(event: Event): string {
  const seed = event.id?.toString() || event.title || ''
  return buildEventCoverDataUri(getEventCategory(event), seed)
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
 * Uses registrations_count from the API which represents users who registered for the event
 * Returns null if no guests (to hide the display)
 */
export function getGuestCount(event: Event): string | null {
  const count = event.registrations_count || 0

  if (count === 0) return null
  const t = i18n.global.t
  return t('events.card.guestCount', { count }, count)
}

/**
 * Convert API server media URL to ImageKit proxy URL
 * Rewrites api.goevent.online/media/... to ik.imagekit.io/goevent/media/...
 * Returns original URL if ImageKit is disabled
 */
export function toImageKitUrl(url: string): string {
  return toImageKitProxy(url)
}

/**
 * Apply ImageKit.io transformation to resize image
 * For ImageKit URLs, inserts transformation params after the base path
 * Also converts API server URLs to ImageKit proxy URLs
 * Returns original URL if ImageKit is disabled
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

  const transform = height ? `w-${width},h-${height}` : `w-${width}`
  return imagekitUrl(url, transform) ?? url
}

/**
 * Get event image URL (returns actual image or null for fallback handling)
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
 * Get event image URL with fallback
 * Returns actual image if available, otherwise returns a category-appropriate fallback image
 */
export function getEventImageWithFallback(event: Event): string {
  const actualImage = getEventImage(event)
  if (actualImage) {
    return actualImage
  }
  return getEventFallbackImage(event)
}

/**
 * Get event thumbnail image URL (optimized for event cards)
 * Display size is 176x112 (w-44 h-28), using 3x for retina = 528x336
 * Always returns an image URL (with fallback if no actual image exists)
 */
export function getEventThumbnail(event: Event): string {
  const imageUrl = getEventImageWithFallback(event)
  // Apply ImageKit transform if it's an ImageKit URL, otherwise return as-is
  return applyImageKitTransform(imageUrl, 528, 336) || imageUrl
}

/**
 * Get event thumbnail for mobile (square crop)
 * Display size is 80x80 (w-20 h-20), using 2x for retina = 160x160
 * Always returns an image URL (with fallback if no actual image exists)
 */
export function getEventThumbnailMobile(event: Event): string {
  const imageUrl = getEventImageWithFallback(event)
  // fo-auto for smart focus cropping, 160x160 for 2x retina
  return imagekitUrl(imageUrl, 'w-160,h-160,fo-auto') ?? imageUrl
}

/**
 * Get optimized host avatar URL
 * Display size is 16-20px, using 2x for retina = 40x40
 */
function getHostAvatarUrl(profileImage: string | null | undefined): string | null {
  if (!profileImage) return null

  const url = apiService.getProfilePictureUrl(profileImage)
  if (!url) return null

  return imagekitUrl(url, 'w-40,h-40,fo-auto') ?? url
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
  const othersCount = hosts.length - 2
  const t = i18n.global.t
  return `${hosts[0].name}, ${hosts[1].name} ${t('events.card.hostOthers', { count: othersCount }, othersCount)}`
}

/**
 * Get event category name.
 *
 * The backend spells the category three different ways depending on the
 * endpoint, so all three are checked. This is the single extraction point —
 * the cover-art lookup reads it too, which is how a category that renders a
 * badge is guaranteed to render matching cover art.
 */
export function getEventCategory(event: Event): string | null {
  const eventWithCategory = event as Event & {
    category?: { name?: string } | number | string | null
    category_name?: string
    category_details?: { name?: string } | null
  }

  // Check for category_name field first
  if (eventWithCategory.category_name) {
    return eventWithCategory.category_name
  }

  // Detail endpoints nest it under category_details
  if (eventWithCategory.category_details?.name) {
    return eventWithCategory.category_details.name
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

  // Get today's date key for comparison
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  sortedEvents.forEach((event) => {
    const eventDate = new Date(event.start_date)
    // Use local date for grouping key to match local display formatting
    const year = eventDate.getFullYear()
    const month = String(eventDate.getMonth() + 1).padStart(2, '0')
    const day = String(eventDate.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`

    // Check if this event is today
    const isToday = dateKey === todayKey

    // Format date parts (uses local timezone)
    // Show "Today" for today's events, otherwise show month and day
    const monthDay = isToday
      ? i18n.global.t('events.card.today')
      : eventDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
    const weekday = isToday
      ? ''
      : eventDate.toLocaleDateString('en-US', { weekday: 'long' })

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
    getEventImageWithFallback,
    getEventFallbackImage,
    getEventThumbnail,
    getEventThumbnailMobile,
    applyImageKitTransform,
    getEventHosts,
    formatHostNames,
    getEventCategory,
    groupEventsByDate,
  }
}
