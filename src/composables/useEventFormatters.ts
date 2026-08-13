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
import { buildEventCoverDataUri, categoryAccent } from '@/utils/eventCoverPlaceholder'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

export interface EventHost {
  name: string
  image: string | null
}

/**
 * The event's identity colour, resolved from its category.
 *
 * Single lookup shared by the card's accent rail, the category chip and the
 * drawer's info tiles, so a category's colour can never disagree with the cover
 * art drawn from the same map.
 */
export function getEventAccent(event: Event): string {
  return categoryAccent(getEventCategory(event))
}

/**
 * Compose a hex colour with an alpha suffix — the codebase's convention for
 * tinting a dynamic entity colour (see the design system's §1).
 *
 * @param hex - Six-digit hex, e.g. `#6d28d9`
 * @param alpha - Two-digit hex alpha, e.g. `14` for ~8%
 */
export function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`
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
 * Format an event's clock range, e.g. "7:30 PM – 9:30 PM".
 *
 * The end time is dropped when it isn't useful: when the event runs past
 * midnight the second half of the range would describe a different day, and
 * when start and end coincide there is nothing to show.
 */
export function formatEventTimeRange(startStr: string, endStr: string | undefined): string {
  const start = formatEventTime(startStr)
  if (!endStr) return start

  const startDate = new Date(startStr)
  const endDate = new Date(endStr)
  if (Number.isNaN(endDate.getTime())) return start

  const sameDay = startDate.toDateString() === endDate.toDateString()
  if (!sameDay || endDate.getTime() <= startDate.getTime()) return start

  return `${start} – ${formatEventTime(endStr)}`
}

export interface RelativeWhen {
  label: string
  /** Drives the live treatment — pulsing dot, emerald chip. */
  isLive: boolean
}

/** Beyond this horizon the date rail already answers "when" well enough. */
const RELATIVE_HORIZON_DAYS = 60

/**
 * How soon the event is, in words — "Happening now", "In 3 days", "Tomorrow".
 *
 * This is the single biggest thing the list was missing: a column of dates
 * reads as a spreadsheet, while a column of *distances* reads as things that
 * are about to happen. Returns null past the horizon (and for anything already
 * over on a past-events list) so the chip stays meaningful where it appears.
 */
export function formatRelativeWhen(event: Event): RelativeWhen | null {
  const t = i18n.global.t

  if (event.is_ongoing) {
    return { label: t('events.card.when.live'), isLive: true }
  }
  if (event.is_past) {
    return { label: t('events.card.when.ended'), isLive: false }
  }

  const start = new Date(event.start_date)
  if (Number.isNaN(start.getTime())) return null

  const now = new Date()
  const minutesAway = (start.getTime() - now.getTime()) / 60000
  if (minutesAway <= 0) return null

  if (minutesAway < 60) {
    return { label: t('events.card.when.soon'), isLive: false }
  }

  // Compare calendar days, not elapsed hours: an event at 9am tomorrow is
  // "Tomorrow" even though it is only 14 hours away.
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfEventDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const daysAway = Math.round(
    (startOfEventDay.getTime() - startOfToday.getTime()) / 86400000
  )

  if (daysAway <= 0) {
    const hours = Math.round(minutesAway / 60)
    return { label: t('events.card.when.inHours', { count: hours }, hours), isLive: false }
  }
  if (daysAway === 1) {
    return { label: t('events.card.when.tomorrow'), isLive: false }
  }
  if (daysAway <= RELATIVE_HORIZON_DAYS) {
    return { label: t('events.card.when.inDays', { count: daysAway }, daysAway), isLive: false }
  }

  return null
}

/**
 * Who is coming, in words — falling back through the signals an event actually
 * has rather than rendering an empty slot.
 *
 * The old card showed a guest count only when it was non-zero and nothing
 * otherwise, which is how the right two-thirds of every row ended up blank on
 * the listings that have no registrations. Registrations first, then likes as a
 * softer signal of interest, then nothing — the caller's byline covers that case.
 */
export function getAttendanceLabel(event: Event): string | null {
  const t = i18n.global.t

  const going = event.registrations_count || 0
  if (going > 0) return t('events.card.going', { count: going }, going)

  const interested = event.likes_count || 0
  if (interested > 0) return t('events.card.interested', { count: interested }, interested)

  return null
}

export interface EntryChip {
  label: string
  tone: 'price' | 'virtual'
}

/**
 * The entry condition, when the event states one.
 *
 * Deliberately says nothing when there are no ticket tiers. "No tiers" is not
 * the same as "free" — an organiser may collect payment off-platform — and a
 * wrong "Free entry" chip is worse on a discovery surface than no chip at all.
 * A real free/paid flag from the backend would let this branch grow.
 */
export function getEntryChip(event: Event): EntryChip | null {
  const t = i18n.global.t

  if (event.has_ticketed_sales && event.min_ticket_price && event.min_ticket_currency) {
    return {
      label: t('events.card.fromPrice', {
        price: formatCurrency(event.min_ticket_price, event.min_ticket_currency as CurrencyCode),
      }),
      tone: 'price',
    }
  }

  if (event.is_virtual) {
    return { label: t('events.card.virtual'), tone: 'virtual' }
  }

  return null
}

/**
 * "By {names}" — the event's hosts, or the organiser when no hosts are listed.
 *
 * The organiser fallback is what guarantees the presence row is never empty:
 * scraped listings carry an organiser name but no host records.
 */
export function getBylineLabel(event: Event): string | null {
  const t = i18n.global.t

  const hostNames = formatHostNames(event)
  if (hostNames) return t('events.card.hostedBy', { names: hostNames })

  if (event.organizer_name) {
    return t('events.card.hostedBy', { names: event.organizer_name })
  }

  return null
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
 * Display size is 208x128 (w-52 h-32), using 3x for retina = 624x384
 * Always returns an image URL (with fallback if no actual image exists)
 */
export function getEventThumbnail(event: Event): string {
  const imageUrl = getEventImageWithFallback(event)
  // Apply ImageKit transform if it's an ImageKit URL, otherwise return as-is
  return applyImageKitTransform(imageUrl, 624, 384) || imageUrl
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
    formatEventTimeRange,
    formatRelativeWhen,
    getAttendanceLabel,
    getEntryChip,
    getBylineLabel,
    getEventAccent,
    withAlpha,
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
