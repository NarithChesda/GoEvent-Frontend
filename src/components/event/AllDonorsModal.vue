<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/50 z-[1000] flex items-end md:items-center justify-center"
        @click.self="emit('close')"
      >
        <Transition name="slide-up">
          <div
            v-if="show"
            class="bg-white w-full md:w-[480px] md:max-w-[90vw] max-h-[85vh] md:max-h-[80vh] rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            @click.stop
          >
            <!-- Header -->
            <div class="flex-shrink-0 bg-white">
              <!-- Title Row -->
              <div class="flex items-center justify-between px-5 pt-4 pb-3">
                <div>
                  <h2 class="text-lg font-bold text-slate-900">All Supporters</h2>
                  <p class="text-xs text-slate-500 mt-0.5">{{ totalCount }} contributions</p>
                </div>
                <button
                  @click="emit('close')"
                  class="p-2 -mr-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X class="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <!-- Tabs (matching fundraising card style) -->
              <div v-if="hasItemDonations" class="border-b border-slate-200">
                <div class="flex px-1">
                  <button
                    @click="activeTab = 'cash'"
                    class="flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
                    :class="activeTab === 'cash'
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
                  >
                    <Banknote class="w-4 h-4" />
                    Money
                    <span class="text-xs px-1.5 py-0.5 rounded-full" :class="activeTab === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                      {{ cashDonorCount }}
                    </span>
                  </button>
                  <button
                    @click="activeTab = 'item'"
                    class="flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
                    :class="activeTab === 'item'
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
                  >
                    <Gift class="w-4 h-4" />
                    Items
                    <span class="text-xs px-1.5 py-0.5 rounded-full" :class="activeTab === 'item' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                      {{ itemDonorCount }}
                    </span>
                  </button>
                </div>
              </div>
              <div v-else class="border-b border-slate-200"></div>

              <!-- Sort Options (minimal, inline) -->
              <div class="flex items-center justify-between px-5 py-2.5 bg-slate-50/80">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Sort by</span>
                <div class="flex items-center gap-1">
                  <button
                    @click="sortBy = '-amount'"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                    :class="sortBy === '-amount'
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'"
                  >
                    Top
                  </button>
                  <button
                    @click="sortBy = '-created_at'"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                    :class="sortBy === '-created_at'
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'"
                  >
                    Recent
                  </button>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div ref="scrollContainerRef" class="flex-1 overflow-y-auto overscroll-contain bg-slate-50/50">
              <!-- Loading State -->
              <div v-if="loading && donations.length === 0" class="p-4 space-y-2">
                <div v-for="i in 5" :key="i" class="animate-pulse flex items-center gap-3 p-3 bg-white rounded-xl">
                  <div class="w-10 h-10 bg-slate-100 rounded-lg"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-slate-100 rounded w-2/3 mb-2"></div>
                    <div class="h-3 bg-slate-100 rounded w-1/3"></div>
                  </div>
                  <div class="h-5 bg-slate-100 rounded w-16"></div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else-if="!loading && donations.length === 0" class="py-16 px-8 text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart class="w-7 h-7 text-slate-300" />
                </div>
                <h3 class="text-base font-semibold text-slate-900 mb-1">No donations yet</h3>
                <p class="text-sm text-slate-500">Be the first to support this campaign!</p>
              </div>

              <!-- Donors List -->
              <div v-else class="p-3 space-y-2">
                <div
                  v-for="(donation, index) in donations"
                  :key="donation.id"
                  class="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-sm transition-all"
                >
                  <!-- Avatar (matching card style) -->
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0 relative"
                    :class="activeTab === 'item' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-50 text-emerald-700'"
                  >
                    {{ getInitials(donation.display_name || 'Anonymous') }}
                    <!-- Top 3 indicator -->
                    <div
                      v-if="sortBy === '-amount' && index < 3"
                      class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm"
                      :class="getRankBadgeClass(index)"
                    >
                      {{ index + 1 }}
                    </div>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-900 truncate">
                      {{ donation.display_name || 'Anonymous' }}
                    </p>
                    <p class="text-xs text-slate-400">{{ formatRelativeTime(donation.created_at) }}</p>
                    <p v-if="donation.message" class="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                      "{{ donation.message }}"
                    </p>
                  </div>

                  <!-- Amount / Item (matching card style) -->
                  <div class="text-right flex-shrink-0">
                    <div v-if="donation.amount" class="text-sm font-semibold text-emerald-600">
                      {{ formatCurrency(parseFloat(donation.amount), donation.currency) }}
                    </div>
                    <div v-else-if="donation.item_quantity">
                      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-lg">
                        <Gift class="w-3 h-3 text-purple-500" />
                        <span class="text-xs font-semibold text-purple-700">
                          {{ donation.item_quantity }} {{ donation.item_unit }}
                        </span>
                      </div>
                      <p class="text-[10px] text-slate-400 mt-1 truncate max-w-[100px]">
                        {{ getItemDisplayName(donation) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Infinite Scroll Sentinel -->
                <div
                  ref="sentinelRef"
                  class="py-4 flex items-center justify-center"
                  :class="{ 'py-1': !loadingMore && !hasMore }"
                >
                  <!-- Loading more indicator -->
                  <div v-if="loadingMore" class="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 class="w-4 h-4 animate-spin" />
                    <span>Loading more...</span>
                  </div>
                  <!-- End of list message -->
                  <div v-else-if="!hasMore && donations.length > 0" class="text-xs text-slate-300">
                    End of list
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary Footer -->
            <div v-if="donations.length > 0" class="flex-shrink-0 border-t border-slate-100 px-5 py-3 bg-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="activeTab === 'item' ? 'bg-purple-400' : 'bg-emerald-400'"></div>
                  <span class="text-sm text-slate-600">
                    <span class="font-semibold text-slate-900">{{ totalCount }}</span>
                    {{ activeTab === 'cash' ? 'donations' : 'item donations' }}
                  </span>
                </div>
                <div v-if="activeTab === 'cash' && averageAmount > 0" class="text-sm text-slate-500">
                  Avg <span class="font-semibold text-slate-700">{{ formatCurrency(averageAmount, currency) }}</span>
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
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { X, Heart, Banknote, Gift, Loader2 } from 'lucide-vue-next'
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
const currentOffset = ref(0)
const totalCount = ref(0)
const cashDonorCount = ref(props.totalCashDonors)
const itemDonorCount = ref(props.totalItemDonors)
const hasMore = ref(false)
const limit = 20

// Refs for infinite scroll
const scrollContainerRef = ref<HTMLElement | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)
let intersectionObserver: IntersectionObserver | null = null

// Computed
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

const loadDonations = async (reset = true) => {
  if (reset) {
    loading.value = true
    currentOffset.value = 0
    donations.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const response = await donationService.getDonations(props.eventId, {
      donation_type: activeTab.value,
      status: 'verified',
      ordering: sortBy.value,
      limit: limit,
      offset: currentOffset.value,
    })

    if (response.success && response.data) {
      if (reset) {
        donations.value = response.data.results
      } else {
        donations.value = [...donations.value, ...response.data.results]
      }
      totalCount.value = response.data.count

      // Use has_more from API if available, otherwise calculate from count
      hasMore.value = response.data.has_more ?? (donations.value.length < response.data.count)

      // Update the count for the current tab from API
      if (activeTab.value === 'cash') {
        cashDonorCount.value = response.data.count
      } else {
        itemDonorCount.value = response.data.count
      }

      // Setup intersection observer after data is loaded
      if (reset) {
        await nextTick()
        setupIntersectionObserver()
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
        limit: 1,
      }),
      donationService.getDonations(props.eventId, {
        donation_type: 'item',
        status: 'verified',
        limit: 1,
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
    currentOffset.value += limit
    loadDonations(false)
  }
}

// Intersection Observer for infinite scroll
const setupIntersectionObserver = () => {
  // Clean up existing observer
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  if (!sentinelRef.value) return

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore.value && !loadingMore.value && !loading.value) {
        loadMore()
      }
    },
    {
      root: scrollContainerRef.value,
      rootMargin: '100px', // Start loading when sentinel is 100px from viewport
      threshold: 0,
    }
  )

  intersectionObserver.observe(sentinelRef.value)
}

const cleanupIntersectionObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
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
    } else {
      // Cleanup when modal closes
      cleanupIntersectionObserver()
    }
  }
)

watch([activeTab, sortBy], () => {
  if (props.show) {
    loadDonations()
  }
})

// Lifecycle
onUnmounted(() => {
  cleanupIntersectionObserver()
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
