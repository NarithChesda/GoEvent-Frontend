<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">
      <!-- Mobile Top Bar -->
      <MobileTopBar />

      <!-- Main Content -->
      <section class="py-4 sm:py-6 lg:py-8">
        <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              Services
            </h1>

            <!-- Category Filter Dropdown - Desktop only -->
            <div class="relative category-filter-container hidden sm:block">
              <button
                @click.stop="showCategoryMenu = !showCategoryMenu"
                class="glass-button flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
                :class="selectedCategory !== 'all'
                  ? 'bg-gradient-to-r from-[#2ecc71]/15 to-[#1e90ff]/15 text-slate-800 border-[#2ecc71]/30'
                  : 'text-slate-700'"
              >
                <span>{{ selectedCategoryName }}</span>
                <ChevronDown
                  class="w-4 h-4 transition-transform duration-200"
                  :class="showCategoryMenu ? 'rotate-180' : ''"
                />
              </button>

              <!-- Dropdown Menu -->
              <Transition name="dropdown">
                <div
                  v-if="showCategoryMenu"
                  class="glass-dropdown absolute right-0 top-full mt-2 rounded-xl overflow-hidden overflow-y-auto min-w-[180px] max-h-[60vh] z-[100]"
                >
                  <button
                    v-for="category in serviceCategories"
                    :key="category.id"
                    @click="selectCategory(category.id)"
                    class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
                    :class="selectedCategory === category.id
                      ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5'
                      : 'text-slate-700'"
                  >
                    {{ category.name }}
                  </button>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Mobile Category Toggle -->
          <ServicesCategoryToggle
            v-model="selectedCategory"
            :categories="serviceCategories"
          />

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
          <div v-if="isLoadingListings && filteredListings.length === 0" class="py-12">
            <div class="flex flex-col items-center justify-center gap-4">
              <div class="w-12 h-12 border-4 border-[#2ecc71] border-t-transparent rounded-full animate-spin"></div>
              <p class="text-slate-600">Loading services...</p>
            </div>
          </div>

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
              <div class="w-8 h-8 border-4 border-[#2ecc71] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!isLoadingListings && filteredListings.length === 0" class="py-12 text-center">
            <p class="text-slate-600 text-lg">No services found.</p>
            <p class="text-slate-500 text-sm mt-2">Try adjusting your filters or check back later.</p>
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
        aria-label="List Your Service"
      >
        <Plus class="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        <div
          class="absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
        >
          List Your Service
        </div>
      </button>

      <!-- Listing Detail Drawer -->
      <ListingDetailDrawer
        v-model="showListingDrawer"
        :listing="selectedListing"
        @contact="handleContactVendor"
      />

      <!-- Vendor Profile Drawer -->
      <VendorProfileDrawer
        v-model="showVendorDrawer"
        :vendor="selectedVendor"
        :listings="vendorListings"
        @listing-click="handleVendorListingClick"
      />

      <!-- Success/Info Messages -->
      <Transition name="slide-up">
        <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-6 z-50">
          <div
            :class="message.type === 'success' ? 'bg-green-500' : 'bg-blue-500'"
            class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
          >
            <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
            <Info v-else class="w-5 h-5 mr-2" />
            {{ message.text }}
          </div>
        </div>
      </Transition>

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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Plus, CheckCircle, Info, ChevronDown } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import AppFooter from '@/components/AppFooter.vue'
import { MobileTopBar } from '@/components/events'
import {
  FeaturedVendors,
  ServiceListingsGrid,
  ListingDetailDrawer,
  VendorProfileDrawer,
  ListingFormDrawer,
  ServicesCategoryToggle,
  type Vendor,
  type Listing
} from '@/components/services'
import { useServices } from '@/composables/useServices'
import { useVendorProfile } from '@/composables/settings'

// Use the services composable
const {
  // State
  featuredVendors,
  allVendors,
  selectedListing: composableSelectedListing,
  selectedVendor: composableSelectedVendor,
  vendorListings: composableVendorListings,
  selectedCategory,
  sortBy,
  isLoadingListings,
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
  fetchListingDetail,
  fetchVendorDetail,
  fetchVendorListings,
  loadMore: composableLoadMore,
  trackView,
  trackContact,

  // Computed
  filteredListings,
  serviceCategoriesForUI,
} = useServices()

// Vendor profile for checking verification status
const { vendorState, loadProfile: loadVendorProfile } = useVendorProfile()
const isVerifiedVendor = computed(() => vendorState.value === 'verified')

// UI State
const showListingDrawer = ref(false)
const showVendorDrawer = ref(false)
const showListingFormDrawer = ref(false)
const editingListing = ref<Listing | null>(null)
const showCategoryMenu = ref(false)
const showAllVendors = ref(false)

// Message state
const message = ref<{ type: 'success' | 'info'; text: string } | null>(null)

// Use composable state directly for drawers
const selectedListing = computed(() => composableSelectedListing.value)
const selectedVendor = computed(() => composableSelectedVendor.value)
const vendorListings = computed(() => composableVendorListings.value)

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
const sortOptions = [
  { value: 'featured', label: 'Featured First' },
  { value: '-created_at', label: 'Newest First' },
  { value: 'price_min', label: 'Price: Low to High' },
  { value: '-price_min', label: 'Price: High to Low' },
  { value: 'title', label: 'A to Z' },
]

// Computed for category name display
const selectedCategoryName = computed(() => {
  const cat = serviceCategories.value.find(c => c.id === selectedCategory.value)
  return cat?.id === 'all' ? 'All Categories' : cat?.name || 'All Categories'
})

// Category selection method
const selectCategory = (id: string) => {
  selectedCategory.value = id
  showCategoryMenu.value = false
}

// Handle click outside to close category menu
const handleCategoryClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showCategoryMenu.value && !target.closest('.category-filter-container')) {
    showCategoryMenu.value = false
  }
}

// Initialize data on mount
onMounted(async () => {
  document.addEventListener('click', handleCategoryClickOutside)

  // Fetch initial data
  await Promise.all([
    fetchCategories(),
    fetchFeaturedVendors(),
    fetchListings(),
    loadVendorProfile(), // Load vendor profile to check verification status
  ])
})

onUnmounted(() => {
  document.removeEventListener('click', handleCategoryClickOutside)
})

// Watch for category and sort changes to refetch listings
watch([selectedCategory, sortBy], async () => {
  await fetchListings()
})

// Methods
const showMessage = (type: 'success' | 'info', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const openListingDetail = async (listing: Listing) => {
  // Fetch full listing details
  await fetchListingDetail(listing.id)
  showListingDrawer.value = true

  // Track view
  await trackView(listing.id, 'browse')
}

const openVendorProfile = async (vendor: Vendor) => {
  // Fetch full vendor details and listings
  await Promise.all([
    fetchVendorDetail(vendor.id),
    fetchVendorListings(vendor.id),
  ])
  showVendorDrawer.value = true
}

const handleVendorListingClick = async (listing: Listing) => {
  showVendorDrawer.value = false
  await openListingDetail(listing)
}

const handleListService = () => {
  editingListing.value = null
  showListingFormDrawer.value = true
}

const handleListingCreated = (listing: Listing) => {
  showMessage('success', `Listing "${listing.title}" created successfully!`)
  // Refresh listings
  fetchListings()
}

const handleListingUpdated = (listing: Listing) => {
  showMessage('success', `Listing "${listing.title}" updated successfully!`)
  // Refresh listings
  fetchListings()
}

const handleListingDeleted = () => {
  showMessage('info', `Listing deleted successfully`)
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

const handleContactVendor = async (type: string) => {
  if (selectedListing.value) {
    // Track contact click
    await trackContact(selectedListing.value.id, type)
  }
  showMessage('success', `Contact via ${type} initiated!`)
}

const loadMore = async () => {
  await composableLoadMore()
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Glass effect styles */
.glass-button {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.75);
}

.glass-dropdown {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.1),
    0 4px 12px rgba(30, 144, 255, 0.08);
}
</style>
