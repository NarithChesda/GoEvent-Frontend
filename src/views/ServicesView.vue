<template>
  <MainLayout>
    <!-- min-height offsets MainLayout's bottom pad (--nav-inset, the floating
         tab bar) / lg:pt-16 (desktop nav) so the sticky footer lands at the
         viewport bottom without a phantom scrollbar -->
    <div
      class="flex flex-col min-h-[calc(100vh_-_var(--nav-inset))] lg:min-h-[calc(100vh-4rem)]"
    >
      <!-- Mobile Top Bar -->
      <MobileTopBar />

      <!--
        The page carries no title row *in the page* — the featured-vendor hero is
        its header, and a "Services" heading above it only pushed the thing the
        visitor came to look at further down. So this isn't PageHeaderRow; it is
        the half of it that earns its place, assembled straight into the mobile
        bar: the page's mark and name, the global actions, and the list's own
        controls once they are handed up. Same contents in the same order as the
        Events and Discover bars, so the three tabs' bars read as one bar whose
        title changes.
      -->
      <Teleport defer to="#mobile-page-header">
        <div class="lg:hidden flex w-full items-center justify-between gap-3">
          <!-- The bar's heading, and below `lg` the page's only one — the
               in-page copy goes screen-reader-only there so the document keeps
               exactly one `h1`. The mark is the page's own tab icon, decorative
               beside a title that already says "Services" (hence
               `aria-hidden`), and colourless so it inherits the heading's tone
               and reads as part of it. -->
          <h1
            class="flex-1 min-w-0 flex items-center gap-2 text-base font-semibold text-slate-900"
          >
            <Sparkles class="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span class="truncate">{{ t('services.title') }}</span>
          </h1>

          <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <!-- The list's own controls, once its heading has scrolled under
                 this bar. The mobile bar is what absorbs them below the nav
                 breakpoint (the desktop nav takes them above it — see
                 ServiceListControls), and they land here rather than in a second
                 teleport of their own so that they sit *before* the global
                 actions, the same order the events tab's bar puts them in. -->
            <Transition name="absorb">
              <ServiceListFilters
                v-if="controlsPinned && !isDesktopNav"
                :categories="serviceCategories"
                :selected-category="selectedCategory"
                :sort-by="sortBy"
                :sort-options="sortOptions"
                @category-change="selectedCategory = $event"
                @sort-change="sortBy = $event"
              />
            </Transition>

            <MobileHeaderActions />
          </div>
        </div>
      </Teleport>

      <!-- Main Content -->
      <section class="flex-1 pt-3 pb-4 sm:pt-4 sm:pb-6 lg:pt-6 lg:pb-[clamp(1.25rem,3vh,2rem)]">
        <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Desktop's heading: the hero says it visually, so this only has to
               say it to a screen reader. Below `lg` the mobile bar carries a
               real one, and this one is dropped outright rather than doubling
               it — `hidden` wins over `sr-only`, which sets no display of its
               own. -->
          <h1 class="hidden lg:block sr-only">{{ t('services.title') }}</h1>

          <!-- Featured vendor hero — the page's header section -->
          <div v-if="isLoadingVendors || featuredVendors.length > 0" class="mb-6 sm:mb-8">
            <div
              v-if="isLoadingVendors && featuredVendors.length === 0"
              class="h-52 sm:h-60 lg:h-64 rounded-3xl bg-slate-200 animate-pulse"
            ></div>
            <VendorSpotlight v-else :vendors="featuredVendors" @vendor-click="openVendorProfile" />
          </div>

          <!-- Heading + category/sort controls. Outside the state branches below
               on purpose: filtering into a category with no listings must still
               leave the filter on screen to get back out of. -->
          <ServiceListControls
            :count="listingsCount"
            :categories="serviceCategories"
            :selected-category="selectedCategory"
            :sort-by="sortBy"
            :sort-options="sortOptions"
            @category-change="selectedCategory = $event"
            @sort-change="sortBy = $event"
          />

          <!-- Loading State for Listings -->
          <ServicesLoadingSkeleton v-if="isLoadingListings && filteredListings.length === 0" />

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
            :has-more="hasMore"
            @listing-click="openListingDetail"
            @load-more="loadMore"
          />

          <!-- Loading More State -->
          <div v-if="isLoadingListings && filteredListings.length > 0" class="py-6">
            <div class="flex justify-center">
              <div
                class="w-8 h-8 border-2 border-[#2ecc71] border-t-transparent rounded-full animate-spin"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <AppFooter />

      <!-- Create Listing FAB - Only visible for verified vendors. Sized and
           anchored as the primary floating action; see EventsView's. -->
      <button
        v-if="isVerifiedVendor"
        @click="handleListService"
        class="fixed bottom-[var(--fab-bottom)] right-4 lg:right-6 w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center z-[60] group"
        :aria-label="t('services.listYourService')"
      >
        <Plus class="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        <div
          class="hidden lg:block absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
        >
          {{ t('services.listYourService') }}
        </div>
      </button>

      <!-- Listing Form Drawer (Create/Edit) -->
      <ListingFormDrawer
        v-model="showListingFormDrawer"
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
import { Plus, Sparkles } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import MainLayout from '@/components/MainLayout.vue'
import AppFooter from '@/components/AppFooter.vue'
import { MobileTopBar, MobileHeaderActions } from '@/components/events'
import {
  VendorSpotlight,
  ServiceListControls,
  ServiceListFilters,
  ServiceListingsGrid,
  ListingFormDrawer,
  ServicesLoadingSkeleton,
  ServicesEmptyState,
  type Vendor,
  type Listing,
} from '@/components/services'
import { useServices } from '@/composables/useServices'
import { useNavPageControls } from '@/composables/useNavPageControls'
import { useVendorProfile } from '@/composables/settings'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()
const router = useRouter()

// Use the services composable
const {
  // State
  featuredVendors,
  selectedCategory,
  sortBy,
  isLoadingListings,
  listingsError,
  isLoadingVendors,
  hasMore,

  // Methods
  fetchCategories,
  fetchListings,
  fetchFeaturedVendors,
  loadMore: composableLoadMore,

  // Computed
  filteredListings,
  serviceCategoriesForUI,
} = useServices()

// Whether the list heading has scrolled under the top bar. ServiceListControls
// owns the sentinel that decides it; the view reads it because the mobile bar's
// contents are the view's to lay out.
const { pinned: controlsPinned, isDesktopNav } = useNavPageControls()

// Vendor profile for checking verification status
const { vendorState, loadProfile: loadVendorProfile } = useVendorProfile()
const isVerifiedVendor = computed(() => vendorState.value === 'verified')

// UI State
const showListingFormDrawer = ref(false)
const editingListing = ref<Listing | null>(null)

// Message state
const { showToast } = useToast()

// Service categories from composable
const serviceCategories = computed(() => serviceCategoriesForUI.value)

// Null while the first page is still loading, so the heading doesn't flash "(0)"
const listingsCount = computed(() =>
  isLoadingListings.value && filteredListings.value.length === 0
    ? null
    : filteredListings.value.length,
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

const loadMore = async () => {
  await composableLoadMore()
}
</script>
