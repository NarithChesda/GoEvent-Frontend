<template>
  <div>
    <!-- Detail mode: render the order detail panel inline so the Settings
         shell (header + tab nav) remains visible. URL drives the state via
         ?order=<confirmation_code>. -->
    <template v-if="orderCode">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 px-2 py-1.5 -mx-2 rounded-lg hover:bg-slate-100/60 transition-colors"
        @click="clearOrderQuery"
      >
        <ArrowLeft class="w-4 h-4" />
        {{ t('events.tickets.order.backToList') }}
      </button>
      <TicketOrderDetailPanel :code="orderCode" />
    </template>

    <!-- List mode -->
    <template v-else>
      <header class="mb-6">
        <h2 class="text-2xl font-semibold tracking-tight text-slate-900">
          {{ t('events.tickets.list.title') }}
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ t('events.tickets.list.subtitle') }}
        </p>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <!-- Empty: friendlier illustration tone + primary gradient CTA -->
      <div
        v-else-if="orders.length === 0"
        class="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-8 sm:p-14 text-center"
      >
        <!-- Soft gradient backdrop blob -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-emerald-50 via-sky-50/60 to-transparent"
        />
        <div class="relative">
          <div class="relative w-20 h-20 mx-auto mb-5">
            <div class="absolute inset-0 bg-gradient-to-br from-[#2ecc71]/15 to-[#1e90ff]/15 rounded-3xl blur-md" />
            <div class="relative w-20 h-20 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Ticket class="w-9 h-9 text-white" />
            </div>
          </div>
          <h4 class="text-lg font-semibold text-slate-900 mb-1.5">
            {{ t('events.tickets.list.empty.title') }}
          </h4>
          <p class="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            {{ t('events.tickets.list.empty.description') }}
          </p>
          <RouterLink
            to="/explore"
            class="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.99] transition-transform duration-200"
          >
            {{ t('events.tickets.list.empty.exploreLink') }}
            <ChevronRight class="w-4 h-4" />
          </RouterLink>
        </div>
      </div>

      <!-- Orders list — left accent stripe carries the status colour, single
           pill carries the label. Quieter, more whitespace. -->
      <ul v-else class="space-y-2.5">
        <li v-for="o in orders" :key="o.confirmation_code">
          <button
            type="button"
            class="group relative w-full text-left bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-all duration-200"
            @click="openOrder(o.confirmation_code)"
          >
            <div class="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 min-h-[64px]">
              <!-- Status mark — small, calm; one of the signals -->
              <div
                class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                :class="statusIconClasses(o.status)"
              >
                <component :is="statusIcon(o.status)" class="w-4 h-4" />
              </div>

              <!-- Body -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-3 mb-1">
                  <p class="text-sm sm:text-[15px] font-semibold text-slate-900 truncate">
                    {{ o.event_title }}
                  </p>
                  <span class="text-sm sm:text-[15px] font-bold text-slate-900 tabular-nums flex-shrink-0">
                    {{ formatCurrency(o.total, o.currency as CurrencyCode) }}
                  </span>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 text-xs text-slate-500">
                    <span class="font-mono text-slate-600 truncate max-w-[110px] sm:max-w-none">
                      {{ o.confirmation_code }}
                    </span>
                    <span class="text-slate-300">·</span>
                    <span class="tabular-nums whitespace-nowrap">
                      {{ t('events.tickets.list.ticketCount', { count: o.ticket_count }, o.ticket_count) }}
                    </span>
                    <span class="hidden sm:inline text-slate-300">·</span>
                    <span class="hidden sm:inline whitespace-nowrap">{{ formatDate(o.created_at) }}</span>
                  </div>

                  <!-- Single status pill (or comp pill) — quiet, on the right -->
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      v-if="o.is_comp"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide text-sky-700 bg-sky-50"
                    >
                      {{ t('events.tickets.list.compBadge') }}
                    </span>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
                      :class="statusBadgeClasses(o.status)"
                    >
                      {{ statusLabel(o.status) }}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </button>
        </li>
      </ul>

      <!-- Pagination "Load more" -->
      <div v-if="hasMore && !loading" class="mt-5 text-center">
        <button
          type="button"
          class="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-sm font-medium border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all duration-200"
          :disabled="loadingMore"
          @click="loadMore"
        >
          <span
            v-if="loadingMore"
            class="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"
          />
          {{ loadingMore ? t('events.tickets.list.loadingMore') : t('events.tickets.list.loadMore') }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type Component } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Ticket,
  ChevronRight,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Ban,
  Hourglass,
} from 'lucide-vue-next'
import TicketOrderDetailPanel from '@/components/tickets/public/TicketOrderDetailPanel.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  ticketOrdersService,
  type TicketOrderListItem,
  type TicketOrderStatus,
} from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

const { t } = useAppLanguage()
const route = useRoute()
const router = useRouter()

const orders = ref<TicketOrderListItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const nextPage = ref(2)

// URL-driven detail state. Settings shell stays mounted; we just toggle the
// inner view based on `?order=<code>` while preserving `?tab=tickets`.
const orderCode = computed<string>(() => {
  const raw = route.query.order
  if (typeof raw !== 'string') return ''
  return raw.trim()
})

const openOrder = (code: string) => {
  router.push({ query: { ...route.query, tab: 'tickets', order: code } })
}

const clearOrderQuery = () => {
  // Strip `order` while keeping the rest of the query (notably `tab=tickets`).
  const { order: _order, ...rest } = route.query
  router.push({ query: { ...rest, tab: 'tickets' } })
}

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const statusLabel = (s: TicketOrderStatus): string => {
  return t(`events.tickets.order.statuses.${s}`)
}

// Match MyTicketsView palette exactly.
const statusBadgeClasses = (s: TicketOrderStatus): string => {
  switch (s) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700'
    case 'awaiting_review':
      return 'bg-amber-50 text-amber-700'
    case 'pending':
      return 'bg-slate-100 text-slate-700'
    case 'refund_requested':
      return 'bg-sky-50 text-sky-700'
    case 'refunded':
      return 'bg-rose-50 text-rose-700'
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

const loadFirstPage = async () => {
  loading.value = true
  try {
    const response = await ticketOrdersService.listMine({ page: 1 })
    if (response.success && response.data) {
      orders.value = response.data.results ?? []
      hasMore.value = Boolean(response.data.next)
      nextPage.value = 2
    }
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  try {
    const response = await ticketOrdersService.listMine({ page: nextPage.value })
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

// When the user closes the detail panel, refresh the list so any state
// changes made on the detail view (e.g. proof uploaded → awaiting_review)
// are reflected immediately. Skip the very first synchronous call.
watch(orderCode, (code, prev) => {
  if (prev && !code) {
    loadFirstPage()
  }
})
</script>
