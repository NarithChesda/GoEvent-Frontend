<template>
  <div class="bg-white rounded-xl p-4 border border-slate-200">
    <!-- Primary Information - Always visible -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2 mb-1">
          <div
            :class="getStatusDotClass(commission.status)"
            class="w-2 h-2 rounded-full flex-shrink-0"
          ></div>
          <h4 class="font-semibold text-slate-900 truncate">
            {{ commission.event_info?.title || 'Unknown Event' }}
          </h4>
        </div>
        <div class="flex items-center space-x-1 text-xs text-slate-500">
          <span class="font-medium">{{
            formatCurrency(commission.commission_amount, commission.currency)
          }}</span>
          <span>•</span>
          <span>{{ formatDate(commission.created_at) }}</span>
        </div>
      </div>

      <div class="flex items-center space-x-2 ml-3">
        <span
          :class="['px-2 py-1 rounded-md text-xs font-medium', getStatusClass(commission.status)]"
        >
          {{ commission.status_display }}
        </span>
        <button
          @click="toggleExpanded"
          class="p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronDown :class="['w-4 h-4 transition-transform', isExpanded && 'rotate-180']" />
        </button>
      </div>
    </div>

    <!-- Secondary Information - Progressive disclosure -->
    <div v-if="isExpanded" class="space-y-3 pt-3 border-t border-slate-100">
      <!-- Detailed metrics -->
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="bg-slate-50 rounded-lg p-2">
          <p class="text-xs text-slate-600 mb-1">Rate</p>
          <p class="text-sm font-semibold text-slate-900">{{ commission.commission_rate }}%</p>
        </div>
        <div class="bg-slate-50 rounded-lg p-2">
          <p class="text-xs text-slate-600 mb-1">From</p>
          <p class="text-sm font-semibold text-slate-900">
            {{ formatCurrency(commission.payment_amount, commission.currency) }}
          </p>
        </div>
        <div class="bg-slate-50 rounded-lg p-2">
          <p class="text-xs text-slate-600 mb-1">Ref</p>
          <p class="text-xs font-medium text-slate-900 truncate">
            {{ commission.commission_reference }}
          </p>
        </div>
      </div>

      <!-- Status-specific information -->
      <div
        v-if="commission.status === 'requested' && commission.requested_at"
        class="bg-purple-50 rounded-lg p-3"
      >
        <div class="flex items-center space-x-2 mb-1">
          <Clock class="w-4 h-4 text-purple-600" />
          <span class="text-xs font-semibold text-purple-700">Under Review</span>
        </div>
        <p class="text-xs text-purple-600">Requested {{ formatDate(commission.requested_at) }}</p>
      </div>

      <div
        v-else-if="commission.status === 'claimed' && commission.claimed_at"
        class="bg-green-50 rounded-lg p-3"
      >
        <div class="flex items-center space-x-2 mb-1">
          <CheckCircle2 class="w-4 h-4 text-green-600" />
          <span class="text-xs font-semibold text-green-700">Claimed Successfully</span>
        </div>
        <p class="text-xs text-green-600">Claimed {{ formatDate(commission.claimed_at) }}</p>
      </div>

      <div
        v-else-if="commission.status === 'rejected' && commission.rejected_at"
        class="bg-red-50 rounded-lg p-3"
      >
        <div class="flex items-center space-x-2 mb-1">
          <XCircle class="w-4 h-4 text-red-600" />
          <span class="text-xs font-semibold text-red-700">Claim Rejected</span>
        </div>
        <p class="text-xs text-red-600">Rejected {{ formatDate(commission.rejected_at) }}</p>
      </div>

      <!-- Payment reference (if available) -->
      <div v-if="commission.payment_info?.payment_reference" class="text-xs text-slate-500">
        <span class="font-medium">Payment:</span> {{ commission.payment_info.payment_reference }}
      </div>

      <!-- Actions -->
      <div class="flex space-x-2 pt-1">
        <!-- User Request Claim Button -->
        <button
          v-if="commission.status === 'pending'"
          @click="$emit('requestClaim', commission)"
          class="flex-1 px-3 py-2 bg-[#1e90ff] hover:bg-[#1873cc] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Request Claim
        </button>

        <button
          @click="$emit('viewDetails', commission)"
          :class="[
            'px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors',
            commission.status !== 'pending' ? 'flex-1' : '',
          ]"
        >
          Details
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, Clock, CheckCircle2, XCircle } from 'lucide-vue-next'
import {
  formatCurrency,
  formatDate,
  getStatusClass,
  getStatusDotClass,
} from '../../../utils/commissionHelpers'
import type { Commission } from '../../../services/commission'

interface Props {
  commission: Commission
}

interface Emits {
  (e: 'requestClaim', commission: Commission): void
  (e: 'viewDetails', commission: Commission): void
}

defineProps<Props>()
defineEmits<Emits>()

// Progressive disclosure state
const isExpanded = ref(false)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}
</script>
