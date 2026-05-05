<template>
  <div>
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Inbox class="w-4 h-4 text-slate-500" />
          {{ t('management.tickets.orders.header') }}
        </h3>
        <p class="mt-1 text-xs text-slate-500">
          {{ t('management.tickets.orders.subtitle') }}
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
        :disabled="loading"
        @click="loadFirstPage"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
        {{ t('management.tickets.orders.refresh') }}
      </button>
    </div>

    <!-- Status filter pills -->
    <div class="mt-3 -mx-1 overflow-x-auto">
      <div class="flex gap-1 px-1 py-1 min-w-max">
        <button
          v-for="filter in statusFilters"
          :key="filter.value ?? 'all'"
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors"
          :class="
            activeStatus === filter.value
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          "
          @click="setStatusFilter(filter.value)"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="mt-4">
      <!-- Loading -->
      <div v-if="loading && orders.length === 0" class="flex items-center justify-center py-8">
        <div class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <!-- Empty -->
      <div
        v-else-if="orders.length === 0"
        class="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-4 py-8 text-center"
      >
        <Inbox class="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-medium text-slate-600">
          {{ t('management.tickets.orders.empty.title') }}
        </p>
        <p class="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          {{ activeStatus
              ? t('management.tickets.orders.empty.descriptionFiltered')
              : t('management.tickets.orders.empty.description') }}
        </p>
      </div>

      <!-- List -->
      <ul v-else class="space-y-2">
        <li
          v-for="o in orders"
          :key="o.confirmation_code"
          class="rounded-xl border bg-white hover:border-slate-300 transition-colors cursor-pointer"
          :class="
            o.status === 'awaiting_review'
              ? 'border-amber-300 bg-amber-50/30'
              : 'border-slate-200'
          "
          @click="openOrder(o.confirmation_code)"
        >
          <div class="flex items-start gap-3 p-3">
            <!-- Status icon -->
            <div
              class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              :class="statusIconClasses(o.status)"
            >
              <component :is="statusIcon(o.status)" class="w-4 h-4" />
            </div>

            <!-- Body -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-mono font-semibold text-slate-900">
                  {{ o.confirmation_code }}
                </p>
                <span
                  :class="[
                    'px-1.5 py-0.5 rounded-md text-[10px] font-medium',
                    statusBadgeClasses(o.status),
                  ]"
                >
                  {{ statusLabel(o.status) }}
                </span>
                <span
                  v-if="o.is_comp"
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-sky-700 bg-sky-50"
                >
                  {{ t('management.tickets.orders.compBadge') }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-slate-600 truncate">
                {{ o.buyer_email }}
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ t('management.tickets.orders.ticketCount', { count: o.ticket_count }) }}
                · {{ formatDate(o.created_at) }}
              </p>
            </div>

            <!-- Total -->
            <div class="flex-shrink-0 text-right">
              <p class="text-sm font-semibold text-slate-900 tabular-nums">
                {{ formatCurrency(o.total, o.currency as CurrencyCode) }}
              </p>
              <ChevronRight class="w-4 h-4 text-slate-400 ml-auto mt-0.5" />
            </div>
          </div>
        </li>
      </ul>

      <!-- Load more -->
      <div v-if="hasMore && !loading" class="mt-4 text-center">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore
              ? t('management.tickets.orders.loadingMore')
              : t('management.tickets.orders.loadMore') }}
        </button>
      </div>
    </div>

    <!-- Review drawer -->
    <TicketOrderReviewDrawer
      :event-id="eventId"
      :confirmation-code="openOrderCode"
      @close="closeOrder"
      @order-updated="handleOrderUpdated"
      @message="(type, text) => emit('message', type, text)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Inbox,
  RefreshCw,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Ban,
  Hourglass,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import TicketOrderReviewDrawer from './TicketOrderReviewDrawer.vue'
import {
  ticketOrdersService,
  type TicketOrderListItem,
  type TicketOrderStatus,
} from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()
void props.canEdit
const emit = defineEmits<{
  message: [type: 'success' | 'error', text: string]
}>()

const { t } = useAppLanguage()
const route = useRoute()
const router = useRouter()

// ---- State ---------------------------------------------------------------
const orders = ref<TicketOrderListItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const nextPage = ref(2)
const activeStatus = ref<TicketOrderStatus | null>(null)
const openOrderCode = ref<string | null>(null)

// ---- Status filter -------------------------------------------------------
const statusFilters = computed<Array<{ value: TicketOrderStatus | null; label: string }>>(() => [
  { value: null, label: t('management.tickets.orders.filters.all') },
  { value: 'awaiting_review', label: t('management.tickets.orders.filters.awaiting_review') },
  { value: 'pending', label: t('management.tickets.orders.filters.pending') },
  { value: 'paid', label: t('management.tickets.orders.filters.paid') },
  { value: 'refund_requested', label: t('management.tickets.orders.filters.refund_requested') },
  { value: 'refunded', label: t('management.tickets.orders.filters.refunded') },
  { value: 'cancelled', label: t('management.tickets.orders.filters.cancelled') },
])

const setStatusFilter = (status: TicketOrderStatus | null) => {
  if (activeStatus.value === status) return
  activeStatus.value = status
  loadFirstPage()
}

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
    case 'cancelled':
    case 'expired':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const statusIcon = (s: TicketOrderStatus): Component => {
  switch (s) {
    case 'paid':
      return CheckCircle2
    case 'awaiting_review':
      return AlertCircle
    case 'pending':
      return Clock
    case 'refund_requested':
      return RotateCcw
    case 'refunded':
      return RotateCcw
    case 'cancelled':
      return Ban
    case 'expired':
      return Hourglass
    default:
      return Clock
  }
}

const statusIconClasses = (s: TicketOrderStatus): string => {
  switch (s) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-600'
    case 'awaiting_review':
      return 'bg-amber-50 text-amber-600'
    case 'pending':
      return 'bg-slate-100 text-slate-500'
    case 'refund_requested':
      return 'bg-sky-50 text-sky-600'
    case 'refunded':
      return 'bg-rose-50 text-rose-600'
    case 'cancelled':
    case 'expired':
      return 'bg-slate-100 text-slate-500'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---- Loading -------------------------------------------------------------
const loadFirstPage = async () => {
  loading.value = true
  try {
    const response = await ticketOrdersService.listForEvent(props.eventId, {
      page: 1,
      ...(activeStatus.value ? { status: activeStatus.value } : {}),
    })
    if (response.success && response.data) {
      orders.value = response.data.results ?? []
      hasMore.value = Boolean(response.data.next)
      nextPage.value = 2
    } else if (response.message) {
      emit('message', 'error', response.message)
    }
  } catch {
    emit('message', 'error', t('management.tickets.orders.loadFailed'))
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  try {
    const response = await ticketOrdersService.listForEvent(props.eventId, {
      page: nextPage.value,
      ...(activeStatus.value ? { status: activeStatus.value } : {}),
    })
    if (response.success && response.data) {
      orders.value = [...orders.value, ...(response.data.results ?? [])]
      hasMore.value = Boolean(response.data.next)
      nextPage.value += 1
    }
  } finally {
    loadingMore.value = false
  }
}

onMounted(loadFirstPage)

// ---- Drawer + ?order= deep-link sync -------------------------------------
const openOrder = (code: string) => {
  openOrderCode.value = code
  if (route.query.order !== code) {
    router.replace({ query: { ...route.query, order: code } })
  }
}

const closeOrder = () => {
  openOrderCode.value = null
  if (route.query.order) {
    // Strip the `order` param while preserving everything else (tab, sub, etc.).
    const { order: _omit, ...rest } = route.query
    void _omit
    router.replace({ query: rest })
  }
}

const handleOrderUpdated = (updated: { confirmation_code: string; status: TicketOrderStatus; total: string; currency: string; is_comp: boolean }) => {
  // Patch the row in-place so the list reflects the new status without a refetch.
  const idx = orders.value.findIndex((o) => o.confirmation_code === updated.confirmation_code)
  if (idx !== -1) {
    orders.value[idx] = {
      ...orders.value[idx],
      status: updated.status,
      total: updated.total,
      currency: updated.currency as CurrencyCode,
      is_comp: updated.is_comp,
    }
  }
}

// React to inbound `?order=` deep links (notification action URL).
const honourOrderQuery = () => {
  const code = route.query.order
  if (typeof code === 'string' && code && code !== openOrderCode.value) {
    openOrderCode.value = code
  } else if (!code && openOrderCode.value !== null) {
    openOrderCode.value = null
  }
}

watch(() => route.query.order, honourOrderQuery, { immediate: true })
</script>
