<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="p-6 border-b border-slate-200">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-slate-900">Commission Details</h3>
          <button
            @click="$emit('close')"
            class="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
          >
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Commission Info -->
        <div>
          <h4 class="font-semibold text-slate-900 mb-3">Commission Information</h4>
          <div class="bg-slate-50 rounded-xl p-4 space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-500 mb-1">Reference Number</p>
                <p class="font-medium text-slate-900">{{ commission?.commission_reference }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Status</p>
                <span
                  v-if="commission"
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
                    getStatusClass(commission.status),
                  ]"
                >
                  <component :is="getStatusIcon(commission.status)" class="w-3 h-3 mr-1" />
                  {{ commission.status_display }}
                </span>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Commission Rate</p>
                <p class="font-medium text-slate-900">{{ commission?.commission_rate }}%</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Commission Amount</p>
                <p class="font-bold text-green-600 text-lg">
                  {{
                    commission
                      ? formatCurrency(commission.commission_amount, commission.currency)
                      : '$0.00'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Event Information -->
        <div>
          <h4 class="font-semibold text-slate-900 mb-3">Event Information</h4>
          <div class="bg-slate-50 rounded-xl p-4 space-y-3">
            <div class="flex items-start space-x-4">
              <div
                class="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              >
                {{ commission?.event_detail?.title?.substring(0, 2).toUpperCase() || 'EV' }}
              </div>
              <div class="flex-1">
                <h5 class="font-semibold text-slate-900">
                  {{ commission?.event_detail?.title || 'Unknown Event' }}
                </h5>
                <p class="text-sm text-slate-600 mt-1">
                  {{ commission?.payment_detail?.pricing_plan_name || 'Standard Plan' }} Package
                </p>
                <div class="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                  <span class="flex items-center space-x-1">
                    <Calendar class="w-3 h-3" />
                    <span>{{
                      commission?.event_detail
                        ? formatDate(commission.event_detail.start_date)
                        : 'N/A'
                    }}</span>
                  </span>
                  <span
                    class="flex items-center space-x-1"
                    v-if="commission?.event_detail?.organizer_email"
                  >
                    <span>{{ commission.event_detail.organizer_email }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Information -->
        <div>
          <h4 class="font-semibold text-slate-900 mb-3">Payment Information</h4>
          <div class="bg-slate-50 rounded-xl p-4 space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-500 mb-1">Payment Reference</p>
                <p class="font-medium text-slate-900">
                  {{ commission?.payment_detail?.payment_reference || 'N/A' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Payment Date</p>
                <p class="font-medium text-slate-900">
                  {{
                    commission?.payment_detail?.confirmed_at
                      ? formatDate(commission.payment_detail.confirmed_at)
                      : 'N/A'
                  }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Customer Email</p>
                <p class="font-medium text-slate-900">
                  {{ commission?.payment_detail?.user_email || 'N/A' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Payment Amount</p>
                <p class="font-medium text-slate-900">
                  {{
                    commission
                      ? formatCurrency(commission.payment_amount, commission.currency)
                      : '$0.00'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing Timeline -->
        <div v-if="commission">
          <h4 class="font-semibold text-slate-900 mb-3">Processing Timeline</h4>
          <div class="relative">
            <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200"></div>
            <div class="space-y-4">
              <!-- Created -->
              <div class="flex items-start space-x-4">
                <div
                  class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10"
                >
                  <Plus class="w-4 h-4 text-slate-600" />
                </div>
                <div class="flex-1">
                  <p class="font-medium text-slate-900 text-sm">Commission Created</p>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ formatDate(commission.created_at) }}
                  </p>
                </div>
              </div>

              <!-- Requested -->
              <div v-if="commission.requested_at" class="flex items-start space-x-4">
                <div
                  class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10"
                >
                  <FileText class="w-4 h-4 text-purple-600" />
                </div>
                <div class="flex-1">
                  <p class="font-medium text-slate-900 text-sm">Claim Requested</p>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ formatDate(commission.requested_at) }}
                  </p>
                  <div
                    v-if="commission.requested_notes"
                    class="bg-white rounded-lg border border-slate-200 p-3 mt-2"
                  >
                    <p class="text-xs text-slate-600 italic">"{{ commission.requested_notes }}"</p>
                  </div>
                </div>
              </div>

              <!-- Claimed -->
              <div v-if="commission.claimed_at" class="flex items-start space-x-4">
                <div
                  class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10"
                >
                  <CheckCircle class="w-4 h-4 text-green-600" />
                </div>
                <div class="flex-1">
                  <p class="font-medium text-slate-900 text-sm">Claim Approved & Paid</p>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ formatDate(commission.claimed_at) }}
                  </p>
                  <div class="bg-white rounded-lg border border-slate-200 p-3 mt-2">
                    <p v-if="commission.processed_by_detail" class="text-xs text-slate-600">
                      Processed by: {{ commission.processed_by_detail.email }}
                    </p>
                    <p v-if="commission.claim_notes" class="text-xs text-slate-600 italic mt-1">
                      "{{ commission.claim_notes }}"
                    </p>
                  </div>
                </div>
              </div>

              <!-- Rejected -->
              <div v-if="commission.rejected_at" class="flex items-start space-x-4">
                <div
                  class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10"
                >
                  <X class="w-4 h-4 text-red-600" />
                </div>
                <div class="flex-1">
                  <p class="font-medium text-slate-900 text-sm">Claim Rejected</p>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ formatDate(commission.rejected_at) }}
                  </p>
                  <div
                    v-if="commission.rejection_reason"
                    class="bg-white rounded-lg border border-slate-200 p-3 mt-2"
                  >
                    <p class="text-xs text-slate-600 italic">"{{ commission.rejection_reason }}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-slate-200 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, Calendar, Plus, FileText, CheckCircle } from 'lucide-vue-next'
import {
  formatCurrency,
  formatDate,
  getStatusClass,
  getStatusIcon,
} from '../../../utils/commissionHelpers'
import type { CommissionDetail } from '../../../services/commission'

interface Props {
  show: boolean
  commission: CommissionDetail | null
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
