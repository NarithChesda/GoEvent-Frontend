/**
 * Registration Filters Composable
 *
 * Handles search, status filtering, and computed filter states for registrations.
 * Includes debounced search to prevent excessive filtering operations.
 *
 * @example
 * const { searchQuery, statusFilter, filteredRegistrations, clearFilters } = useRegistrationFilters(registrations)
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { EventRegistrationDetail } from '../../services/api'

export type RegistrationStatus = '' | 'registered' | 'checked_in' | 'cancelled'

export interface StatusFilterOption {
  value: RegistrationStatus
  label: string
  count: number
  color: string
  bgColor: string
}

export function useRegistrationFilters(registrations: Ref<EventRegistrationDetail[]>) {
  // Search state
  const searchQuery = ref('')
  const debouncedQuery = ref('')
  let searchTimer: number | undefined

  // Filter state
  const statusFilter = ref<RegistrationStatus>('')
  const isFilterDropdownOpen = ref(false)

  // Debounce search input
  watch(
    () => searchQuery.value,
    (val) => {
      if (searchTimer) window.clearTimeout(searchTimer)
      searchTimer = window.setTimeout(() => {
        debouncedQuery.value = val
      }, 250)
    },
  )

  // Cleanup timer on unmount
  onUnmounted(() => {
    if (searchTimer) window.clearTimeout(searchTimer)
  })

  // Initialize debounced query on mount
  onMounted(() => {
    debouncedQuery.value = searchQuery.value
  })

  // Count computations
  const checkedInCount = computed(
    () => registrations.value.filter((r) => r.status === 'checked_in').length,
  )

  const pendingCount = computed(
    () => registrations.value.filter((r) => r.status === 'registered').length,
  )

  const cancelledCount = computed(
    () => registrations.value.filter((r) => r.status === 'cancelled').length,
  )

  const allCount = computed(() => registrations.value.length)

  // Filtered registrations
  const filteredRegistrations = computed(() => {
    let filtered = registrations.value

    // Filter by search query
    if (debouncedQuery.value.trim()) {
      const query = debouncedQuery.value.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.user_details?.first_name?.toLowerCase().includes(query) ||
          r.user_details?.last_name?.toLowerCase().includes(query) ||
          r.user_details?.username?.toLowerCase().includes(query) ||
          r.user_details?.email?.toLowerCase().includes(query) ||
          r.confirmation_code?.toLowerCase().includes(query),
      )
    }

    // Filter by status
    if (statusFilter.value) {
      filtered = filtered.filter((r) => r.status === statusFilter.value)
    }

    // Sort by registration date (newest first)
    return filtered.sort((a, b) => {
      const dateA = a.registered_at ? new Date(a.registered_at).getTime() : 0
      const dateB = b.registered_at ? new Date(b.registered_at).getTime() : 0
      return dateB - dateA
    })
  })

  // Status filter options with counts
  const statusFilterOptions = computed<StatusFilterOption[]>(() => [
    {
      value: '',
      label: 'All',
      count: allCount.value,
      color: 'slate',
      bgColor: 'bg-slate-100',
    },
    {
      value: 'registered',
      label: 'Not Checked In',
      count: pendingCount.value,
      color: 'sky',
      bgColor: 'bg-sky-500',
    },
    {
      value: 'checked_in',
      label: 'Checked In',
      count: checkedInCount.value,
      color: 'emerald',
      bgColor: 'bg-emerald-500',
    },
    {
      value: 'cancelled',
      label: 'Cancelled',
      count: cancelledCount.value,
      color: 'red',
      bgColor: 'bg-red-500',
    },
  ])

  // Methods
  const selectStatusFilter = (filter: RegistrationStatus) => {
    statusFilter.value = filter
    isFilterDropdownOpen.value = false
  }

  const clearFilters = () => {
    searchQuery.value = ''
    statusFilter.value = ''
  }

  const clearSearch = () => {
    searchQuery.value = ''
  }

  const toggleFilterDropdown = () => {
    isFilterDropdownOpen.value = !isFilterDropdownOpen.value
  }

  const closeFilterDropdown = () => {
    isFilterDropdownOpen.value = false
  }

  const getFilterLabel = (): string => {
    switch (statusFilter.value) {
      case 'registered':
        return 'Not Checked In'
      case 'checked_in':
        return 'Checked In'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'All'
    }
  }

  const getFilterButtonClass = (): string => {
    if (statusFilter.value === '') {
      return 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
    }
    return 'text-white border-transparent'
  }

  const getFilterButtonStyle = (): Record<string, string> => {
    switch (statusFilter.value) {
      case 'registered':
        return { backgroundColor: '#0ea5e9' } // sky-500
      case 'checked_in':
        return { backgroundColor: '#10b981' } // emerald-500
      case 'cancelled':
        return { backgroundColor: '#ef4444' } // red-500
      default:
        return {}
    }
  }

  const hasActiveFilters = computed(() => {
    return searchQuery.value.trim() !== '' || statusFilter.value !== ''
  })

  return {
    // Search state
    searchQuery,
    debouncedQuery,

    // Filter state
    statusFilter,
    isFilterDropdownOpen,

    // Counts
    checkedInCount,
    pendingCount,
    cancelledCount,
    allCount,

    // Computed
    filteredRegistrations,
    statusFilterOptions,
    hasActiveFilters,

    // Methods
    selectStatusFilter,
    clearFilters,
    clearSearch,
    toggleFilterDropdown,
    closeFilterDropdown,
    getFilterLabel,
    getFilterButtonClass,
    getFilterButtonStyle,
  }
}
