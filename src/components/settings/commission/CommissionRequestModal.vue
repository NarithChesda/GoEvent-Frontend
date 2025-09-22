<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="p-6 border-b border-slate-200">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-slate-900">Request Commission Claim</h3>
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
              <span class="text-slate-600">Commission Amount:</span>
              <span class="font-bold text-green-600 text-base">{{
                commission
                  ? formatCurrency(commission.commission_amount, commission.currency)
                  : '$0.00'
              }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-600">Created Date:</span>
              <span class="font-medium text-slate-900">{{
                commission ? formatDate(commission.created_at) : 'N/A'
              }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Information -->
        <div>
          <h4 class="font-semibold text-slate-900 text-sm mb-3">Payment Method</h4>
          <div class="space-y-2">
            <label
              class="flex items-start space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all"
            >
              <input type="radio" name="payment_method" class="mt-1" checked />
              <div class="flex-1">
                <p class="font-medium text-slate-900 text-sm">Bank Transfer</p>
                <p class="text-xs text-slate-500 mt-1">Transfer to your registered bank account</p>
                <div class="mt-2 text-xs text-slate-600 bg-blue-50 rounded-lg p-2">
                  Account: ****1234 (Chase Bank)
                </div>
              </div>
            </label>
            <label
              class="flex items-start space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all"
            >
              <input type="radio" name="payment_method" class="mt-1" />
              <div class="flex-1">
                <p class="font-medium text-slate-900 text-sm">PayPal</p>
                <p class="text-xs text-slate-500 mt-1">Transfer to your PayPal account</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Request Notes -->
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            :value="notes"
            @input="$emit('update:notes', ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            placeholder="Add any special instructions or notes for processing..."
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          ></textarea>
        </div>

        <!-- Important Notice -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div class="flex items-start space-x-2">
            <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div class="text-xs text-amber-800 space-y-1">
              <p class="font-semibold">Important Information:</p>
              <ul class="list-disc list-inside space-y-0.5 ml-1">
                <li>Commission claims are typically processed within 3-5 business days</li>
                <li>Ensure your payment information is up to date</li>
                <li>You will receive an email notification once processed</li>
                <li>Minimum payout amount is $25.00</li>
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
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting" class="flex items-center space-x-2">
            <RefreshCw class="w-4 h-4 animate-spin" />
            <span>Submitting...</span>
          </span>
          <span v-else>Submit Claim Request</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, AlertTriangle, RefreshCw } from 'lucide-vue-next'
import { formatCurrency, formatDate } from '../../../utils/commissionHelpers'
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
