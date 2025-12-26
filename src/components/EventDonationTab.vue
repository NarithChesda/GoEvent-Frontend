<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">Donation Management</h2>
      <p class="text-xs sm:text-sm text-slate-600 mt-1">Track donations and manage fundraising progress</p>
    </div>

    <!-- Fundraising Not Enabled State -->
    <div
      v-if="!isFundraisingEnabled"
      class="rounded-3xl border border-white/70 bg-white p-8 sm:p-12 shadow-lg shadow-slate-200/60 text-center"
    >
      <Heart class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">Fundraising Not Enabled</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        Enable fundraising mode in your event settings to start accepting donations.
      </p>
      <button
        v-if="canEdit"
        @click="$emit('enable-fundraising')"
        class="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all duration-200 mx-auto"
      >
        <Heart class="w-4 h-4" />
        Enable Fundraising
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="isLoading"
      class="rounded-3xl border border-white/70 bg-white p-8 sm:p-12 shadow-lg shadow-slate-200/60 text-center"
    >
      <Loader2 class="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 mx-auto mb-3 sm:mb-4 animate-spin" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">Loading Donations</h3>
      <p class="text-xs sm:text-sm text-slate-600">Fetching fundraising data...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="rounded-3xl border border-red-200/70 bg-red-50 p-8 sm:p-12 shadow-lg shadow-red-200/60 text-center"
    >
      <AlertCircle class="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-red-900 mb-1.5 sm:mb-2">Failed to Load Donations</h3>
      <p class="text-xs sm:text-sm text-red-700 mb-4 sm:mb-6 max-w-md mx-auto">
        {{ error }}
      </p>
      <button
        @click="loadData"
        class="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all duration-200 mx-auto"
      >
        <RefreshCw class="w-4 h-4" />
        Retry
      </button>
    </div>

    <!-- Main Content (when fundraising is enabled and data loaded) -->
    <template v-else>
      <!-- Unified Content Area -->
      <div class="space-y-6">
        <!-- Summary View -->
        <DonationSummaryView
          :progress="progress"
          :cash-donations-count="cashDonationsCount"
          :item-donations-count="itemDonationsCount"
          :pending-donations-count="pendingDonationsCount"
        />

        <!-- Donations List View -->
        <DonationListView
          :donations="donations"
          :can-edit="canEdit"
          :total-count="donations.length"
          @verify="handleVerifyDonation"
          @reject="handleRejectDonation"
          @view-receipt="handleViewReceipt"
        />

        <!-- Item Categories View -->
        <DonationCategoriesView
          :categories="categories"
          :can-edit="canEdit"
          @add-category="handleAddCategory"
          @edit-category="handleEditCategory"
          @delete-category="handleDeleteCategory"
        />
      </div>
    </template>

    <!-- Rejection Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showRejectModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-black/50 backdrop-blur-sm"
            @click="closeRejectModal"
          ></div>

          <!-- Modal Content -->
          <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <X class="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Reject Donation</h3>
                <p class="text-sm text-slate-500">Provide a reason for rejection</p>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                Rejection Reason <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="rejectionReason"
                rows="3"
                class="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm"
                placeholder="Explain why this donation is being rejected..."
              ></textarea>
              <p v-if="rejectError" class="mt-1.5 text-xs text-red-600">{{ rejectError }}</p>
            </div>

            <div class="flex items-center justify-end gap-3">
              <button
                @click="closeRejectModal"
                :disabled="isRejecting"
                class="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                @click="confirmRejectDonation"
                :disabled="isRejecting || !rejectionReason.trim()"
                class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="isRejecting" class="w-4 h-4 animate-spin" />
                <span>{{ isRejecting ? 'Rejecting...' : 'Reject Donation' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Receipt Image Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showReceiptModal && receiptImageUrl"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-black/80 backdrop-blur-sm"
            @click="closeReceiptModal"
          ></div>

          <!-- Modal Content -->
          <div class="relative max-w-3xl max-h-[90vh] z-10">
            <button
              @click="closeReceiptModal"
              class="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
            >
              <X class="w-6 h-6" />
            </button>
            <img
              :src="receiptImageUrl"
              alt="Donation Receipt"
              class="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Heart, Loader2, AlertCircle, RefreshCw, X } from 'lucide-vue-next'
import DonationSummaryView from './donation/DonationSummaryView.vue'
import DonationListView from './donation/DonationListView.vue'
import DonationCategoriesView from './donation/DonationCategoriesView.vue'
import { donationService, apiClient } from '@/services/api'
import type { Event } from '@/services/api'
import type {
  EventDonation,
  DonationItemCategory,
  FundraisingProgress
} from '@/services/api/types/donation.types'

interface Props {
  eventId: string
  event: Event
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'enable-fundraising': []
}>()

// ============================================
// STATE
// ============================================

// Loading and error states
const isLoading = ref(false)
const error = ref<string | null>(null)

// Data
const donations = ref<EventDonation[]>([])
const categories = ref<DonationItemCategory[]>([])
const progress = ref<FundraisingProgress>({
  goal: null,
  currency: 'USD',
  total_raised: '0.00',
  total_donors: 0,
  percentage: 0,
  recent_donations: []
})

// Rejection modal state
const showRejectModal = ref(false)
const donationToReject = ref<EventDonation | null>(null)
const rejectionReason = ref('')
const isRejecting = ref(false)
const rejectError = ref<string | null>(null)

// Receipt modal state
const showReceiptModal = ref(false)
const receiptImageUrl = ref<string | null>(null)

// ============================================
// COMPUTED
// ============================================

// Check if fundraising is enabled
const isFundraisingEnabled = computed(() => {
  return props.event.is_fundraising === true
})

// Count donations by type and status
const cashDonationsCount = computed(() => {
  return donations.value.filter(d => d.donation_type === 'cash' && d.status === 'verified').length
})

const itemDonationsCount = computed(() => {
  return donations.value.filter(d => d.donation_type === 'item' && d.status === 'verified').length
})

const pendingDonationsCount = computed(() => {
  return donations.value.filter(d => d.status === 'pending').length
})

// ============================================
// DATA FETCHING
// ============================================

/**
 * Load all donation data from the API
 * Fetches donations, progress, and item categories in parallel
 */
async function loadData(): Promise<void> {
  if (!isFundraisingEnabled.value) return

  isLoading.value = true
  error.value = null

  try {
    // Fetch all data in parallel for better performance
    const [donationsResponse, progressResponse, categoriesResponse] = await Promise.all([
      donationService.getDonations(props.eventId, {
        ordering: '-created_at'
      }),
      donationService.getFundraisingProgress(props.eventId),
      donationService.getItemCategories(props.eventId, {
        ordering: 'display_order'
      })
    ])

    // Handle donations response
    if (donationsResponse.success && donationsResponse.data) {
      donations.value = donationsResponse.data.results
    } else {
      throw new Error(donationsResponse.message || 'Failed to load donations')
    }

    // Handle progress response
    if (progressResponse.success && progressResponse.data) {
      progress.value = progressResponse.data
    } else {
      // Progress endpoint might fail if no donations yet - use defaults
      console.warn('Could not load progress:', progressResponse.message)
    }

    // Handle categories response
    if (categoriesResponse.success && categoriesResponse.data) {
      categories.value = categoriesResponse.data.results
    } else {
      // Categories might be empty - this is OK
      console.warn('Could not load categories:', categoriesResponse.message)
    }
  } catch (err) {
    console.error('Error loading donation data:', err)
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

// ============================================
// DONATION VERIFICATION
// ============================================

/**
 * Verify a pending donation
 * Updates the donation status optimistically and syncs with API
 */
async function handleVerifyDonation(donation: EventDonation): Promise<void> {
  // Optimistic update
  const originalStatus = donation.status
  const donationIndex = donations.value.findIndex(d => d.id === donation.id)
  if (donationIndex !== -1) {
    donations.value[donationIndex] = {
      ...donations.value[donationIndex],
      status: 'verified'
    }
  }

  try {
    const response = await donationService.verifyDonation(props.eventId, donation.id)

    if (response.success && response.data) {
      // Update with the actual response data
      if (donationIndex !== -1) {
        donations.value[donationIndex] = response.data.donation
      }

      // Refresh progress to reflect the new verified donation
      await refreshProgress()
    } else {
      // Revert optimistic update on failure
      if (donationIndex !== -1) {
        donations.value[donationIndex] = {
          ...donations.value[donationIndex],
          status: originalStatus
        }
      }
      console.error('Failed to verify donation:', response.message)
    }
  } catch (err) {
    // Revert optimistic update on error
    if (donationIndex !== -1) {
      donations.value[donationIndex] = {
        ...donations.value[donationIndex],
        status: originalStatus
      }
    }
    console.error('Error verifying donation:', err)
  }
}

/**
 * Open the rejection modal for a donation
 */
function handleRejectDonation(donation: EventDonation): void {
  donationToReject.value = donation
  rejectionReason.value = ''
  rejectError.value = null
  showRejectModal.value = true
}

/**
 * Close the rejection modal
 */
function closeRejectModal(): void {
  if (isRejecting.value) return
  showRejectModal.value = false
  donationToReject.value = null
  rejectionReason.value = ''
  rejectError.value = null
}

/**
 * Confirm and process the donation rejection
 */
async function confirmRejectDonation(): Promise<void> {
  if (!donationToReject.value || !rejectionReason.value.trim()) {
    rejectError.value = 'Please provide a rejection reason'
    return
  }

  isRejecting.value = true
  rejectError.value = null

  const donation = donationToReject.value
  const donationIndex = donations.value.findIndex(d => d.id === donation.id)

  try {
    const response = await donationService.rejectDonation(
      props.eventId,
      donation.id,
      rejectionReason.value.trim()
    )

    if (response.success && response.data) {
      // Update the donation in the list
      if (donationIndex !== -1) {
        donations.value[donationIndex] = response.data.donation
      }

      // Reset state and close modal
      isRejecting.value = false
      showRejectModal.value = false
      donationToReject.value = null
      rejectionReason.value = ''
      rejectError.value = null
    } else {
      rejectError.value = response.message || 'Failed to reject donation'
    }
  } catch (err) {
    console.error('Error rejecting donation:', err)
    rejectError.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    isRejecting.value = false
  }
}

// ============================================
// RECEIPT VIEWING
// ============================================

/**
 * Open the receipt image modal
 */
function handleViewReceipt(donation: EventDonation): void {
  if (!donation.receipt_image) return

  // Build the full URL for the receipt image
  receiptImageUrl.value = apiClient.getProfilePictureUrl(donation.receipt_image)
  showReceiptModal.value = true
}

/**
 * Close the receipt modal
 */
function closeReceiptModal(): void {
  showReceiptModal.value = false
  receiptImageUrl.value = null
}

// ============================================
// CATEGORY MANAGEMENT (placeholder handlers)
// ============================================

function handleAddCategory(): void {
  console.log('Add category - to be implemented')
  // TODO: Implement category creation modal
}

function handleEditCategory(category: DonationItemCategory): void {
  console.log('Edit category:', category.id)
  // TODO: Implement category edit modal
}

function handleDeleteCategory(category: DonationItemCategory): void {
  console.log('Delete category:', category.id)
  // TODO: Implement category deletion confirmation
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Refresh only the fundraising progress data
 */
async function refreshProgress(): Promise<void> {
  try {
    const response = await donationService.getFundraisingProgress(props.eventId)
    if (response.success && response.data) {
      progress.value = response.data
    }
  } catch (err) {
    console.error('Error refreshing progress:', err)
  }
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  if (isFundraisingEnabled.value) {
    loadData()
  }
})

// Watch for changes to fundraising status
watch(
  () => props.event.is_fundraising,
  (newValue) => {
    if (newValue && donations.value.length === 0) {
      loadData()
    }
  }
)

// Watch for eventId changes (in case component is reused)
watch(
  () => props.eventId,
  () => {
    if (isFundraisingEnabled.value) {
      loadData()
    }
  }
)
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
