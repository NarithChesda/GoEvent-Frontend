<template>
  <div class="space-y-6">
    <!-- Commission Overview Dashboard -->
    <BaseCard variant="featured" size="lg" class="shadow-xl">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
          <h2 class="text-xl font-bold text-slate-900">Commission Dashboard</h2>
        </div>
        <button
          @click="refreshData"
          :disabled="isLoading || isStatsLoading"
          class="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw :class="['w-4 h-4', { 'animate-spin': isLoading || isStatsLoading }]" />
          <span>Refresh</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="mb-6">
        <CommissionStatsCards :stats="stats" :is-stats-loading="isStatsLoading" />
      </div>

    </BaseCard>

    <!-- Filters Section -->
    <CommissionFilters
      :status-filters="statusFilters"
      :selected-status="selectedStatus"
      v-model:start-date="startDate"
      v-model:end-date="endDate"
      v-model:search-query="searchQuery"
      @select-status="selectStatus"
    />

    <!-- Commissions List -->
    <CommissionTable
      :commissions="paginatedCommissions"
      :is-loading="isLoading"
      :total-commissions="totalCommissions"
      @request-claim="openRequestClaimModal"
      @view-details="viewCommissionDetails"
      @export-data="handleExportData"
    />

    <!-- Pagination -->
    <BaseCard variant="compact" size="sm">
      <CommissionPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :pagination-info="paginationInfo"
        @go-to-page="goToPage"
        @previous-page="goToPreviousPage"
        @next-page="goToNextPage"
      />
    </BaseCard>

    <!-- Modals -->
    <CommissionRequestModal
      :show="showRequestClaimModal"
      :commission="selectedCommissionForClaim"
      v-model:notes="requestClaimNotes"
      :is-submitting="isRequestingClaim"
      @close="closeRequestClaimModal"
      @submit="requestClaim"
    />

    <CommissionDetailsModal
      :show="showDetailsModal"
      :commission="selectedCommission"
      @close="closeDetailsModal"
    />

    <CommissionClaimModal
      :show="showClaimModal"
      :commission="selectedCommissionForApproval"
      v-model:notes="claimNotes"
      :is-submitting="isClaimingCommission"
      @close="closeClaimModal"
      @submit="claimCommission"
    />

    <CommissionBulkClaimModal
      :show="showBulkClaimModal"
      :commissions="selectedCommissionsForBulkAction"
      v-model:notes="bulkClaimNotes"
      :is-submitting="isBulkActioning"
      @close="closeBulkClaimModal"
      @submit="bulkClaimCommissions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { formatDate, formatCurrency } from '../../utils/commissionHelpers'
import type { Commission } from '../../services/commission'

// Composables
import { useCommissionData } from '../../composables/useCommissionData'
import { useCommissionPagination } from '../../composables/useCommissionPagination'
import { useCommissionActions } from '../../composables/useCommissionActions'
import { useNotifications } from '../../composables/useNotifications'

// Components
import BaseCard from '../BaseCard.vue'
import CommissionStatsCards from './commission/CommissionStatsCards.vue'
import CommissionFilters from './commission/CommissionFilters.vue'
import CommissionTable from './commission/CommissionTable.vue'
import CommissionPagination from './commission/CommissionPagination.vue'
import CommissionRequestModal from './commission/CommissionRequestModal.vue'
import CommissionDetailsModal from './commission/CommissionDetailsModal.vue'
import CommissionClaimModal from './commission/CommissionClaimModal.vue'
import CommissionBulkClaimModal from './commission/CommissionBulkClaimModal.vue'

// Commission data management
const {
  isLoading,
  isStatsLoading,
  commissions,
  stats,
  totalCommissions,
  selectedStatus,
  startDate,
  endDate,
  searchQuery,
  filteredCommissions,
  statusFilters,
  fetchStats,
  fetchCommissions,
  refreshData,
  selectStatus,
} = useCommissionData()

// Pagination
const {
  currentPage,
  totalPages,
  paginatedData: paginatedCommissions,
  paginationInfo,
  goToPage,
  goToPreviousPage,
  goToNextPage,
  resetToFirstPage,
} = useCommissionPagination(filteredCommissions)

// Commission actions (modals, claim requests, etc.)
const {
  showRequestClaimModal,
  showDetailsModal,
  showClaimModal,
  showBulkClaimModal,
  selectedCommission,
  selectedCommissionForClaim,
  selectedCommissionForApproval,
  selectedCommissionsForBulkAction,
  requestClaimNotes,
  claimNotes,
  bulkClaimNotes,
  isRequestingClaim,
  isClaimingCommission,
  isBulkActioning,
  openRequestClaimModal,
  openClaimModal,
  openBulkClaimModal,
  requestClaim: baseRequestClaim,
  claimCommission: baseClaimCommission,
  bulkClaimCommissions: baseBulkClaimCommissions,
  viewCommissionDetails,
  closeRequestClaimModal,
  closeDetailsModal,
  closeClaimModal,
  closeBulkClaimModal,
} = useCommissionActions()

const { info, success, error } = useNotifications()

// Enhanced functions that refresh data after success
async function requestClaim() {
  await baseRequestClaim(async (updatedCommission) => {
    if (updatedCommission) {
      // Update the specific commission in our local state if possible
      const index = commissions.value.findIndex((c) => c.id === updatedCommission.id)
      if (index !== -1) {
        // Convert CommissionDetail back to Commission for the list view
        const updatedCommissionListItem: Commission = {
          ...commissions.value[index],
          status: updatedCommission.status,
          requested_at: updatedCommission.requested_at,
          requested_notes: updatedCommission.requested_notes,
          can_request_claim: updatedCommission.can_request_claim,
          can_be_claimed: updatedCommission.can_be_claimed,
          can_be_rejected: updatedCommission.can_be_rejected,
          is_requested: updatedCommission.status === 'requested',
          is_pending: updatedCommission.status === 'pending',
        }
        commissions.value[index] = updatedCommissionListItem
      }
    }
    // Also refresh stats to reflect the change
    await fetchStats(true)
  })
}

async function claimCommission() {
  await baseClaimCommission(async (updatedCommission) => {
    if (updatedCommission) {
      // Update the specific commission in our local state if possible
      const index = commissions.value.findIndex((c) => c.id === updatedCommission.id)
      if (index !== -1) {
        // Convert CommissionDetail back to Commission for the list view
        const updatedCommissionListItem: Commission = {
          ...commissions.value[index],
          status: updatedCommission.status,
          claimed_at: updatedCommission.claimed_at,
          claim_notes: updatedCommission.claim_notes,
          can_request_claim: updatedCommission.can_request_claim,
          can_be_claimed: updatedCommission.can_be_claimed,
          can_be_rejected: updatedCommission.can_be_rejected,
          is_claimed: updatedCommission.status === 'claimed',
          is_requested: false,
          is_pending: false,
        }
        commissions.value[index] = updatedCommissionListItem
      }
    }
    // Also refresh stats to reflect the change
    await fetchStats(true)
  })
}

async function bulkClaimCommissions() {
  await baseBulkClaimCommissions(async (updatedCommissions) => {
    if (updatedCommissions && updatedCommissions.length > 0) {
      // Update multiple commissions in our local state
      updatedCommissions.forEach((updatedCommission) => {
        const index = commissions.value.findIndex((c) => c.id === updatedCommission.id)
        if (index !== -1) {
          commissions.value[index] = {
            ...commissions.value[index],
            status: updatedCommission.status,
            claimed_at: updatedCommission.claimed_at,
            claim_notes: updatedCommission.claim_notes,
            can_request_claim: updatedCommission.can_request_claim,
            can_be_claimed: updatedCommission.can_be_claimed,
            can_be_rejected: updatedCommission.can_be_rejected,
            is_claimed: updatedCommission.status === 'claimed',
            is_requested: false,
            is_pending: false,
          }
        }
      })
    }
    // Also refresh stats to reflect the changes
    await fetchStats(true)
  })
}

function handleExportData() {
  // Export filtered commissions as CSV
  try {
    const csvData = generateCommissionCSV(filteredCommissions.value)
    downloadCSV(csvData, `commissions-${new Date().toISOString().split('T')[0]}.csv`)
    success('Export Complete', 'Your commission data has been downloaded')
  } catch (err) {
    // Using the error notification function from useNotifications
    error('Export Failed', 'Unable to export commission data')
  }
}


// Helper functions for export
function generateCommissionCSV(commissions: Commission[]): string {
  const headers = ['Reference', 'Event', 'Date', 'Rate', 'Amount', 'Status', 'Notes']
  const rows = commissions.map((c) => [
    c.commission_reference,
    c.event_info?.title || 'Unknown',
    formatDate(c.created_at),
    `${c.commission_rate}%`,
    formatCurrency(c.commission_amount, c.currency),
    c.status_display,
    (c.requested_notes || c.claim_notes || '').replace(/[,\n\r]/g, ' '),
  ])

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Watch for filter changes and reset pagination
watch([selectedStatus, searchQuery, startDate, endDate], () => {
  resetToFirstPage()
})

// Initialize data on mount
onMounted(() => {
  refreshData()
})
</script>
