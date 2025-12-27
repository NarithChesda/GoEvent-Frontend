/**
 * useEventSharing.ts
 *
 * Composable for event sharing functionality.
 * Handles sharing event via native share API or clipboard.
 *
 * @module composables/event/useEventSharing
 */

import type { Ref } from 'vue'
import type { Event } from '@/services/api'

export function useEventSharing(event: Ref<Event | null>) {
  const shareEvent = async () => {
    if (!event.value) return

    // Use SSR redirect URL for proper meta tags when shared
    const shareUrl = `https://goevent.online/e/${event.value.id}`
    const shareData = {
      title: event.value.title,
      text: event.value.short_description || event.value.title,
      url: shareUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareUrl)
        // Could show a toast here
      }
    } catch {
      // User cancelled or share failed
    }
  }

  const openMap = (location: string | undefined) => {
    if (!location) return
    const encoded = encodeURIComponent(location)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank')
  }

  return {
    shareEvent,
    openMap,
  }
}
