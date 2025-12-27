/**
 * useEventFormatters.ts (event-specific)
 *
 * Event-specific formatting utilities for PublicEventDrawer.
 * Extracted from PublicEventDrawer.vue for reusability.
 *
 * @module composables/event/useEventFormatters
 */

export function useEventDateFormatters() {
  const getMonthAbbr = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  }

  const getDayOfMonth = (dateStr: string): string => {
    return new Date(dateStr).getDate().toString()
  }

  const getFormattedDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const getTimeRange = (startStr: string, endStr: string): string => {
    const start = new Date(startStr)
    const end = new Date(endStr)

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    }

    return `${formatTime(start)} - ${formatTime(end)}`
  }

  const getInitials = (name: string): string => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const formatAgendaTime = (item: {
    start_time_text?: string
    end_time_text?: string
  }): string => {
    const start = item.start_time_text || ''
    const end = item.end_time_text || ''
    if (start && end) {
      return `${start} - ${end}`
    }
    return start || end
  }

  return {
    getMonthAbbr,
    getDayOfMonth,
    getFormattedDate,
    getTimeRange,
    getInitials,
    formatAgendaTime,
  }
}
