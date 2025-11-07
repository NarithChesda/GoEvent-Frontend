<template>
  <div>
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-2">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-slate-900">Cash Gift Analytics</h3>
          <p class="text-sm text-slate-500 mt-1">Distribution and insights across guest groups</p>
        </div>
      </div>
    </header>

    <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span class="ml-3 text-sm text-slate-600">Loading analytics...</span>
      </div>

      <!-- No Data State -->
      <div v-else-if="totalGifts === 0" class="text-center py-12">
        <Coins class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-base text-slate-500">No cash gifts recorded yet</p>
        <p class="text-sm text-slate-400 mt-1">Data will appear once guests add their gifts</p>
      </div>

      <!-- Data Visualization -->
      <div v-else class="flex flex-col gap-6">
        <!-- Key Metrics Overview -->
        <div class="grid gap-3 sm:grid-cols-3">
          <!-- Total Gifts -->
          <div class="rounded-2xl border border-transparent bg-amber-50/80 p-4 shadow-sm shadow-amber-100/70">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-wide text-amber-600">Total Gifts</p>
              <Coins class="h-4 w-4 text-amber-600" />
            </div>
            <p class="mt-3 text-lg font-semibold text-slate-900">{{ totalGifts }} gifts</p>
            <p class="text-xs text-amber-700/70">
              Across {{ currencyBreakdown.length }} {{ currencyBreakdown.length === 1 ? 'currency' : 'currencies' }}
            </p>
          </div>

          <!-- Participation Rate -->
          <div class="rounded-2xl border border-transparent bg-emerald-50/80 p-4 shadow-sm shadow-emerald-100/70">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Participation</p>
              <span class="text-xs font-semibold text-emerald-600">{{ giftParticipationPercentage }}%</span>
            </div>
            <p class="mt-3 text-lg font-semibold text-slate-900">{{ totalGuestsWithGifts }} guests</p>
            <p class="text-xs text-emerald-700/70">Out of {{ totalGuests }} total guests</p>
          </div>

          <!-- Currencies -->
          <div class="rounded-2xl border border-transparent bg-sky-50/80 p-4 shadow-sm shadow-sky-100/70">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-wide text-sky-600">Currencies</p>
              <span class="text-xs font-semibold text-sky-600">{{ currencyBreakdown.length }}</span>
            </div>
            <p class="mt-3 text-lg font-semibold text-slate-900">
              <span v-for="(currency, index) in currencyBreakdown" :key="currency.code">
                {{ currency.code }}<span v-if="index < currencyBreakdown.length - 1">, </span>
              </span>
            </p>
            <p class="text-xs text-sky-700/70">Active currency types</p>
          </div>
        </div>

        <!-- Currency Distribution Charts -->
        <div class="space-y-5">
          <div
            v-for="currencyData in currencyChartData"
            :key="currencyData.currency"
          >
            <!-- Currency Header -->
            <div class="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{{ currencyData.currency }}</p>
                <p class="text-4xl font-semibold tracking-tight text-slate-900">
                  {{ formatCurrency(currencyData.totalAmount, currencyData.currency) }}
                </p>
                <p class="mt-1 text-sm text-slate-500">
                  From {{ currencyData.guestCount }} {{ currencyData.guestCount === 1 ? 'guest' : 'guests' }}
                  · Avg {{ formatCurrency(currencyData.totalAmount / currencyData.guestCount, currencyData.currency) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Pie Chart -->
              <div class="flex items-center justify-center">
                <div class="w-full max-w-sm">
                  <Pie :data="currencyData.chartData" :options="chartOptions" />
                </div>
              </div>

              <!-- Group Breakdown -->
              <div class="space-y-2">
                <div
                  v-for="group in currencyData.groupTotals"
                  :key="group.id"
                  class="rounded-2xl border border-transparent p-4 shadow-sm"
                  :style="{ backgroundColor: group.color + '15' }"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-3 h-3 rounded-full"
                        :style="{ backgroundColor: group.color }"
                      ></div>
                      <p class="text-xs font-semibold uppercase tracking-wide" :style="{ color: group.color }">{{ group.name }}</p>
                    </div>
                    <span class="text-xs font-semibold" :style="{ color: group.color }">
                      {{ ((group.total / currencyData.totalAmount) * 100).toFixed(1) }}%
                    </span>
                  </div>
                  <p class="mt-3 text-lg font-semibold text-slate-900">
                    {{ formatCurrency(group.total, currencyData.currency) }}
                  </p>
                  <p class="text-xs text-slate-600/80">{{ group.guestCount }} {{ group.guestCount === 1 ? 'guest' : 'guests' }} contributed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { Coins } from 'lucide-vue-next'
import { guestService, type GuestGroup } from '../../services/api'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

// Props
const props = defineProps<{
  eventId: string
  groups: GuestGroup[]
}>()

// State
const loading = ref(false)
const allGuests = ref<any[]>([])

// Fetch all guests with cash gifts
const loadGuestData = async () => {
  loading.value = true
  try {
    // Fetch guests from all groups
    const promises = props.groups.map(group =>
      guestService.getGuests(props.eventId, {
        group: group.id,
        page_size: 1000, // Get all guests
      })
    )

    const responses = await Promise.all(promises)
    const guests: any[] = []

    responses.forEach(response => {
      if (response.success && response.data) {
        guests.push(...response.data.results)
      }
    })

    // Filter guests with cash gifts
    allGuests.value = guests.filter(g => g.cash_gift_amount && parseFloat(g.cash_gift_amount) > 0)
  } catch (error) {
    console.error('Error loading guest data:', error)
  } finally {
    loading.value = false
  }
}

// Computed: Group totals by currency
const currencyChartData = computed(() => {
  // Group guests by currency
  const currencyMap = new Map<string, any[]>()

  allGuests.value.forEach(guest => {
    const currency = guest.cash_gift_currency || 'USD'
    if (!currencyMap.has(currency)) {
      currencyMap.set(currency, [])
    }
    currencyMap.get(currency)!.push(guest)
  })

  // For each currency, calculate group breakdown
  return Array.from(currencyMap.entries()).map(([currency, guests]) => {
    const groupTotalsMap = new Map<number, { id: number; name: string; color: string; total: number; guestCount: number }>()

    // Initialize with all groups
    props.groups.forEach(group => {
      groupTotalsMap.set(group.id, {
        id: group.id,
        name: group.name,
        color: group.color || '#3498db',
        total: 0,
        guestCount: 0,
      })
    })

    // Calculate totals for this currency
    guests.forEach(guest => {
      const groupData = groupTotalsMap.get(guest.group)
      if (groupData) {
        const amount = parseFloat(guest.cash_gift_amount) || 0
        groupData.total += amount
        groupData.guestCount += 1
      }
    })

    // Filter out groups with no gifts in this currency
    const groupTotals = Array.from(groupTotalsMap.values())
      .filter(g => g.total > 0)
      .sort((a, b) => b.total - a.total)

    // Create chart data
    const chartData = {
      labels: groupTotals.map(g => g.name),
      datasets: [
        {
          data: groupTotals.map(g => g.total),
          backgroundColor: groupTotals.map(g => g.color),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    }

    const totalAmount = groupTotals.reduce((sum, g) => sum + g.total, 0)
    const guestCount = groupTotals.reduce((sum, g) => sum + g.guestCount, 0)

    return {
      currency,
      groupTotals,
      chartData,
      totalAmount,
      guestCount,
    }
  }).sort((a, b) => b.totalAmount - a.totalAmount) // Sort by total amount descending
})

// Computed: Currency breakdown (for summary cards)
const currencyBreakdown = computed(() => {
  const currencyMap = new Map<string, { code: string; total: number; count: number }>()

  allGuests.value.forEach(guest => {
    const currency = guest.cash_gift_currency || 'USD'
    const amount = parseFloat(guest.cash_gift_amount) || 0

    if (!currencyMap.has(currency)) {
      currencyMap.set(currency, { code: currency, total: 0, count: 0 })
    }

    const data = currencyMap.get(currency)!
    data.total += amount
    data.count += 1
  })

  return Array.from(currencyMap.values())
    .sort((a, b) => b.total - a.total)
})

// Chart options
const chartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 15,
        font: {
          size: 12,
        },
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${formatAmount(value)} (${percentage}%)`
        },
      },
    },
  },
}

// Computed stats
const totalGifts = computed(() => allGuests.value.length)
const totalGuestsWithGifts = computed(() => allGuests.value.length)
const totalGuests = computed(() => {
  return props.groups.reduce((sum, group) => sum + group.guest_count, 0)
})
const giftParticipationPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((totalGuestsWithGifts.value / total) * 100)
})

// Format amount (simplified without currency)
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format with currency
const formatCurrency = (amount: number, currency: string) => {
  return `${formatAmount(amount)} ${currency}`
}

// Lifecycle
onMounted(() => {
  if (props.groups.length > 0) {
    loadGuestData()
  }
})

// Watch for group changes
watch(() => props.groups, (newGroups) => {
  if (newGroups.length > 0) {
    loadGuestData()
  }
}, { deep: true })

// Expose refresh method and currency breakdown
defineExpose({
  refresh: loadGuestData,
  currencyBreakdown,
})
</script>

<style scoped>
/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  div[role='progressbar'] {
    transition: none !important;
  }

  .transition-all,
  .transition-colors {
    transition: none !important;
  }
}
</style>
