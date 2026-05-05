<template>
  <div>
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
      class="bg-white border border-slate-200 rounded-xl p-8 text-center"
    >
      <Ticket class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-medium text-slate-700">
        {{ t('events.tickets.list.empty.title') }}
      </p>
      <p class="mt-1 text-xs text-slate-500 max-w-md mx-auto">
        {{ t('events.tickets.list.empty.description') }}
      </p>
      <RouterLink
        to="/explore"
        class="inline-block mt-4 text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        {{ t('events.tickets.list.empty.exploreLink') }}
      </RouterLink>
    </div>

    <!-- Orders list -->
    <ul v-else class="space-y-3">
      <li v-for="o in orders" :key="o.confirmation_code">
        <RouterLink
          :to="{ name: 'my-ticket-order', params: { code: o.confirmation_code } }"
          class="block bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm rounded-xl p-4 transition-all"
        >
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-slate-900 truncate">
                  {{ o.event_title }}
                </p>
                <span
                  v-if="o.is_comp"
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-sky-700 bg-sky-50"
                >
                  {{ t('events.tickets.list.compBadge') }}
                </span>
              </div>
              <p class="mt-1 text-xs text-slate-500 font-mono">
                {{ o.confirmation_code }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                {{ t('events.tickets.list.ticketCount', { count: o.ticket_count }) }}
                · {{ formatDate(o.created_at) }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-1.5">
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-[11px] font-medium',
                  statusBadgeClass(o.status),
                ]"
              >
                {{ statusLabel(o.status) }}
              </span>
              <p class="text-sm font-semibold text-slate-900 tabular-nums">
                {{ formatCurrency(o.total, o.currency as CurrencyCode) }}
              </p>
            </div>
          </div>
        </RouterLink>
      </li>
    </ul>

    <!-- Pagination "Load more" — keeps it simple. -->
    <div v-if="hasMore && !loading" class="mt-4 text-center">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? t('events.tickets.list.loadingMore') : t('events.tickets.list.loadMore') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Ticket } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  ticketOrdersService,
  type TicketOrderListItem,
  type TicketOrderStatus,
} from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

const { t } = useAppLanguage()

const orders = ref<TicketOrderListItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const nextPage = ref(2)

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

const statusBadgeClass = (s: TicketOrderStatus): string => {
  switch (s) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800'
    case 'pending':
    case 'awaiting_review':
      return 'bg-amber-100 text-amber-800'
    case 'refund_requested':
      return 'bg-sky-100 text-sky-800'
    default:
      return 'bg-slate-100 text-slate-700'
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
</script>
