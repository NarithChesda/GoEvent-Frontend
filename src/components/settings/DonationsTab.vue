<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading && donations.length === 0" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle class="w-8 h-8 text-red-600" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load donations</h3>
      <p class="text-gray-500 mb-4">{{ error }}</p>
      <button
        @click="loadDonations"
        class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Donations Content -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-gray-900">My Donations</h2>
          <p class="text-sm text-gray-500 mt-1">
            Track your donations across all events
          </p>
        </div>
      </div>

      <!-- Quick Stats (inline) -->
      <div v-if="donations.length > 0" class="flex items-center gap-6 text-sm">
        <span class="text-gray-500">
          <span class="font-medium text-emerald-600">{{ verifiedCount }}</span> verified
        </span>
        <span class="text-gray-500">
          <span class="font-medium text-amber-600">{{ pendingCount }}</span> pending
        </span>
        <span class="text-gray-500">
          <span class="font-medium text-gray-600">{{ totalCount }}</span> total
        </span>
      </div>

      <!-- Filter Bar -->
      <div v-if="donations.length > 0 || selectedStatus !== ''" class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm p-3">
        <div class="flex items-center gap-3">
          <!-- Status Filter Dropdown -->
          <div class="relative">
            <button
              @click="isStatusDropdownOpen = !isStatusDropdownOpen"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border"
              :class="selectedStatus === ''
                ? 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                : statusButtonClass"
            >
              <Filter class="w-4 h-4 flex-shrink-0" :class="selectedStatus === '' ? 'text-slate-500' : ''" />
              <span class="truncate max-w-[80px] sm:max-w-[120px]">
                {{ selectedStatus === '' ? 'All Status' : statusLabels[selectedStatus] }}
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

          <div class="flex-1"></div>

          <!-- Count -->
          <div class="flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0">
            <span class="font-medium text-slate-700">{{ filteredDonations.length }}</span>
            <span>/</span>
            <span>{{ totalCount }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="donations.length === 0 && !isLoading" class="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Heart class="w-7 h-7 text-emerald-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No donations yet</h3>
            <p class="text-gray-600">
              When you make donations to events, they will appear here.
            </p>
          </div>
        </div>
      </div>

      <!-- Donations List -->
      <div v-else class="space-y-3">
        <div
          v-for="donation in filteredDonations"
          :key="donation.id"
          class="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
        >
          <div class="p-4 sm:p-5">
            <div class="flex items-start gap-3 sm:gap-4">
              <!-- Icon -->
              <div
                :class="[
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  donation.donation_type === 'cash' ? 'bg-emerald-100' : 'bg-purple-100'
                ]"
              >
                <DollarSign v-if="donation.donation_type === 'cash'" class="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                <Package v-else class="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>

              <!-- Info Section -->
              <div class="flex-1 min-w-0">
                <!-- Top Row: Event + Status -->
                <div class="flex items-start justify-between gap-2 mb-1">
                  <div class="min-w-0">
                    <h4 class="font-semibold text-slate-900 truncate">
                      {{ donation.event_info?.title || 'Event' }}
                    </h4>
                  </div>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0',
                      statusBadgeClass[donation.status]
                    ]"
                  >
                    {{ statusLabels[donation.status] }}
                  </span>
                </div>

                <!-- Amount/Item -->
                <div class="font-bold text-slate-900 tabular-nums text-lg">
                  {{ donation.donation_display }}
                </div>

                <!-- Message -->
                <p v-if="donation.message" class="text-sm text-slate-600 mt-1 line-clamp-1">
                  "{{ donation.message }}"
                </p>

                <!-- Bottom Row: Meta + Actions -->
                <div class="flex items-center justify-between gap-3 mt-3">
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span class="flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      {{ formatDate(donation.created_at) }}
                    </span>
                    <span v-if="donation.event_info?.start_date" class="hidden sm:flex items-center gap-1">
                      <CalendarDays class="w-3 h-3" />
                      Event: {{ formatDate(donation.event_info.start_date) }}
                    </span>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1.5">
                    <!-- View Receipt -->
                    <button
                      v-if="donation.receipt_image"
                      @click="viewReceipt(donation)"
                      class="px-2.5 py-1 text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1"
                      title="View receipt"
                    >
                      <ImageIcon class="w-3 h-3" />
                      <span class="hidden sm:inline">Receipt</span>
                    </button>

                    <!-- Edit (for pending donations) -->
                    <button
                      v-if="donation.status === 'pending'"
                      @click="editDonation(donation)"
                      class="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Pencil class="w-3 h-3" />
                      <span class="hidden sm:inline">Edit</span>
                    </button>
                  </div>
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

        <!-- Load More -->
        <div v-if="hasMore" class="text-center pt-4">
          <button
            @click="loadMore"
            :disabled="isLoading"
            class="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
          >
            {{ isLoading ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showReceiptModal && selectedDonationForReceipt"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          @click.self="showReceiptModal = false"
        >
          <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Donation Receipt</h3>
              <button
                @click="showReceiptModal = false"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X class="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div class="p-6">
              <div class="mb-4">
                <p class="text-sm text-slate-600">
                  <span class="font-medium">Amount:</span> {{ selectedDonationForReceipt.donation_display }}
                </p>
                <p class="text-sm text-slate-600">
                  <span class="font-medium">Date:</span> {{ formatDate(selectedDonationForReceipt.created_at) }}
                </p>
              </div>
              <img
                v-if="selectedDonationForReceipt.receipt_image"
                :src="getMediaUrl(selectedDonationForReceipt.receipt_image)"
                alt="Receipt"
                class="w-full rounded-lg border border-slate-200"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit Donation Drawer -->
    <DonationEditDrawer
      v-model="showEditDrawer"
      :donation="selectedDonationForEdit"
      @updated="handleDonationUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Heart,
  DollarSign,
  Package,
  Calendar,
  CalendarDays,
  ImageIcon,
  Pencil,
  X,
  Filter,
  ChevronDown,
  AlertCircle,
} from 'lucide-vue-next'
import { donationService, apiClient } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { UserDonation, DonationStatus } from '@/services/api/types/donation.types'
import DonationEditDrawer from './DonationEditDrawer.vue'

// Auth store
const authStore = useAuthStore()

// State
const donations = ref<UserDonation[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const hasMore = ref(false)
const currentPage = ref(1)
const totalCount = ref(0)

// Filter state
const selectedStatus = ref<DonationStatus | ''>('')
const isStatusDropdownOpen = ref(false)

// UI state
const showReceiptModal = ref(false)
const selectedDonationForReceipt = ref<UserDonation | null>(null)
const showEditDrawer = ref(false)
const selectedDonationForEdit = ref<UserDonation | null>(null)

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

// Computed
const verifiedCount = computed(() => donations.value.filter(d => d.status === 'verified').length)
const pendingCount = computed(() => donations.value.filter(d => d.status === 'pending').length)

const filteredDonations = computed(() => {
  if (!selectedStatus.value) return donations.value
  return donations.value.filter(d => d.status === selectedStatus.value)
})

const statusButtonClass = computed(() => {
  if (selectedStatus.value === 'pending') return 'bg-amber-500 text-white border-amber-500'
  if (selectedStatus.value === 'verified') return 'bg-emerald-500 text-white border-emerald-500'
  if (selectedStatus.value === 'rejected') return 'bg-red-500 text-white border-red-500'
  return ''
})

// Methods
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getMediaUrl = (mediaUrl: string | null | undefined): string | undefined => {
  if (!mediaUrl) return undefined
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }
  return apiClient.getProfilePictureUrl(mediaUrl) || undefined
}

const loadDonations = async (page = 1) => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    error.value = 'Please sign in to view your donations'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const response = await donationService.getMyDonations({
      page,
      page_size: 20,
      ordering: '-created_at'
    })

    if (response.success && response.data) {
      // Handle both array and paginated response formats
      // API returns { summary, donations } for my-donations endpoint
      const results = Array.isArray(response.data)
        ? response.data
        : (response.data.donations || response.data.results || [])

      if (page === 1) {
        donations.value = results
      } else {
        donations.value = [...donations.value, ...results]
      }

      // Handle pagination
      if (Array.isArray(response.data)) {
        hasMore.value = false
        totalCount.value = results.length
      } else {
        // my-donations endpoint returns { summary, donations }
        // or standard paginated format with { next, count, results }
        hasMore.value = !!response.data.next
        totalCount.value = response.data.summary?.total_donations
          || response.data.count
          || results.length
      }
      currentPage.value = page
    } else {
      error.value = response.message || 'Failed to load donations'
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
    error.value = errorMessage
  } finally {
    isLoading.value = false
  }
}

const loadMore = () => {
  if (hasMore.value && !isLoading.value) {
    loadDonations(currentPage.value + 1)
  }
}

const viewReceipt = (donation: UserDonation) => {
  selectedDonationForReceipt.value = donation
  showReceiptModal.value = true
}

const editDonation = (donation: UserDonation) => {
  selectedDonationForEdit.value = donation
  showEditDrawer.value = true
}

const handleDonationUpdated = (updatedDonation: UserDonation) => {
  const index = donations.value.findIndex(d => d.id === updatedDonation.id)
  if (index !== -1) {
    donations.value[index] = updatedDonation
  }
}

// Initialize
onMounted(() => {
  loadDonations()
})
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
