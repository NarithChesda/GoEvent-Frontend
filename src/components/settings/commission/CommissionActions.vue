<template>
  <div class="flex items-center justify-center space-x-2">
    <!-- Request Claim Button (User) -->
    <button
      v-if="commission.status === 'pending'"
      @click="$emit('requestClaim', commission)"
      class="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#1e90ff] hover:bg-[#1873cc] text-white text-sm font-medium rounded-lg transition-all duration-200"
    >
      <FileText class="w-3.5 h-3.5" />
      <span>Request Claim</span>
    </button>

    <!-- Status Button for Non-claimable Commissions -->
    <button
      v-else-if="commission.status === 'requested'"
      disabled
      class="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg cursor-not-allowed opacity-50"
    >
      <Clock class="w-3.5 h-3.5" />
      <span>Under Review</span>
    </button>

    <button
      v-else-if="commission.status === 'claimed'"
      disabled
      class="inline-flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg cursor-not-allowed"
    >
      <CheckCircle2 class="w-3.5 h-3.5" />
      <span>Paid</span>
    </button>

    <button
      v-else-if="commission.status === 'rejected'"
      disabled
      class="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-lg cursor-not-allowed"
    >
      <X class="w-3.5 h-3.5" />
      <span>Rejected</span>
    </button>

    <!-- View Details Button -->
    <button
      @click="$emit('viewDetails', commission)"
      class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
    >
      <Eye class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { FileText, Clock, CheckCircle2, X, Eye } from 'lucide-vue-next'
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
</script>
