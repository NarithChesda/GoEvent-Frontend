/**
 * usePublicEventData.ts
 *
 * Composable for loading and managing public event data in the PublicEventDrawer.
 * Handles event loading, registration status, banner image fallbacks, and state management.
 *
 * @module composables/event/usePublicEventData
 */

import { ref, computed } from 'vue'
import { eventsService, donationService, type Event, type EventRegistration } from '@/services/api'
import type { FundraisingProgress, DonationCategorySummary, EventDonation } from '@/services/api/types/donation.types'
import { getEventFallbackImage } from '@/composables/useEventFormatters'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/services/api'

export function usePublicEventData() {
  const authStore = useAuthStore()

  // State
  const event = ref<Event | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const userRegistration = ref<EventRegistration | null>(null)
  const registrationChecked = ref(false)
  const fundraisingProgress = ref<FundraisingProgress | null>(null)
  const itemCategorySummary = ref<DonationCategorySummary | null>(null)
  const recentCashDonations = ref<EventDonation[]>([])
  const recentItemDonations = ref<EventDonation[]>([])

  // Banner image fallback state
  const primaryBannerError = ref(false)
  const fallbackBannerError = ref(false)

  // Statuses that mean user is NOT actively registered/attending (lowercase for comparison)
  const NON_ATTENDING_STATUSES = ['not_coming', 'declined', 'cancelled', 'withdrawn', 'no']

  // Computed properties
  const currentUser = computed(() => authStore.user)

  const organizerName = computed(() => {
    if (!event.value?.organizer_details) return 'GoEvent'
    const { first_name, last_name, username } = event.value.organizer_details
    if (first_name && last_name) return `${first_name} ${last_name}`
    return first_name || username || 'GoEvent'
  })

  const isEventFull = computed(() => {
    if (!event.value || !event.value.max_attendees) return false
    return event.value.registrations_count >= event.value.max_attendees
  })

  const isRegistrationClosed = computed(() => {
    if (!event.value?.registration_deadline) return false
    return new Date(event.value.registration_deadline) < new Date()
  })

  const isUserRegistered = computed(() => {
    // If we explicitly checked registration status, use that as source of truth
    if (registrationChecked.value) {
      if (!userRegistration.value) {
        return false
      }
      // User is only considered "registered" if status indicates active attendance
      const status = userRegistration.value.status?.toLowerCase() || ''
      if (NON_ATTENDING_STATUSES.includes(status)) {
        return false
      }
      return true
    }
    // Fallback to event data before registration is checked
    if (event.value?.is_registered) return true
    return false
  })

  const isFundraisingEnabled = computed(() => {
    return event.value?.is_fundraising === true
  })

  const registrationStatusLabel = computed(() => {
    const status = userRegistration.value?.status || ''
    // Capitalize first letter of each word
    return status.replace(/\b\w/g, (c) => c.toUpperCase())
  })

  const registrationStatusBadgeClass = computed(() => {
    const status = userRegistration.value?.status?.toLowerCase() || ''
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700'
      case 'checked in':
      case 'checked_in':
        return 'bg-blue-100 text-blue-700'
      case 'registered':
        return 'bg-amber-100 text-amber-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  })

  const currentBannerSrc = computed(() => {
    if (!event.value) return ''
    if (!primaryBannerError.value && event.value.banner_image) {
      return getBannerUrl(event.value.banner_image)
    }
    return getEventFallbackImage(event.value)
  })

  const timeUntilEvent = computed(() => {
    if (!event.value?.start_date) return null

    const now = new Date()
    const eventStart = new Date(event.value.start_date)
    const diff = eventStart.getTime() - now.getTime()

    if (diff <= 0) return null // Event has started or passed

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    }

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }

    return `${minutes}m`
  })

  // Methods
  const handleBannerImageError = () => {
    if (!primaryBannerError.value) {
      primaryBannerError.value = true
    } else {
      fallbackBannerError.value = true
    }
  }

  const resetBannerErrors = () => {
    primaryBannerError.value = false
    fallbackBannerError.value = false
  }

  const loadEvent = async (eventId: string | null) => {
    if (!eventId) return

    loading.value = true
    error.value = null
    resetBannerErrors()
    userRegistration.value = null
    registrationChecked.value = false

    try {
      // Fetch event data and user's registration status in parallel
      const eventPromise = eventsService.getEvent(eventId)
      const registrationPromise = authStore.isAuthenticated
        ? eventsService.getMyRegistration(eventId)
        : Promise.resolve(null)

      const [eventResponse, registrationResponse] = await Promise.all([
        eventPromise,
        registrationPromise,
      ])

      if (eventResponse.success && eventResponse.data) {
        event.value = eventResponse.data

        // Mark that we've checked registration status
        if (authStore.isAuthenticated) {
          registrationChecked.value = true
        }

        // Store the full registration data if user is registered
        if (registrationResponse && registrationResponse.success && registrationResponse.data) {
          userRegistration.value = registrationResponse.data
        }

        // Load fundraising progress and item categories if fundraising is enabled
        if (event.value.is_fundraising) {
          try {
            const [progressResponse, categoriesResponse, cashDonationsResponse, itemDonationsResponse] = await Promise.all([
              donationService.getFundraisingProgress(eventId),
              donationService.getItemCategorySummary(eventId),
              donationService.getDonations(eventId, {
                donation_type: 'cash',
                status: 'verified',
                ordering: '-created_at',
                page_size: 5
              }),
              donationService.getDonations(eventId, {
                donation_type: 'item',
                status: 'verified',
                ordering: '-created_at',
                page_size: 5
              })
            ])

            if (progressResponse.success && progressResponse.data) {
              fundraisingProgress.value = progressResponse.data
            }

            if (categoriesResponse.success && categoriesResponse.data) {
              itemCategorySummary.value = categoriesResponse.data
            }

            if (cashDonationsResponse.success && cashDonationsResponse.data?.results) {
              recentCashDonations.value = cashDonationsResponse.data.results
            }

            if (itemDonationsResponse.success && itemDonationsResponse.data?.results) {
              recentItemDonations.value = itemDonationsResponse.data.results
            }
          } catch (err) {
            console.warn('Could not load fundraising data:', err)
          }
        }
      } else {
        error.value = eventResponse.message || 'Event not found'
      }
    } catch (err) {
      error.value = 'Failed to load event details'
    } finally {
      loading.value = false
    }
  }

  const refreshFundraisingProgress = async (eventId: string) => {
    if (!event.value?.is_fundraising) return

    try {
      const [progressResponse, categoriesResponse, cashDonationsResponse, itemDonationsResponse] = await Promise.all([
        donationService.getFundraisingProgress(eventId),
        donationService.getItemCategorySummary(eventId),
        donationService.getDonations(eventId, {
          donation_type: 'cash',
          status: 'verified',
          ordering: '-created_at',
          page_size: 5
        }),
        donationService.getDonations(eventId, {
          donation_type: 'item',
          status: 'verified',
          ordering: '-created_at',
          page_size: 5
        })
      ])

      if (progressResponse.success && progressResponse.data) {
        fundraisingProgress.value = progressResponse.data
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        itemCategorySummary.value = categoriesResponse.data
      }

      if (cashDonationsResponse.success && cashDonationsResponse.data?.results) {
        recentCashDonations.value = cashDonationsResponse.data.results
      }

      if (itemDonationsResponse.success && itemDonationsResponse.data?.results) {
        recentItemDonations.value = itemDonationsResponse.data.results
      }
    } catch (err) {
      console.warn('Could not refresh fundraising data:', err)
    }
  }

  // URL helpers
  const getBannerUrl = (bannerImage: string): string => {
    if (bannerImage.startsWith('http://') || bannerImage.startsWith('https://')) {
      return bannerImage
    }
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    if (bannerImage.startsWith('/')) {
      return `${API_BASE_URL}${bannerImage}`
    }
    return `${API_BASE_URL}/media/${bannerImage}`
  }

  const getProfileUrl = (profileImage: string): string => {
    return apiClient.getProfilePictureUrl(profileImage) || ''
  }

  return {
    // State
    event,
    loading,
    error,
    userRegistration,
    registrationChecked,
    fundraisingProgress,
    itemCategorySummary,
    recentCashDonations,
    recentItemDonations,
    primaryBannerError,
    fallbackBannerError,

    // Computed
    currentUser,
    organizerName,
    isEventFull,
    isRegistrationClosed,
    isUserRegistered,
    isFundraisingEnabled,
    registrationStatusLabel,
    registrationStatusBadgeClass,
    currentBannerSrc,
    timeUntilEvent,

    // Methods
    loadEvent,
    refreshFundraisingProgress,
    handleBannerImageError,
    resetBannerErrors,
    getBannerUrl,
    getProfileUrl,
  }
}
