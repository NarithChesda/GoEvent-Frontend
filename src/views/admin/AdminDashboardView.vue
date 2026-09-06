<template>
  <div class="space-y-6">
    <!-- What needs deciding, first. Everything below this is background. -->
    <section>
      <h2 class="text-base font-semibold text-slate-900">{{ t('admin.dashboard.queuesTitle') }}</h2>
      <p class="mt-1 text-sm text-slate-600">{{ t('admin.dashboard.queuesBody') }}</p>

      <div v-if="adminStore.loading && !adminStore.summary" class="mt-3 grid gap-3 sm:grid-cols-2">
        <div
          v-for="n in 6"
          :key="n"
          class="h-[4.5rem] animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      </div>

      <p
        v-else-if="adminStore.error"
        class="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        {{ adminStore.error }}
      </p>

      <div v-else class="mt-3 grid gap-3 sm:grid-cols-2">
        <RouterLink
          v-for="item in queueItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/40"
        >
          <span
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            :class="item.count > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'"
            aria-hidden="true"
          >
            <component :is="item.icon" class="h-5 w-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-slate-900">
              {{ t(`admin.nav.${item.labelKey}`) }}
            </span>
            <span class="block truncate text-xs text-slate-500">
              {{
                item.count > 0
                  ? t('admin.dashboard.awaiting', { count: item.count })
                  : t('admin.dashboard.clear')
              }}
            </span>
          </span>
          <span
            v-if="item.count > 0"
            class="flex-shrink-0 text-lg font-bold tabular-nums text-slate-900"
          >
            {{ item.count }}
          </span>
          <CheckCheck v-else class="h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden="true" />
        </RouterLink>
      </div>
    </section>

    <!-- The platform, over a window. Fetched once per page load: it is the slow
         call of the two, so it is not on the navigation path the summary is. -->
    <section>
      <div class="flex items-center justify-between gap-2">
        <h2 class="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">
          {{ t('admin.dashboard.metricsTitle') }}
        </h2>
        <div class="relative flex-shrink-0">
          <select
            v-model.number="days"
            class="appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            :aria-label="t('admin.dashboard.window')"
          >
            <option v-for="option in WINDOW_OPTIONS" :key="option" :value="option">
              {{ t('admin.dashboard.lastDays', { days: option }) }}
            </option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </div>

      <div v-if="metricsLoading" class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="n in 4"
          :key="n"
          class="h-[5.5rem] animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      </div>

      <div
        v-else-if="metricsError"
        class="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-center"
      >
        <p class="text-sm text-red-700">{{ metricsError }}</p>
        <button
          type="button"
          class="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
          @click="loadMetrics"
        >
          <RefreshCw class="h-4 w-4" aria-hidden="true" />
          {{ t('common.actions.retry') }}
        </button>
      </div>

      <template v-else-if="metrics">
        <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatTile
            :label="t('admin.dashboard.revenueAllTime')"
            :value="formatMoney(metrics.revenue.all_time)"
            :hint="
              t('admin.dashboard.revenueWindow', {
                amount: formatMoney(metrics.revenue.window),
                count: metrics.revenue.window_payment_count,
              })
            "
          />
          <!-- `public_approved` is what Explore actually lists, which is a
               different number from the total and the one moderation moves. It
               is optional in the type because it postdates the first build. -->
          <AdminStatTile
            :label="t('admin.dashboard.events')"
            :value="formatCount(metrics.events.total)"
            :hint="
              metrics.events.public_approved === undefined
                ? t('admin.dashboard.inWindow', { count: formatCount(metrics.events.window) })
                : t('admin.dashboard.eventsHint', {
                    window: formatCount(metrics.events.window),
                    listed: formatCount(metrics.events.public_approved),
                  })
            "
          />
          <AdminStatTile
            :label="t('admin.dashboard.users')"
            :value="formatCount(metrics.users.total)"
            :hint="
              t('admin.dashboard.usersHint', {
                partners: metrics.users.partners,
                staff: metrics.users.staff,
              })
            "
          />
          <AdminStatTile
            :label="t('admin.dashboard.unpaidCommissions')"
            :value="formatMoney(metrics.commissions.unpaid)"
            :hint="
              t('admin.dashboard.catalogueHint', {
                templates: metrics.templates.approved,
                listings: metrics.listings.approved,
              })
            "
          />
        </div>

        <div class="mt-3 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-2">
          <AdminSeriesChart
            :points="revenueSeries"
            :label="t('admin.dashboard.revenueChart')"
            :range-label="t('admin.dashboard.lastDays', { days: metrics.window_days })"
            color="#2ecc71"
            :format-value="formatMoneyValue"
          />
          <AdminSeriesChart
            :points="eventSeries"
            :label="t('admin.dashboard.eventsChart')"
            :range-label="t('admin.dashboard.lastDays', { days: metrics.window_days })"
            color="#1e90ff"
            :format-value="formatCount"
          />
        </div>

        <p class="mt-2 text-xs text-slate-500">
          {{ t('admin.dashboard.partnerTemplates', { count: metrics.templates.partner_built }) }}
        </p>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * The admin landing page: what needs deciding, then how the platform is doing.
 *
 * That order is the whole design. A staff member arriving here is answering
 * "is there work?", and the revenue chart is not an answer to it — so the six
 * queue counts come first at full size, and the metrics sit underneath as
 * context.
 *
 * **Two fetches with two different rhythms.** `/summary/` is cheap and belongs
 * to the layout, which refetches it on navigation and after every decision.
 * `/metrics/` is the slow one and is fetched here, once per page load and again
 * only when the window changes.
 *
 * Money arrives as `Decimal` strings and is parsed before anything is added or
 * plotted — see `parseMoney`.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { CheckCheck, ChevronDown, RefreshCw } from 'lucide-vue-next'
import AdminStatTile from '@/components/admin/AdminStatTile.vue'
import AdminSeriesChart from '@/components/admin/AdminSeriesChart.vue'
import { ADMIN_NAV_ITEMS } from '@/components/admin/adminNav'
import { formatMoney, parseMoney, zeroFillSeries } from '@/components/admin/adminDisplay'
import { useAdminStore } from '@/stores/admin'
import { adminService } from '@/services/api'
import type { AdminMetrics } from '@/services/api'

const WINDOW_OPTIONS = [7, 30, 90, 365]

const { t } = useI18n()
const adminStore = useAdminStore()

const days = ref(30)
const metrics = ref<AdminMetrics | null>(null)
const metricsLoading = ref(false)
const metricsError = ref<string | null>(null)

const queueItems = computed(() =>
  ADMIN_NAV_ITEMS.filter((item) => item.queue).map((item) => ({
    ...item,
    count: adminStore.pendingFor(item.queue!) ?? 0,
  })),
)

const revenueSeries = computed(() =>
  metrics.value
    ? zeroFillSeries(
        metrics.value.revenue.series,
        metrics.value.since,
        metrics.value.window_days,
        (entry) => parseMoney(entry.amount),
      )
    : [],
)

const eventSeries = computed(() =>
  metrics.value
    ? zeroFillSeries(
        metrics.value.events.series,
        metrics.value.since,
        metrics.value.window_days,
        (entry) => entry.count,
      )
    : [],
)

const formatCount = (value: number): string => value.toLocaleString('en-US')

/** Compact on the chart's axis label, where the full currency string is too wide. */
const formatMoneyValue = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)

const loadMetrics = async (): Promise<void> => {
  metricsLoading.value = true
  metricsError.value = null

  const response = await adminService.getMetrics(days.value)

  if (response.success && response.data) {
    metrics.value = response.data
  } else {
    metrics.value = null
    metricsError.value = response.message ?? t('admin.states.errorTitle')
  }

  metricsLoading.value = false
}

watch(days, loadMetrics)
onMounted(loadMetrics)
</script>
