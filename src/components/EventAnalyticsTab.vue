<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 overflow-hidden">
      <!-- Title Section -->
      <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/80">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900 leading-tight tracking-tight">Analytics</h2>
              <p class="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Track event metrics and insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loadingPayments"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Loading analytics...</span>
      </div>
    </div>

    <!-- No Template Selected -->
    <div
      v-else-if="!props.event?.event_template"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <BarChart3 class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Template Selected</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        You need to select an event template before you can view analytics.
      </p>
      <button
        @click="redirectToTemplateTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <Mail class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Select Template
      </button>
    </div>

    <!-- Template Payment Check -->
    <div
      v-else-if="!hasTemplatePayment"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Lock class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">Template Payment Required</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        Your template {{ props.event.event_template_details?.name || 'Selected Template' }}
        requires payment before you can view analytics.
      </p>
      <button
        @click="redirectToPaymentTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <CreditCard class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Complete Payment
      </button>
    </div>

    <!-- Content Area -->
    <div v-else class="min-h-[400px]">
      <!-- Cash Gift Analytics Section -->
      <CashGiftAnalytics
        ref="cashGiftAnalyticsRef"
        :event-id="props.eventId"
        :groups="groups"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { BarChart3, Lock, CreditCard, Mail } from 'lucide-vue-next'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useGuestManagementStore } from '../stores/guestManagement'
import CashGiftAnalytics from './invitation/CashGiftAnalytics.vue'
import type { Event } from '../services/api'

// Props
const props = defineProps<{
  eventId: string
  event: Event
  canEdit: boolean
}>()

// Emits
const emit = defineEmits<{
  'tab-change': [tab: string]
}>()

// Use composables
const { isTemplateActivated, loadPayments, loadingPayments } = usePaymentTemplateIntegration(props.event)

// Use Pinia store for guest management
const store = useGuestManagementStore()

// Computed properties
const groups = computed(() => store.groups)
const hasTemplatePayment = computed(() => {
  if (!props.event?.event_template) return false
  return isTemplateActivated.value
})

// Methods
const redirectToPaymentTab = () => {
  emit('tab-change', 'template-payment')
}

const redirectToTemplateTab = () => {
  emit('tab-change', 'template-payment')
}

// Load groups for analytics
const loadGroups = () => store.loadGroups(props.eventId)

// Lifecycle
onMounted(async () => {
  await loadPayments()
  // Always load groups if we have template payment
  if (hasTemplatePayment.value) {
    await loadGroups()
  }
})

// Watch for template payment changes
watch(() => hasTemplatePayment.value, async (hasPayment) => {
  if (hasPayment && groups.value.length === 0) {
    await loadGroups()
  }
})
</script>
