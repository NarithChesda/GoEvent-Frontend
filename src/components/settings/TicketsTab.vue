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
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        {{ t('events.tickets.list.title') }}
      </h2>
      <p class="text-sm text-gray-500 mb-6">
        {{ t('events.tickets.list.subtitle') }}
      </p>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <!-- Empty -->
      <div
        v-else-if="orders.length === 0"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 sm:p-12 text-center"
      >
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Ticket class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="font-semibold text-slate-900 mb-1.5 sm:mb-2">
          {{ t('events.tickets.list.empty.title') }}
        </h4>
        <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-4">
          {{ t('events.tickets.list.empty.description') }}
        </p>
        <RouterLink
          to="/explore"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200"
        >
          {{ t('events.tickets.list.empty.exploreLink') }}
        </RouterLink>
      </div>

      <!-- Orders list (matches MyTicketsView styling) -->
      <ul v-else class="space-y-2">
        <li v-for="o in orders" :key="o.confirmation_code">
          <button
            type="button"
            class="w-full text-left bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200"
            :class="o.status === 'awaiting_review' ? 'ring-1 ring-amber-200/80' : ''"
            @click="openOrder(o.confirmation_code)"
          >
            <div class="flex items-center gap-3 px-4 py-3">
              <!-- Status icon -->
              <div
                class="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                :class="statusIconClasses(o.status)"
              >
                <component :is="statusIcon(o.status)" class="w-4.5 h-4.5" />
              </div>

              <!-- Body -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <p class="text-sm font-semibold text-slate-900 truncate">
                      {{ o.event_title }}
                    </p>
                    <span
                      class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium"
                      :class="statusBadgeClasses(o.status)"
                    >
                      {{ statusLabel(o.status) }}
                    </span>
                    <span
                      v-if="o.is_comp"
                      class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-sky-700 bg-sky-50"
                    >
                      {{ t('events.tickets.list.compBadge') }}
                    </span>
                  </div>
                  <span class="font-bold text-slate-900 tabular-nums flex-shrink-0">
                    {{ formatCurrency(o.total, o.currency as CurrencyCode) }}
                  </span>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-mono text-slate-600 truncate min-w-0 max-w-full sm:max-w-xs">
                    {{ o.confirmation_code }}
                  </span>
                  <span class="text-xs text-slate-300">•</span>
                  <span class="text-xs text-slate-500 tabular-nums">
                    {{ t('events.tickets.list.ticketCount', { count: o.ticket_count }, o.ticket_count) }}
                  </span>
                  <span class="text-xs text-slate-300">•</span>
                  <span class="text-xs text-slate-500">{{ formatDate(o.created_at) }}</span>
                </div>
              </div>

              <ChevronRight class="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>
          </button>
        </li>
      </ul>

      <!-- Pagination "Load more" -->
      <div v-if="hasMore && !loading" class="mt-4 text-center">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all duration-200"
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
