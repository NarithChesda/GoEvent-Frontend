<template>
  <div class="space-y-4">
    <!-- Filter and Actions Bar (sticky, matches guest/expense pattern) -->
    <div class="sticky top-0 z-20">
      <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm">
        <!-- Mobile: title row on top -->
        <div class="px-3 pt-3 sm:hidden">
          <div class="flex items-center gap-2">
            <Inbox class="w-4 h-4 text-slate-500 flex-shrink-0" />
            <h3 class="text-sm font-semibold text-slate-900">
              {{ t('management.tickets.orders.header') }}
            </h3>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            {{ t('management.tickets.orders.subtitle') }}
          </p>
        </div>

        <!-- Filter pills + actions row -->
        <div class="flex items-center gap-2 sm:gap-3 p-3">
          <!-- Status filter dropdown trigger -->
          <div class="relative" ref="filterContainer">
            <button
              type="button"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border"
              :class="
                activeStatus === null
                  ? 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  : 'text-white border-transparent bg-slate-900 hover:bg-slate-800'
              "
              :aria-expanded="isFilterDropdownOpen"
              :aria-label="t('management.tickets.orders.filters.all')"
              @click="isFilterDropdownOpen = !isFilterDropdownOpen"
            >
              <Filter
                class="w-4 h-4 flex-shrink-0"
                :class="activeStatus === null ? 'text-slate-500' : 'text-white/80'"
              />
              <span class="truncate max-w-[120px] sm:max-w-[180px]">
                {{ activeFilterLabel }}
              </span>
              <ChevronDown
                class="w-4 h-4 transition-transform flex-shrink-0"
                :class="[
                  { 'rotate-180': isFilterDropdownOpen },
                  activeStatus === null ? 'text-slate-400' : 'text-white/80',
                ]"
              />
            </button>

            <Transition name="dropdown">
              <div
                v-if="isFilterDropdownOpen"
                class="absolute top-full left-0 mt-2 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-[100] max-h-[320px] overflow-y-auto"
                @click.stop
              >
                <div class="p-1.5">
                  <button
                    v-for="filter in statusFilters"
                    :key="filter.value ?? 'all'"
                    type="button"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150"
                    :class="
                      activeStatus === filter.value
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    "
                    @click="setStatusFilter(filter.value)"
                  >
                    <span class="flex-1 text-left">{{ filter.label }}</span>
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Click outside to close dropdown -->
            <div
              v-if="isFilterDropdownOpen"
              class="fixed inset-0 z-[90]"
              @click="isFilterDropdownOpen = false"
            ></div>
          </div>

          <!-- Divider -->
          <div class="w-px h-5 bg-slate-200 hidden sm:block"></div>

          <!-- Desktop title (sm+) -->
          <div class="hidden sm:flex items-center gap-2 min-w-0 flex-shrink">
            <Inbox class="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span class="text-sm font-semibold text-slate-900 truncate">
              {{ t('management.tickets.orders.header') }}
            </span>
          </div>

          <!-- Order count -->
          <div class="hidden sm:flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0">
            <span class="font-medium text-slate-700">{{ orders.length }}</span>
          </div>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- Refresh -->
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-all duration-200 flex-shrink-0 disabled:opacity-50"
            :disabled="loading"
            :aria-label="t('management.tickets.orders.refresh')"
            @click="loadFirstPage"
          >
            <RefreshCw class="w-4 h-4" :class="loading ? 'animate-spin' : ''" />
            <span class="hidden sm:inline">{{ t('management.tickets.orders.refresh') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div>
      <!-- Loading -->
      <div v-if="loading && orders.length === 0" class="flex justify-center items-center py-12">
        <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="orders.length === 0"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 sm:p-12 text-center"
      >
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Inbox class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="font-semibold text-slate-900 mb-1.5 sm:mb-2">
          {{ t('management.tickets.orders.empty.title') }}
        </h4>
        <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
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
          class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200 cursor-pointer"
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
              <!-- Top row: code, status, comp -->
              <div class="flex items-center justify-between gap-2 mb-1">
                <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <p class="text-sm font-mono font-semibold text-slate-900 truncate">
                    {{ o.confirmation_code }}
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
                    {{ t('management.tickets.orders.compBadge') }}
                  </span>
                </div>
                <!-- Total amount -->
                <span class="font-bold text-slate-900 tabular-nums flex-shrink-0">
                  {{ formatCurrency(o.total, o.currency as CurrencyCode) }}
                </span>
              </div>

              <!-- Bottom row: buyer + meta -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs text-slate-600 truncate min-w-0 max-w-full sm:max-w-xs">
                  {{ o.buyer_email }}
                </span>
                <span class="text-xs text-slate-300">•</span>
                <span class="text-xs text-slate-500 tabular-nums">
                  {{ t('management.tickets.orders.ticketCount', { count: o.ticket_count }, o.ticket_count) }}
                </span>
                <span class="text-xs text-slate-300">•</span>
                <span class="text-xs text-slate-500">{{ formatDate(o.created_at) }}</span>
              </div>
            </div>

            <!-- Chevron -->
            <ChevronRight class="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>
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
  ChevronDown,
  Filter,
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
const isFilterDropdownOpen = ref(false)
const filterContainer = ref<HTMLElement | null>(null)

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

const activeFilterLabel = computed(() => {
  const match = statusFilters.value.find((f) => f.value === activeStatus.value)
  return match ? match.label : t('management.tickets.orders.filters.all')
})

const setStatusFilter = (status: TicketOrderStatus | null) => {
  isFilterDropdownOpen.value = false
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

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
