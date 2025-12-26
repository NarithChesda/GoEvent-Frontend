<template>
  <div class="space-y-4">
    <!-- Filter Bar -->
    <div class="sticky top-0 z-20">
      <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm">
        <div class="flex items-center gap-3 p-3">
          <!-- Status Filter Dropdown -->
          <div class="relative" ref="statusFilterContainer">
            <button
              @click="isStatusDropdownOpen = !isStatusDropdownOpen"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border"
              :class="selectedStatus === ''
                ? 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                : statusButtonClass"
            >
              <Filter class="w-4 h-4 flex-shrink-0" :class="selectedStatus === '' ? 'text-slate-500' : ''" />
              <span class="truncate max-w-[80px] sm:max-w-[120px]">
                {{ selectedStatus === '' ? 'All Status' : statusLabels[selectedStatus as DonationStatus] }}
              </span>
              <ChevronDown
                class="w-4 h-4 transition-transform flex-shrink-0"
                :class="{ 'rotate-180': isStatusDropdownOpen }"
              />
            </button>

            <!-- Status Dropdown Menu -->
            <Transition name="dropdown">
              <div
                v-if="isStatusDropdownOpen"
                class="absolute top-full left-0 mt-2 min-w-[180px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-[100]"
                @click.stop
              >
                <div class="p-1.5">
                  <button
                    @click="selectStatus('')"
                    :class="[
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                      selectedStatus === ''
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    ]"
                  >
                    <Filter class="w-4 h-4 text-slate-400" />
                    <span class="flex-1 text-left">All Status</span>
                  </button>

                  <div class="my-1.5 border-t border-slate-100"></div>

                  <button
                    v-for="status in statusOptions"
                    :key="status"
                    @click="selectStatus(status)"
                    :class="[
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                      selectedStatus === status
                        ? statusItemActiveClass(status)
                        : 'text-slate-700 hover:bg-slate-50'
                    ]"
                  >
                    <div
                      class="w-4 h-4 rounded-full flex items-center justify-center"
                      :class="statusDotClass(status)"
                    >
                      <div class="w-2 h-2 rounded-full" :class="statusDotInnerClass(status)"></div>
                    </div>
                    <span class="flex-1 text-left">{{ statusLabels[status] }}</span>
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Click outside to close -->
            <div
              v-if="isStatusDropdownOpen"
              @click="isStatusDropdownOpen = false"
              class="fixed inset-0 z-[90]"
            ></div>
          </div>

          <!-- Type Filter Dropdown -->
          <div class="relative hidden sm:block" ref="typeFilterContainer">
            <button
              @click="isTypeDropdownOpen = !isTypeDropdownOpen"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border"
              :class="selectedType === ''
                ? 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                : typeButtonClass"
            >
              <component
                :is="selectedType === 'cash' ? DollarSign : selectedType === 'item' ? Package : Package"
                class="w-4 h-4 flex-shrink-0"
                :class="selectedType === '' ? 'text-slate-500' : ''"
              />
              <span class="truncate max-w-[80px] sm:max-w-[120px]">
                {{ selectedType === '' ? 'All Types' : typeLabels[selectedType as DonationType] }}
              </span>
              <ChevronDown
                class="w-4 h-4 transition-transform flex-shrink-0"
                :class="{ 'rotate-180': isTypeDropdownOpen }"
              />
            </button>

            <!-- Type Dropdown Menu -->
            <Transition name="dropdown">
              <div
                v-if="isTypeDropdownOpen"
                class="absolute top-full left-0 mt-2 min-w-[180px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-[100]"
                @click.stop
              >
                <div class="p-1.5">
                  <button
                    @click="selectType('')"
                    :class="[
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                      selectedType === ''
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    ]"
                  >
                    <Package class="w-4 h-4 text-slate-400" />
                    <span class="flex-1 text-left">All Types</span>
                  </button>

                  <div class="my-1.5 border-t border-slate-100"></div>

                  <button
                    @click="selectType('cash')"
                    :class="[
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                      selectedType === 'cash'
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    ]"
                  >
                    <div
                      class="w-4 h-4 rounded-full flex items-center justify-center"
                      :class="selectedType === 'cash' ? 'bg-emerald-400' : 'bg-emerald-100'"
                    >
                      <DollarSign class="w-2.5 h-2.5" :class="selectedType === 'cash' ? 'text-white' : 'text-emerald-600'" />
                    </div>
                    <span class="flex-1 text-left">Cash</span>
                  </button>

                  <button
                    @click="selectType('item')"
                    :class="[
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                      selectedType === 'item'
                        ? 'bg-purple-500 text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    ]"
                  >
                    <div
                      class="w-4 h-4 rounded-full flex items-center justify-center"
                      :class="selectedType === 'item' ? 'bg-purple-400' : 'bg-purple-100'"
                    >
                      <Package class="w-2.5 h-2.5" :class="selectedType === 'item' ? 'text-white' : 'text-purple-600'" />
                    </div>
                    <span class="flex-1 text-left">Item</span>
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Click outside to close -->
            <div
              v-if="isTypeDropdownOpen"
              @click="isTypeDropdownOpen = false"
              class="fixed inset-0 z-[90]"
            ></div>
          </div>

          <!-- Divider -->
          <div class="w-px h-5 bg-slate-200 hidden sm:block"></div>

          <!-- Search Input (Desktop) -->
          <div class="hidden sm:block flex-1 min-w-0">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Search donations..."
                class="w-full pl-9 pr-8 py-2 bg-slate-50/50 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          <!-- Count -->
          <div class="flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0">
            <span class="font-medium text-slate-700">{{ filteredDonations.length }}</span>
            <span>/</span>
            <span>{{ totalCount }}</span>
          </div>
        </div>

        <!-- Mobile Search Row -->
        <div class="p-3 pt-0 sm:hidden">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Search donations..."
              class="w-full pl-9 pr-4 py-2 bg-slate-50/50 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Scrollable Donations List Container -->
    <div
      v-if="filteredDonations.length > 0"
      class="max-h-[600px] overflow-y-auto space-y-2 pr-2 custom-scrollbar relative z-0"
    >
      <div
        v-for="donation in filteredDonations"
        :key="donation.id"
        class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white overflow-hidden transition-all duration-200"
      >
        <!-- Donation Card -->
        <div class="px-4 py-3 sm:p-4">
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div
              :class="[
                'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                donation.donation_type === 'cash' ? 'bg-emerald-100' : 'bg-purple-100'
              ]"
            >
              <DollarSign v-if="donation.donation_type === 'cash'" class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <Package v-else class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>

            <!-- Info Section -->
            <div class="flex-1 min-w-0">
              <!-- Top Row: Name + Status + Amount -->
              <div class="flex items-start justify-between gap-2 mb-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <h4 class="font-semibold text-slate-900 truncate">{{ donation.display_name }}</h4>
                  <span
                    v-if="donation.is_anonymous"
                    class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded flex-shrink-0"
                  >
                    Anon
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold',
                      statusBadgeClass[donation.status]
                    ]"
                  >
                    {{ statusLabels[donation.status] }}
                  </span>
                </div>
              </div>

              <!-- Amount/Item -->
              <div class="font-bold text-slate-900 tabular-nums">
                {{ donation.donation_display }}
              </div>

              <!-- Message -->
              <p v-if="donation.message" class="text-sm text-slate-600 mt-1 line-clamp-1">
                "{{ donation.message }}"
              </p>

              <!-- Bottom Row: Meta + Actions -->
              <div class="flex items-center justify-between gap-3 mt-2">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span class="flex items-center gap-1">
                    <Calendar class="w-3 h-3" />
                    {{ formatDate(donation.created_at) }}
                  </span>
                  <span v-if="donation.donor_email" class="hidden sm:flex items-center gap-1">
                    <Mail class="w-3 h-3" />
                    {{ donation.donor_email }}
                  </span>
                </div>

                <!-- Actions when host can edit -->
                <div v-if="canEdit" class="flex items-center gap-1.5">
                  <!-- Receipt button -->
                  <button
                    v-if="donation.receipt_image"
                    @click.stop="$emit('view-receipt', donation)"
                    class="px-2.5 py-1 text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1"
                    title="View receipt"
                  >
                    <ImageIcon class="w-3 h-3" />
                    <span class="hidden sm:inline">Receipt</span>
                  </button>

                  <!-- Pending: Show both Verify and Reject -->
                  <template v-if="donation.status === 'pending'">
                    <button
                      @click.stop="$emit('verify', donation)"
                      class="px-2.5 py-1 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Check class="w-3 h-3" />
                      <span class="hidden sm:inline">Verify</span>
                    </button>
                    <button
                      @click.stop="$emit('reject', donation)"
                      class="px-2.5 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <X class="w-3 h-3" />
                      <span class="hidden sm:inline">Reject</span>
                    </button>
                  </template>

                  <!-- Verified: Allow changing to Rejected -->
                  <button
                    v-else-if="donation.status === 'verified'"
                    @click.stop="$emit('reject', donation)"
                    class="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1"
                    title="Change to rejected"
                  >
                    <X class="w-3 h-3" />
                    <span class="hidden sm:inline">Reject</span>
                  </button>

                  <!-- Rejected: Allow changing to Verified -->
                  <button
                    v-else-if="donation.status === 'rejected'"
                    @click.stop="$emit('verify', donation)"
                    class="px-2.5 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                    title="Change to verified"
                  >
                    <Check class="w-3 h-3" />
                    <span class="hidden sm:inline">Verify</span>
                  </button>
                </div>

                <!-- Receipt link when host cannot edit -->
                <button
                  v-else-if="donation.receipt_image"
                  @click.stop="$emit('view-receipt', donation)"
                  class="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  <ImageIcon class="w-3 h-3" />
                  <span class="hidden sm:inline">Receipt</span>
                </button>
              </div>

              <!-- Rejection Reason -->
              <div v-if="donation.status === 'rejected' && donation.rejection_reason" class="mt-2 p-2 bg-red-50 rounded-lg">
                <p class="text-xs text-red-700">
                  <span class="font-medium">Rejected:</span> {{ donation.rejection_reason }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More / Infinite Scroll Trigger -->
      <div
        ref="loadMoreTrigger"
        class="py-4 flex justify-center"
      >
        <div v-if="isLoadingMore" class="flex items-center gap-2">
          <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm text-slate-500">Loading more donations...</span>
        </div>
        <div v-else-if="!hasMore && filteredDonations.length > 0" class="text-sm text-slate-400">
          All {{ totalCount }} donations loaded
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-12 text-center">
      <Heart class="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h4 class="font-semibold text-slate-600 mb-1">No Donations Found</h4>
      <p class="text-sm text-slate-400">
        {{ searchTerm || selectedStatus || selectedType
          ? 'Try adjusting your filters'
          : 'Donations will appear here when people contribute'
        }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Search,
  DollarSign,
  Package,
  Calendar,
  Mail,
  ImageIcon,
  Check,
  X,
  Heart,
  Filter,
  ChevronDown
} from 'lucide-vue-next'
import type { EventDonation, DonationStatus, DonationType } from '@/services/api/types/donation.types'

interface Props {
  donations: EventDonation[]
  canEdit: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  totalCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  hasMore: false,
  isLoadingMore: false,
  totalCount: 0
})

const emit = defineEmits<{
  'verify': [donation: EventDonation]
  'reject': [donation: EventDonation]
  'view-receipt': [donation: EventDonation]
  'load-more': []
  'filter-change': [filters: { status: DonationStatus | '', type: DonationType | '', search: string }]
}>()

// Infinite scroll
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

const setupIntersectionObserver = () => {
  if (!loadMoreTrigger.value) return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && props.hasMore && !props.isLoadingMore) {
        emit('load-more')
      }
    },
    {
      rootMargin: '100px',
      threshold: 0.1
    }
  )

  observer.observe(loadMoreTrigger.value)
}

// Re-setup observer when loadMoreTrigger becomes available
watch(loadMoreTrigger, (newTrigger) => {
  if (observer) {
    observer.disconnect()
  }
  if (newTrigger) {
    setupIntersectionObserver()
  }
})

// Local state
const searchTerm = ref('')
const selectedStatus = ref<DonationStatus | ''>('')
const selectedType = ref<DonationType | ''>('')
const isStatusDropdownOpen = ref(false)
const isTypeDropdownOpen = ref(false)
const statusFilterContainer = ref<HTMLElement>()
const typeFilterContainer = ref<HTMLElement>()

// Status options
const statusOptions: DonationStatus[] = ['pending', 'verified', 'rejected']

// Status display config
const statusLabels: Record<DonationStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected'
}

const statusBadgeClass: Record<DonationStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700'
}

// Button class based on selected status
const statusButtonClass = computed(() => {
  if (selectedStatus.value === 'pending') return 'bg-amber-500 text-white border-amber-500'
  if (selectedStatus.value === 'verified') return 'bg-emerald-500 text-white border-emerald-500'
  if (selectedStatus.value === 'rejected') return 'bg-red-500 text-white border-red-500'
  return ''
})

const statusItemActiveClass = (status: DonationStatus): string => {
  if (status === 'pending') return 'bg-amber-500 text-white'
  if (status === 'verified') return 'bg-emerald-500 text-white'
  if (status === 'rejected') return 'bg-red-500 text-white'
  return ''
}

const statusDotClass = (status: DonationStatus): string => {
  if (status === 'pending') return 'bg-amber-100'
  if (status === 'verified') return 'bg-emerald-100'
  if (status === 'rejected') return 'bg-red-100'
  return ''
}

const statusDotInnerClass = (status: DonationStatus): string => {
  if (status === 'pending') return 'bg-amber-500'
  if (status === 'verified') return 'bg-emerald-500'
  if (status === 'rejected') return 'bg-red-500'
  return ''
}

const selectStatus = (status: DonationStatus | '') => {
  selectedStatus.value = status
  isStatusDropdownOpen.value = false
}

// Type display config
const typeLabels: Record<DonationType, string> = {
  cash: 'Cash',
  item: 'Item'
}

// Button class based on selected type
const typeButtonClass = computed(() => {
  if (selectedType.value === 'cash') return 'bg-emerald-500 text-white border-emerald-500'
  if (selectedType.value === 'item') return 'bg-purple-500 text-white border-purple-500'
  return ''
})

const selectType = (type: DonationType | '') => {
  selectedType.value = type
  isTypeDropdownOpen.value = false
}

// Emit filter changes for server-side filtering (with debounce for search)
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const emitFilterChange = () => {
  emit('filter-change', {
    status: selectedStatus.value,
    type: selectedType.value,
    search: searchTerm.value
  })
}

watch([selectedStatus, selectedType], () => {
  emitFilterChange()
})

watch(searchTerm, () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    emitFilterChange()
  }, 300)
})

// Filtered donations
const filteredDonations = computed(() => {
  let result = [...props.donations]

  if (selectedStatus.value) {
    result = result.filter(d => d.status === selectedStatus.value)
  }

  if (selectedType.value) {
    result = result.filter(d => d.donation_type === selectedType.value)
  }

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(d =>
      d.donor_name.toLowerCase().includes(term) ||
      d.donor_email?.toLowerCase().includes(term) ||
      d.message?.toLowerCase().includes(term) ||
      d.item_name?.toLowerCase().includes(term)
    )
  }

  return result
})

// Helpers
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Custom scrollbar - matches guest list style */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #cbd5e1;
}
</style>
