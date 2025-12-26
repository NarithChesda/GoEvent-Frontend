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

    <!-- Main Content (when fundraising is enabled) -->
    <template v-else>
      <!-- Unified Content Area -->
      <div class="space-y-6">
        <!-- Summary View -->
        <DonationSummaryView
          :progress="mockProgress"
          :cash-donations-count="mockCashDonationsCount"
          :item-donations-count="mockItemDonationsCount"
          :pending-donations-count="mockPendingDonationsCount"
        />

        <!-- Donations List View -->
        <DonationListView
          :donations="mockDonations"
          :can-edit="canEdit"
          @verify="handleVerifyDonation"
          @reject="handleRejectDonation"
          @view-receipt="handleViewReceipt"
        />

        <!-- Item Categories View -->
        <DonationCategoriesView
          :categories="mockCategories"
          :can-edit="canEdit"
          @add-category="handleAddCategory"
          @edit-category="handleEditCategory"
          @delete-category="handleDeleteCategory"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Heart } from 'lucide-vue-next'
import DonationSummaryView from './donation/DonationSummaryView.vue'
import DonationListView from './donation/DonationListView.vue'
import DonationCategoriesView from './donation/DonationCategoriesView.vue'
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

// Check if fundraising is enabled
const isFundraisingEnabled = computed(() => {
  return props.event.is_fundraising === true
})

// ============================================
// MOCK DATA - Replace with API calls later
// ============================================

const mockProgress: FundraisingProgress = {
  goal: '50000.00',
  currency: 'USD',
  total_raised: '12500.00',
  total_donors: 45,
  percentage: 25,
  recent_donations: [
    {
      id: 1,
      display_name: 'John Smith',
      donation_type: 'cash',
      amount: '500.00',
      currency: 'USD',
      item_category: null,
      item_category_info: null,
      item_name: '',
      item_quantity: null,
      item_unit: '',
      estimated_value: null,
      message: 'Happy to support this cause!',
      is_anonymous: false,
      donation_display: '$500.00 USD',
      verified_at: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 2,
      display_name: 'Local Grocery Store',
      donation_type: 'item',
      amount: null,
      currency: 'USD',
      item_category: 1,
      item_category_info: { id: 1, name: 'Instant Noodles', unit: 'pack' },
      item_name: 'Mama Shrimp Flavor',
      item_quantity: 50,
      item_unit: '',
      estimated_value: '25.00',
      message: 'Hope this helps the families!',
      is_anonymous: false,
      donation_display: 'Instant Noodles: 50 pack',
      verified_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 90000000).toISOString()
    },
    {
      id: 3,
      display_name: 'Anonymous',
      donation_type: 'cash',
      amount: '1000.00',
      currency: 'USD',
      item_category: null,
      item_category_info: null,
      item_name: '',
      item_quantity: null,
      item_unit: '',
      estimated_value: null,
      message: '',
      is_anonymous: true,
      donation_display: '$1,000.00 USD',
      verified_at: new Date(Date.now() - 172800000).toISOString(),
      created_at: new Date(Date.now() - 180000000).toISOString()
    }
  ]
}

const mockCashDonationsCount = 32
const mockItemDonationsCount = 13
const mockPendingDonationsCount = 5

const mockDonations: EventDonation[] = [
  {
    id: 1,
    event: props.eventId,
    user: 42,
    user_info: {
      id: 42,
      email: 'john@example.com',
      username: 'john_donor',
      first_name: 'John',
      last_name: 'Smith'
    },
    donor_name: 'John Smith',
    donor_email: 'john@example.com',
    donor_phone: '+1234567890',
    donation_type: 'cash',
    amount: '500.00',
    currency: 'USD',
    item_category: null,
    item_category_info: null,
    item_name: '',
    item_description: '',
    item_quantity: null,
    item_unit: '',
    estimated_value: null,
    message: 'Happy to support this cause!',
    receipt_image: '/media/donation_receipts/receipt_001.webp',
    is_anonymous: false,
    status: 'verified',
    verified_by: 1,
    verified_at: new Date(Date.now() - 3600000).toISOString(),
    rejection_reason: '',
    display_name: 'John Smith',
    donation_display: '$500.00 USD',
    can_be_edited: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    event: props.eventId,
    user: 43,
    user_info: {
      id: 43,
      email: 'jane@example.com',
      username: 'jane_doe'
    },
    donor_name: 'Jane Doe',
    donor_email: 'jane@example.com',
    donation_type: 'cash',
    amount: '250.00',
    currency: 'USD',
    item_category: null,
    item_category_info: null,
    is_anonymous: false,
    status: 'pending',
    display_name: 'Jane Doe',
    donation_display: '$250.00 USD',
    can_be_edited: true,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 3,
    event: props.eventId,
    donor_name: 'Local Grocery Store',
    donor_email: 'store@example.com',
    donation_type: 'item',
    amount: null,
    currency: 'USD',
    item_category: 1,
    item_category_info: { id: 1, name: 'Instant Noodles', unit: 'pack' },
    item_name: 'Mama Shrimp Flavor',
    item_description: 'Popular Thai instant noodles',
    item_quantity: 50,
    item_unit: '',
    estimated_value: '25.00',
    message: 'Hope this helps!',
    receipt_image: '/media/donation_receipts/noodles_photo.webp',
    is_anonymous: false,
    status: 'verified',
    verified_by: 1,
    verified_at: new Date(Date.now() - 86400000).toISOString(),
    display_name: 'Local Grocery Store',
    donation_display: 'Instant Noodles: 50 pack',
    can_be_edited: false,
    created_at: new Date(Date.now() - 90000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 4,
    event: props.eventId,
    donor_name: 'Water Company Inc',
    donor_email: 'water@example.com',
    donation_type: 'item',
    amount: null,
    currency: 'USD',
    item_category: 2,
    item_category_info: { id: 2, name: 'Bottled Water', unit: 'case' },
    item_name: 'Spring Water',
    item_description: '24-bottle cases of drinking water',
    item_quantity: 30,
    item_unit: '',
    estimated_value: '150.00',
    message: 'Stay hydrated!',
    is_anonymous: false,
    status: 'pending',
    display_name: 'Water Company Inc',
    donation_display: 'Bottled Water: 30 case',
    can_be_edited: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 5,
    event: props.eventId,
    donor_name: 'Anonymous Donor',
    donor_email: 'anon@example.com',
    donation_type: 'cash',
    amount: '100.00',
    currency: 'USD',
    item_category: null,
    item_category_info: null,
    is_anonymous: true,
    status: 'rejected',
    rejection_reason: 'Receipt image is unclear. Please upload a clearer image.',
    display_name: 'Anonymous',
    donation_display: '$100.00 USD',
    can_be_edited: false,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
]

const mockCategories: DonationItemCategory[] = [
  {
    id: 1,
    event: props.eventId,
    name: 'Instant Noodles',
    unit: 'pack',
    target_quantity: 500,
    description: 'Any brand of instant noodles',
    display_order: 0,
    is_active: true,
    total_quantity: 245,
    donation_count: 12,
    progress_percentage: 49.0,
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 2,
    event: props.eventId,
    name: 'Bottled Water',
    unit: 'case',
    target_quantity: 100,
    description: '24-bottle cases of drinking water',
    display_order: 1,
    is_active: true,
    total_quantity: 85,
    donation_count: 8,
    progress_percentage: 85.0,
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 3,
    event: props.eventId,
    name: 'Canned Food',
    unit: 'can',
    target_quantity: 200,
    description: 'Canned fish, meat, or vegetables',
    display_order: 2,
    is_active: true,
    total_quantity: 45,
    donation_count: 5,
    progress_percentage: 22.5,
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString()
  }
]

// ============================================
// EVENT HANDLERS (placeholder for future API)
// ============================================

const handleVerifyDonation = (donation: EventDonation) => {
  console.log('Verify donation:', donation.id)
  // TODO: Call API to verify donation
}

const handleRejectDonation = (donation: EventDonation) => {
  console.log('Reject donation:', donation.id)
  // TODO: Show rejection modal and call API
}

const handleViewReceipt = (donation: EventDonation) => {
  console.log('View receipt:', donation.receipt_image)
  // TODO: Open image modal
}

const handleAddCategory = () => {
  console.log('Add category')
  // TODO: Show add category modal
}

const handleEditCategory = (category: DonationItemCategory) => {
  console.log('Edit category:', category.id)
  // TODO: Show edit category modal
}

const handleDeleteCategory = (category: DonationItemCategory) => {
  console.log('Delete category:', category.id)
  // TODO: Show delete confirmation modal
}
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
