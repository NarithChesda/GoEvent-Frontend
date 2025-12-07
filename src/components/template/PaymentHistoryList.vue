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
        class="p-3 sm:p-4 bg-slate-50/50 rounded-xl sm:rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors duration-200"
      >
        <!-- Header Row: Plan name, Amount, Status -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-slate-900 text-sm sm:text-base">
              {{ payment.plan_name || 'Payment' }}
            </h4>
            <p v-if="payment.template_name" class="text-xs sm:text-sm text-slate-500 mt-0.5">
              {{ payment.template_name }}
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-base sm:text-lg font-bold text-slate-900">${{ payment.amount }}</p>
            <span
              class="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium mt-1"
              :class="getStatusBadgeClass(payment.status)"
            >
              <component :is="getStatusIcon(payment.status)" class="w-3 h-3 mr-1" />
              {{ payment.status_display || getStatusDisplay(payment.status) }}
            </span>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm border-t border-slate-100 pt-3">
          <!-- Date -->
          <div class="flex items-center gap-2 text-slate-600">
            <Calendar class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>{{ formatDate(payment.created_at) }}</span>
          </div>

          <!-- Payment Method -->
          <div class="flex items-center gap-2 text-slate-600">
            <CreditCard class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span class="truncate">{{ payment.payment_method_name || 'N/A' }}</span>
          </div>

          <!-- Transaction Reference -->
          <div v-if="payment.transaction_reference" class="flex items-center gap-2 text-slate-600">
            <Hash class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span class="truncate font-mono text-xs">{{ payment.transaction_reference }}</span>
          </div>

          <!-- Payment Reference -->
          <div v-if="payment.payment_reference" class="flex items-center gap-2 text-slate-600">
            <FileText class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span class="truncate font-mono text-xs">{{ payment.payment_reference }}</span>
          </div>

          <!-- Original Price vs Amount (if discount applied) -->
          <div v-if="payment.discount_amount && parseFloat(payment.discount_amount) > 0" class="flex items-center gap-2 text-slate-600 sm:col-span-2">
            <Tag class="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span>
              <span class="line-through text-slate-400">${{ payment.original_price }}</span>
              <span class="text-green-600 ml-1">(-${{ payment.discount_amount }} discount)</span>
            </span>
          </div>

          <!-- User Notes -->
          <div v-if="payment.user_notes" class="flex items-start gap-2 text-slate-600 sm:col-span-2">
            <MessageSquare class="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span class="line-clamp-2">{{ payment.user_notes }}</span>
          </div>

          <!-- Payment Proof Indicator -->
          <div v-if="payment.payment_proof" class="flex items-center gap-2 text-slate-600">
            <ImageIcon class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span class="text-green-600">Receipt uploaded</span>
          </div>
        </div>

        <!-- Update Payment Button (if pending) -->
        <div v-if="payment.status === 'pending'" class="mt-3 pt-3 border-t border-slate-100">
          <button
            @click="$emit('update-payment', payment)"
            class="inline-flex items-center gap-1.5 text-[#1e90ff] hover:text-[#1873cc] text-xs sm:text-sm font-medium transition-colors"
          >
            <Pencil class="w-3.5 h-3.5" />
            {{ payment.payment_proof ? 'Update Payment Details' : 'Update Payment / Upload Receipt' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  History,
  Pencil,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  RotateCcw,
  Calendar,
  CreditCard,
  Hash,
  FileText,
  Tag,
  MessageSquare,
  ImageIcon,
} from 'lucide-vue-next'
import type { Payment } from '../../types/payment'
import type { Component } from 'vue'

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

const getStatusIcon = (status?: string): Component => {
  switch (status) {
    case 'confirmed':
      return CheckCircle
    case 'pending':
      return Clock
    case 'failed':
      return XCircle
    case 'cancelled':
      return Ban
    case 'refunded':
      return RotateCcw
    default:
      return Clock
  }
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
