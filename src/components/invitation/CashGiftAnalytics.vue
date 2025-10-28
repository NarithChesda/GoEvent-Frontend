<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-bold text-slate-900 flex items-center">
          <Coins class="w-5 h-5 text-amber-600 mr-2" />
          Cash Gift Analytics
        </h3>
        <p class="text-sm text-slate-600 mt-1">Breakdown by guest group and currency</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      <span class="ml-3 text-sm text-slate-600">Loading cash gift data...</span>
    </div>

    <!-- No Data State -->
    <div v-else-if="totalGifts === 0" class="text-center py-12">
      <Coins class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p class="text-base text-slate-500">No cash gifts recorded yet</p>
      <p class="text-sm text-slate-400 mt-1">Cash gifts will appear here once guests add them</p>
    </div>

    <!-- Chart and Stats -->
    <div v-else class="space-y-6">
      <!-- Currency Breakdown Stats -->
      <div>
        <h4 class="text-sm font-semibold text-slate-700 mb-3">Currency Summary</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="currency in currencyBreakdown"
            :key="currency.code"
            class="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
          >
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <span class="text-xs font-bold text-amber-700">{{ currency.code }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-900">
                  {{ formatCurrency(currency.total, currency.code) }}
                </p>
                <p class="text-xs text-slate-500">{{ currency.count }} gifts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pie Charts by Currency -->
      <div class="space-y-6">
        <div
          v-for="currencyData in currencyChartData"
          :key="currencyData.currency"
          class="border border-slate-200 rounded-2xl p-6 bg-white"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <span class="text-sm font-bold text-amber-700">{{ currencyData.currency }}</span>
            </div>
            <div>
              <h4 class="text-base font-bold text-slate-900">
                {{ currencyData.currency }} Distribution by Group
              </h4>
              <p class="text-xs text-slate-600">
                {{ formatCurrency(currencyData.totalAmount, currencyData.currency) }} from {{ currencyData.guestCount }} guests
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Pie Chart -->
            <div class="flex items-center justify-center">
              <div class="w-full max-w-sm">
                <Pie :data="currencyData.chartData" :options="chartOptions" />
              </div>
            </div>

            <!-- Group Breakdown -->
            <div>
              <h5 class="text-sm font-semibold text-slate-700 mb-3">Group Breakdown</h5>
              <div class="space-y-2">
                <div
                  v-for="group in currencyData.groupTotals"
                  :key="group.id"
                  class="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-3 h-3 rounded-full flex-shrink-0"
                      :style="{ backgroundColor: group.color }"
                    ></div>
                    <span class="text-sm font-medium text-slate-900">{{ group.name }}</span>
                    <span class="text-xs text-slate-500">({{ group.guestCount }} guests)</span>
                  </div>
                  <span class="text-sm font-semibold text-slate-900">
                    {{ formatCurrency(group.total, currencyData.currency) }}
                  </span>
                </div>
              </div>

              <!-- Currency Total Summary -->
              <div class="mt-4 pt-4 border-t-2 border-slate-200">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-slate-700">Total {{ currencyData.currency }}</span>
                  <span class="text-lg font-bold text-amber-600">
                    {{ formatCurrency(currencyData.totalAmount, currencyData.currency) }}
                  </span>
                </div>
                <div class="mt-1 text-xs text-slate-500">
                  From {{ currencyData.guestCount }} guest{{ currencyData.guestCount !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Overall Grand Total -->
      <div class="border-t-2 border-slate-200 pt-4 px-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-slate-700">Total Gifts Received (All Currencies)</span>
          <span class="text-lg font-bold text-amber-600">{{ totalGifts }}</span>
        </div>
        <div class="mt-2 text-xs text-slate-500">
          From {{ totalGuestsWithGifts }} out of {{ totalGuests }} guests
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
  ChartOptions,
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
