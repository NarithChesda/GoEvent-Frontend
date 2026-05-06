<template>
  <MainLayout>
    <div class="min-h-screen bg-slate-50/50">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 [padding-bottom:calc(env(safe-area-inset-bottom)+5rem)] lg:[padding-bottom:calc(env(safe-area-inset-bottom)+2rem)]">
        <!-- Page header (canonical) -->
        <header class="mb-5">
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
            {{ t('events.tickets.list.title') }}
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            {{ t('events.tickets.list.subtitle') }}
          </p>
        </header>

        <div class="space-y-4">
          <!-- Sticky filter / actions bar (matches TicketOrdersList) -->
          <div class="sticky top-0 z-20">
            <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm">
              <!-- Mobile: title row -->
              <div class="px-3 pt-3 sm:hidden">
                <div class="flex items-center gap-2">
                  <Ticket class="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <h3 class="text-sm font-semibold text-slate-900">
                    {{ t('events.tickets.list.title') }}
                  </h3>
                </div>
              </div>

              <div class="flex items-center gap-2 sm:gap-3 p-3">
                <!-- Desktop title -->
                <div class="hidden sm:flex items-center gap-2 min-w-0 flex-shrink">
                  <Ticket class="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span class="text-sm font-semibold text-slate-900 truncate">
                    {{ t('events.tickets.list.title') }}
                  </span>
                </div>

                <!-- Order count -->
                <div
                  v-if="!loading && orders.length > 0"
                  class="hidden sm:flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0"
                >
                  <span class="font-medium text-slate-700">{{ orders.length }}</span>
                </div>

                <div class="flex-1"></div>

                <!-- Refresh -->
                <button
                  type="button"
                  class="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-all duration-200 flex-shrink-0 disabled:opacity-50"
                  :disabled="loading"
                  :aria-label="t('events.tickets.list.refresh')"
                  @click="loadFirstPage"
                >
                  <RefreshCw class="w-4 h-4" :class="loading ? 'animate-spin' : ''" />
                  <span class="hidden sm:inline">{{ t('events.tickets.list.refresh') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading && orders.length === 0" class="flex items-center justify-center py-12">
            <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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

          <!-- Orders list -->
          <ul v-else class="space-y-2">
            <li v-for="o in orders" :key="o.confirmation_code">
              <RouterLink
                :to="{ name: 'my-ticket-order', params: { code: o.confirmation_code } }"
                class="block bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200"
                :class="o.status === 'awaiting_review' ? 'ring-1 ring-amber-200/80' : ''"
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
                    <!-- Top row: event title, status, comp -->
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

                    <!-- Bottom row: code + meta -->
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
              </RouterLink>
            </li>
          </ul>

          <!-- Load more -->
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
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Ticket,
  RefreshCw,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Ban,
  Hourglass,
} from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
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

// Match TicketOrdersList palette exactly.
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
</script>
