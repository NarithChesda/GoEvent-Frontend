/**
 * useEventFormatters.ts
 *
 * Shared formatting utilities for event display across EventsView and ExploreView.
 * Extracts common formatting logic to eliminate code duplication.
 *
 * @module composables/useEventFormatters
 */

import { apiService, type Event } from '@/services/api'
import { isImageKitEnabled } from './useImageKitConfig'

export interface EventHost {
  name: string
  image: string | null
}

/**
 * Fallback images for events without banner images
 * High-quality event-related images from Unsplash, mapped by category
 */
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  // Wedding & Social
  wedding: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=500&fit=crop',
  birthday: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&h=500&fit=crop',
  anniversary: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&h=500&fit=crop',
  party: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
  celebration: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop',
  social: 'https://images.unsplash.com/photo-1529543544277-750e0e833bcf?w=800&h=500&fit=crop',
  networking: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&h=500&fit=crop',
  meetup: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=500&fit=crop',

  // Business & Professional
  business: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop',
  conference: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=500&fit=crop',
  corporate: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=500&fit=crop',
  seminar: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=500&fit=crop',

  // Education & Learning
  education: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=500&fit=crop',
  workshop: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',
  training: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',

  // Entertainment & Music
  music: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  concert: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop',
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop',

  // Food & Dining
  food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  dining: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=500&fit=crop',

  // Sports & Fitness
  sports: 'https://images.unsplash.com/photo-1461896836934-28e4b93b0709?w=800&h=500&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop',

  // Arts & Creative
  art: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=500&fit=crop',
  photography: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=500&fit=crop',

  // Technology
  tech: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=500&fit=crop',
  technology: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=500&fit=crop',

  // Venue & Location
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=500&fit=crop',
}

/**
 * Default fallback images used when no category match is found
 * Rotated based on event ID or title hash for visual variety
 */
const DEFAULT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop', // Celebration confetti
  'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&h=500&fit=crop', // Event setup
  'https://images.unsplash.com/photo-1540575467063-178a50e2f60f?w=800&h=500&fit=crop', // Conference
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=500&fit=crop', // Event venue
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=500&fit=crop', // Presentation
]

/**
 * Get a fallback image URL based on event category
 * @param event - Event object to get fallback for
 * @returns Fallback image URL
 */
export function getEventFallbackImage(event: Event): string {
  const eventWithCategory = event as Event & {
    category?: { name?: string } | number | string | null
    category_name?: string
    category_details?: { name?: string } | null
  }

  // Try to get category name from various possible fields
  let categoryName = ''
  if (eventWithCategory.category_name) {
    categoryName = eventWithCategory.category_name.toLowerCase()
  } else if (eventWithCategory.category_details?.name) {
    categoryName = eventWithCategory.category_details.name.toLowerCase()
  } else if (eventWithCategory.category && typeof eventWithCategory.category === 'object') {
    const categoryObj = eventWithCategory.category as { name?: string }
    if (categoryObj.name) {
      categoryName = categoryObj.name.toLowerCase()
    }
  }

  // Check for exact category match
  if (categoryName && CATEGORY_FALLBACK_IMAGES[categoryName]) {
    return CATEGORY_FALLBACK_IMAGES[categoryName]
  }

  // Check for partial category match
  for (const [key, url] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
    if (categoryName.includes(key) || key.includes(categoryName)) {
      return url
    }
  }

  // Use event ID or title to pick a consistent default image
  const hashSource = event.id?.toString() || event.title || ''
  const hash = hashSource.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  return DEFAULT_FALLBACK_IMAGES[Math.abs(hash) % DEFAULT_FALLBACK_IMAGES.length]
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
 * Returns original URL if ImageKit is disabled
 */
export function toImageKitUrl(url: string): string {
  // Check if ImageKit is enabled
  if (!isImageKitEnabled()) {
    return url
  }

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

  // Check if ImageKit is enabled
  if (!isImageKitEnabled()) {
    return url
  }

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
      ? 'Today'
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
