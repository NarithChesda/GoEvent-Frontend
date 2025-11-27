<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="!showBannerCropper && closeDrawer()"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] laptop-sm:w-[560px] laptop-md:w-[620px] desktop:w-[680px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white">Edit Event</h2>
            </div>
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

          <!-- Error State -->
          <div v-else-if="error" class="p-6 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle class="w-8 h-8 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Unable to Load Event</h3>
            <p class="text-slate-600 mb-4">{{ error }}</p>
            <button
              @click="loadEvent"
              class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>

          <!-- Edit Form -->
          <div v-else class="p-3 laptop-sm:p-4 space-y-4 laptop-sm:space-y-5 pb-24">
            <!-- Banner Image Upload -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Banner</h3>
                <!-- Options button when banner exists -->
                <div v-if="event?.banner_image" class="relative">
                  <button
                    @click.stop="showBannerDropdown = !showBannerDropdown"
                    :disabled="isUploadingBanner"
                    class="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                  >
                    <MoreHorizontal class="w-4 h-4" />
                  </button>
                  <!-- Dropdown menu -->
                  <div
                    v-if="showBannerDropdown"
                    @click.stop
                    class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 min-w-[120px]"
                  >
                    <button
                      @click="triggerBannerUpload(); showBannerDropdown = false"
                      :disabled="isUploadingBanner"
                      class="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Upload class="w-4 h-4" />
                      <span>Replace</span>
                    </button>
                    <button
                      @click="openBannerCropper(); showBannerDropdown = false"
                      :disabled="isUploadingBanner"
                      class="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Crop class="w-4 h-4" />
                      <span>Crop</span>
                    </button>
                    <button
                      @click="removeBanner"
                      :disabled="isUploadingBanner"
                      class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <X class="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Hidden file input -->
              <input
                ref="bannerFileInput"
                type="file"
                accept="image/*"
                @change="handleBannerFileSelect"
                class="hidden"
              />

              <!-- Banner Preview or Upload Area -->
              <div
                v-if="event?.banner_image"
                class="relative rounded-lg overflow-hidden"
                style="padding-bottom: 52.5%;"
              >
                <img
                  :src="getMediaUrl(event.banner_image)"
                  alt="Event Banner"
                  class="absolute inset-0 w-full h-full object-cover"
                />
                <!-- Loading overlay -->
                <div
                  v-if="isUploadingBanner"
                  class="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <Loader class="w-6 h-6 text-white animate-spin" />
                </div>
              </div>
              <div
                v-else
                @click="triggerBannerUpload"
                class="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#2ecc71] hover:bg-slate-50 transition-all group"
              >
                <div class="flex flex-col items-center gap-1.5">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                    <ImageIcon class="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div>
                    <p class="text-xs font-medium text-slate-600 group-hover:text-slate-900">Click to upload banner</p>
                    <p class="text-[10px] text-slate-400">1200x630px recommended</p>
                  </div>
                </div>
                <!-- Loading state -->
                <div v-if="isUploadingBanner" class="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <Loader class="w-5 h-5 text-[#2ecc71] animate-spin" />
                </div>
              </div>
            </div>

            <!-- Basic Information -->
            <div class="space-y-3 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Basic Information</h3>

              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Event Title *</label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  placeholder="Enter event title"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
              </div>

              <!-- Short Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
                <input
                  v-model="form.short_description"
                  type="text"
                  maxlength="300"
                  placeholder="Brief description for event cards"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
                <p class="text-xs text-slate-500 mt-1">
                  {{ form.short_description?.length || 0 }}/300 characters
                </p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Full Description *</label>
                <RichTextEditor
                  v-model="form.description"
                  placeholder="Detailed event description"
                  min-height="120px"
                />
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <div class="relative">
                  <select
                    v-model="form.category"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                  >
                    <option value="">Select a category</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <!-- Date and Time -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</h3>

              <!-- Start Date/Time -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Start Date *</label>
                  <input
                    v-model="startDate"
                    type="date"
                    required
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Start Time *</label>
                  <input
                    v-model="startTime"
                    type="time"
                    required
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
              </div>

              <!-- End Date/Time -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">End Date *</label>
                  <input
                    v-model="endDate"
                    type="date"
                    required
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">End Time *</label>
                  <input
                    v-model="endTime"
                    type="time"
                    required
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
              </div>

              <!-- Timezone -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
                <div class="relative">
                  <select
                    v-model="form.timezone"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                  >
                    <optgroup
                      v-for="(timezones, region) in timezonesByRegion"
                      :key="region"
                      :label="region"
                    >
                      <option
                        v-for="timezone in timezones"
                        :key="timezone.value"
                        :value="timezone.value"
                      >
                        {{ timezone.label }}
                      </option>
                    </optgroup>
                  </select>
                  <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <!-- Location -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</h3>

              <!-- Location Type Toggle Buttons -->
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  @click="form.is_virtual = false"
                  :class="[
                    'flex items-center gap-2 px-3.5 py-3 rounded-lg border-2 transition-all',
                    !form.is_virtual
                      ? 'border-[#2ecc71] bg-white'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <div :class="[
                    'w-6 h-6 rounded flex items-center justify-center',
                    !form.is_virtual ? 'bg-[#2ecc71]' : 'bg-slate-100'
                  ]">
                    <MapPin :class="['w-3.5 h-3.5', !form.is_virtual ? 'text-white' : 'text-slate-500']" />
                  </div>
                  <span :class="['font-medium text-sm flex-1', !form.is_virtual ? 'text-slate-900' : 'text-slate-600']">
                    In Person
                  </span>
                  <Check v-if="!form.is_virtual" class="w-4 h-4 text-[#2ecc71]" />
                </button>

                <button
                  type="button"
                  @click="form.is_virtual = true"
                  :class="[
                    'flex items-center gap-2 px-3.5 py-3 rounded-lg border-2 transition-all',
                    form.is_virtual
                      ? 'border-[#1e90ff] bg-white'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <div :class="[
                    'w-6 h-6 rounded flex items-center justify-center',
                    form.is_virtual ? 'bg-[#1e90ff]' : 'bg-slate-100'
                  ]">
                    <Video :class="['w-3.5 h-3.5', form.is_virtual ? 'text-white' : 'text-slate-500']" />
                  </div>
                  <span :class="['font-medium text-sm flex-1', form.is_virtual ? 'text-slate-900' : 'text-slate-600']">
                    Virtual
                  </span>
                  <Check v-if="form.is_virtual" class="w-4 h-4 text-[#1e90ff]" />
                </button>
              </div>

              <!-- Location Input (In Person) -->
              <div v-if="!form.is_virtual" class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                  <div class="relative">
                    <MapPin class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      v-model="form.location"
                      type="text"
                      placeholder="Enter location address"
                      class="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                    <button
                      v-if="form.location"
                      type="button"
                      @click="form.location = ''"
                      class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300 transition-colors"
                    >
                      <X class="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                </div>

                <!-- Google Maps Embed -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Map</label>

                  <!-- Map Preview -->
                  <div v-if="form.google_map_embed_link" class="relative mb-2">
                    <iframe
                      :src="form.google_map_embed_link"
                      class="w-full h-32 laptop-sm:h-36 rounded-lg border border-slate-200"
                      style="border: 0"
                      allowfullscreen
                      loading="lazy"
                    ></iframe>
                    <button
                      type="button"
                      @click="form.google_map_embed_link = ''"
                      class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </div>

                  <div class="relative">
                    <Map class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      v-model="form.google_map_embed_link"
                      type="text"
                      placeholder="Paste Google Maps embed URL"
                      @paste="handleMapsPaste"
                      class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                  </div>
                  <p class="text-xs text-slate-500 mt-1">
                    Paste Google Maps embed code or URL
                  </p>
                </div>
              </div>

              <!-- Virtual Link Input -->
              <div v-else>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Virtual Meeting Link</label>
                <div class="relative">
                  <Link2 class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.virtual_link"
                    type="url"
                    placeholder="https://zoom.us/meeting/..."
                    class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
              </div>
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
              <span>{{ isSubmitting ? 'Saving...' : 'Update Event' }}</span>
            </button>

            <button
              v-if="event"
              @click="showDeleteConfirm = true"
              :disabled="isSubmitting || isDeleting"
              class="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 class="w-4 h-4" />
              <span>Delete</span>
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

  <!-- Banner Image Cropper Modal - Outside drawer's Teleport to avoid z-index issues -->
  <ImageCropperModal
    v-if="showBannerCropper"
    :show="showBannerCropper"
    :image-source="bannerCropperImage"
    title="Crop Banner Image"
    :aspect-ratio="BANNER_ASPECT_RATIO"
    cropper-height="400px"
    help-text="Adjust the crop area to frame your banner image (1200x630px ratio)"
    @close="closeBannerCropper"
    @apply="handleBannerCropApply"
    @update:cropper-ref="setBannerCropperRef"
  />

  <!-- Delete Confirmation Modal -->
  <DeleteConfirmModal
    :show="showDeleteConfirm"
    :loading="isDeleting"
    title="Delete Event"
    :item-name="event?.title"
    message="This will permanently delete this event and all associated data including guests, media, and agenda items."
    @confirm="handleDeleteConfirm"
    @cancel="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import {
  X,
  Check,
  Loader,
  AlertCircle,
  CheckCircle,
  MapPin,
  Video,
  Link2,
  Save,
  Map,
  ImageIcon,
  Upload,
  Crop,
  MoreHorizontal,
  ArrowRight,
  Trash2,
  ChevronDown,
} from 'lucide-vue-next'
import RichTextEditor from './RichTextEditor.vue'
import ImageCropperModal from './common/ImageCropperModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import {
  eventsService,
  eventCategoriesService,
  type Event,
  type EventCategory,
} from '../services/api'
import { getTimezonesByRegion, getUserTimezone } from '../utils/timezones'
import { extractGoogleMapsEmbedUrl } from '../utils/embedExtractor'
import { useMediaUrl } from '../composables/useMediaUrl'

interface Props {
  modelValue: boolean
  eventId: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', event: Event): void
  (e: 'deleted', eventId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const event = ref<Event | null>(null)
const categories = ref<EventCategory[]>([])
const loading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)
const error = ref<string | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Banner upload state
const bannerFileInput = ref<HTMLInputElement | null>(null)
const isUploadingBanner = ref(false)
const showBannerDropdown = ref(false)
const showBannerCropper = ref(false)
const bannerCropperImage = ref<string | null>(null)
const bannerCropperRef = ref<any>(null)
const pendingBannerFile = ref<File | null>(null)
const BANNER_ASPECT_RATIO = 1200 / 630

// Composables
const { getMediaUrl } = useMediaUrl()

// Timezone data
const timezonesByRegion = getTimezonesByRegion()

// Form data
const form = reactive({
  title: '',
  short_description: '',
  description: '',
  start_date: '',
  end_date: '',
  timezone: getUserTimezone(),
  location: '',
  google_map_embed_link: '',
  virtual_link: '',
  is_virtual: false,
  privacy: 'public' as 'public' | 'private',
  status: 'published' as 'draft' | 'published' | 'cancelled' | 'completed',
  category: '' as string | number | null,
})

// Original form values for dirty tracking
const originalForm = ref<typeof form | null>(null)

// Computed properties for separate date and time inputs
const startDate = computed({
  get: () => form.start_date ? form.start_date.split('T')[0] : '',
  set: (val: string) => {
    const time = startTime.value || '00:00'
    form.start_date = val ? `${val}T${time}` : ''
  }
})

const startTime = computed({
  get: () => form.start_date ? form.start_date.split('T')[1] || '' : '',
  set: (val: string) => {
    const date = startDate.value || new Date().toISOString().split('T')[0]
    form.start_date = date ? `${date}T${val}` : ''
  }
})

const endDate = computed({
  get: () => form.end_date ? form.end_date.split('T')[0] : '',
  set: (val: string) => {
    const time = endTime.value || '00:00'
    form.end_date = val ? `${val}T${time}` : ''
  }
})

const endTime = computed({
  get: () => form.end_date ? form.end_date.split('T')[1] || '' : '',
  set: (val: string) => {
    const date = endDate.value || new Date().toISOString().split('T')[0]
    form.end_date = date ? `${date}T${val}` : ''
  }
})

// Methods
const loadEvent = async () => {
  if (!props.eventId) return

  loading.value = true
  error.value = null

  try {
    const [eventResponse, categoriesResponse] = await Promise.all([
      eventsService.getEvent(props.eventId),
      eventCategoriesService.getCategories()
    ])

    if (eventResponse.success && eventResponse.data) {
      event.value = eventResponse.data
      populateForm(eventResponse.data)
    } else {
      error.value = eventResponse.message || 'Event not found'
    }

    if (categoriesResponse.success && categoriesResponse.data) {
      categories.value = categoriesResponse.data.results || []
    }
  } catch (err) {
    console.error('Error loading event:', err)
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

const populateForm = (eventData: Event) => {
  form.title = eventData.title || ''
  form.short_description = eventData.short_description || ''
  form.description = eventData.description || ''
  form.start_date = eventData.start_date.slice(0, 16)
  form.end_date = eventData.end_date.slice(0, 16)
  form.timezone = eventData.timezone || getUserTimezone()
  form.location = eventData.location || ''
  form.google_map_embed_link = eventData.google_map_embed_link || ''
  form.virtual_link = eventData.virtual_link || ''
  form.is_virtual = eventData.is_virtual
  form.privacy = eventData.privacy
  form.status = eventData.status
  form.category = eventData.category ? eventData.category.toString() : ''

  // Store original values for dirty tracking
  originalForm.value = { ...form }
}

const handleSubmit = async () => {
  if (!event.value || !originalForm.value) return

  // Validation
  if (!form.title.trim()) {
    showMessage('error', 'Event title is required')
    return
  }

  if (!form.description.trim()) {
    showMessage('error', 'Event description is required')
    return
  }

  if (!form.start_date || !form.end_date) {
    showMessage('error', 'Start date and end date are required')
    return
  }

  if (new Date(form.end_date) <= new Date(form.start_date)) {
    showMessage('error', 'End date must be after start date')
    return
  }

  // Build update payload with only changed fields (dirty tracking)
  const updateData: Record<string, unknown> = {}
  const original = originalForm.value

  // Check text fields
  if (form.title.trim() !== original.title) {
    updateData.title = form.title.trim()
  }
  if ((form.short_description?.trim() || '') !== (original.short_description || '')) {
    updateData.short_description = form.short_description?.trim() || ''
  }
  if (form.description.trim() !== original.description) {
    updateData.description = form.description.trim()
  }

  // Check date/time fields
  if (form.start_date !== original.start_date) {
    updateData.start_date = new Date(form.start_date).toISOString()
  }
  if (form.end_date !== original.end_date) {
    updateData.end_date = new Date(form.end_date).toISOString()
  }
  if (form.timezone !== original.timezone) {
    updateData.timezone = form.timezone || 'UTC'
  }

  // Check boolean/enum fields
  if (form.is_virtual !== original.is_virtual) {
    updateData.is_virtual = form.is_virtual
  }
  if (form.privacy !== original.privacy) {
    updateData.privacy = form.privacy
  }
  if (form.status !== original.status) {
    updateData.status = form.status
  }

  // Check category
  const currentCategory = form.category && form.category !== '' ? parseInt(form.category.toString(), 10) : null
  const originalCategory = original.category && original.category !== '' ? parseInt(original.category.toString(), 10) : null
  if (currentCategory !== originalCategory) {
    updateData.category = currentCategory
  }

  // Handle location fields based on is_virtual
  // If is_virtual changed, we need to update location fields accordingly
  if (form.is_virtual !== original.is_virtual || form.is_virtual) {
    // Virtual event - clear physical location fields if they had values
    if (form.is_virtual) {
      if (original.location) {
        updateData.location = ''
      }
      if (original.google_map_embed_link) {
        updateData.google_map_embed_link = null
      }
      if ((form.virtual_link?.trim() || '') !== (original.virtual_link || '')) {
        updateData.virtual_link = form.virtual_link?.trim() || ''
      }
    }
  }

  if (!form.is_virtual) {
    // In-person event - check location fields
    if ((form.location?.trim() || '') !== (original.location || '')) {
      updateData.location = form.location?.trim() || ''
    }
    if ((form.google_map_embed_link?.trim() || '') !== (original.google_map_embed_link || '')) {
      updateData.google_map_embed_link = form.google_map_embed_link?.trim() || null
    }
    // Clear virtual_link if it had a value
    if (original.virtual_link) {
      updateData.virtual_link = ''
    }
  }

  // If nothing changed, inform user and return early
  if (Object.keys(updateData).length === 0) {
    showMessage('success', 'No changes to save')
    return
  }

  isSubmitting.value = true

  try {
    const response = await eventsService.patchEvent(event.value.id, updateData)

    if (response.success && response.data) {
      showMessage('success', 'Event updated successfully!')
      emit('updated', response.data)
      // Update original form to reflect saved state
      originalForm.value = { ...form }
      setTimeout(() => {
        closeDrawer()
      }, 1000)
    } else {
      showMessage('error', response.message || 'Failed to update event')
    }
  } catch (err) {
    console.error('Error updating event:', err)
    showMessage('error', 'An error occurred while updating the event')
  } finally {
    isSubmitting.value = false
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

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!event.value) return

  isDeleting.value = true

  try {
    const response = await eventsService.deleteEvent(event.value.id)
    if (response.success) {
      showDeleteConfirm.value = false
      emit('deleted', event.value.id)
      closeDrawer()
    } else {
      showMessage('error', response.message || 'Failed to delete event')
    }
  } catch (err) {
    console.error('Error deleting event:', err)
    showMessage('error', 'An error occurred while deleting the event')
  } finally {
    isDeleting.value = false
  }
}

// Handle paste events for Google Maps iframe
const handleMapsPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text')
  if (!pastedText) return

  // Try to extract Google Maps URL from iframe code
  const extractedUrl = extractGoogleMapsEmbedUrl(pastedText)

  if (extractedUrl) {
    event.preventDefault()
    form.google_map_embed_link = extractedUrl
  }
}

// Banner upload methods
const triggerBannerUpload = () => {
  bannerFileInput.value?.click()
}

const handleBannerFileSelect = (e: globalThis.Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = '' // Reset input

  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showMessage('error', 'Please select an image file')
    return
  }

  // Store the file and open cropper
  pendingBannerFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    bannerCropperImage.value = ev.target?.result as string
    showBannerCropper.value = true
  }
  reader.readAsDataURL(file)
}

const openBannerCropper = () => {
  const bannerUrl = getMediaUrl(event.value?.banner_image)
  if (bannerUrl) {
    bannerCropperImage.value = bannerUrl
    showBannerCropper.value = true
  }
}

const closeBannerCropper = () => {
  showBannerCropper.value = false
  bannerCropperImage.value = null
  pendingBannerFile.value = null
}

const setBannerCropperRef = (ref: InstanceType<typeof ImageCropperModal> | null) => {
  bannerCropperRef.value = ref
}

const handleBannerCropApply = async () => {
  if (!bannerCropperRef.value || !event.value) return

  const { canvas } = bannerCropperRef.value.getResult()
  if (!canvas) return

  // Create a new canvas with exact 1200x630 dimensions
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = 1200
  outputCanvas.height = 630
  const ctx = outputCanvas.getContext('2d')
  if (!ctx) return

  // Draw the cropped image scaled to 1200x630
  ctx.drawImage(canvas, 0, 0, 1200, 630)

  outputCanvas.toBlob(async (blob: Blob | null) => {
    if (!blob || !event.value) return

    const fileName = pendingBannerFile.value?.name?.replace(/\.[^/.]+$/, '.jpg') || 'banner.jpg'
    const croppedFile = new File([blob], fileName, { type: 'image/jpeg' })

    closeBannerCropper()
    await uploadBanner(croppedFile)
  }, 'image/jpeg', 0.85)
}

const uploadBanner = async (file: File) => {
  if (!event.value) return

  isUploadingBanner.value = true

  try {
    const formData = new FormData()
    formData.append('banner_image', file)

    const response = await eventsService.updateEventWithFiles(event.value.id, formData)

    if (response.success && response.data) {
      event.value = response.data
      emit('updated', response.data)
      showMessage('success', 'Banner uploaded successfully')
    } else {
      showMessage('error', response.message || 'Failed to upload banner')
    }
  } catch (err) {
    console.error('Error uploading banner:', err)
    showMessage('error', 'Failed to upload banner')
  } finally {
    isUploadingBanner.value = false
  }
}

const removeBanner = async () => {
  if (!event.value) return

  isUploadingBanner.value = true

  try {
    const response = await eventsService.patchEvent(event.value.id, { banner_image: null })

    if (response.success && response.data) {
      event.value = response.data
      emit('updated', response.data)
      showMessage('success', 'Banner removed successfully')
    } else {
      showMessage('error', response.message || 'Failed to remove banner')
    }
  } catch (err) {
    console.error('Error removing banner:', err)
    showMessage('error', 'Failed to remove banner')
  } finally {
    isUploadingBanner.value = false
    showBannerDropdown.value = false
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.eventId) {
      loadEvent()
    }
    // Prevent body scroll when drawer is open
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }
)

// Watch for eventId changes
watch(
  () => props.eventId,
  (newId) => {
    if (newId && props.modelValue) {
      loadEvent()
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
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
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
