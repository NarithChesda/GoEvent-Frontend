<template>
  <div class="bg-white rounded-xl p-4 border border-slate-200">
    <!-- Quick Actions based on current context -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-slate-700">Suggested Actions</h3>
      <span class="text-xs text-slate-500">{{ contextualMessage }}</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <!-- Contextual actions based on data state -->
      <template v-if="hasAdminClaimableCommissions">
        <button
          @click="$emit('bulkApproveClaim')"
          class="inline-flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>Approve {{ adminClaimableCount }} requests</span>
        </button>
      </template>

      <template v-if="hasUserClaimableCommissions">
        <button
          @click="$emit('bulkRequestClaim')"
          class="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <FileText class="w-4 h-4" />
          <span>Request {{ userClaimableCount }} pending</span>
        </button>
      </template>

      <template v-if="hasRequestedCommissions">
        <button
          @click="$emit('viewRequested')"
          class="inline-flex items-center space-x-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-medium rounded-lg transition-colors"
        >
          <Clock class="w-4 h-4" />
          <span>Review {{ requestedCount }} requests</span>
        </button>
      </template>

      <template v-if="shouldShowFilterSuggestion">
        <button
          @click="$emit('filterByStatus', suggestedFilterStatus)"
          class="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          <Filter class="w-4 h-4" />
          <span>Filter {{ suggestedFilterLabel }}</span>
        </button>
      </template>

      <!-- Always available actions -->
      <button
        @click="$emit('exportData')"
        class="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
      >
        <Download class="w-4 h-4" />
        <span>Export</span>
      </button>

      <button
        v-if="shouldShowHelp"
        @click="$emit('showHelp')"
        class="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
      >
        <HelpCircle class="w-4 h-4" />
        <span>Help</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Clock, Filter, Download, HelpCircle, FileText } from 'lucide-vue-next'
import type { CommissionStats } from '../../../services/commission'

interface Props {
  stats: CommissionStats | null
  selectedStatus: string
  totalCommissions: number
  commissions: any[]
}

interface Emits {
  (e: 'bulkApproveClaim'): void
  (e: 'bulkRequestClaim'): void
  (e: 'viewRequested'): void
  (
    e: 'filterByStatus',
    status: 'all' | 'pending' | 'requested' | 'claimed' | 'rejected' | 'cancelled',
  ): void
  (e: 'exportData'): void
  (e: 'showHelp'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Stats-based counts
const requestedCount = computed(() => props.stats?.requested_commissions || 0)

// Actual commission-based counts for more accurate actions
const adminClaimableCount = computed(() => props.commissions.filter((c) => c.can_be_claimed).length)
const userClaimableCount = computed(
  () => props.commissions.filter((c) => c.can_request_claim).length,
)

const hasAdminClaimableCommissions = computed(() => adminClaimableCount.value > 0)
const hasUserClaimableCommissions = computed(() => userClaimableCount.value > 0)
const hasRequestedCommissions = computed(() => requestedCount.value > 0)

const shouldShowFilterSuggestion = computed(() => {
  // Show filter suggestion if user is on "all" and has specific statuses with items
  if (props.selectedStatus !== 'all') return false

  if (hasAdminClaimableCommissions.value) return true
  if (hasUserClaimableCommissions.value) return true
  if (hasRequestedCommissions.value) return true

  return false
})

const suggestedFilterStatus = computed(() => {
  if (hasAdminClaimableCommissions.value || hasUserClaimableCommissions.value) return 'pending'
  if (hasRequestedCommissions.value) return 'requested'
  return 'all'
})

const suggestedFilterLabel = computed(() => {
  if (hasAdminClaimableCommissions.value || hasUserClaimableCommissions.value) return 'pending'
  if (hasRequestedCommissions.value) return 'requests'
  return 'all'
})

const shouldShowHelp = computed(() => {
  // Show help if user has no commissions or very few
  return props.totalCommissions === 0 || props.totalCommissions < 3
})

const contextualMessage = computed(() => {
  if (props.totalCommissions === 0) return 'Get started with your first commission'
  if (hasAdminClaimableCommissions.value) return 'You have requests to approve'
  if (hasUserClaimableCommissions.value) return 'You have claimable commissions'
  if (hasRequestedCommissions.value) return 'Track your pending requests'
  return 'Manage your commissions'
})
</script>
