<template>
  <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
          {{ t('management.cashGiftAnalytics.title') }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ t('management.cashGiftAnalytics.subtitle') }}
        </p>
      </div>
      <button
        type="button"
        class="flex-shrink-0 rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="loading"
        :aria-label="t('management.cashGiftAnalytics.refresh')"
        :title="t('management.cashGiftAnalytics.refresh')"
        @click="loadGuestData"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Loading skeleton (first load only — refreshes keep content visible) -->
    <div v-if="loading && totalGifts === 0" class="animate-pulse space-y-8" aria-hidden="true">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-28 rounded-2xl bg-slate-100" />
      </div>
      <div class="space-y-3">
        <div class="h-3 w-20 rounded bg-slate-100" />
        <div class="h-8 w-48 max-w-full rounded bg-slate-100" />
        <div class="h-3 w-full rounded-full bg-slate-100" />
        <div v-for="i in 3" :key="i" class="h-10 rounded-xl bg-slate-100" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="totalGifts === 0" class="py-12 text-center">
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20"
      >
        <Coins class="h-7 w-7 text-[#2ecc71]" />
      </div>
      <p class="text-base font-semibold text-slate-900">
        {{ t('management.cashGiftAnalytics.empty.title') }}
      </p>
      <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {{ t('management.cashGiftAnalytics.empty.description') }}
      </p>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-8">
      <!-- ================================================================
        Section 1 · KPI tiles
        Participation is the hero; gifts received and currencies are quiet
        supporting stats. Labels/values stay in slate — no colored text.
      ================================================================= -->
      <section class="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <!-- Hero: participation -->
        <div
          class="col-span-2 rounded-2xl border border-emerald-100/70 bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 p-4 sm:p-5 lg:col-span-1"
        >
          <p class="text-xs font-medium text-slate-500">
            {{ t('management.cashGiftAnalytics.metrics.participation') }}
          </p>
          <p class="mt-1.5 text-3xl sm:text-4xl font-bold leading-none text-slate-900">
            {{ giftParticipationPercentage }}%
          </p>
          <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/10">
            <div
              class="h-full rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] transition-all duration-500"
              :style="{ width: `${giftParticipationPercentage}%` }"
            />
          </div>
          <p class="mt-2 text-[11px] leading-snug text-slate-500">
            {{
              t('management.cashGiftAnalytics.metrics.participationDesc', {
                count: totalGifts,
                total: totalGuests,
              })
            }}
          </p>
        </div>

        <!-- Gifts received -->
        <div class="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 sm:p-5">
          <p class="text-xs font-medium text-slate-500">
            {{ t('management.cashGiftAnalytics.metrics.giftsReceived') }}
          </p>
          <p class="mt-1.5 text-2xl sm:text-3xl font-semibold leading-none text-slate-900">
            {{ totalGifts }}
          </p>
          <p class="mt-2 text-[11px] leading-snug text-slate-500">
            {{
              t('management.cashGiftAnalytics.metrics.acrossCurrencies', { count: currencyBreakdown.length }, currencyBreakdown.length)
            }}
          </p>
        </div>

        <!-- Currencies -->
        <div class="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 sm:p-5">
          <p class="text-xs font-medium text-slate-500">
            {{ t('management.cashGiftAnalytics.metrics.currencies') }}
          </p>
          <p class="mt-1.5 text-2xl sm:text-3xl font-semibold leading-none text-slate-900">
            {{ currencyBreakdown.length }}
          </p>
          <p class="mt-2 truncate text-[11px] leading-snug text-slate-500">
            {{ currencyBreakdown.map((c) => c.code).join(' · ') }}
          </p>
        </div>
      </section>

      <!-- ================================================================
        Section 2 · Per-currency breakdowns
        Each currency leads with its total, then a segmented bar (group
        colors, 2px gaps, hover tooltips) and a clean row list — replaces
        the pie chart + tinted group cards.
      ================================================================= -->
      <section
        v-for="section in currencySections"
        :key="section.currency"
        class="border-t border-slate-100 pt-6 first-of-type:border-t-0 first-of-type:pt-0"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {{ section.currency }}
        </p>
        <p class="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          {{ formatCurrency(section.totalAmount, section.currency) }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{
            t('management.cashGiftAnalytics.chart.fromGuests', {
              count: section.guestCount,
              avg: formatCurrency(section.average, section.currency),
            }, section.guestCount)
          }}
        </p>

        <!-- Segmented bar by group -->
        <div class="mt-4 flex h-3 w-full gap-[3px]">
          <div
            v-for="group in section.groups"
            :key="group.id"
            class="group relative h-full"
            :style="{ flexGrow: group.total, flexBasis: '0%' }"
          >
            <div
              class="h-full w-full rounded-full transition-all duration-500"
              :style="{ backgroundColor: group.color }"
            />
            <div
              class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block"
            >
              {{ group.name }} · {{ formatCurrency(group.total, section.currency) }} ({{ group.percent }}%)
            </div>
          </div>
        </div>

        <!-- Group rows -->
        <div class="mt-2 divide-y divide-slate-100">
          <div
            v-for="group in section.groups"
            :key="group.id"
            class="flex items-center justify-between gap-4 py-2.5"
          >
            <div class="flex min-w-0 items-center gap-2.5">
              <span
                class="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                :style="{ backgroundColor: group.color }"
              />
              <p class="truncate text-sm font-medium text-slate-700">
                {{ group.name }}
              </p>
              <p class="hidden flex-shrink-0 text-xs text-slate-400 sm:block">
                {{ t('management.cashGiftAnalytics.chart.guestsContributed', { count: group.guestCount }, group.guestCount) }}
              </p>
            </div>
            <div class="flex flex-shrink-0 items-baseline gap-2">
              <p class="text-sm font-semibold tabular-nums text-slate-900">
                {{ formatCurrency(group.total, section.currency) }}
              </p>
              <p class="w-11 text-right text-[11px] tabular-nums text-slate-400">
                {{ group.percent }}%
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Coins, RefreshCw } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { guestService } from '../../services/api'
import type { EventGuest, GuestGroup } from '../../services/api'

const { t } = useAppLanguage()

const props = defineProps<{
  eventId: string
  groups: GuestGroup[]
}>()

const loading = ref(false)
const allGuests = ref<EventGuest[]>([])

// One unfiltered request instead of one request per group — also catches
// guests whose group isn't in the (possibly stale) `groups` prop.
const loadGuestData = async () => {
  loading.value = true
  try {
    const response = await guestService.getGuests(props.eventId, {
      page_size: 1000,
    })
    const guests = response.success && response.data ? response.data.results : []
    allGuests.value = guests.filter(
      (g) => g.cash_gift_amount && parseFloat(g.cash_gift_amount) > 0,
    )
  } catch (error) {
    console.error('Error loading guest data:', error)
  } finally {
    loading.value = false
  }
}

// ---- Metrics ---------------------------------------------------------------
const totalGifts = computed(() => allGuests.value.length)

const totalGuests = computed(() =>
  props.groups.reduce((sum, group) => sum + group.guest_count, 0),
)

const giftParticipationPercentage = computed(() => {
  if (totalGuests.value === 0) return 0
  return Math.min(100, Math.round((totalGifts.value / totalGuests.value) * 100))
})

// Currency totals, largest first (drives the tiles + section order).
const currencyBreakdown = computed(() => {
  const currencyMap = new Map<string, { code: string; total: number; count: number }>()

  for (const guest of allGuests.value) {
    const currency = guest.cash_gift_currency || 'USD'
    let data = currencyMap.get(currency)
    if (!data) {
      data = { code: currency, total: 0, count: 0 }
      currencyMap.set(currency, data)
    }
    data.total += parseFloat(guest.cash_gift_amount || '0') || 0
    data.count += 1
  }

  return Array.from(currencyMap.values()).sort((a, b) => b.total - a.total)
})

// ---- Per-currency group breakdown -------------------------------------------
interface GroupTotal {
  id: number | 'other'
  name: string
  color: string
  total: number
  guestCount: number
  percent: number
}

interface CurrencySection {
  currency: string
  totalAmount: number
  guestCount: number
  average: number
  groups: GroupTotal[]
}

const currencySections = computed<CurrencySection[]>(() => {
  const groupsById = new Map(props.groups.map((g) => [g.id, g]))
  const byCurrency = new Map<string, EventGuest[]>()

  for (const guest of allGuests.value) {
    const currency = guest.cash_gift_currency || 'USD'
    const bucket = byCurrency.get(currency)
    if (bucket) {
      bucket.push(guest)
    } else {
      byCurrency.set(currency, [guest])
    }
  }

  return Array.from(byCurrency.entries())
    .map(([currency, guests]) => {
      const totals = new Map<number | 'other', GroupTotal>()

      for (const guest of guests) {
        const group = groupsById.get(guest.group)
        // Fall back to the embedded group details, then to a neutral
        // "Other" bucket, so no gift ever silently disappears.
        const key: number | 'other' = group
          ? group.id
          : guest.group_details
            ? guest.group_details.id
            : 'other'
        let row = totals.get(key)
        if (!row) {
          const details = group ?? guest.group_details
          row = {
            id: key,
            name: details?.name ?? t('management.cashGiftAnalytics.chart.otherGroup'),
            color: details?.color || '#94a3b8',
            total: 0,
            guestCount: 0,
            percent: 0,
          }
          totals.set(key, row)
        }
        row.total += parseFloat(guest.cash_gift_amount || '0') || 0
        row.guestCount += 1
      }

      const groups = Array.from(totals.values())
        .filter((g) => g.total > 0)
        .sort((a, b) => b.total - a.total)
      const totalAmount = groups.reduce((sum, g) => sum + g.total, 0)
      const guestCount = groups.reduce((sum, g) => sum + g.guestCount, 0)
      for (const g of groups) {
        g.percent = totalAmount === 0 ? 0 : Math.round((g.total / totalAmount) * 100)
      }

      return {
        currency,
        totalAmount,
        guestCount,
        average: guestCount === 0 ? 0 : totalAmount / guestCount,
        groups,
      }
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
})

// ---- Formatting --------------------------------------------------------------
const formatAmount = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

const formatCurrency = (amount: number, currency: string) =>
  `${formatAmount(amount)} ${currency}`

// ---- Lifecycle ----------------------------------------------------------------
onMounted(() => {
  loadGuestData()
})

watch(
  () => props.eventId,
  () => {
    allGuests.value = []
    loadGuestData()
  },
)

defineExpose({
  refresh: loadGuestData,
  currencyBreakdown,
})
</script>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .transition-all,
  .transition-colors {
    transition: none !important;
  }
}
</style>
