import { ref, computed } from 'vue'
import {
  commissionService,
  type Commission,
  type CommissionDetail,
  type CommissionStats,
  type CommissionFilters,
} from '../services/commission'
import { useNotifications } from './useNotifications'

// Simple cache for commission stats (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let statsCache: { data: CommissionStats; timestamp: number } | null = null

export function useCommissionData() {
  const { success, error } = useNotifications()

  // State
  const isLoading = ref(false)
  const isStatsLoading = ref(false)
  const commissions = ref<Commission[]>([])
  const stats = ref<CommissionStats | null>(null)
  const totalCommissions = ref(0)

  // Filters
  const selectedStatus = ref<
    'all' | 'pending' | 'requested' | 'claimed' | 'rejected' | 'cancelled'
  >('all')
  const startDate = ref('')
  const endDate = ref('')
  const searchQuery = ref('')

  // Computed
  const filteredCommissions = computed(() => {
    let filtered = [...commissions.value]

    // Apply status filter
    if (selectedStatus.value !== 'all') {
      filtered = filtered.filter((commission) => commission.status === selectedStatus.value)
    }

    // Note: Search is now handled server-side in fetchCommissions
    // This client-side filter is kept for additional real-time filtering if needed

    return filtered
  })

  const statusFilters = computed(() => [
    {
      value: 'all' as const,
      label: 'All',
      count: stats.value?.total_commissions || 0,
      activeClass: 'bg-slate-900 text-white',
      dotClass: 'bg-slate-400',
    },
    {
      value: 'pending' as const,
      label: 'Pending',
      count: stats.value?.pending_commissions || 0,
      activeClass: 'bg-amber-600 text-white',
      dotClass: 'bg-amber-600',
    },
    {
      value: 'requested' as const,
      label: 'Requested',
      count: stats.value?.requested_commissions || 0,
      activeClass: 'bg-purple-600 text-white',
      dotClass: 'bg-purple-600',
    },
    {
      value: 'claimed' as const,
      label: 'Claimed',
      count: stats.value?.claimed_commissions || 0,
      activeClass: 'bg-green-600 text-white',
      dotClass: 'bg-green-600',
    },
    {
      value: 'rejected' as const,
      label: 'Rejected',
      count: stats.value?.rejected_commissions || 0,
      activeClass: 'bg-red-600 text-white',
      dotClass: 'bg-red-600',
    },
  ])

  // Methods
  async function fetchStats(forceRefresh = false) {
    // Check cache first (unless force refresh)
    if (!forceRefresh && statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION) {
      stats.value = statsCache.data
      return
    }

    isStatsLoading.value = true
    try {
      const response = await commissionService.getCommissionStats()
      if (response.success && response.data) {
        stats.value = response.data
        // Update cache
        statsCache = {
          data: response.data,
          timestamp: Date.now(),
        }
      } else {
        error('Failed to load commission statistics', response.message || 'Unknown error occurred')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      error('Failed to load commission statistics', errorMessage)
    } finally {
      isStatsLoading.value = false
    }
  }

  async function fetchCommissions() {
    isLoading.value = true
    try {
      // Validate date range
      if (startDate.value && endDate.value && new Date(startDate.value) > new Date(endDate.value)) {
        error('Invalid Date Range', 'Start date cannot be after end date')
        isLoading.value = false
        return
      }

      const filters: Omit<CommissionFilters, 'page' | 'page_size'> = {}

      if (startDate.value) filters.start_date = startDate.value
      if (endDate.value) filters.end_date = endDate.value
      if (searchQuery.value.trim()) filters.search = searchQuery.value.trim()

      // Use my_commissions endpoint for better performance
      const response = await commissionService.getMyCommissions(filters)
      if (response.success && response.data) {
        commissions.value = response.data
        totalCommissions.value = response.data.length

        // Debug logging - temporary
        console.log('Commission data received:', {
          totalCount: response.data.length,
          firstCommission: response.data[0],
          samplePermissions: response.data.map(c => ({
            id: c.id,
            status: c.status,
            can_request_claim: c.can_request_claim,
            can_be_claimed: c.can_be_claimed
          }))
        })
      } else {
        error('Failed to load commissions', response.message || 'Unknown error occurred')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      error('Failed to load commissions', errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  async function refreshData() {
    await Promise.all([fetchStats(true), fetchCommissions()])
    success('Data refreshed successfully')
  }

  function selectStatus(status: typeof selectedStatus.value) {
    selectedStatus.value = status
  }

  return {
    // State
    isLoading,
    isStatsLoading,
    commissions,
    stats,
    totalCommissions,

    // Filters
    selectedStatus,
    startDate,
    endDate,
    searchQuery,

    // Computed
    filteredCommissions,
    statusFilters,

    // Methods
    fetchStats,
    fetchCommissions,
    refreshData,
    selectStatus,
  }
}
