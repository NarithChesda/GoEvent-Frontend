<template>
  <MainLayout>
    <div class="min-h-screen bg-slate-50/50">
      <div
        class="max-w-3xl mx-auto px-4 sm:px-6 py-6 [padding-bottom:calc(env(safe-area-inset-bottom)+5rem)] lg:[padding-bottom:calc(env(safe-area-inset-bottom)+2rem)]"
      >
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
            <div
              class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm"
            >
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
            <div
              class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"
            />
          </div>

          <!-- Empty -->
          <div
            v-else-if="orders.length === 0"
            class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 sm:p-12 text-center"
          >
            <div
              class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
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

          <!-- Orders list. Same card the Settings tab uses — this route and that
               tab are the same list, and used to be two drifting copies of it. -->
          <ul v-else class="grid grid-cols-1 gap-3">
            <li v-for="o in orders" :key="o.confirmation_code">
              <TicketOrderStubCard :order="o" @select="openOrder" />
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
              {{
                loadingMore
                  ? t('events.tickets.list.loadingMore')
                  : t('events.tickets.list.loadMore')
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Ticket, RefreshCw } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import TicketOrderStubCard from '@/components/tickets/public/TicketOrderStubCard.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { ticketOrdersService, type TicketOrderListItem } from '@/services/api'

const { t } = useAppLanguage()
const router = useRouter()

const orders = ref<TicketOrderListItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const nextPage = ref(2)

const openOrder = (code: string) => {
  router.push({ name: 'my-ticket-order', params: { code } })
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
