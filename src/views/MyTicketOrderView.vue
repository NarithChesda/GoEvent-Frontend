<template>
  <MainLayout :hide-mobile-tab-bar="true">
    <div class="min-h-screen bg-slate-50/50">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <!-- Back link -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          {{ t('events.tickets.order.back') }}
        </button>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <!-- Error -->
        <div
          v-else-if="error || !order"
          class="bg-white border border-slate-200 rounded-xl p-6 text-center"
        >
          <p class="text-sm text-slate-600">
            {{ error || t('events.tickets.order.notFound') }}
          </p>
        </div>

        <div v-else class="space-y-5">
          <!-- Header -->
          <header class="bg-white border border-slate-200 rounded-xl p-4">
            <div class="flex items-start justify-between gap-3 flex-wrap">
              <div class="min-w-0">
                <p class="text-xs uppercase text-slate-500 tracking-wide">
                  {{ t('events.tickets.order.confirmationCodeLabel') }}
                </p>
                <p class="font-mono text-lg font-bold text-slate-900 break-all">
                  {{ order.confirmation_code }}
                </p>
                <p class="mt-1 text-sm text-slate-600">{{ order.event.title }}</p>
              </div>
              <span
                :class="[
                  'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                  statusBadgeClass,
                ]"
              >
                {{ statusLabel }}
              </span>
            </div>
          </header>

          <!-- Status banner -->
          <div
            :class="[
              'rounded-xl p-4 border',
              bannerClass,
            ]"
          >
            <p class="text-sm font-medium">{{ statusLine }}</p>
            <p v-if="statusHelp" class="mt-1 text-xs opacity-90">{{ statusHelp }}</p>
            <p
              v-if="refundCountdown"
              class="mt-2 inline-block px-2 py-0.5 rounded-md bg-white/60 text-xs font-medium"
            >
              {{ refundCountdown }}
            </p>
          </div>

          <!-- Items -->
          <section class="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100">
              <h2 class="text-sm font-semibold text-slate-900">
                {{ t('events.tickets.order.itemsHeader') }}
              </h2>
            </div>
            <ul class="divide-y divide-slate-100">
              <li
                v-for="(item, idx) in order.items"
                :key="idx"
                class="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-900">{{ item.ticket_type.name }}</p>
                  <p class="text-xs text-slate-500 tabular-nums">
                    {{ item.quantity }} × {{ formatCurrency(item.unit_price, order.currency as CurrencyCode) }}
                  </p>
                </div>
                <p class="text-sm font-semibold text-slate-900 tabular-nums">
                  {{ formatCurrency(item.subtotal, order.currency as CurrencyCode) }}
                </p>
              </li>
            </ul>
            <div class="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">{{ t('events.tickets.order.subtotalLabel') }}</span>
                <span class="text-slate-900 tabular-nums">
                  {{ formatCurrency(order.subtotal, order.currency as CurrencyCode) }}
                </span>
              </div>
              <div
                v-if="order.promo_code"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-slate-600">
                  {{ t('events.tickets.order.discountLabel') }} ({{ order.promo_code }})
                </span>
                <span class="text-emerald-700 tabular-nums">
                  − {{ formatCurrency(order.promo_discount, order.currency as CurrencyCode) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-base font-semibold pt-1 border-t border-slate-200">
                <span class="text-slate-900">{{ t('events.tickets.order.totalLabel') }}</span>
                <span class="text-slate-900 tabular-nums">
                  {{ formatCurrency(order.total, order.currency as CurrencyCode) }}
                </span>
              </div>
            </div>
          </section>

          <!-- Pending: proof upload -->
          <TicketProofUploadForm
            v-if="order.status === 'pending'"
            :event-id="order.event.id"
            :confirmation-code="order.confirmation_code"
            @submitted="handleOrderUpdated"
            @message="handleMessage"
          />

          <!-- Paid: tickets -->
          <section v-if="order.status === 'paid' && order.tickets.length > 0">
            <h2 class="text-sm font-semibold text-slate-900 mb-3">
              {{ t('events.tickets.order.ticketsHeader') }}
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TicketCard
                v-for="ticket in order.tickets"
                :key="ticket.id"
                :ticket="ticket"
              />
            </div>
          </section>

          <!-- Refund summary (when present) -->
          <section
            v-if="order.refund"
            class="bg-white border border-slate-200 rounded-xl p-4"
          >
            <h2 class="text-sm font-semibold text-slate-900 mb-2">
              {{ t('events.tickets.order.refund.summaryHeader') }}
            </h2>
            <p class="text-xs text-slate-600">
              <span class="font-medium text-slate-700">{{ t('events.tickets.order.refund.statusLabel') }}:</span>
              {{ t(`events.tickets.order.refund.statuses.${order.refund.status}`) }}
            </p>
            <p v-if="order.refund.reason" class="mt-1 text-xs text-slate-600">
              <span class="font-medium text-slate-700">{{ t('events.tickets.order.refund.reasonLabel') }}:</span>
              {{ order.refund.reason }}
            </p>
            <p v-if="order.refund.admin_notes" class="mt-1 text-xs text-slate-600">
              <span class="font-medium text-slate-700">{{ t('events.tickets.order.refund.adminNotesLabel') }}:</span>
              {{ order.refund.admin_notes }}
            </p>
          </section>

          <!-- Actions -->
          <div class="flex flex-wrap gap-2">
            <button
              v-if="canCancel"
              type="button"
              class="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              :disabled="isCancelling"
              @click="cancelOrder"
            >
              {{ isCancelling ? t('events.tickets.order.cancelling') : t('events.tickets.order.cancel') }}
            </button>
            <button
              v-if="canRequestRefund"
              type="button"
              class="px-4 py-2 text-sm font-medium border border-rose-200 rounded-lg text-rose-700 hover:bg-rose-50"
              @click="showRefundModal = true"
            >
              {{ t('events.tickets.order.requestRefund') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Refund modal -->
      <RefundRequestModal
        ref="refundModalRef"
        :show="showRefundModal"
        :is-submitting="isRequestingRefund"
        @close="showRefundModal = false"
        @submit="submitRefund"
      />

      <!-- Toast -->
      <Transition name="slide-up">
        <div v-if="message" class="fixed bottom-4 right-4 z-50">
          <div
            :class="message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'"
            class="text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm"
          >
            <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 flex-shrink-0" />
            <AlertCircle v-else class="w-5 h-5 flex-shrink-0" />
            <span class="text-sm">{{ message.text }}</span>
          </div>
        </div>
      </Transition>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import TicketCard from '@/components/tickets/public/TicketCard.vue'
import TicketProofUploadForm from '@/components/tickets/public/TicketProofUploadForm.vue'
import RefundRequestModal from '@/components/tickets/public/RefundRequestModal.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { ticketOrdersService, type TicketOrderDetail } from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

const { t } = useAppLanguage()
const route = useRoute()
const router = useRouter()

const code = String(route.params.code)

const order = ref<TicketOrderDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const showRefundModal = ref(false)
const isRequestingRefund = ref(false)
const refundModalRef = ref<InstanceType<typeof RefundRequestModal> | null>(null)

const isCancelling = ref(false)

interface Toast { type: 'success' | 'error'; text: string }
const message = ref<Toast | null>(null)
let messageTimer: number | null = null
const handleMessage = (type: Toast['type'], text: string) => {
  message.value = { type, text }
  if (messageTimer !== null) clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => {
    message.value = null
    messageTimer = null
  }, 4000)
}

// ---- Live ticking for the refund-window countdown ------------------------
const now = ref(Date.now())
let tickInterval: number | null = null
onMounted(() => {
  // Update every 30s — fine-grained enough for a "1h 23m" display.
  tickInterval = window.setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})
onBeforeUnmount(() => {
  if (tickInterval !== null) clearInterval(tickInterval)
  if (messageTimer !== null) clearTimeout(messageTimer)
})

// ---- Load ----------------------------------------------------------------
const loadOrder = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await ticketOrdersService.get(code)
    if (response.success && response.data) {
      order.value = response.data
    } else {
      error.value = response.message || t('events.tickets.order.loadFailed')
    }
  } catch {
    error.value = t('events.tickets.order.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(loadOrder)

// ---- Status presentation -------------------------------------------------
const statusLabel = computed(() => {
  if (!order.value) return ''
  return t(`events.tickets.order.statuses.${order.value.status}`)
})

const statusBadgeClass = computed(() => {
  switch (order.value?.status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800'
    case 'pending':
    case 'awaiting_review':
      return 'bg-amber-100 text-amber-800'
    case 'refund_requested':
    case 'refunded':
    case 'cancelled':
    case 'expired':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
})

const statusLine = computed(() => {
  if (!order.value) return ''
  return t(`events.tickets.order.banners.${order.value.status}.line`)
})

const statusHelp = computed(() => {
  if (!order.value) return ''
  // Intentional: helpKey may be missing for some statuses; fall back to ''.
  const key = `events.tickets.order.banners.${order.value.status}.help`
  const localized = t(key)
  return localized === key ? '' : localized
})

const bannerClass = computed(() => {
  switch (order.value?.status) {
    case 'pending':
    case 'awaiting_review':
      return 'bg-amber-50 border-amber-200 text-amber-900'
    case 'paid':
      return 'bg-emerald-50 border-emerald-200 text-emerald-900'
    case 'refund_requested':
      return 'bg-sky-50 border-sky-200 text-sky-900'
    case 'refunded':
    case 'cancelled':
    case 'expired':
      return 'bg-slate-50 border-slate-200 text-slate-700'
    default:
      return 'bg-slate-50 border-slate-200 text-slate-700'
  }
})

const refundCountdown = computed(() => {
  if (!order.value || order.value.status !== 'paid') return null
  if (!order.value.is_refundable) return null
  if (!order.value.refund_window_ends_at) return null
  const ends = new Date(order.value.refund_window_ends_at).getTime()
  if (Number.isNaN(ends)) return null
  const remaining = ends - now.value
  if (remaining <= 0) return null
  const hours = Math.floor(remaining / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  // Show the warning banner only when within 2h of close — matches the
  // guide's UX recommendation.
  if (remaining > 2 * 3_600_000) return null
  return t('events.tickets.order.refund.windowClosing', { hours, minutes })
})

// ---- Action gating -------------------------------------------------------
const canCancel = computed(() => {
  if (!order.value) return false
  return order.value.status === 'pending' || order.value.status === 'awaiting_review'
})

const canRequestRefund = computed(() => {
  if (!order.value) return false
  return (
    order.value.status === 'paid' &&
    order.value.is_refundable &&
    !order.value.is_comp &&
    !order.value.refund
  )
})

// ---- Action handlers -----------------------------------------------------
const handleOrderUpdated = (updated: TicketOrderDetail) => {
  order.value = updated
}

const cancelOrder = async () => {
  if (!order.value) return
  if (!confirm(t('events.tickets.order.cancelConfirm'))) return
  isCancelling.value = true
  try {
    const response = await ticketOrdersService.cancel(order.value.confirmation_code)
    if (response.success && response.data) {
      order.value = response.data
      handleMessage('success', t('events.tickets.order.cancelSuccess'))
    } else {
      handleMessage('error', response.message || t('events.tickets.order.cancelFailed'))
    }
  } catch {
    handleMessage('error', t('events.tickets.order.cancelFailed'))
  } finally {
    isCancelling.value = false
  }
}

const submitRefund = async (reason: string) => {
  if (!order.value) return
  isRequestingRefund.value = true
  try {
    const response = await ticketOrdersService.requestRefund(
      order.value.confirmation_code,
      { reason },
    )
    if (response.success) {
      showRefundModal.value = false
      handleMessage('success', t('events.tickets.order.refund.successMessage'))
      await loadOrder()
    } else {
      const msg = response.message || t('events.tickets.order.refund.errorGeneric')
      refundModalRef.value?.setErrorMessage(msg)
    }
  } catch {
    refundModalRef.value?.setErrorMessage(t('events.tickets.order.refund.errorGeneric'))
  } finally {
    isRequestingRefund.value = false
  }
}

const goBack = () => {
  router.push({ name: 'my-tickets' })
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
