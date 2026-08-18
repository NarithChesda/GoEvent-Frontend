/**
 * usePublicEventData.ts
 *
 * Composable for loading and managing public event data in the PublicEventDrawer.
 * Handles event loading, registration status, banner image fallbacks, and state management.
 *
 * @module composables/event/usePublicEventData
 */

import { ref, computed } from 'vue'
import { eventsService, donationService, expensesService, type Event, type EventRegistration } from '@/services/api'
import type { FundraisingProgress, DonationCategorySummary, EventDonation } from '@/services/api/types/donation.types'
import type { PublicExpenseRecord } from '@/services/api/types/expense.types'
import { getEventFallbackImage } from '@/composables/useEventFormatters'
import { BANNER_WIDTHS, getBannerUrl as resolveBannerUrl } from '@/utils/mediaUrl'
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
  const topDonors = ref<EventDonation[]>([])
  const publicExpenses = ref<PublicExpenseRecord[]>([])

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

  /**
   * Whether `currentBannerSrc` is the generated category cover rather than a
   * photo the host uploaded.
   *
   * The generated art already draws the category mark full-bleed, so anything
   * that watermarks the same mark over the banner has to know to sit this one
   * out — see the drawer hero's motif.
   */
  const usingGeneratedCover = computed(
    () => !event.value?.banner_image || primaryBannerError.value
  )

  const currentBannerSrc = computed(() => {
    const current = event.value
    if (!current) return ''
    const photo = usingGeneratedCover.value ? null : current.banner_image
    return photo ? getBannerUrl(photo) : getEventFallbackImage(current)
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

  /**
   * Re-fetch the event in place, without tearing the panel down.
   *
   * A silent load skips everything that exists to reset the view for a
   * *different* event: the skeleton, the cleared registration state, the reset
   * banner-error flags. It is for reconciling with the server after an action
   * the reader just took — registering, cancelling — where blanking the panel
   * they are reading, and dropping their scroll position with it, is the wrong
   * answer. A silent load that fails leaves the current data alone rather than
   * replacing a working panel with an error screen.
   */
  interface LoadEventOptions {
    silent?: boolean
  }

  const loadEvent = async (eventId: string | null, options: LoadEventOptions = {}) => {
    if (!eventId) return

    const silent = options.silent === true

    if (!silent) {
      loading.value = true
      error.value = null
      resetBannerErrors()
      userRegistration.value = null
      registrationChecked.value = false
    }

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

        // Store the full registration data if user is registered.
        //
        // On a silent refresh this has to be authoritative in both directions:
        // a successful lookup that comes back empty means the reader is no
        // longer registered (they just cancelled), and leaving the stale
        // registration in place would keep showing them a ticket they gave up.
        // A *failed* lookup says nothing, so it changes nothing.
        if (registrationResponse?.success) {
          userRegistration.value = registrationResponse.data ?? null
        }

        // Load fundraising progress and item categories if fundraising is enabled
        if (event.value.is_fundraising) {
          try {
            const [progressResponse, categoriesResponse, cashDonationsResponse, itemDonationsResponse, topDonorsResponse, expensesResponse] = await Promise.all([
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
              }),
              // Fetch top donors sorted by amount
              donationService.getDonations(eventId, {
                donation_type: 'cash',
                status: 'verified',
                ordering: '-amount',
                page_size: 10
              }),
              // Fetch public expenses for transparency
              expensesService.getPublicExpenses(eventId)
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

            if (topDonorsResponse.success && topDonorsResponse.data?.results) {
              topDonors.value = topDonorsResponse.data.results
            }

            if (expensesResponse.success && expensesResponse.data) {
              publicExpenses.value = expensesResponse.data
            }
          } catch (err) {
            console.warn('Could not load fundraising data:', err)
          }
        }
      } else if (!silent) {
        error.value = eventResponse.message || 'Event not found'
      }
    } catch {
      if (!silent) error.value = 'Failed to load event details'
    } finally {
      if (!silent) loading.value = false
    }
  }

  const refreshFundraisingProgress = async (eventId: string) => {
    if (!event.value?.is_fundraising) return

    try {
      const [progressResponse, categoriesResponse, cashDonationsResponse, itemDonationsResponse, topDonorsResponse, expensesResponse] = await Promise.all([
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
        }),
        // Fetch top donors sorted by amount
        donationService.getDonations(eventId, {
          donation_type: 'cash',
          status: 'verified',
          ordering: '-amount',
          page_size: 10
        }),
        // Fetch public expenses for transparency
        expensesService.getPublicExpenses(eventId)
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

      if (topDonorsResponse.success && topDonorsResponse.data?.results) {
        topDonors.value = topDonorsResponse.data.results
      }

      if (expensesResponse.success && expensesResponse.data) {
        publicExpenses.value = expensesResponse.data
      }
    } catch (err) {
      console.warn('Could not refresh fundraising data:', err)
    }
  }

  // URL helpers
  const getBannerUrl = (bannerImage: string): string =>
    resolveBannerUrl(bannerImage, BANNER_WIDTHS.page) ?? ''

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
    topDonors,
    publicExpenses,
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
    usingGeneratedCover,
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
