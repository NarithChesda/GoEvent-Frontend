<template>
  <Teleport to="body">
    <!-- Backdrop - no click to close, user must use close button -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-[998]"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] laptop-sm:w-[560px] laptop-md:w-[620px] desktop:w-[680px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white">
                {{ isEditMode ? 'Edit Listing' : 'Create Listing' }}
              </h2>
            </div>

            <!-- Right: Delete button (edit mode only) -->
            <button
              v-if="isEditMode"
              @click="showDeleteConfirm = true"
              :disabled="isSubmitting"
              class="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete listing"
            >
              <Trash2 class="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- Loading State -->
          <div v-if="loading" class="p-6">
            <div class="animate-pulse space-y-6">
              <div class="h-10 bg-slate-200 rounded-xl"></div>
              <div class="h-24 bg-slate-200 rounded-xl"></div>
              <div class="h-10 bg-slate-200 rounded-xl"></div>
              <div class="grid grid-cols-2 gap-4">
                <div class="h-10 bg-slate-200 rounded-xl"></div>
                <div class="h-10 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>

          <!-- Form -->
          <div v-else class="p-3 laptop-sm:p-4 space-y-4 laptop-sm:space-y-5 pb-24">
            <!-- Basic Information -->
            <div class="space-y-3">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Basic Information</h3>

              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Service Title *</label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  placeholder="Enter service title"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
              </div>

              <!-- Tagline -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Tagline</label>
                <input
                  v-model="form.tagline"
                  type="text"
                  maxlength="150"
                  placeholder="Brief catchy description"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
                <p class="text-xs text-slate-500 mt-1">
                  {{ form.tagline?.length || 0 }}/150 characters
                </p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Full Description *</label>
                <textarea
                  v-model="form.description"
                  rows="4"
                  placeholder="Detailed service description"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white resize-none"
                ></textarea>
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                <div class="relative">
                  <select
                    v-model.number="form.category"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                  >
                    <option :value="null">Select a category</option>
                    <option v-for="category in categories" :key="category.id" :value="Number(category.id)">
                      {{ category.name }}
                    </option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <!-- Pricing -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pricing</h3>

              <!-- Price Type -->
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="form.priceType = 'fixed'"
                  :class="[
                    'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all text-center',
                    form.priceType === 'fixed'
                      ? 'border-[#2ecc71] bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <DollarSign :class="['w-4 h-4', form.priceType === 'fixed' ? 'text-[#2ecc71]' : 'text-slate-400']" />
                  <span :class="['text-xs font-medium', form.priceType === 'fixed' ? 'text-slate-900' : 'text-slate-600']">Fixed</span>
                </button>

                <button
                  type="button"
                  @click="form.priceType = 'range'"
                  :class="[
                    'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all text-center',
                    form.priceType === 'range'
                      ? 'border-[#2ecc71] bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <TrendingUp :class="['w-4 h-4', form.priceType === 'range' ? 'text-[#2ecc71]' : 'text-slate-400']" />
                  <span :class="['text-xs font-medium', form.priceType === 'range' ? 'text-slate-900' : 'text-slate-600']">Range</span>
                </button>

                <button
                  type="button"
                  @click="form.priceType = 'quote'"
                  :class="[
                    'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all text-center',
                    form.priceType === 'quote'
                      ? 'border-[#2ecc71] bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <MessageSquare :class="['w-4 h-4', form.priceType === 'quote' ? 'text-[#2ecc71]' : 'text-slate-400']" />
                  <span :class="['text-xs font-medium', form.priceType === 'quote' ? 'text-slate-900' : 'text-slate-600']">Quote</span>
                </button>
              </div>

              <!-- Price Inputs -->
              <div v-if="form.priceType === 'fixed'" class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Price *</label>
                  <div class="relative">
                    <DollarSign class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      v-model.number="form.priceMin"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                  <div class="relative">
                    <select
                      v-model="form.currency"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KHR">KHR (៛)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div v-else-if="form.priceType === 'range'" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Min Price *</label>
                    <div class="relative">
                      <DollarSign class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        v-model.number="form.priceMin"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Max Price *</label>
                    <div class="relative">
                      <DollarSign class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        v-model.number="form.priceMax"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                  <div class="relative">
                    <select
                      v-model="form.currency"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KHR">KHR (៛)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div v-else class="bg-slate-50 rounded-lg p-3">
                <p class="text-sm text-slate-600">
                  Price will be displayed as "Contact for Quote"
                </p>
              </div>

            </div>

            <!-- Service Area -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Area</h3>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Locations Served</label>
                <div class="relative">
                  <MapPin class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.serviceArea"
                    type="text"
                    placeholder="e.g., Phnom Penh, Cambodia or Nationwide"
                    class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags</h3>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Service Tags</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="(tag, index) in form.tags"
                    :key="index"
                    class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                  >
                    {{ tag }}
                    <button
                      type="button"
                      @click="removeTag(index)"
                      class="w-4 h-4 rounded-full bg-slate-300 hover:bg-slate-400 flex items-center justify-center transition-colors"
                    >
                      <X class="w-2.5 h-2.5 text-slate-600" />
                    </button>
                  </span>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newTag"
                    type="text"
                    placeholder="Add a tag"
                    @keydown.enter.prevent="addTag"
                    class="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                  <button
                    type="button"
                    @click="addTag"
                    :disabled="!newTag.trim()"
                    class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  Press Enter or click Add to add a tag
                </p>
              </div>
            </div>

            <!-- Gallery -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gallery</h3>
                <span class="text-xs text-slate-400">Click star to set cover</span>
              </div>

              <!-- Hidden file input for gallery -->
              <input
                ref="galleryFileInput"
                type="file"
                accept="image/*"
                multiple
                @change.stop="handleGalleryFileSelect"
                class="hidden"
              />

              <!-- Gallery Grid -->
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="(image, index) in form.gallery"
                  :key="index"
                  :class="[
                    'relative aspect-square rounded-lg overflow-hidden bg-slate-100 group',
                    form.coverIndex === index ? 'ring-2 ring-[#2ecc71] ring-offset-1' : ''
                  ]"
                >
                  <img :src="image.url" alt="Gallery" class="w-full h-full object-cover" />

                  <!-- Cover badge -->
                  <div
                    v-if="form.coverIndex === index"
                    class="absolute top-1 left-1 px-1.5 py-0.5 bg-[#2ecc71] text-white text-[10px] font-medium rounded"
                  >
                    Cover
                  </div>

                  <!-- Action buttons overlay -->
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <!-- Set as cover button -->
                    <button
                      type="button"
                      @click="setCoverImage(index)"
                      :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                        form.coverIndex === index
                          ? 'bg-[#2ecc71] text-white'
                          : 'bg-white/90 hover:bg-[#2ecc71] text-slate-600 hover:text-white'
                      ]"
                      :title="form.coverIndex === index ? 'Current cover' : 'Set as cover'"
                    >
                      <Star :class="['w-4 h-4', form.coverIndex === index ? 'fill-current' : '']" />
                    </button>

                    <!-- Delete button -->
                    <button
                      type="button"
                      @click="removeGalleryImage(index)"
                      class="w-8 h-8 bg-white/90 hover:bg-red-500 text-slate-600 hover:text-white rounded-full flex items-center justify-center transition-colors"
                      title="Remove image"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Add More Button -->
                <div
                  v-if="form.gallery.length < 10"
                  @click.stop.prevent="triggerGalleryUpload"
                  class="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#2ecc71] hover:bg-slate-50 transition-all group"
                >
                  <Plus class="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  <span class="text-xs text-slate-400 group-hover:text-emerald-600 mt-1">Add</span>
                </div>
              </div>
              <p class="text-xs text-slate-500">
                Add up to 10 images. The starred image will be used as your listing cover.
              </p>
            </div>

          </div>
        </div>

        <!-- Footer with Save and Delete Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              @click="handleSubmit"
              :disabled="isSubmitting"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Listing' : 'Create Listing') }}</span>
            </button>

            <button
              type="button"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
        <Transition name="slide-up">
          <div v-if="message" class="absolute bottom-16 left-4 right-4 z-10">
            <div
              :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
              class="text-white px-3 py-2.5 rounded-lg shadow-lg flex items-center"
            >
              <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 mr-2 flex-shrink-0" />
              <AlertCircle v-else class="w-4 h-4 mr-2 flex-shrink-0" />
              <span class="text-xs">{{ message.text }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Delete Confirmation Modal -->
  <DeleteConfirmModal
    :show="showDeleteConfirm"
    :loading="isDeleting"
    title="Delete Listing"
    :item-name="form.title"
    @confirm="handleDelete"
    @cancel="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import {
  X,
  Loader,
  AlertCircle,
  CheckCircle,
  MapPin,
  Save,
  ArrowRight,
  Trash2,
  ChevronDown,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Plus,
  Star,
} from 'lucide-vue-next'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import {
  serviceCategoriesService,
  serviceListingsService,
  apiClient,
  type ServiceCategory,
  type ServiceListing,
  type CreateServiceListingData,
  type UpdateServiceListingData,
} from '@/services/api'

interface GalleryImage {
  id?: number // From API when editing existing
  url: string
  file?: File // For new uploads
  is_cover: boolean
}

interface Props {
  modelValue: boolean
  listingId?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', listing: ServiceListing): void
  (e: 'updated', listing: ServiceListing): void
  (e: 'deleted', listingId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  listingId: null,
})

const emit = defineEmits<Emits>()

// Computed
const isEditMode = computed(() => !!props.listingId)

// State
const loading = ref(false)
const isSubmitting = ref(false)
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Gallery upload state
const galleryFileInput = ref<HTMLInputElement | null>(null)

// Tag input
const newTag = ref('')

// Categories from API
const categories = ref<ServiceCategory[]>([])
const isLoadingCategories = ref(false)

// Current listing data when editing
const currentListing = ref<ServiceListing | null>(null)

// Form data
const form = reactive({
  title: '',
  tagline: '',
  description: '',
  category: null as number | null, // API uses numeric IDs
  priceType: 'fixed' as 'fixed' | 'range' | 'quote',
  priceMin: null as number | null,
  priceMax: null as number | null,
  currency: 'USD',
  priceDisplayText: '', // Custom price display text
  serviceArea: '',
  tags: [] as string[],
  gallery: [] as GalleryImage[],
  coverIndex: 0, // Index of the cover image in gallery
})

// Pending files to upload after listing creation
const pendingFiles = ref<File[]>([])

// Methods
const resetForm = () => {
  form.title = ''
  form.tagline = ''
  form.description = ''
  form.category = null
  form.priceType = 'fixed'
  form.priceMin = null
  form.priceMax = null
  form.currency = 'USD'
  form.priceDisplayText = ''
  form.serviceArea = ''
  form.tags = []
  form.gallery = []
  form.coverIndex = 0
  pendingFiles.value = []
  currentListing.value = null
}

/**
 * Fetch categories from API
 */
const fetchCategories = async () => {
  if (categories.value.length > 0) return // Already loaded

  isLoadingCategories.value = true
  try {
    const response = await serviceCategoriesService.listCategories()
    if (response.success && response.data) {
      categories.value = response.data.results
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  } finally {
    isLoadingCategories.value = false
  }
}

/**
 * Fetch listing data when editing
 */
const fetchListing = async (listingId: string) => {
  loading.value = true
  try {
    const response = await serviceListingsService.getListing(listingId)
    if (response.success && response.data) {
      currentListing.value = response.data
      populateFormFromListing(response.data)
    } else {
      showMessage('error', response.message || 'Failed to load listing')
    }
  } catch (error) {
    console.error('Failed to fetch listing:', error)
    showMessage('error', 'Failed to load listing data')
  } finally {
    loading.value = false
  }
}

/**
 * Populate form from API listing data
 */
const populateFormFromListing = (listing: ServiceListing) => {
  form.title = listing.title || ''
  form.tagline = listing.short_tagline || ''
  form.description = listing.description || ''
  // Ensure category is a number for proper v-model binding with select option values
  form.category = listing.category != null ? Number(listing.category) : null

  // Determine price type from data
  const priceMin = parseFloat(listing.price_min) || 0
  const priceMax = parseFloat(listing.price_max) || 0

  if (priceMin === 0 && priceMax === 0) {
    form.priceType = 'quote'
  } else if (priceMin === priceMax || priceMax === 0) {
    form.priceType = 'fixed'
    form.priceMin = priceMin
  } else {
    form.priceType = 'range'
    form.priceMin = priceMin
    form.priceMax = priceMax
  }

  form.currency = listing.currency || 'USD'
  form.priceDisplayText = listing.price_display_text || ''
  form.serviceArea = listing.service_area || ''
  form.tags = listing.tags_list || []

  // Map media to gallery
  form.gallery = (listing.media || []).map((media) => ({
    id: media.id,
    url: apiClient.getProfilePictureUrl(media.image) || media.image,
    is_cover: media.is_cover,
  }))

  // Find cover index
  const coverIdx = form.gallery.findIndex((img) => img.is_cover)
  form.coverIndex = coverIdx >= 0 ? coverIdx : 0
}

const triggerGalleryUpload = () => {
  galleryFileInput.value?.click()
}

const handleGalleryFileSelect = (e: Event) => {
  e.stopPropagation()
  e.preventDefault()

  const target = e.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) {
    target.value = ''
    return
  }

  const remainingSlots = 10 - form.gallery.length
  const filesToAdd = Array.from(files).slice(0, remainingSlots)
  const isFirstImage = form.gallery.length === 0

  filesToAdd.forEach((file, idx) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const newImage: GalleryImage = {
        url: ev.target?.result as string,
        file: file,
        is_cover: isFirstImage && idx === 0, // First image becomes cover by default
      }
      form.gallery.push(newImage)
    }
    reader.readAsDataURL(file)
  })

  // Clear input value after processing to allow selecting same file again
  target.value = ''
}

const removeGalleryImage = (index: number) => {
  form.gallery.splice(index, 1)
  // Adjust cover index if needed
  if (form.coverIndex === index) {
    form.coverIndex = form.gallery.length > 0 ? 0 : -1
    if (form.gallery.length > 0) {
      form.gallery[0].is_cover = true
    }
  } else if (form.coverIndex > index) {
    form.coverIndex--
  }
}

const setCoverImage = (index: number) => {
  // Update is_cover flags
  form.gallery.forEach((img, idx) => {
    img.is_cover = idx === index
  })
  form.coverIndex = index
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  form.tags.splice(index, 1)
}

/**
 * Build price display text based on price type
 */
const buildPriceDisplayText = (): string => {
  if (form.priceDisplayText) return form.priceDisplayText

  const currencySymbol = form.currency === 'USD' ? '$' : form.currency === 'EUR' ? '€' : '៛'

  if (form.priceType === 'quote') {
    return 'Contact for Quote'
  } else if (form.priceType === 'fixed') {
    return `${currencySymbol}${form.priceMin || 0}`
  } else {
    return `${currencySymbol}${form.priceMin || 0} - ${currencySymbol}${form.priceMax || 0}`
  }
}

/**
 * Upload pending media files to a listing and return the uploaded media with their IDs
 */
const uploadPendingMedia = async (listingId: string): Promise<number | null> => {
  const newImageIndices: number[] = []
  const filesToUpload: File[] = []

  // Track which gallery indices have new files
  form.gallery.forEach((img, idx) => {
    if (img.file) {
      newImageIndices.push(idx)
      filesToUpload.push(img.file)
    }
  })

  if (filesToUpload.length === 0) return null

  try {
    const response = await serviceListingsService.bulkUploadMedia(listingId, filesToUpload)

    if (response.success && response.data?.media) {
      // Map uploaded media IDs back to gallery items
      response.data.media.forEach((media, uploadIdx) => {
        const galleryIdx = newImageIndices[uploadIdx]
        if (galleryIdx !== undefined) {
          form.gallery[galleryIdx].id = media.id
        }
      })

      // Check if the cover image is one of the newly uploaded images
      const coverImage = form.gallery[form.coverIndex]
      if (coverImage?.id) {
        return coverImage.id
      }
    }
    return null
  } catch (error) {
    console.error('Failed to upload media:', error)
    // Don't throw - listing was created, just media upload failed
    showMessage('error', 'Listing saved but some images failed to upload')
    return null
  }
}

const handleSubmit = async () => {
  // Validation
  if (!form.title.trim()) {
    showMessage('error', 'Service title is required')
    return
  }

  if (!form.description.trim()) {
    showMessage('error', 'Description is required')
    return
  }

  if (!form.category) {
    showMessage('error', 'Please select a category')
    return
  }

  if (form.priceType === 'fixed' && !form.priceMin) {
    showMessage('error', 'Please enter a price')
    return
  }

  if (form.priceType === 'range' && (!form.priceMin || !form.priceMax)) {
    showMessage('error', 'Please enter both min and max prices')
    return
  }

  isSubmitting.value = true

  try {
    // Build API payload
    const priceMin = form.priceType === 'quote' ? '0' : String(form.priceMin || 0)
    const priceMax =
      form.priceType === 'quote'
        ? '0'
        : form.priceType === 'fixed'
          ? priceMin
          : String(form.priceMax || 0)

    if (isEditMode.value && props.listingId) {
      // Update existing listing
      const updateData: UpdateServiceListingData = {
        category: form.category!,
        title: form.title.trim(),
        description: form.description.trim(),
        short_tagline: form.tagline.trim(),
        price_min: priceMin,
        price_max: priceMax,
        price_display_text: buildPriceDisplayText(),
        currency: form.currency,
        service_area: form.serviceArea.trim(),
        tags: form.tags.join(', '),
      }

      const response = await serviceListingsService.updateListing(props.listingId, updateData)

      if (response.success && response.data) {
        // Handle new media uploads
        const newFiles = form.gallery.filter((img) => img.file)
        if (newFiles.length > 0) {
          await uploadPendingMedia(props.listingId)
        }

        // Handle deleted media (existing media that was removed)
        if (currentListing.value) {
          const existingIds = currentListing.value.media.map((m) => m.id)
          const currentIds = form.gallery.filter((img) => img.id).map((img) => img.id!)
          const deletedIds = existingIds.filter((id) => !currentIds.includes(id))

          for (const mediaId of deletedIds) {
            await serviceListingsService.deleteMedia(props.listingId, mediaId)
          }
        }

        // Update cover image - the gallery items now have IDs after upload
        const coverImage = form.gallery[form.coverIndex]
        if (coverImage?.id) {
          await serviceListingsService.setCoverImage(props.listingId, coverImage.id)
        }

        // Re-fetch the listing to get updated data including media changes
        const updatedResponse = await serviceListingsService.getListing(props.listingId)
        const finalListing = updatedResponse.success && updatedResponse.data
          ? updatedResponse.data
          : response.data

        showMessage('success', 'Listing updated successfully!')
        emit('updated', finalListing)

        setTimeout(() => {
          closeDrawer()
        }, 1000)
      } else {
        showMessage('error', response.message || 'Failed to update listing')
      }
    } else {
      // Create new listing
      const createData: CreateServiceListingData = {
        category: form.category!,
        title: form.title.trim(),
        description: form.description.trim(),
        short_tagline: form.tagline.trim(),
        price_min: priceMin,
        price_max: priceMax,
        price_display_text: buildPriceDisplayText(),
        currency: form.currency,
        service_area: form.serviceArea.trim(),
        tags: form.tags.join(', '),
      }

      const response = await serviceListingsService.createListing(createData)

      if (response.success && response.data) {
        const listingId = response.data.id

        // Upload media if any
        if (form.gallery.length > 0) {
          await uploadPendingMedia(listingId)

          // Set cover image after upload (gallery items now have IDs)
          const coverImage = form.gallery[form.coverIndex]
          if (coverImage?.id) {
            await serviceListingsService.setCoverImage(listingId, coverImage.id)
          }
        }

        // Re-fetch the listing to get complete data including media
        const updatedResponse = await serviceListingsService.getListing(listingId)
        const finalListing = updatedResponse.success && updatedResponse.data
          ? updatedResponse.data
          : response.data

        showMessage('success', 'Listing created successfully!')
        emit('created', finalListing)

        setTimeout(() => {
          closeDrawer()
        }, 1000)
      } else {
        showMessage('error', response.message || 'Failed to create listing')
      }
    }
  } catch (err) {
    console.error('Error saving listing:', err)
    showMessage('error', 'An error occurred while saving')
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!props.listingId) return

  isDeleting.value = true
  try {
    const response = await serviceListingsService.deleteListing(props.listingId)

    if (response.success) {
      showDeleteConfirm.value = false
      emit('deleted', props.listingId)
      closeDrawer()
    } else {
      showMessage('error', response.message || 'Failed to delete listing')
    }
  } catch (err) {
    console.error('Error deleting listing:', err)
    showMessage('error', 'Failed to delete listing')
  } finally {
    isDeleting.value = false
  }
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 4000)
}

const closeDrawer = () => {
  emit('update:modelValue', false)
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      // Load categories if not already loaded
      await fetchCategories()

      // If editing, fetch listing data
      if (props.listingId) {
        await fetchListing(props.listingId)
      } else {
        resetForm()
      }

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // Defer body style resets until after transition completes (350ms)
      // to prevent layout recalculation during animation
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 350)
    }
  }
)

// Watch for listingId prop changes
watch(
  () => props.listingId,
  async (newListingId) => {
    if (newListingId && props.modelValue) {
      await fetchListing(newListingId)
    }
  }
)
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%) translateZ(0);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%) translateZ(0);
  }
}

/* Slide up transition for toast */
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
</style>
