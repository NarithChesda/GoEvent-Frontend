<template>
  <div>
    <!-- Optional consumer-injected header actions (e.g. an inline back button). -->
    <slot name="header-actions" />

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div
        class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"
      />
    </div>

    <!-- Error / empty -->
    <div
      v-else-if="error || !order"
      class="bg-white border border-slate-200 rounded-3xl p-10 sm:p-14 text-center"
    >
      <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8 text-slate-400" />
      </div>
      <p class="text-sm text-slate-600 max-w-sm mx-auto">
        {{ error || t('events.tickets.order.notFound') }}
      </p>
    </div>

    <div v-else class="space-y-5">
      <!--
        Header card: the code, and immediately under it the one sentence about
        where the order stands. The status used to be a second card floating
        below this one, which on a phone left the code sitting alone in a tall
        box with nothing beside it. Status is *about* the code, so it lives in
        the same card, tinted, as a strip along its bottom.
      -->
      <header
        class="relative bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
      >
        <div aria-hidden="true" class="h-1.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]" />
        <div class="px-4 py-4 sm:px-6 sm:py-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p
                class="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1"
              >
                {{ t('events.tickets.order.confirmationCodeLabel') }}
              </p>
              <p
                class="font-mono text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] break-all leading-tight"
              >
                {{ order.confirmation_code }}
              </p>
              <!-- Skipped when embedded: the modal's own head already names the
                   event, and two copies of it a centimetre apart read as an
                   accident rather than a hierarchy. -->
              <p
                v-if="eventTitle && !embedded"
                class="mt-2 text-sm sm:text-base font-medium text-slate-900 break-words"
              >
                {{ eventTitle }}
              </p>
            </div>
            <!-- Single intentional status badge (comp shown beside it only when relevant) -->
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap',
                  statusBadgeClass,
                ]"
              >
                {{ statusLabel }}
              </span>
              <span
                v-if="order.is_comp"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide bg-sky-50 text-sky-700"
              >
                {{ t('events.tickets.list.compBadge') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Status strip -->
        <div :class="['px-4 py-3 sm:px-6 sm:py-3.5 border-t', bannerClass]">
          <p class="text-sm font-medium leading-snug">{{ statusLine }}</p>
          <p v-if="statusHelp" class="mt-1 text-xs leading-relaxed opacity-90">{{ statusHelp }}</p>
          <p
            v-if="refundCountdown"
            class="mt-2 inline-block px-2.5 py-1 rounded-full bg-white/70 text-[11px] font-semibold uppercase tracking-wide"
          >
            {{ refundCountdown }}
          </p>
        </div>
      </header>

      <!-- Items: a receipt. One line per ticket type, one line for what it came
           to — the subtotal row only appears when a discount makes it differ
           from the total, since repeating the same figure twice under a rule
           reads as an error rather than a breakdown. -->
      <section>
        <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          {{ t('events.tickets.order.itemsHeader') }}
        </h2>
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <ul class="divide-y divide-slate-100">
            <li
              v-for="(item, idx) in order.items"
              :key="idx"
              class="px-4 sm:px-5 py-3 flex items-start justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-900 truncate">
                  {{ item.ticket_type.name }}
                </p>
                <p class="text-xs text-slate-500 tabular-nums mt-0.5">
                  {{ item.quantity }} ×
                  {{ formatCurrency(item.unit_price, order.currency as CurrencyCode) }}
                </p>
              </div>
              <p class="text-sm font-semibold text-slate-900 tabular-nums flex-shrink-0">
                {{ formatCurrency(item.subtotal, order.currency as CurrencyCode) }}
              </p>
            </li>
          </ul>
          <div class="px-4 sm:px-5 py-3 bg-slate-50/70 border-t border-slate-200 text-sm">
            <template v-if="showSubtotal">
              <div class="flex items-center justify-between">
                <span class="text-slate-500">{{ t('events.tickets.order.subtotalLabel') }}</span>
                <span class="text-slate-700 tabular-nums">
                  {{ formatCurrency(order.subtotal, order.currency as CurrencyCode) }}
                </span>
              </div>
              <div v-if="order.promo_code" class="flex items-center justify-between mt-1.5">
                <span class="text-slate-500 min-w-0 truncate">
                  {{ t('events.tickets.order.discountLabel') }}
                  <span
                    class="font-mono text-[11px] ml-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
                    >{{ order.promo_code }}</span
                  >
                </span>
                <span class="text-emerald-700 font-medium tabular-nums flex-shrink-0">
                  − {{ formatCurrency(order.promo_discount, order.currency as CurrencyCode) }}
                </span>
              </div>
            </template>
            <div
              class="flex items-baseline justify-between gap-3"
              :class="showSubtotal ? 'pt-2.5 mt-2.5 border-t border-dashed border-slate-300' : ''"
            >
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">{{
                t('events.tickets.order.totalLabel')
              }}</span>
              <span class="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                {{ formatCurrency(order.total, order.currency as CurrencyCode) }}
              </span>
            </div>
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
        <!-- auto-fit rather than a fixed two-up: inside the modal a lone ticket
             would otherwise sit in the left half with dead space beside it. -->
        <div class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
          <TicketCard v-for="ticket in order.tickets" :key="ticket.id" :ticket="ticket" />
        </div>
      </section>

      <!-- Refund summary (when present) -->
      <section v-if="order.refund">
        <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          {{ t('events.tickets.order.refund.summaryHeader') }}
        </h2>
        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm space-y-2">
          <div class="flex items-baseline gap-2">
            <span
              class="text-[11px] font-semibold uppercase tracking-wide text-rose-600 flex-shrink-0"
              >{{ t('events.tickets.order.refund.statusLabel') }}</span
            >
            <span class="text-rose-900 font-medium">{{
              t(`events.tickets.order.refund.statuses.${order.refund.status}`)
            }}</span>
          </div>
          <div v-if="order.refund.reason" class="flex items-baseline gap-2 flex-wrap">
            <span
              class="text-[11px] font-semibold uppercase tracking-wide text-rose-600 flex-shrink-0"
              >{{ t('events.tickets.order.refund.reasonLabel') }}</span
            >
            <span class="text-rose-900 leading-relaxed">{{ order.refund.reason }}</span>
          </div>
          <div v-if="order.refund.admin_notes" class="flex items-baseline gap-2 flex-wrap">
            <span
              class="text-[11px] font-semibold uppercase tracking-wide text-rose-600 flex-shrink-0"
              >{{ t('events.tickets.order.refund.adminNotesLabel') }}</span
            >
            <span class="text-rose-900 leading-relaxed">{{ order.refund.admin_notes }}</span>
          </div>
        </div>
      </section>

      <!-- Actions — full-width on mobile, comfortable touch targets -->
      <div
        v-if="canCancel || canRequestRefund"
        class="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-1"
      >
        <button
          v-if="canCancel"
          type="button"
          class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          :disabled="isCancelling"
          @click="cancelOrder"
        >
          <span
            v-if="isCancelling"
            class="w-4 h-4 animate-spin border-2 border-slate-400 border-t-transparent rounded-full"
          />
          {{
            isCancelling ? t('events.tickets.order.cancelling') : t('events.tickets.order.cancel')
          }}
        </button>
        <button
          v-if="canRequestRefund"
          type="button"
          class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-medium border border-rose-200 hover:border-rose-300 hover:bg-rose-50 rounded-xl text-rose-700 transition-all duration-200"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import TicketCard from '@/components/tickets/public/TicketCard.vue'
import TicketProofUploadForm from '@/components/tickets/public/TicketProofUploadForm.vue'
import RefundRequestModal from '@/components/tickets/public/RefundRequestModal.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { ticketOrdersService, type TicketOrderDetail } from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'
import { ticketOrderBadgeClasses } from '@/utils/ticketOrderStatus'

const props = defineProps<{
  code: string
  /** Rendered inside a surface that already names the order (TicketOrderModal). */
  embedded?: boolean
}>()

const { t } = useAppLanguage()

const order = ref<TicketOrderDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const showRefundModal = ref(false)
const isRequestingRefund = ref(false)
const refundModalRef = ref<InstanceType<typeof RefundRequestModal> | null>(null)

const isCancelling = ref(false)

const { showToast } = useToast()
const handleMessage = (type: 'success' | 'error', text: string) => {
  showToast(type, text)
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

// Badge sits on the white header card — use the same tinted chips as the
// list view so paid/awaiting_review/etc. read at a glance.
// Shared with the list this panel opens from, so a status can't be amber on one
// screen and slate on the next. See utils/ticketOrderStatus.ts.
const statusBadgeClass = computed(() =>
  order.value ? ticketOrderBadgeClasses(order.value.status) : 'bg-slate-100 text-slate-600',
)

// The breakdown earns its space only when something was taken off; otherwise
// subtotal and total are the same number printed twice.
const showSubtotal = computed(() => {
  if (!order.value) return false
  if (order.value.promo_code) return true
  return parseFloat(order.value.subtotal) !== parseFloat(order.value.total)
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
    // Amber is reserved for "we're waiting on you". Once the proof is in, the
    // ball is in the organizer's court and the banner cools to sky.
    case 'pending':
      return 'bg-amber-50 border-amber-200 text-amber-900'
    case 'paid':
      return 'bg-emerald-50 border-emerald-200 text-emerald-900'
    case 'awaiting_review':
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
    const response = await ticketOrdersService.requestRefund(order.value.confirmation_code, {
      reason,
    })
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
