<template>
  <div>
    <!-- Optional consumer-injected header actions (e.g. an inline back button). -->
    <slot name="header-actions" />

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Error / empty -->
    <div
      v-else-if="error || !order"
      class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 sm:p-12 text-center"
    >
      <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8 text-slate-400" />
      </div>
      <p class="text-sm text-slate-600 max-w-sm mx-auto">
        {{ error || t('events.tickets.order.notFound') }}
      </p>
    </div>

    <div v-else class="space-y-5">
      <!-- Header card with gradient (mirrors review drawer header) -->
      <header class="rounded-2xl overflow-hidden shadow-sm">
        <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 py-4 sm:px-5 sm:py-5">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div class="min-w-0 flex-1">
              <p class="text-[10px] sm:text-[11px] uppercase tracking-wide text-white/80 mb-0.5">
                {{ t('events.tickets.order.confirmationCodeLabel') }}
              </p>
              <p class="font-mono text-base sm:text-lg font-bold text-white break-all leading-tight">
                {{ order.confirmation_code }}
              </p>
              <p v-if="eventTitle" class="mt-1.5 text-sm text-white/90 break-words">
                {{ eventTitle }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium',
                  statusBadgeClass,
                ]"
              >
                {{ statusLabel }}
              </span>
              <span
                v-if="order.is_comp"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-white/90 text-sky-700"
              >
                {{ t('events.tickets.list.compBadge') }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- Status banner -->
      <div
        :class="[
          'rounded-2xl p-4 border',
          bannerClass,
        ]"
      >
        <p class="text-sm font-medium">{{ statusLine }}</p>
        <p v-if="statusHelp" class="mt-1 text-xs opacity-90">{{ statusHelp }}</p>
        <p
          v-if="refundCountdown"
          class="mt-2 inline-block px-2 py-0.5 rounded-lg bg-white/60 text-xs font-medium"
        >
          {{ refundCountdown }}
        </p>
      </div>

      <!-- Items -->
      <section>
        <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          {{ t('events.tickets.order.itemsHeader') }}
        </h2>
        <ul class="bg-white/80 border border-slate-200/60 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          <li
            v-for="(item, idx) in order.items"
            :key="idx"
            class="px-4 py-3 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ item.ticket_type.name }}</p>
              <p class="text-xs text-slate-500 tabular-nums mt-0.5">
                {{ item.quantity }} × {{ formatCurrency(item.unit_price, order.currency as CurrencyCode) }}
              </p>
            </div>
            <p class="text-sm font-semibold text-slate-900 tabular-nums flex-shrink-0">
              {{ formatCurrency(item.subtotal, order.currency as CurrencyCode) }}
            </p>
          </li>
        </ul>
        <div class="mt-2 px-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl space-y-1 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-slate-600">{{ t('events.tickets.order.subtotalLabel') }}</span>
            <span class="text-slate-900 tabular-nums">
              {{ formatCurrency(order.subtotal, order.currency as CurrencyCode) }}
            </span>
          </div>
          <div
            v-if="order.promo_code"
            class="flex items-center justify-between"
          >
            <span class="text-slate-600">
              {{ t('events.tickets.order.discountLabel') }} ({{ order.promo_code }})
            </span>
            <span class="text-emerald-700 tabular-nums">
              − {{ formatCurrency(order.promo_discount, order.currency as CurrencyCode) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-base font-semibold pt-1.5 border-t border-slate-200">
            <span class="text-slate-900">{{ t('events.tickets.order.totalLabel') }}</span>
            <span class="text-slate-900 tabular-nums">
              {{ formatCurrency(order.total, order.currency as CurrencyCode) }}
            </span>
          </div>
        </div>
      </section>

      <!-- Pending: proof upload. The detail endpoint may serve either the
           nested `event` object (documented shape) or the slim shape with
           a flat UUID `event` + `event_id`; `eventId` resolves both. -->
      <TicketProofUploadForm
        v-if="order.status === 'pending' && eventId"
        :event-id="eventId"
        :confirmation-code="order.confirmation_code"
        @submitted="handleOrderUpdated"
        @message="handleMessage"
      />

      <!-- Paid: tickets -->
      <section v-if="order.status === 'paid' && order.tickets.length > 0">
        <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
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
      <section v-if="order.refund">
        <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          {{ t('events.tickets.order.refund.summaryHeader') }}
        </h2>
        <div class="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 sm:p-4 text-sm space-y-1.5">
          <p class="text-rose-900">
            <span class="font-semibold">{{ t('events.tickets.order.refund.statusLabel') }}:</span>
            {{ t(`events.tickets.order.refund.statuses.${order.refund.status}`) }}
          </p>
          <p v-if="order.refund.reason" class="text-rose-800">
            <span class="font-semibold">{{ t('events.tickets.order.refund.reasonLabel') }}:</span>
            {{ order.refund.reason }}
          </p>
          <p v-if="order.refund.admin_notes" class="text-rose-800">
            <span class="font-semibold">{{ t('events.tickets.order.refund.adminNotesLabel') }}:</span>
            {{ order.refund.admin_notes }}
          </p>
        </div>
      </section>

      <!-- Actions -->
      <div v-if="canCancel || canRequestRefund" class="flex flex-wrap gap-2 pt-1">
        <button
          v-if="canCancel"
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          :disabled="isCancelling"
          @click="cancelOrder"
        >
          <span
            v-if="isCancelling"
            class="w-4 h-4 animate-spin border-2 border-slate-400 border-t-transparent rounded-full"
          />
          {{ isCancelling ? t('events.tickets.order.cancelling') : t('events.tickets.order.cancel') }}
        </button>
        <button
          v-if="canRequestRefund"
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium border border-rose-200 hover:border-rose-300 hover:bg-rose-50 rounded-xl text-rose-700 transition-all duration-200"
          @click="showRefundModal = true"
        >
          {{ t('events.tickets.order.requestRefund') }}
        </button>
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

    <!-- Toast (matches canonical: bottom-20 lg:bottom-8 / right-4 sm:right-8 / left-4 sm:left-auto) -->
    <Transition name="slide-up">
      <div
        v-if="message"
        class="fixed bottom-20 lg:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-[100]"
      >
        <div
          :class="message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'"
          class="text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 sm:max-w-sm"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 flex-shrink-0" />
          <AlertCircle v-else class="w-5 h-5 flex-shrink-0" />
          <span class="text-sm">{{ message.text }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import TicketCard from '@/components/tickets/public/TicketCard.vue'
import TicketProofUploadForm from '@/components/tickets/public/TicketProofUploadForm.vue'
import RefundRequestModal from '@/components/tickets/public/RefundRequestModal.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { ticketOrdersService, type TicketOrderDetail } from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

const props = defineProps<{
  code: string
}>()

const { t } = useAppLanguage()

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
    const response = await ticketOrdersService.get(props.code)
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

// Refetch whenever the parent swaps in a different code (e.g. user navigates
// between orders within the Settings tab without unmounting the panel).
watch(
  () => props.code,
  (next, prev) => {
    if (next && next !== prev) {
      loadOrder()
    }
  },
  { immediate: true },
)

// ---- Event identity ------------------------------------------------------
// `event` is either a nested OrderEventBrief or a bare UUID string (FK PK)
// depending on which serializer the backend is currently serving. Flat
// companions (`event_id`, `event_title`) may or may not be present.
const eventId = computed<string>(() => {
  const o = order.value
  if (!o) return ''
  if (o.event && typeof o.event === 'object') return o.event.id
  if (typeof o.event === 'string') return o.event
  return o.event_id ?? ''
})

const eventTitle = computed<string>(() => {
  const o = order.value
  if (!o) return ''
  if (o.event && typeof o.event === 'object') return o.event.title
  return o.event_title ?? ''
})

// ---- Status presentation -------------------------------------------------
const statusLabel = computed(() => {
  if (!order.value) return ''
  return t(`events.tickets.order.statuses.${order.value.status}`)
})

// Badge sits inside the gradient header — keep it on a white-ish chip so
// text contrast holds against the green→blue background.
const statusBadgeClass = computed(() => {
  switch (order.value?.status) {
    case 'paid':
      return 'bg-white/95 text-emerald-700'
    case 'awaiting_review':
      return 'bg-white/95 text-amber-700'
    case 'pending':
      return 'bg-white/90 text-slate-700'
    case 'refund_requested':
      return 'bg-white/95 text-sky-700'
    case 'refunded':
      return 'bg-white/95 text-rose-700'
    case 'cancelled':
    case 'expired':
      return 'bg-white/90 text-slate-600'
    default:
      return 'bg-white/90 text-slate-700'
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
