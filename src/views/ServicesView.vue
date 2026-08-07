<template>
  <MainLayout>
    <!-- min-height offsets MainLayout's pb-20 (mobile tab bar) / lg:pt-16 (desktop nav)
         so the sticky footer lands at the viewport bottom without a phantom scrollbar -->
    <div class="flex flex-col min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-4rem)] bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">
      <!-- Mobile Top Bar -->
      <MobileTopBar />

      <!-- Main Content -->
      <section class="flex-1 py-4 sm:py-6 lg:py-[clamp(1.25rem,3vh,2rem)]">
        <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header -->
          <div
            class="flex items-center justify-between gap-2 mb-6 sm:mb-8 lg:mb-[clamp(1.25rem,3.5vh,2.5rem)]"
          >
            <h1
              class="flex-1 min-w-0 truncate text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900"
            >
              {{ t('services.title') }}
            </h1>

            <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <!-- Category Filter: desktop dropdown / mobile chip + bottom sheet -->
              <ServicesCategoryFilter
                v-model="selectedCategory"
                :categories="serviceCategories"
              />
            </div>
          </div>

          <!-- Featured Vendors Section -->
          <FeaturedVendors
            v-if="!isLoadingDisplayedVendors && displayedVendors.length > 0 || showAllVendors"
            :vendors="displayedVendors"
            :show-all="showAllVendors"
            :loading="isLoadingDisplayedVendors"
            :has-more="hasMoreVendors"
            @vendor-click="openVendorProfile"
            @toggle-view="handleToggleVendorView"
            @load-more="handleLoadMoreVendors"
          />

          <!-- Loading State for Listings -->
          <ServicesLoadingSkeleton
            v-if="isLoadingListings && filteredListings.length === 0"
          />

          <!-- Error State -->
          <ServicesEmptyState
            v-else-if="listingsError && filteredListings.length === 0"
            variant="error"
            :title="t('services.errorState.title')"
            :description="t('services.errorState.description')"
            :action-label="t('services.errorState.retry')"
            :show-action="true"
            @action="retryListings"
          />

          <!-- Empty State -->
          <ServicesEmptyState
            v-else-if="filteredListings.length === 0"
            :title="t('services.emptyState.title')"
            :description="t('services.emptyState.description')"
          />

          <!-- Service Listings Grid -->
          <ServiceListingsGrid
            v-else
            :listings="filteredListings"
            :categories="serviceCategories"
            :selected-category="selectedCategory"
            :sort-by="sortBy"
            :sort-options="sortOptions"
            :has-more="hasMore"
            @listing-click="openListingDetail"
            @load-more="loadMore"
            @category-change="selectedCategory = $event"
            @sort-change="sortBy = $event"
          />

          <!-- Loading More State -->
          <div v-if="isLoadingListings && filteredListings.length > 0" class="py-6">
            <div class="flex justify-center">
              <div class="w-8 h-8 border-2 border-[#2ecc71] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

        </div>
      </section>

      <!-- Footer -->
      <AppFooter />

      <!-- Create Listing FAB - Only visible for verified vendors -->
      <button
        v-if="isVerifiedVendor"
        @click="handleListService"
        class="fixed bottom-20 lg:bottom-4 right-4 lg:right-6 w-14 h-14 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 hover:scale-110 flex items-center justify-center z-[60] group"
        :aria-label="t('services.listYourService')"
      >
        <Plus class="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        <div
          class="absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
        >
          {{ t('services.listYourService') }}
        </div>
      </button>

      <!-- Listing Form Drawer (Create/Edit) -->
      <ListingFormDrawer
        v-model="showListingFormDrawer"
        :listing="editingListing"
        :listing-id="editingListing?.id"
        @created="handleListingCreated"
        @updated="handleListingUpdated"
        @deleted="handleListingDeleted"
      />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import MainLayout from '@/components/MainLayout.vue'
import AppFooter from '@/components/AppFooter.vue'
import { MobileTopBar } from '@/components/events'
import {
  FeaturedVendors,
  ServiceListingsGrid,
  ListingFormDrawer,
  ServicesCategoryFilter,
  ServicesLoadingSkeleton,
  ServicesEmptyState,
  type Vendor,
  type Listing
} from '@/components/services'
import { useServices } from '@/composables/useServices'
import { useVendorProfile } from '@/composables/settings'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()
const router = useRouter()

// Use the services composable
const {
  // State
  featuredVendors,
  allVendors,
  selectedCategory,
  sortBy,
  isLoadingListings,
  listingsError,
  isLoadingVendors,
  isLoadingAllVendors,
  hasMore,
  hasMoreVendors,

  // Methods
  fetchCategories,
  fetchListings,
  fetchFeaturedVendors,
  fetchAllVendors,
  loadMoreVendors,
  loadMore: composableLoadMore,

  // Computed
  filteredListings,
  serviceCategoriesForUI,
} = useServices()

// Vendor profile for checking verification status
const { vendorState, loadProfile: loadVendorProfile } = useVendorProfile()
const isVerifiedVendor = computed(() => vendorState.value === 'verified')

// UI State
const showListingFormDrawer = ref(false)
const editingListing = ref<Listing | null>(null)
const showAllVendors = ref(false)

// Message state
const { showToast } = useToast()

// Service categories from composable
const serviceCategories = computed(() => serviceCategoriesForUI.value)

// Vendors to display (featured or all based on toggle)
const displayedVendors = computed(() =>
  showAllVendors.value ? allVendors.value : featuredVendors.value
)
const isLoadingDisplayedVendors = computed(() =>
  showAllVendors.value ? isLoadingAllVendors.value : isLoadingVendors.value
)

// Sort options
const sortOptions = computed(() => [
  { value: 'featured', label: t('services.sort.featured') },
  { value: '-created_at', label: t('services.sort.newest') },
  { value: 'price_min', label: t('services.sort.priceLow') },
  { value: '-price_min', label: t('services.sort.priceHigh') },
  { value: 'title', label: t('services.sort.alphabetical') },
])

// Retry listings after a load failure
const retryListings = async () => {
  await fetchListings()
}

// Initialize data on mount
onMounted(async () => {
  // Fetch initial data
  await Promise.all([
    fetchCategories(),
    fetchFeaturedVendors(),
    fetchListings(),
    loadVendorProfile(), // Load vendor profile to check verification status
  ])
})

// Watch for category and sort changes to refetch listings
watch([selectedCategory, sortBy], async () => {
  await fetchListings()
})

// Methods
const showMessage = (type: 'success' | 'info', text: string) => {
  showToast(type, text)
}

const openListingDetail = (listing: Listing) => {
  router.push({ name: 'service-detail', params: { id: listing.id } })
}

const openVendorProfile = (vendor: Vendor) => {
  router.push({ name: 'vendor-detail', params: { id: vendor.id } })
}

const handleListService = () => {
  editingListing.value = null
  showListingFormDrawer.value = true
}

const handleListingCreated = (listing: Listing) => {
  showMessage('success', t('services.messages.listingCreated', { title: listing.title }))
  // Refresh listings
  fetchListings()
}

const handleListingUpdated = (listing: Listing) => {
  showMessage('success', t('services.messages.listingUpdated', { title: listing.title }))
  // Refresh listings
  fetchListings()
}

const handleListingDeleted = () => {
  showMessage('info', t('services.messages.listingDeleted'))
  // Refresh listings
  fetchListings()
}

// Toggle between featured and all vendors
const handleToggleVendorView = async () => {
  // Prevent rapid toggling during fetch
  if (isLoadingAllVendors.value) return

  const willShowAll = !showAllVendors.value
  if (willShowAll && allVendors.value.length === 0) {
    // Fetch data first, then toggle view
    await fetchAllVendors()
  }
  showAllVendors.value = willShowAll
}

// Load more vendors when showing all
const handleLoadMoreVendors = async () => {
  await loadMoreVendors()
}

const loadMore = async () => {
  await composableLoadMore()
}
</script>

