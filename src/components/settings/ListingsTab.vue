<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading && listings.length === 0" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load listings</h3>
      <p class="text-gray-500 mb-4">{{ error }}</p>
      <button
        @click="loadListings"
        class="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Not Verified State -->
    <div v-else-if="!isVerifiedVendor">
      <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldAlert class="w-7 h-7 text-amber-600" />
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Verification Required</h2>
            <p class="text-gray-600">
              You need to be a verified vendor to create and manage service listings.
              Please complete your vendor profile and wait for verification.
            </p>
            <div class="flex items-center gap-2 text-sm mt-3">
              <span class="text-gray-500">Current status:</span>
              <span
                :class="[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  vendorState === 'pending' ? 'bg-amber-100 text-amber-700' :
                  vendorState === 'unverified' ? 'bg-slate-100 text-slate-600' :
                  'bg-red-100 text-red-700'
                ]"
              >
                {{ vendorState === 'pending' ? 'Pending Review' : vendorState === 'not_vendor' ? 'Not a Vendor' : 'Unverified' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Listings Content -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-gray-900">My Listings</h2>
          <p class="text-sm text-gray-500 mt-1">
            Manage your service listings and track their performance
          </p>
        </div>
        <button
          @click="openCreateDrawer"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow"
        >
          <Plus class="w-5 h-5" />
          <span>New Listing</span>
        </button>
      </div>

      <!-- Quick Stats (inline) -->
      <div v-if="listings.length > 0" class="flex items-center gap-6 text-sm">
        <span class="text-gray-500">
          <span class="font-medium text-emerald-600">{{ activeCount }}</span> active
        </span>
        <span class="text-gray-500">
          <span class="font-medium text-amber-600">{{ pendingCount }}</span> pending
        </span>
        <span class="text-gray-500">
          <span class="font-medium text-gray-600">{{ draftCount }}</span> draft
        </span>
      </div>

      <!-- Empty State -->
      <div v-if="listings.length === 0 && !isLoading" class="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-xl p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package class="w-7 h-7 text-sky-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
            <p class="text-gray-600">
              Create your first service listing to start reaching potential clients.
            </p>
          </div>
        </div>
        <div class="mt-8">
          <button
            @click="openCreateDrawer"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow"
          >
            <Plus class="w-5 h-5" />
            <span>Create Your First Listing</span>
          </button>
        </div>
      </div>

      <!-- Listings List -->
      <div v-else class="space-y-4">
        <div
          v-for="listing in listings"
          :key="listing.id"
          class="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
        >
          <!-- Mobile Layout -->
          <div class="sm:hidden p-4">
            <div class="flex gap-3">
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <!-- Status Badge -->
                <div class="flex items-center gap-2 mb-2">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      getStatusClass(listing.status)
                    ]"
                  >
                    {{ getStatusLabel(listing.status) }}
                  </span>
                  <span
                    v-if="listing.is_featured"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                  >
                    Featured
                  </span>
                </div>

                <!-- Title -->
                <h3 class="text-base font-medium text-gray-900 mb-1 line-clamp-2">
                  {{ listing.title }}
                </h3>

                <!-- Price -->
                <p class="text-sm font-medium text-sky-600 mb-1">
                  {{ listing.price_display_text || 'Contact for price' }}
                </p>

                <!-- Category -->
                <div class="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                  <Tag class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span class="truncate">{{ getCategoryName(listing) }}</span>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-3 text-xs text-gray-400">
                  <span class="flex items-center gap-1">
                    <Eye class="w-3.5 h-3.5" />
                    {{ listing.views_count || 0 }}
                  </span>
                  <span class="flex items-center gap-1">
                    <MousePointerClick class="w-3.5 h-3.5" />
                    {{ listing.contact_clicks_count || 0 }}
                  </span>
                </div>
              </div>

              <!-- Cover Image -->
              <div class="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <img
                  v-if="listing.cover_image_url"
                  :src="getImageUrl(listing.cover_image_url)"
                  :alt="listing.title"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                >
                  <ImageIcon class="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>

            <!-- Mobile Actions -->
            <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                @click="editListing(listing)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Pencil class="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                v-if="listing.status === 'draft'"
                @click="submitForReview(listing)"
                :disabled="isSubmitting === listing.id"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sky-700 border border-sky-300 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send class="w-3.5 h-3.5" />
                {{ isSubmitting === listing.id ? '...' : 'Submit' }}
              </button>
            </div>
          </div>

          <!-- Desktop Layout -->
          <div class="hidden sm:block p-5">
            <div class="flex gap-5">
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <!-- Status and Category -->
                <div class="flex items-center gap-2 mb-2">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      getStatusClass(listing.status)
                    ]"
                  >
                    {{ getStatusLabel(listing.status) }}
                  </span>
                  <span
                    v-if="listing.is_featured"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                  >
                    Featured
                  </span>
                  <span class="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {{ getCategoryName(listing) }}
                  </span>
                </div>

                <!-- Title -->
                <h3 class="text-lg font-medium text-gray-900 mb-1">
                  {{ listing.title }}
                </h3>

                <!-- Description -->
                <p class="text-sm text-gray-500 mb-2 line-clamp-1">
                  {{ listing.short_tagline || listing.description }}
                </p>

                <!-- Price -->
                <p class="text-sm font-medium text-sky-600 mb-3">
                  {{ listing.price_display_text || 'Contact for price' }}
                </p>

                <!-- Stats -->
                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <span class="flex items-center gap-1.5">
                    <Eye class="w-4 h-4" />
                    {{ listing.views_count || 0 }} views
                  </span>
                  <span class="flex items-center gap-1.5">
                    <MousePointerClick class="w-4 h-4" />
                    {{ listing.contact_clicks_count || 0 }} clicks
                  </span>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    @click="editListing(listing)"
                    class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Pencil class="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    v-if="listing.status === 'draft'"
                    @click="submitForReview(listing)"
                    :disabled="isSubmitting === listing.id"
                    class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-sky-700 border border-sky-300 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send class="w-4 h-4" />
                    {{ isSubmitting === listing.id ? 'Submitting...' : 'Submit for Review' }}
                  </button>
                  <button
                    @click="viewAnalytics(listing)"
                    class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <BarChart3 class="w-4 h-4" />
                    Analytics
                  </button>
                </div>
              </div>

              <!-- Cover Image -->
              <div class="w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <img
                  v-if="listing.cover_image_url"
                  :src="getImageUrl(listing.cover_image_url)"
                  :alt="listing.title"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                >
                  <ImageIcon class="w-8 h-8 text-gray-400" />
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

    <!-- Listing Form Drawer -->
    <ListingFormDrawer
      v-model="showFormDrawer"
      :listing-id="editingListingId"
      @created="handleListingCreated"
      @updated="handleListingUpdated"
      @deleted="handleListingDeleted"
    />

    <!-- Analytics Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showAnalyticsModal && selectedListingForAnalytics"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          @click.self="showAnalyticsModal = false"
        >
          <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Listing Analytics</h3>
              <button
                @click="showAnalyticsModal = false"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X class="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div class="p-6">
              <h4 class="font-medium text-gray-900 mb-4">{{ selectedListingForAnalytics.title }}</h4>

              <div v-if="isLoadingAnalytics" class="py-8 text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
                <p class="text-sm text-gray-500 mt-2">Loading analytics...</p>
              </div>

              <div v-else-if="analytics" class="space-y-6">
                <!-- Summary Stats -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-sky-50 rounded-lg p-4 text-center">
                    <p class="text-3xl font-bold text-sky-700">{{ analytics.total_views }}</p>
                    <p class="text-sm text-sky-600">Total Views</p>
                  </div>
                  <div class="bg-emerald-50 rounded-lg p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-700">{{ analytics.total_contact_clicks }}</p>
                    <p class="text-sm text-emerald-600">Contact Clicks</p>
                  </div>
                </div>

                <!-- Conversion Rate -->
                <div class="bg-slate-50 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Conversion Rate</span>
                    <span class="text-lg font-semibold text-slate-900">
                      {{ (analytics.conversion_rate * 100).toFixed(1) }}%
                    </span>
                  </div>
                  <div class="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full transition-all duration-500"
                      :style="{ width: `${Math.min(analytics.conversion_rate * 100, 100)}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Trends -->
                <div v-if="analytics.trends" class="bg-slate-50 rounded-lg p-4">
                  <p class="text-sm text-slate-600 mb-2">View Trend (Last {{ analytics.trends.period_days }} days)</p>
                  <div class="flex items-center gap-2">
                    <TrendingUp
                      v-if="analytics.trends.view_change_percent >= 0"
                      class="w-5 h-5 text-emerald-600"
                    />
                    <TrendingDown
                      v-else
                      class="w-5 h-5 text-red-600"
                    />
                    <span
                      :class="[
                        'text-lg font-semibold',
                        analytics.trends.view_change_percent >= 0 ? 'text-emerald-700' : 'text-red-700'
                      ]"
                    >
                      {{ analytics.trends.view_change_percent >= 0 ? '+' : '' }}{{ analytics.trends.view_change_percent.toFixed(1) }}%
                    </span>
                  </div>
                </div>

                <!-- Contact Types Breakdown -->
                <div v-if="analytics.contact_clicks_by_type && Object.keys(analytics.contact_clicks_by_type).length > 0">
                  <p class="text-sm font-medium text-slate-700 mb-3">Contact Method Breakdown</p>
                  <div class="space-y-2">
                    <div
                      v-for="(count, type) in analytics.contact_clicks_by_type"
                      :key="type"
                      class="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
                    >
                      <span class="text-sm text-slate-600 capitalize">{{ type }}</span>
                      <span class="font-medium text-slate-900">{{ count }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="py-8 text-center text-gray-500">
                No analytics data available yet
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast Messages -->
    <Transition name="slide-up">
      <div v-if="toastMessage" class="fixed bottom-20 lg:bottom-4 right-4 z-[1001]">
        <div
          :class="[
            'px-4 py-3 rounded-lg shadow-lg flex items-center gap-2',
            toastMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
          ]"
        >
          <div
            :class="[
              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
              toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            ]"
          >
            <svg v-if="toastMessage.type === 'success'" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span class="font-medium">{{ toastMessage.text }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus,
  Pencil,
  Eye,
  Tag,
  BarChart3,
  Package,
  ShieldAlert,
  Send,
  X,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Image as ImageIcon,
} from 'lucide-vue-next'
import { ListingFormDrawer } from '@/components/services'
import { serviceListingsService, serviceCategoriesService, apiClient } from '@/services/api'
import { useVendorProfile } from '@/composables/settings/useVendorProfile'
import type { ServiceListing, ServiceListingAnalytics, ServiceCategory } from '@/services/api/types'

// Vendor profile state
const { vendorState, loadProfile } = useVendorProfile({ autoLoad: false })
const isVerifiedVendor = computed(() => vendorState.value === 'verified')

// Categories for lookup
const categories = ref<ServiceCategory[]>([])

// Listings state
const listings = ref<ServiceListing[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const hasMore = ref(false)
const currentPage = ref(1)

// UI state
const showFormDrawer = ref(false)
const editingListingId = ref<string | null>(null)
const isSubmitting = ref<string | null>(null)

// Analytics state
const showAnalyticsModal = ref(false)
const selectedListingForAnalytics = ref<ServiceListing | null>(null)
const analytics = ref<ServiceListingAnalytics | null>(null)
const isLoadingAnalytics = ref(false)

// Toast state
const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Computed stats
const activeCount = computed(() => listings.value.filter(l => l.status === 'approved').length)
const pendingCount = computed(() => listings.value.filter(l => l.status === 'pending_review').length)
const draftCount = computed(() => listings.value.filter(l => l.status === 'draft').length)

// Methods
const getImageUrl = (url: string | null): string => {
  if (!url) return ''
  return apiClient.getProfilePictureUrl(url) || url
}

const getCategoryName = (listing: ServiceListing): string => {
  // First try category_details from the listing (full response)
  if (listing.category_details?.name) {
    return listing.category_details.name
  }
  // Try category_name field (brief response format - API may return this instead)
  const listingWithCategoryName = listing as ServiceListing & { category_name?: string }
  if (listingWithCategoryName.category_name) {
    return listingWithCategoryName.category_name
  }
  // Fallback: look up from categories list using category ID
  // Compare as strings to handle potential type mismatches from API
  if (listing.category != null && categories.value.length > 0) {
    const listingCategoryId = String(listing.category)
    const category = categories.value.find(c => String(c.id) === listingCategoryId)
    if (category) {
      return category.name
    }
  }
  return 'Uncategorized'
}

const loadCategories = async () => {
  try {
    const response = await serviceCategoriesService.listCategories()
    if (response.success && response.data) {
      // Flatten categories to include subcategories for lookup
      const flattenCategories = (cats: ServiceCategory[]): ServiceCategory[] => {
        const result: ServiceCategory[] = []
        for (const cat of cats) {
          result.push(cat)
          if (cat.subcategories && cat.subcategories.length > 0) {
            result.push(...flattenCategories(cat.subcategories))
          }
        }
        return result
      }
      categories.value = flattenCategories(response.data.results)
    }
  } catch (err) {
    console.error('Error loading categories:', err)
  }
}

const getStatusClass = (status: string): string => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700'
    case 'pending_review':
      return 'bg-amber-100 text-amber-700'
    case 'draft':
      return 'bg-slate-100 text-slate-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    case 'suspended':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'approved':
      return 'Active'
    case 'pending_review':
      return 'Pending Review'
    case 'draft':
      return 'Draft'
    case 'rejected':
      return 'Rejected'
    case 'suspended':
      return 'Suspended'
    default:
      return status
  }
}

const showToast = (type: 'success' | 'error', text: string) => {
  toastMessage.value = { type, text }
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

const loadListings = async (page = 1) => {
  isLoading.value = true
  error.value = null

  try {
    const response = await serviceListingsService.getMyListings({ page, page_size: 20 })

    if (response.success && response.data) {
      if (page === 1) {
        listings.value = response.data.results
      } else {
        listings.value = [...listings.value, ...response.data.results]
      }
      hasMore.value = !!response.data.next
      currentPage.value = page
    } else {
      error.value = response.message || 'Failed to load listings'
    }
  } catch (err: any) {
    error.value = err?.message || 'An unexpected error occurred'
    console.error('Error loading listings:', err)
  } finally {
    isLoading.value = false
  }
}

const loadMore = () => {
  if (hasMore.value && !isLoading.value) {
    loadListings(currentPage.value + 1)
  }
}

const openCreateDrawer = () => {
  editingListingId.value = null
  showFormDrawer.value = true
}

const editListing = (listing: ServiceListing) => {
  editingListingId.value = listing.id
  showFormDrawer.value = true
}

const submitForReview = async (listing: ServiceListing) => {
  isSubmitting.value = listing.id
  try {
    const response = await serviceListingsService.submitForReview(listing.id)

    if (response.success && response.data) {
      // Update the listing in the list
      const index = listings.value.findIndex(l => l.id === listing.id)
      if (index !== -1) {
        listings.value[index] = response.data
      }
      showToast('success', 'Listing submitted for review')
    } else {
      showToast('error', response.message || 'Failed to submit for review')
    }
  } catch (err: any) {
    showToast('error', err?.message || 'Failed to submit for review')
  } finally {
    isSubmitting.value = null
  }
}

const viewAnalytics = async (listing: ServiceListing) => {
  selectedListingForAnalytics.value = listing
  showAnalyticsModal.value = true
  analytics.value = null
  isLoadingAnalytics.value = true

  try {
    const response = await serviceListingsService.getAnalytics(listing.id, { period: 'daily', days: 30 })

    if (response.success && response.data) {
      analytics.value = response.data
    }
  } catch (err) {
    console.error('Error loading analytics:', err)
  } finally {
    isLoadingAnalytics.value = false
  }
}

const handleListingCreated = (listing: ServiceListing) => {
  listings.value.unshift(listing)
  // Note: ListingFormDrawer already shows success message
}

const handleListingUpdated = (listing: ServiceListing) => {
  const index = listings.value.findIndex(l => l.id === listing.id)
  if (index !== -1) {
    listings.value[index] = listing
  }
  // Note: ListingFormDrawer already shows success message
}

const handleListingDeleted = (listingId: string) => {
  listings.value = listings.value.filter(l => l.id !== listingId)
  // Note: ListingFormDrawer already shows success message
}

// Initialize
onMounted(async () => {
  await loadProfile()
  if (isVerifiedVendor.value) {
    // Load categories and listings in parallel
    await Promise.all([
      loadCategories(),
      loadListings(),
    ])
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

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
