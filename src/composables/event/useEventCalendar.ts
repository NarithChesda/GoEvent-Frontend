/**
 * useEventCalendar.ts
 *
 * Composable for calendar integration functionality.
 * Handles adding events to Google Calendar, Outlook, and downloading ICS files.
 *
 * @module composables/event/useEventCalendar
 */

import { ref, type Ref } from 'vue'
import type { Event } from '@/services/api'

export function useEventCalendar(event: Ref<Event | null>) {
  const showCalendarOptions = ref(false)

  const sanitizeText = (text: string, maxLength = 1000): string => {
    if (!text) return ''
    let cleaned = text.replace(/<[^>]*>/g, '')
    cleaned = cleaned
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
      .trim()
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...'
    }
    return cleaned
  }

  const addToGoogleCalendar = () => {
    if (!event.value) return

    const startDate = new Date(event.value.start_date)
    const endDate = new Date(event.value.end_date)

    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
    }

    const title = sanitizeText(event.value.title, 200)
    const description = sanitizeText(
      event.value.description || event.value.short_description || '',
      500
    )

    let location = ''
    if (event.value.is_virtual) {
      location = event.value.virtual_link || 'Virtual Event'
    } else {
      location = sanitizeText(event.value.location || '', 200)
    }

    const baseUrl = 'https://calendar.google.com/calendar/render'
    const params = [
      'action=TEMPLATE',
      `text=${encodeURIComponent(title)}`,
      `dates=${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
      `details=${encodeURIComponent(description)}`,
      `location=${encodeURIComponent(location)}`,
      'trp=false',
    ].join('&')

    window.open(`${baseUrl}?${params}`, '_blank')
    showCalendarOptions.value = false
  }

  const addToOutlookCalendar = () => {
    if (!event.value) return

    const startDate = new Date(event.value.start_date)
    const endDate = new Date(event.value.end_date)

    const params = new URLSearchParams({
      subject: event.value.title,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: event.value.description || event.value.short_description || '',
      location: event.value.is_virtual
        ? event.value.virtual_link || 'Virtual Event'
        : event.value.location || '',
    })

    window.open(
      `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`,
      '_blank'
    )
    showCalendarOptions.value = false
  }

  const downloadICSFile = () => {
    if (!event.value) return

    const startDate = new Date(event.value.start_date)
    const endDate = new Date(event.value.end_date)

    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GoEvent//Event Calendar//EN
BEGIN:VEVENT
UID:${event.value.id}@goevent.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${event.value.title}
DESCRIPTION:${event.value.description || event.value.short_description || ''}
LOCATION:${
      event.value.is_virtual
        ? event.value.virtual_link || 'Virtual Event'
        : event.value.location || ''
    }
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.value.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showCalendarOptions.value = false
  }

  return {
    showCalendarOptions,
    addToGoogleCalendar,
    addToOutlookCalendar,
    downloadICSFile,
  }
}
