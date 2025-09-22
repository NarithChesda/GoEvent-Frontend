<template>
  <BaseCard variant="base" size="sm" class="overflow-hidden">
    <div class="p-4 border-b border-slate-200 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-2 h-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full"></div>
        <h3 class="text-lg font-semibold text-slate-900">Commission History</h3>
      </div>
      <button
        @click="$emit('exportData')"
        class="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-emerald-50 hover:to-sky-50 text-slate-700 hover:text-[#1e90ff] text-sm font-medium rounded-lg transition-all duration-300 border border-slate-200 hover:border-[#87CEEB]"
      >
        <Download class="w-4 h-4" />
        <span>Export CSV</span>
      </button>
    </div>

    <!-- Table for Desktop -->
    <div class="hidden lg:block overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
            >
              Reference
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
            >
              Event
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
            >
              Date
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
            >
              Rate
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
            >
              Amount
            </th>
            <th
              class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <!-- Loading State -->
          <tr v-if="isLoading">
            <td colspan="7" class="px-6 py-8 text-center">
              <div class="flex items-center justify-center space-x-2 text-slate-500">
                <RefreshCw class="w-5 h-5 animate-spin" />
                <span>Loading commissions...</span>
              </div>
            </td>
          </tr>

          <!-- No Data State -->
          <tr v-else-if="commissions.length === 0">
            <td colspan="7" class="px-6 py-8 text-center">
              <div class="text-slate-500">
                <FileText class="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p class="text-sm font-medium">No commissions found</p>
                <p class="text-xs mt-1">{{ noDataMessage }}</p>
              </div>
            </td>
          </tr>

          <!-- Commission Rows -->
          <tr
            v-else
            v-for="commission in commissions"
            :key="commission.id"
            class="hover:bg-slate-50/50 transition-colors"
          >
            <td class="px-6 py-4">
              <div class="flex items-center space-x-2">
                <Hash class="w-4 h-4 text-slate-400" />
                <span class="text-sm font-medium text-slate-900">{{
                  commission.commission_reference
                }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="space-y-1">
                <p class="text-sm font-medium text-slate-900">
                  {{ commission.event_info?.title || 'Unknown Event' }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ commission.payment_info?.payment_reference || 'N/A' }}
                </p>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="space-y-1">
                <p class="text-sm text-slate-700">{{ formatDate(commission.created_at) }}</p>
                <p class="text-xs text-slate-500">{{ getRelativeTime(commission.created_at) }}</p>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm font-medium text-slate-900"
                >{{ commission.commission_rate }}%</span
              >
            </td>
            <td class="px-6 py-4">
              <div class="space-y-1">
                <p class="text-sm font-bold text-slate-900">
                  {{ formatCurrency(commission.commission_amount, commission.currency) }}
                </p>
                <p class="text-xs text-slate-500">
                  from {{ formatCurrency(commission.payment_amount, commission.currency) }}
                </p>
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                  getStatusClass(commission.status),
                ]"
              >
                <component :is="getStatusIcon(commission.status)" class="w-3 h-3 mr-1" />
                {{ commission.status_display }}
              </span>
            </td>
            <td class="px-6 py-4">
              <CommissionActions
                :commission="commission"
                @request-claim="$emit('requestClaim', commission)"
                @view-details="$emit('viewDetails', commission)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards for Mobile -->
    <div class="lg:hidden p-4 space-y-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="flex items-center justify-center space-x-2 text-slate-500">
          <RefreshCw class="w-5 h-5 animate-spin" />
          <span>Loading commissions...</span>
        </div>
      </div>

      <!-- No Data State -->
      <div v-else-if="commissions.length === 0" class="text-center py-8">
        <div class="text-slate-500">
          <FileText class="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p class="text-sm font-medium">No commissions found</p>
          <p class="text-xs mt-1">{{ noDataMessage }}</p>
        </div>
      </div>

      <!-- Mobile Commission Cards -->
      <CommissionMobileCard
        v-else
        v-for="commission in commissions"
        :key="commission.id"
        :commission="commission"
        @request-claim="$emit('requestClaim', commission)"
        @view-details="$emit('viewDetails', commission)"
      />
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw, FileText, Hash, Download } from 'lucide-vue-next'
import {
  formatCurrency,
  formatDate,
  getRelativeTime,
  getStatusClass,
  getStatusIcon,
} from '../../../utils/commissionHelpers'
import CommissionActions from './CommissionActions.vue'
import CommissionMobileCard from './CommissionMobileCard.vue'
import BaseCard from '../../BaseCard.vue'
import type { Commission } from '../../../services/commission'

interface Props {
  commissions: Commission[]
  isLoading: boolean
  totalCommissions: number
}

interface Emits {
  (e: 'requestClaim', commission: Commission): void
  (e: 'viewDetails', commission: Commission): void
  (e: 'exportData'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const noDataMessage = computed(() => {
  return props.totalCommissions === 0
    ? "You haven't earned any commissions yet."
    : 'Try adjusting your filters.'
})
</script>
