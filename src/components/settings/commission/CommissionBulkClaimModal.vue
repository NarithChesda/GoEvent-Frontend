<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="p-6 border-b border-slate-200">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-slate-900">Bulk Approve Commissions</h3>
          <button
            @click="$emit('close')"
            class="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
          >
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div class="p-6 space-y-4">
        <!-- Summary -->
        <div class="bg-green-50 rounded-2xl p-4 space-y-3">
          <h4 class="font-semibold text-green-900 text-sm">Approval Summary</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-green-600">Total Commissions:</span>
              <span class="font-bold text-green-900 ml-2">{{ commissions.length }}</span>
            </div>
            <div>
              <span class="text-green-600">Total Amount:</span>
              <span class="font-bold text-green-900 ml-2">{{ totalAmount }}</span>
            </div>
          </div>
        </div>

        <!-- Commission List -->
        <div class="space-y-3">
          <h4 class="font-semibold text-slate-900 text-sm">Commissions to Approve</h4>
          <div class="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-4">
            <div
              v-for="commission in commissions"
              :key="commission.id"
              class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-sm font-medium text-slate-900 truncate">
                    {{ commission.event_info?.title || 'Unknown Event' }}
                  </span>
                  <span
                    :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      getStatusClass(commission.status),
                    ]"
                  >
                    {{ commission.status_display }}
                  </span>
                </div>
                <div class="flex items-center space-x-3 text-xs text-slate-500">
                  <span>{{ commission.commission_reference }}</span>
                  <span>•</span>
                  <span>{{
                    commission.referrer_info?.full_name ||
                    commission.referrer_info?.email ||
                    'Unknown'
                  }}</span>
                  <span>•</span>
                  <span>{{ formatDate(commission.created_at) }}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold text-green-600">
                  {{ formatCurrency(commission.commission_amount, commission.currency) }}
                </div>
                <div class="text-xs text-slate-500">{{ commission.commission_rate }}% rate</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bulk Notes -->
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2">
            Bulk Approval Notes (Optional)
          </label>
          <textarea
            :value="notes"
            @input="$emit('update:notes', ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            placeholder="Add any notes for all selected commissions..."
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
          ></textarea>
        </div>

        <!-- Important Warning -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div class="flex items-start space-x-2">
            <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div class="text-xs text-amber-800 space-y-1">
              <p class="font-semibold">Important - Bulk Approval:</p>
              <ul class="list-disc list-inside space-y-0.5 ml-1">
                <li>All selected commissions will be marked as "Claimed" and paid</li>
                <li>Referrers will be notified via email for each commission</li>
                <li>Ensure payment processing is completed outside this system</li>
                <li>This action cannot be undone for all commissions</li>
                <li>Review the list carefully before proceeding</li>
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
          :disabled="isSubmitting || commissions.length === 0"
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting" class="flex items-center space-x-2">
            <RefreshCw class="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </span>
          <span v-else class="flex items-center space-x-2">
            <CheckCircle2 class="w-4 h-4" />
            <span
              >Approve {{ commissions.length }} Commission{{
                commissions.length > 1 ? 's' : ''
              }}</span
            >
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-vue-next'
import { formatCurrency, formatDate, getStatusClass } from '../../../utils/commissionHelpers'
import type { Commission } from '../../../services/commission'

interface Props {
  show: boolean
  commissions: Commission[]
  notes: string
  isSubmitting: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit'): void
  (e: 'update:notes', value: string): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const totalAmount = computed(() => {
  if (props.commissions.length === 0) return '$0.00'

  const total = props.commissions.reduce((sum, commission) => sum + commission.commission_amount, 0)
  const currency = props.commissions[0]?.currency || 'USD'

  return formatCurrency(total, currency)
})
</script>
