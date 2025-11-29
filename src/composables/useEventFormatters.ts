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
        image: host.profile_image
          ? apiService.getProfilePictureUrl(host.profile_image)
          : null,
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
    getEventHosts,
    formatHostNames,
    getEventCategory,
    groupEventsByDate,
  }
}
