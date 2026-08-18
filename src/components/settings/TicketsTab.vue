<template>
  <div>
    <!--
      An order opens over its own list rather than replacing it: the list is
      short, the orders on it look alike, and swapping the whole tab out for one
      of them lost the buyer their place. `?order=<confirmation_code>` still
      drives the state, so an order stays deep-linkable and Back closes it.
    -->
    <TicketOrderModal
      :show="!!orderCode"
      :code="orderCode"
      :title="selectedTitle"
      @close="clearOrderQuery"
    />

    <!--
      Heading and the two controls that act on the whole list. A buyer's own
      orders repeat the same event title over and over — filtering by state is
      the only way to triage them, so the filter is chrome, not an extra.
    -->
    <header class="flex items-start justify-between gap-3 mb-5">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold text-slate-900">
          {{ t('events.tickets.list.title') }}
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ headerLine }}
        </p>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Status filter. Server-side (`?status=`), so it filters the whole
             history rather than only the pages already loaded. -->
        <div class="relative">
          <button
            type="button"
            class="flex items-center gap-2 min-h-[40px] px-3 py-2 bg-white border rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            :class="
              statusFilter
                ? 'border-slate-300 text-slate-900 bg-slate-50'
                : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            "
            :aria-label="t('events.tickets.list.filter.label')"
            :aria-expanded="isFilterOpen"
            @click="isFilterOpen = !isFilterOpen"
          >
            <span
              v-if="statusFilter"
              class="w-2 h-2 rounded-full flex-shrink-0"
              :class="ticketOrderDotClasses(statusFilter)"
              aria-hidden="true"
            />
            <SlidersHorizontal v-else class="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span class="truncate max-w-[6rem] sm:max-w-[9rem]">{{ filterLabel }}</span>
            <ChevronDown
              class="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': isFilterOpen }"
            />
          </button>

          <Transition name="dropdown">
            <div
              v-if="isFilterOpen"
              class="absolute right-0 top-full mt-2 min-w-[13rem] bg-white border border-slate-200 rounded-xl shadow-xl z-[100] p-1.5"
            >
              <button
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
                :class="
                  statusFilter === null
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'
                "
                @click="selectStatus(null)"
              >
                <SlidersHorizontal class="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span class="flex-1 text-left">{{ t('events.tickets.list.filter.all') }}</span>
              </button>

              <div class="my-1.5 border-t border-slate-100" />

              <button
                v-for="status in TICKET_ORDER_STATUS_ORDER"
                :key="status"
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
                :class="
                  statusFilter === status
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'
                "
                @click="selectStatus(status)"
              >
                <span
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :class="ticketOrderDotClasses(status)"
                  aria-hidden="true"
                />
                <span class="flex-1 text-left truncate">{{ statusLabel(status) }}</span>
              </button>
            </div>
          </Transition>

          <div v-if="isFilterOpen" class="fixed inset-0 z-[90]" @click="isFilterOpen = false" />
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :disabled="loading"
          :aria-label="t('events.tickets.list.refresh')"
          :title="t('events.tickets.list.refresh')"
          @click="loadFirstPage"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </header>

    <!-- Loading — the stub shape, so nothing jumps when the orders arrive -->
    <ul v-if="loading" class="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-hidden="true">
      <li
        v-for="n in 4"
        :key="n"
        class="rounded-2xl bg-white border border-slate-200 overflow-hidden"
      >
        <div class="flex items-start gap-3 px-4 pt-3.5 pb-3 sm:px-5 animate-pulse">
          <div class="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0" />
          <div class="flex-1 min-w-0 space-y-2 pt-0.5">
            <div class="h-3.5 bg-slate-200 rounded w-2/3" />
            <div class="h-3 bg-slate-100 rounded w-2/5" />
          </div>
          <div class="space-y-2 pt-0.5">
            <div class="h-3.5 bg-slate-200 rounded w-16" />
            <div class="h-3 bg-slate-100 rounded w-14 ml-auto" />
          </div>
        </div>
        <div
          class="h-11 px-4 sm:px-5 bg-slate-50 border-t-2 border-dashed border-slate-200 flex items-center animate-pulse"
        >
          <div class="h-3 bg-slate-200 rounded w-28" />
        </div>
      </li>
    </ul>

    <!-- Error — the old code swallowed a failed request and rendered the
         "no tickets yet" state over it, which reads as data loss. -->
    <div
      v-else-if="error"
      class="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center"
    >
      <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-7 h-7 text-red-600" />
      </div>
      <h4 class="text-base font-semibold text-slate-900 mb-1.5">
        {{ t('events.tickets.list.error.title') }}
      </h4>
      <p class="text-sm text-slate-500 max-w-sm mx-auto mb-5">{{ error }}</p>
      <button
        type="button"
        class="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-sm font-medium border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200"
        @click="loadFirstPage"
      >
        <RefreshCw class="w-4 h-4" />
        {{ t('events.tickets.list.error.retry') }}
      </button>
    </div>

    <!-- Empty under a filter — a different problem from having no tickets,
         and it needs the way back out rather than a link to the shop. -->
    <div
      v-else-if="orders.length === 0 && statusFilter"
      class="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center"
    >
      <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <SlidersHorizontal class="w-7 h-7 text-slate-400" />
      </div>
      <h4 class="text-base font-semibold text-slate-900 mb-1.5">
        {{ t('events.tickets.list.emptyFiltered.title') }}
      </h4>
      <p class="text-sm text-slate-500 max-w-sm mx-auto mb-5">
        {{ t('events.tickets.list.emptyFiltered.description') }}
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-sm font-medium border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200"
        @click="selectStatus(null)"
      >
        {{ t('events.tickets.list.emptyFiltered.clear') }}
      </button>
    </div>

    <!-- Empty -->
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
          <div
            class="absolute inset-0 bg-gradient-to-br from-[#2ecc71]/15 to-[#1e90ff]/15 rounded-3xl blur-md"
          />
          <div
            class="relative w-20 h-20 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
          >
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

    <!-- Orders. Two up from `lg`, where the settings column is wide enough
         that a single file of cards leaves half the page empty. -->
    <ul v-else class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <li v-for="o in orders" :key="o.confirmation_code">
        <TicketOrderStubCard :order="o" @select="openOrder" />
      </li>
    </ul>

    <!-- Pagination "Load more" -->
    <div v-if="hasMore && !loading && !error" class="mt-5 text-center">
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Ticket,
} from 'lucide-vue-next'
import TicketOrderModal from '@/components/tickets/public/TicketOrderModal.vue'
import TicketOrderStubCard from '@/components/tickets/public/TicketOrderStubCard.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  ticketOrdersService,
  type TicketOrderListItem,
  type TicketOrderStatus,
} from '@/services/api'
import { TICKET_ORDER_STATUS_ORDER, ticketOrderDotClasses } from '@/utils/ticketOrderStatus'

const { t } = useAppLanguage()
const route = useRoute()
const router = useRouter()

const orders = ref<TicketOrderListItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const hasMore = ref(false)
const nextPage = ref(2)
const totalCount = ref(0)

const statusFilter = ref<TicketOrderStatus | null>(null)
const isFilterOpen = ref(false)

// URL-driven detail state: `?order=<code>` opens the modal over the list, and
// `?tab=tickets` is preserved so closing it lands back on this tab.
const orderCode = computed<string>(() => {
  const raw = route.query.order
  if (typeof raw !== 'string') return ''
  return raw.trim()
})

// Known from the row that was tapped, so the modal has a title before its own
// fetch resolves. Empty on a cold deep link, which the modal falls back for.
const selectedTitle = computed<string>(
  () => orders.value.find((o) => o.confirmation_code === orderCode.value)?.event_title ?? '',
)

const openOrder = (code: string) => {
  router.push({ query: { ...route.query, tab: 'tickets', order: code } })
}

const clearOrderQuery = () => {
  // Strip `order` while keeping the rest of the query (notably `tab=tickets`).
  const { order: _order, ...rest } = route.query
  router.push({ query: { ...rest, tab: 'tickets' } })
}

const statusLabel = (s: TicketOrderStatus): string => t(`events.tickets.order.statuses.${s}`)

const filterLabel = computed(() =>
  statusFilter.value ? statusLabel(statusFilter.value) : t('events.tickets.list.filter.all'),
)

// Once there is something to count, the count is more use than the standing
// description of what the page is.
const headerLine = computed(() =>
  totalCount.value > 0
    ? t('events.tickets.list.orderCount', { count: totalCount.value }, totalCount.value)
    : t('events.tickets.list.subtitle'),
)

const selectStatus = (status: TicketOrderStatus | null) => {
  isFilterOpen.value = false
  if (statusFilter.value === status) return
  statusFilter.value = status
  loadFirstPage()
}

const listParams = (page: number) => ({
  page,
  ...(statusFilter.value ? { status: statusFilter.value } : {}),
})

const loadFirstPage = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await ticketOrdersService.listMine(listParams(1))
    if (response.success && response.data) {
      orders.value = response.data.results ?? []
      hasMore.value = Boolean(response.data.next)
      totalCount.value = response.data.count ?? orders.value.length
      nextPage.value = 2
    } else {
      error.value = response.message || t('events.tickets.order.loadFailed')
    }
  } catch {
    error.value = t('events.tickets.order.loadFailed')
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  try {
    const response = await ticketOrdersService.listMine(listParams(nextPage.value))
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

// When the user closes the modal, refresh the list so any state changed inside
// it (e.g. proof uploaded → awaiting_review) shows on the card behind it.
// Skip the very first synchronous call.
watch(orderCode, (code, prev) => {
  if (prev && !code) {
    loadFirstPage()
  }
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
