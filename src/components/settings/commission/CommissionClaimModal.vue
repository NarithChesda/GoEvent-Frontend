<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="p-6 border-b border-slate-200">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-slate-900">Approve & Pay Commission</h3>
          <button
            @click="$emit('close')"
            class="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
          >
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div class="p-6 space-y-4">
        <!-- Commission Details -->
        <div class="bg-slate-50 rounded-2xl p-4 space-y-3">
          <h4 class="font-semibold text-slate-900 text-sm">Commission Details</h4>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600">Reference:</span>
              <span class="font-medium text-slate-900">{{ commission?.commission_reference }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600">Event:</span>
              <span class="font-medium text-slate-900">{{
                commission?.event_info?.title || 'Unknown Event'
              }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600">Referrer:</span>
              <span class="font-medium text-slate-900">{{
                commission?.referrer_info?.full_name ||
                commission?.referrer_info?.email ||
                'Unknown'
              }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600">Commission Amount:</span>
              <span class="font-bold text-green-600 text-base">{{
                commission
                  ? formatCurrency(commission.commission_amount, commission.currency)
                  : '$0.00'
              }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600">Payment Amount:</span>
              <span class="font-medium text-slate-900">{{
                commission
                  ? formatCurrency(commission.payment_amount, commission.currency)
                  : '$0.00'
              }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600">Commission Rate:</span>
              <span class="font-medium text-slate-900">{{ commission?.commission_rate }}%</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600">Status:</span>
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  getStatusClass(commission?.status || ''),
                ]"
              >
                {{ commission?.status_display }}
              </span>
            </div>
          </div>
        </div>

        <!-- Request Information (if requested) -->
        <div
          v-if="commission?.status === 'requested' && commission?.requested_at"
          class="bg-purple-50 rounded-2xl p-4 space-y-3"
        >
          <h4 class="font-semibold text-purple-900 text-sm">Request Information</h4>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-purple-600">Requested Date:</span>
              <span class="font-medium text-purple-900">{{
                formatDate(commission.requested_at)
              }}</span>
            </div>
            <div v-if="commission.requested_notes" class="text-sm">
              <span class="text-purple-600 block mb-1">User Notes:</span>
              <div class="bg-white rounded-lg p-3 text-purple-900 text-xs border border-purple-200">
                {{ commission.requested_notes }}
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Notes -->
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2">
            Claim Notes (Optional)
          </label>
          <textarea
            :value="notes"
            @input="$emit('update:notes', ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            placeholder="Add any notes about the commission approval and payment..."
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
          ></textarea>
        </div>

        <!-- Confirmation Notice -->
        <div class="bg-green-50 border border-green-200 rounded-xl p-4">
          <div class="flex items-start space-x-2">
            <CheckCircle2 class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div class="text-xs text-green-800 space-y-1">
              <p class="font-semibold">Confirming Commission Approval:</p>
              <ul class="list-disc list-inside space-y-0.5 ml-1">
                <li>This action will mark the commission as "Claimed" and paid</li>
                <li>The referrer will be notified via email</li>
                <li>Payment processing should be completed outside this system</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-slate-200 flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          :disabled="isSubmitting"
          class="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          @click="$emit('submit')"
          :disabled="isSubmitting"
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting" class="flex items-center space-x-2">
            <RefreshCw class="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </span>
          <span v-else class="flex items-center space-x-2">
            <CheckCircle2 class="w-4 h-4" />
            <span>Approve & Mark as Paid</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import { formatCurrency, formatDate, getStatusClass } from '../../../utils/commissionHelpers'
import type { Commission } from '../../../services/commission'

interface Props {
  show: boolean
  commission: Commission | null
  notes: string
  isSubmitting: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit'): void
  (e: 'update:notes', value: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
