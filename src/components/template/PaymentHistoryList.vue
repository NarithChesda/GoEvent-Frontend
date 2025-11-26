<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
    <h3 class="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center">
      <History class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
      Payment History
    </h3>

    <div v-if="loading" class="text-center py-6 sm:py-8">
      <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff] mx-auto"></div>
      <p class="text-xs sm:text-sm text-slate-600 mt-2">Loading payment history...</p>
    </div>

    <div v-else-if="payments.length === 0" class="text-center py-6 sm:py-8">
      <History class="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
      <p class="text-xs sm:text-sm text-slate-500">No payments found for this event.</p>
    </div>

    <div v-else class="space-y-3 sm:space-y-4">
      <div
        v-for="payment in payments"
        :key="payment.id"
        class="p-3 sm:p-4 bg-slate-50/50 rounded-xl sm:rounded-2xl hover:bg-slate-100/50 transition-colors duration-200"
      >
        <div class="flex items-center justify-between mb-2 sm:mb-3 gap-2">
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-slate-900 text-sm sm:text-base truncate">{{ payment.plan_name }}</h4>
            <p class="text-xs sm:text-sm text-slate-600">{{ formatDate(payment.created_at) }}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-base sm:text-lg font-bold text-slate-900">${{ payment.amount }}</p>
            <span
              class="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium"
              :class="getStatusBadgeClass(payment.status)"
            >
              {{ getStatusDisplay(payment.status) }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <p class="text-slate-600 truncate">
            <span class="font-medium">Reference:</span> {{ payment.transaction_reference }}
          </p>
          <p class="text-slate-600 truncate">
            <span class="font-medium">Method:</span> {{ payment.payment_method_name }}
          </p>
          <p v-if="payment.template_name" class="text-slate-600 sm:col-span-2 truncate">
            <span class="font-medium">Template:</span> {{ payment.template_name }}
          </p>
        </div>

        <!-- Update Payment (if pending) -->
        <div v-if="payment.status === 'pending'" class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200">
          <button
            @click="$emit('update-payment', payment)"
            class="text-[#1e90ff] hover:text-[#1873cc] text-xs sm:text-sm font-medium inline-flex items-center"
          >
            <Pencil class="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
            <span class="hidden sm:inline">{{ payment.payment_proof ? 'Update Payment Details' : 'Update Payment / Upload Receipt' }}</span>
            <span class="sm:hidden">{{ payment.payment_proof ? 'Update' : 'Update / Upload' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { History, Pencil } from 'lucide-vue-next'
import type { Payment } from '../../types/payment'

interface Props {
  payments: readonly Payment[]
  loading?: boolean
}

defineProps<Props>()

defineEmits<{
  'update-payment': [payment: Payment]
}>()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'bg-orange-100 text-orange-700'
    case 'confirmed':
      return 'bg-green-100 text-green-700'
    case 'failed':
      return 'bg-red-100 text-red-700'
    case 'cancelled':
      return 'bg-slate-100 text-slate-700'
    case 'refunded':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getStatusDisplay = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'Pending Review'
    case 'confirmed':
      return 'Confirmed'
    case 'failed':
      return 'Rejected'
    case 'cancelled':
      return 'Cancelled'
    case 'refunded':
      return 'Refunded'
    default:
      return 'Unknown'
  }
}
</script>
