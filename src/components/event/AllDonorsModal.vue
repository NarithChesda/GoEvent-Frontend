<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/60 z-[1000] flex items-end md:items-center justify-center"
        @click.self="emit('close')"
      >
        <Transition name="slide-up">
          <div
            v-if="show"
            class="bg-white w-full md:w-[500px] md:max-w-[90vw] max-h-[85vh] md:max-h-[80vh] rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex-shrink-0 border-b border-slate-200 px-4 py-3">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-slate-900">All Supporters</h2>
                <button
                  @click="emit('close')"
                  class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X class="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <!-- Tabs -->
              <div v-if="hasItemDonations" class="flex gap-1 mt-3">
                <button
                  @click="activeTab = 'cash'"
                  class="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="activeTab === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'"
                >
                  <div class="flex items-center justify-center gap-1.5">
                    <Banknote class="w-4 h-4" />
                    <span>Money</span>
                    <span class="text-xs opacity-70">({{ cashDonorCount }})</span>
                  </div>
                </button>
                <button
                  @click="activeTab = 'item'"
                  class="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="activeTab === 'item' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'"
                >
                  <div class="flex items-center justify-center gap-1.5">
                    <Package class="w-4 h-4" />
                    <span>Items</span>
                    <span class="text-xs opacity-70">({{ itemDonorCount }})</span>
                  </div>
                </button>
              </div>

              <!-- Sort Options -->
              <div class="flex items-center gap-2 mt-3">
                <span class="text-xs text-slate-500">Sort by:</span>
                <button
                  @click="sortBy = '-amount'"
                  class="px-2 py-1 text-xs rounded-md transition-colors"
                  :class="sortBy === '-amount' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                >
                  Top Amount
                </button>
                <button
                  @click="sortBy = '-created_at'"
                  class="px-2 py-1 text-xs rounded-md transition-colors"
                  :class="sortBy === '-created_at' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                >
                  Most Recent
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto overscroll-contain">
              <!-- Loading State -->
              <div v-if="loading && donations.length === 0" class="p-4 space-y-3">
                <div v-for="i in 5" :key="i" class="animate-pulse flex items-center gap-3">
                  <div class="w-10 h-10 bg-slate-200 rounded-lg"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div class="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div class="h-4 bg-slate-200 rounded w-16"></div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else-if="!loading && donations.length === 0" class="p-8 text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-base font-medium text-slate-900 mb-1">No donations yet</h3>
                <p class="text-sm text-slate-500">Be the first to support this campaign!</p>
              </div>

              <!-- Donors List -->
              <div v-else class="divide-y divide-slate-100">
                <div
                  v-for="(donation, index) in donations"
                  :key="donation.id"
                  class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <!-- Rank Badge (for top donors) -->
                  <div class="w-6 flex-shrink-0 text-center">
                    <div
                      v-if="sortBy === '-amount' && index < 3"
                      class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      :class="getRankBadgeClass(index)"
                    >
                      {{ index + 1 }}
                    </div>
                    <span v-else class="text-xs text-slate-400">{{ index + 1 }}</span>
                  </div>

                  <!-- Avatar -->
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    :class="getAvatarClass(index)"
                  >
                    {{ getInitials(donation.display_name || 'Anonymous') }}
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-900 truncate">
                      {{ donation.display_name || 'Anonymous' }}
                    </p>
                    <p class="text-xs text-slate-500">{{ formatRelativeTime(donation.created_at) }}</p>
                    <p v-if="donation.message" class="text-xs text-slate-600 mt-0.5 line-clamp-1 italic">
                      "{{ donation.message }}"
                    </p>
                  </div>

                  <!-- Amount / Item -->
                  <div class="text-right flex-shrink-0">
                    <div v-if="donation.amount" class="text-sm font-semibold text-slate-900">
                      {{ formatCurrency(parseFloat(donation.amount), donation.currency) }}
                    </div>
                    <div v-else-if="donation.item_quantity">
                      <p class="text-xs text-slate-500">{{ getItemDisplayName(donation) }}</p>
                      <p class="text-sm font-semibold text-slate-900">
                        {{ donation.item_quantity }} {{ donation.item_unit }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Load More -->
                <div v-if="hasMore" class="p-4">
                  <button
                    @click="loadMore"
                    :disabled="loadingMore"
                    class="w-full py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <span v-if="loadingMore" class="flex items-center justify-center gap-2">
                      <Loader2 class="w-4 h-4 animate-spin" />
                      Loading...
                    </span>
                    <span v-else>Load More</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Summary Footer -->
            <div v-if="donations.length > 0" class="flex-shrink-0 border-t border-slate-200 px-4 py-3 bg-slate-50">
              <div class="flex items-center justify-between text-sm">
                <div class="text-slate-600">
                  <span class="font-semibold text-slate-900">{{ totalCount }}</span>
                  {{ activeTab === 'cash' ? 'monetary donations' : 'item donations' }}
                </div>
                <div v-if="activeTab === 'cash' && averageAmount > 0" class="text-slate-600">
                  Avg: <span class="font-semibold text-slate-900">{{ formatCurrency(averageAmount, currency) }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Heart, Banknote, Package, Loader2 } from 'lucide-vue-next'
import { donationService } from '@/services/api'
import type { EventDonation } from '@/services/api/types/donation.types'
import { useEventDateFormatters } from '@/composables/event'

interface Props {
  show: boolean
  eventId: string
  currency: string
  totalCashDonors: number
  totalItemDonors: number
  hasItemDonations: boolean
  initialTab?: 'cash' | 'item'
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'cash',
})
const emit = defineEmits<Emits>()

const { getInitials } = useEventDateFormatters()

// State
const activeTab = ref<'cash' | 'item'>(props.initialTab)
const sortBy = ref<'-amount' | '-created_at'>('-amount')
const donations = ref<EventDonation[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const totalCount = ref(0)
const cashDonorCount = ref(props.totalCashDonors)
const itemDonorCount = ref(props.totalItemDonors)
const pageSize = 20

// Computed
const hasMore = computed(() => donations.value.length < totalCount.value)
const averageAmount = computed(() => {
  if (activeTab.value !== 'cash' || donations.value.length === 0) return 0
  const total = donations.value.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0)
  return total / donations.value.length
})

// Methods
const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`

  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}

const getItemDisplayName = (donation: EventDonation): string => {
  if (donation.item_name) return donation.item_name
  if (donation.item_category_info?.name) return donation.item_category_info.name
  return 'Item'
}

const getRankBadgeClass = (index: number): string => {
  switch (index) {
    case 0:
      return 'bg-amber-400 text-amber-900' // Gold
    case 1:
      return 'bg-slate-300 text-slate-700' // Silver
    case 2:
      return 'bg-amber-600 text-amber-100' // Bronze
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const getAvatarClass = (index: number): string => {
  if (sortBy.value === '-amount' && index < 3) {
    switch (index) {
      case 0:
        return 'bg-amber-100 text-amber-700'
      case 1:
        return 'bg-slate-200 text-slate-700'
      case 2:
        return 'bg-amber-100 text-amber-800'
    }
  }
  return 'bg-slate-100 text-slate-700'
}

const loadDonations = async (reset = true) => {
  if (reset) {
    loading.value = true
    currentPage.value = 1
    donations.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const response = await donationService.getDonations(props.eventId, {
      donation_type: activeTab.value,
      status: 'verified',
      ordering: sortBy.value,
      page: currentPage.value,
      page_size: pageSize,
    })

    if (response.success && response.data) {
      if (reset) {
        donations.value = response.data.results
      } else {
        donations.value = [...donations.value, ...response.data.results]
      }
      totalCount.value = response.data.count

      // Update the count for the current tab from API
      if (activeTab.value === 'cash') {
        cashDonorCount.value = response.data.count
      } else {
        itemDonorCount.value = response.data.count
      }
    }
  } catch (err) {
    console.error('Failed to load donations:', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Fetch counts for both tabs
const loadTabCounts = async () => {
  try {
    const [cashResponse, itemResponse] = await Promise.all([
      donationService.getDonations(props.eventId, {
        donation_type: 'cash',
        status: 'verified',
        page_size: 1,
      }),
      donationService.getDonations(props.eventId, {
        donation_type: 'item',
        status: 'verified',
        page_size: 1,
      }),
    ])

    if (cashResponse.success && cashResponse.data) {
      cashDonorCount.value = cashResponse.data.count
    }
    if (itemResponse.success && itemResponse.data) {
      itemDonorCount.value = itemResponse.data.count
    }
  } catch (err) {
    console.error('Failed to load tab counts:', err)
  }
}

const loadMore = () => {
  if (hasMore.value && !loadingMore.value) {
    currentPage.value++
    loadDonations(false)
  }
}

// Watchers
watch(
  () => props.show,
  (isVisible) => {
    if (isVisible) {
      activeTab.value = props.initialTab
      loadDonations()
      // Load counts for both tabs to show accurate numbers
      if (props.hasItemDonations) {
        loadTabCounts()
      }
    }
  }
)

watch([activeTab, sortBy], () => {
  if (props.show) {
    loadDonations()
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translateY(20px);
    opacity: 0;
  }
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
