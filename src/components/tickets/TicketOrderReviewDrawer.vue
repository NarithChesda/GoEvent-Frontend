<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
        @click="handleClose"
      />
    </Transition>

    <!-- Right-side drawer (slide on desktop, bottom sheet on mobile) -->
    <Transition name="slide-right">
      <div
        v-if="isOpen"
        class="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto w-full md:w-[560px] lg:w-[640px] bg-white md:rounded-l-3xl rounded-t-3xl md:rounded-tr-none shadow-2xl z-[71] flex flex-col max-h-[92vh] md:max-h-none"
        @click.stop
      >
        <!-- Header -->
        <header class="flex-shrink-0 px-5 py-4 border-b border-slate-200 bg-white">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">
                {{ t('management.tickets.orders.review.codeLabel') }}
              </p>
              <p class="text-base font-mono font-semibold text-slate-900 break-all">
                {{ confirmationCode }}
              </p>
              <span
                v-if="order"
                :class="[
                  'inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-medium',
                  statusBadgeClasses(order.status),
                ]"
              >
                {{ statusLabel(order.status) }}
              </span>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center flex-shrink-0"
              :aria-label="t('management.tickets.orders.review.close')"
              @click="handleClose"
            >
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </header>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>

          <!-- Error -->
          <div v-else-if="loadError" class="p-5">
            <div class="rounded-lg bg-red-50 border border-red-200 p-3">
              <p class="text-sm text-red-800">{{ loadError }}</p>
            </div>
          </div>

          <div v-else-if="order" class="p-5 space-y-5">
            <!-- Buyer info -->
            <section>
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {{ t('management.tickets.orders.review.buyerHeader') }}
              </h3>
              <div class="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
                <p class="font-medium text-slate-900">{{ order.buyer_name || order.buyer.name }}</p>
                <p class="text-slate-600">{{ order.buyer_email }}</p>
                <p v-if="order.buyer_phone" class="text-slate-600">{{ order.buyer_phone }}</p>
              </div>
            </section>

            <!-- Items -->
            <section>
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {{ t('management.tickets.orders.review.itemsHeader') }}
              </h3>
              <ul class="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                <li
                  v-for="(item, idx) in order.items"
                  :key="idx"
                  class="px-3 py-2.5 flex items-center justify-between gap-3 bg-white"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-900 truncate">
                      {{ item.ticket_type.name }}
                    </p>
                    <p class="text-xs text-slate-500 tabular-nums">
                      {{ item.quantity }} ×
                      {{ formatCurrency(item.unit_price, order.currency as CurrencyCode) }}
                    </p>
                  </div>
                  <p class="text-sm font-semibold text-slate-900 tabular-nums">
                    {{ formatCurrency(item.subtotal, order.currency as CurrencyCode) }}
                  </p>
                </li>
              </ul>
              <div class="mt-2 px-3 py-2 bg-slate-50 rounded-lg space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-600">
                    {{ t('management.tickets.orders.review.subtotal') }}
                  </span>
                  <span class="text-slate-900 tabular-nums">
                    {{ formatCurrency(order.subtotal, order.currency as CurrencyCode) }}
                  </span>
                </div>
                <div v-if="order.promo_code" class="flex justify-between">
                  <span class="text-slate-600">
                    {{ t('management.tickets.orders.review.discount') }} ({{ order.promo_code }})
                  </span>
                  <span class="text-emerald-700 tabular-nums">
                    − {{ formatCurrency(order.promo_discount, order.currency as CurrencyCode) }}
                  </span>
                </div>
                <div class="flex justify-between font-semibold pt-1 border-t border-slate-200">
                  <span class="text-slate-900">
                    {{ t('management.tickets.orders.review.total') }}
                  </span>
                  <span class="text-slate-900 tabular-nums">
                    {{ formatCurrency(order.total, order.currency as CurrencyCode) }}
                  </span>
                </div>
              </div>
            </section>

            <!-- Payment / proof -->
            <section v-if="!order.is_comp">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {{ t('management.tickets.orders.review.paymentHeader') }}
              </h3>
              <div class="bg-slate-50 rounded-xl p-3 space-y-2 text-sm">
                <div v-if="order.payment_method_name" class="flex justify-between gap-3">
                  <span class="text-slate-500">
                    {{ t('management.tickets.orders.review.method') }}
                  </span>
                  <span class="text-slate-900 text-right">{{ order.payment_method_name }}</span>
                </div>
                <div v-if="order.transaction_reference" class="flex justify-between gap-3">
                  <span class="text-slate-500">
                    {{ t('management.tickets.orders.review.transactionRef') }}
                  </span>
                  <span class="font-mono text-slate-900 text-right break-all">
                    {{ order.transaction_reference }}
                  </span>
                </div>
                <div v-if="order.proof_submitted_at" class="flex justify-between gap-3">
                  <span class="text-slate-500">
                    {{ t('management.tickets.orders.review.proofSubmittedAt') }}
                  </span>
                  <span class="text-slate-900 text-right">
                    {{ formatDateTime(order.proof_submitted_at) }}
                  </span>
                </div>
                <div v-if="order.buyer_notes" class="pt-2 border-t border-slate-200">
                  <p class="text-xs text-slate-500 mb-0.5">
                    {{ t('management.tickets.orders.review.buyerNotes') }}
                  </p>
                  <p class="text-slate-700 whitespace-pre-line">{{ order.buyer_notes }}</p>
                </div>
              </div>

              <!-- Proof file preview -->
              <div v-if="rawProofUrl" class="mt-3">
                <p class="text-xs text-slate-500 mb-1.5">
                  {{ t('management.tickets.orders.review.proofFile') }}
                </p>
                <div
                  v-if="proofIsImage"
                  class="rounded-xl border border-slate-200 overflow-hidden bg-slate-100"
                >
                  <a :href="proofUrl" target="_blank" rel="noopener noreferrer">
                    <img
                      :src="proofUrl"
                      alt="Payment proof"
                      class="w-full max-h-96 object-contain bg-white"
                    />
                  </a>
                </div>
                <a
                  v-else
                  :href="proofUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FileText class="w-4 h-4" />
                  {{ t('management.tickets.orders.review.openProof') }}
                  <ExternalLink class="w-3.5 h-3.5 ml-auto text-slate-400" />
                </a>
              </div>
              <div
                v-else-if="order.status === 'pending'"
                class="mt-2 text-xs text-slate-500 italic"
              >
                {{ t('management.tickets.orders.review.noProofYet') }}
              </div>
            </section>

            <!-- Comp callout -->
            <section
              v-if="order.is_comp"
              class="rounded-xl border border-sky-200 bg-sky-50 p-3"
            >
              <p class="text-sm font-medium text-sky-900">
                {{ t('management.tickets.orders.review.compTitle') }}
              </p>
              <p class="mt-0.5 text-xs text-sky-800">
                {{ t('management.tickets.orders.review.compDescription') }}
              </p>
            </section>

            <!-- Confirmation history (when reviewed) -->
            <section v-if="order.confirmed_at || order.admin_notes">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {{ t('management.tickets.orders.review.reviewHeader') }}
              </h3>
              <div class="bg-slate-50 rounded-xl p-3 space-y-2 text-sm">
                <div v-if="order.confirmed_by" class="flex justify-between gap-3">
                  <span class="text-slate-500">
                    {{ t('management.tickets.orders.review.reviewedBy') }}
                  </span>
                  <span class="text-slate-900 text-right">{{ order.confirmed_by.email }}</span>
                </div>
                <div v-if="order.confirmed_at" class="flex justify-between gap-3">
                  <span class="text-slate-500">
                    {{ t('management.tickets.orders.review.reviewedAt') }}
                  </span>
                  <span class="text-slate-900 text-right">
                    {{ formatDateTime(order.confirmed_at) }}
                  </span>
                </div>
                <div v-if="order.admin_notes" class="pt-2 border-t border-slate-200">
                  <p class="text-xs text-slate-500 mb-0.5">
                    {{ t('management.tickets.orders.review.adminNotes') }}
                  </p>
                  <p class="text-slate-700 whitespace-pre-line">{{ order.admin_notes }}</p>
                </div>
              </div>
            </section>

            <!-- Refund summary -->
            <section
              v-if="order.refund"
              class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm"
            >
              <p class="font-medium text-rose-900">
                {{ t('management.tickets.orders.review.refundHeader') }}
                ({{ order.refund.status }})
              </p>
              <p v-if="order.refund.reason" class="mt-1 text-rose-800">
                {{ order.refund.reason }}
              </p>
            </section>

            <!-- Action area: confirm / reject (only when actionable) -->
            <section
              v-if="canReview"
              class="border-t border-slate-200 pt-4 space-y-3"
            >
              <label class="block">
                <span class="text-xs font-medium text-slate-700">
                  {{ t('management.tickets.orders.review.adminNotesLabel') }}
                  <span v-if="rejecting" class="text-red-500">*</span>
                </span>
                <textarea
                  v-model="adminNotes"
                  rows="3"
                  maxlength="1000"
                  :placeholder="
                    rejecting
                      ? t('management.tickets.orders.review.adminNotesRejectPlaceholder')
                      : t('management.tickets.orders.review.adminNotesPlaceholder')
                  "
                  class="mt-1 w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-y"
                  :class="actionFieldError ? 'border-red-300' : 'border-slate-300'"
                />
                <p v-if="actionFieldError" class="mt-1 text-xs text-red-600">
                  {{ actionFieldError }}
                </p>
              </label>

              <div v-if="actionError" class="rounded-lg bg-red-50 border border-red-200 p-3">
                <p class="text-sm text-red-800">{{ actionError }}</p>
              </div>

              <div class="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  class="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  :disabled="submitting"
                  @click="confirmOrder"
                >
                  <span
                    v-if="submitting && action === 'confirm'"
                    class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
                  />
                  <Check v-else class="w-4 h-4" />
                  {{ t('management.tickets.orders.review.confirm') }}
                </button>
                <button
                  type="button"
                  class="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  :disabled="submitting"
                  @click="rejectOrder"
                >
                  <span
                    v-if="submitting && action === 'reject'"
                    class="w-4 h-4 animate-spin border-2 border-rose-600 border-t-transparent rounded-full"
                  />
                  <X v-else class="w-4 h-4" />
                  {{ t('management.tickets.orders.review.reject') }}
                </button>
              </div>
              <p class="text-[11px] text-slate-500 text-center">
                {{ t('management.tickets.orders.review.actionHint') }}
              </p>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  X,
  Check,
  FileText,
  ExternalLink,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  apiClient,
  ticketOrdersService,
  type TicketOrderDetail,
  type TicketOrderStatus,
} from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

interface Props {
  eventId: string
  /** Confirmation code of the order to load. `null` means the drawer is closed. */
  confirmationCode: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  orderUpdated: [order: TicketOrderDetail]
  message: [type: 'success' | 'error', text: string]
}>()

const { t } = useAppLanguage()

const isOpen = computed(() => props.confirmationCode !== null)

// ---- State ---------------------------------------------------------------
const order = ref<TicketOrderDetail | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)

const adminNotes = ref('')
const action = ref<'confirm' | 'reject' | null>(null)
const submitting = ref(false)
const actionError = ref('')
const actionFieldError = ref('')

const rejecting = computed(() => action.value === 'reject')

// ---- Permissions / gating ------------------------------------------------
const canReview = computed(() => {
  // Backend allows confirm/reject only when the order is awaiting review.
  // Pending (no proof yet) can't be confirmed; nothing to verify.
  return order.value?.status === 'awaiting_review'
})

// ---- Status presentation -------------------------------------------------
const statusLabel = (s: TicketOrderStatus) =>
  t(`management.tickets.orders.statuses.${s}`)

const statusBadgeClasses = (s: TicketOrderStatus): string => {
  switch (s) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800'
    case 'awaiting_review':
      return 'bg-amber-100 text-amber-800'
    case 'pending':
      return 'bg-slate-100 text-slate-700'
    case 'refund_requested':
      return 'bg-sky-100 text-sky-800'
    case 'refunded':
      return 'bg-rose-100 text-rose-800'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const formatDateTime = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ---- Proof file preview --------------------------------------------------
// Backend serializer currently emits the FileField as `payment_proof`; the
// docs call it `payment_proof_url`. Read either so we don't break when the
// backend reconciles the rename.
const rawProofUrl = computed<string | null>(() => {
  const o = order.value
  if (!o) return null
  return o.payment_proof_url ?? o.payment_proof ?? null
})

const proofUrl = computed<string>(() => {
  const raw = rawProofUrl.value
  if (!raw) return ''
  return apiClient.getProfilePictureUrl(raw) || raw
})

const proofIsImage = computed<boolean>(() => {
  const url = rawProofUrl.value
  if (!url) return false
  // Strip query string before extension check; preview only inline-able formats.
  const path = url.split('?')[0]?.toLowerCase() ?? ''
  return /\.(jpe?g|png|gif|webp)$/.test(path)
})

// ---- Load ----------------------------------------------------------------
const resetActionState = () => {
  adminNotes.value = ''
  action.value = null
  actionError.value = ''
  actionFieldError.value = ''
}

const loadOrder = async (code: string) => {
  loading.value = true
  loadError.value = null
  resetActionState()
  try {
    const response = await ticketOrdersService.getForEvent(props.eventId, code)
    if (response.success && response.data) {
      order.value = response.data
    } else {
      order.value = null
      loadError.value = response.message || t('management.tickets.orders.review.loadFailed')
    }
  } catch {
    order.value = null
    loadError.value = t('management.tickets.orders.review.loadFailed')
  } finally {
    loading.value = false
  }
}

// React to parent passing in a new code (open / switch).
watch(
  () => props.confirmationCode,
  (next, prev) => {
    if (next && next !== prev) {
      loadOrder(next)
    } else if (!next) {
      order.value = null
      resetActionState()
    }
  },
  { immediate: true },
)

const handleClose = () => {
  if (submitting.value) return
  emit('close')
}

// ---- Actions -------------------------------------------------------------
const confirmOrder = async () => {
  if (!order.value || submitting.value) return
  action.value = 'confirm'
  submitting.value = true
  actionError.value = ''
  actionFieldError.value = ''
  try {
    const response = await ticketOrdersService.confirm(order.value.confirmation_code, {
      admin_notes: adminNotes.value.trim() || undefined,
    })
    if (response.success && response.data) {
      order.value = response.data
      emit('orderUpdated', response.data)
      emit('message', 'success', t('management.tickets.orders.review.confirmedToast'))
    } else {
      actionError.value =
        response.message || t('management.tickets.orders.review.actionFailed')
    }
  } catch {
    actionError.value = t('management.tickets.orders.review.actionFailed')
  } finally {
    submitting.value = false
    action.value = null
  }
}

const rejectOrder = async () => {
  if (!order.value || submitting.value) return
  // Backend requires admin_notes for reject; surface inline before hitting the API.
  const notes = adminNotes.value.trim()
  if (!notes) {
    action.value = 'reject'
    actionFieldError.value = t('management.tickets.orders.review.rejectNotesRequired')
    return
  }
  action.value = 'reject'
  submitting.value = true
  actionError.value = ''
  actionFieldError.value = ''
  try {
    const response = await ticketOrdersService.reject(order.value.confirmation_code, {
      admin_notes: notes,
    })
    if (response.success && response.data) {
      order.value = response.data
      emit('orderUpdated', response.data)
      emit('message', 'success', t('management.tickets.orders.review.rejectedToast'))
    } else {
      actionError.value =
        response.message || t('management.tickets.orders.review.actionFailed')
    }
  } catch {
    actionError.value = t('management.tickets.orders.review.actionFailed')
  } finally {
    submitting.value = false
    action.value = null
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}
</style>
