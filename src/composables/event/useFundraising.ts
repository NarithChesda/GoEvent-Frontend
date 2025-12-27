/**
 * useFundraising.ts
 *
 * Composable for fundraising functionality in PublicEventDrawer.
 * Handles fundraising progress calculations and display formatting.
 *
 * @module composables/event/useFundraising
 */

import { computed, type Ref } from 'vue'
import type { Event } from '@/services/api'
import type { FundraisingProgress } from '@/services/api/types/donation.types'

export function useFundraising(
  event: Ref<Event | null>,
  fundraisingProgress: Ref<FundraisingProgress | null>
) {
  const fundraisingProgressPercentage = computed(() => {
    if (!fundraisingProgress.value) return 0
    // Use the percentage from API if available
    if (fundraisingProgress.value.percentage !== undefined) {
      return Math.round(fundraisingProgress.value.percentage)
    }
    // Otherwise calculate it
    const current = parseFloat(fundraisingProgress.value.total_raised || '0')
    const goal = parseFloat(
      fundraisingProgress.value.goal || event.value?.fundraising_goal || '1'
    )
    return Math.round((current / goal) * 100)
  })

  const fundraisingDaysLeft = computed(() => {
    if (!event.value?.fundraising_deadline) return null
    const deadline = new Date(event.value.fundraising_deadline)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  })

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60)
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`

    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
  }

  return {
    fundraisingProgressPercentage,
    fundraisingDaysLeft,
    formatCurrency,
    formatRelativeTime,
  }
}
