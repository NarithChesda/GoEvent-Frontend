<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Showcase</h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage all visual content and media for your event showcase or invitation</p>
      </div>
    </div>

    <!-- All Sections Stacked -->
    <div class="space-y-6">
      <!-- Basic Media Section (Category-specific: wedding, birthday, housewarming) -->
      <div v-if="props.showCategorySpecificSections">
        <div v-if="!localEventData && props.eventId" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
            <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Loading media...</span>
          </div>
        </div>
        <BasicMediaSection
          v-else
          ref="basicMediaSectionRef"
          :event-data="localEventData"
          :can-edit="canEdit"
          @updated="handleEventUpdated"
        />
      </div>

      <!-- Photo Gallery Section -->
      <div>
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
          <!-- Header -->
          <div class="mb-6">
            <h5 class="font-semibold text-slate-900">Event Photos</h5>
            <p class="text-sm text-slate-600">Photos will be displayed on the event showcase page in order. Drag and drop to reorder.</p>
          </div>

          <!-- Loading State -->
          <div
            v-if="loading"
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            <div v-for="i in 8" :key="i" class="animate-pulse">
              <div class="bg-slate-200 aspect-square rounded-xl sm:rounded-2xl"></div>
              <div class="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                <div class="h-3 sm:h-4 bg-slate-200 rounded w-3/4"></div>
                <div class="h-2.5 sm:h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-8">
            <div class="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md mx-auto">
              <AlertCircle class="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-1.5 sm:mb-2" />
              <p class="text-base sm:text-lg text-red-600 font-semibold leading-relaxed">{{ error }}</p>
              <button
                @click="fetchMedia"
                class="mt-3 sm:mt-4 bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base"
              >
                Try Again
              </button>
            </div>
          </div>

          <!-- Gallery Content -->
          <div v-else>
            <!-- Empty State -->
            <div v-if="media.length === 0">
              <div
                @click="canEdit && eventData && props.eventId ? openUploadModal() : null"
                :class="[
                  'border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center',
                  canEdit && eventData && props.eventId
                    ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group'
                    : 'border-slate-300 bg-slate-50'
                ]"
              >
                <div class="flex flex-col items-center justify-center min-h-[120px]">
                  <div :class="[
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
                    canEdit && eventData && props.eventId ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
                  ]">
                    <Upload v-if="canEdit && eventData && props.eventId" :class="[
                      'w-8 h-8 transition-colors',
                      'text-slate-400 group-hover:text-emerald-600'
                    ]" />
                    <ImageIcon v-else class="w-8 h-8 text-slate-400" />
                  </div>
                  <p :class="[
                    'font-semibold transition-colors',
                    canEdit && eventData && props.eventId ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
                  ]">No photos added</p>
                  <p class="text-sm text-slate-500 mt-1">Upload photos to showcase your event's atmosphere and venue</p>
                  <p v-if="canEdit && eventData && props.eventId" class="text-xs text-slate-400 mt-1">Click to add photos</p>
                </div>
              </div>
            </div>

            <!-- Media Grid with Upload Card -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              <MediaCard
                v-for="mediaItem in media"
                :key="mediaItem.id"
                :media="mediaItem"
                :can-edit="canEdit"
                :draggable="canEdit"
                @delete="deleteMedia"
                @set-featured="toggleFeatured"
                @drag-start="handleDragStart"
                @drag-end="handleDragEnd"
                class="media-item"
                :data-id="mediaItem.id"
              />

              <!-- Upload Card at the end -->
              <div
                v-if="canEdit && eventData && props.eventId"
                @click="openUploadModal"
                class="border-2 border-dashed rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer group border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 aspect-square flex flex-col items-center justify-center p-4"
              >
                <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 bg-slate-200 group-hover:bg-emerald-100">
                  <Upload class="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <p class="font-semibold transition-colors text-slate-600 group-hover:text-slate-900 text-sm sm:text-base">Add photos</p>
                <p class="text-xs text-slate-400 mt-1">{{ media.length }} photos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Videos & Maps Section -->
      <div>
        <EmbedsSection
          :event-data="localEventData"
          :can-edit="canEdit"
          @updated="handleEventUpdated"
        />
      </div>

      <!-- Event Payment Section -->
      <div v-if="localEventData?.id">
        <PaymentMethodsSection
          ref="paymentMethodsSectionRef"
          :event-id="localEventData.id"
          :event="localEventData"
          :can-edit="canEdit"
          @event-updated="handleEventUpdated"
        />
      </div>

      <!-- Event Texts Section (Category-specific: wedding, birthday, housewarming) -->
      <div v-if="props.showCategorySpecificSections && localEventData?.id">
        <EventTextTab
          ref="eventTextTabRef"
          :event-id="localEventData.id"
        />
      </div>

    </div>

    <!-- Upload Modal -->
    <UploadMediaModal
      v-if="showUploadModal && props.eventId"
      :event-id="props.eventId"
      @close="showUploadModal = false"
      @uploaded="handleMediaUploaded"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleting"
      title="Delete Media"
      :item-name="mediaToDelete?.caption || 'Untitled Media'"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-8 right-8 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Upload, ImageIcon, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { mediaService, type EventPhoto, type Event } from '../services/api'
import { useToast } from '../composables/useToast'
import MediaCard from './MediaCard.vue'
import UploadMediaModal from './UploadMediaModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import BasicMediaSection from './BasicMediaSection.vue'
import EmbedsSection from './EmbedsSection.vue'
import PaymentMethodsSection from './PaymentMethodsSection.vue'
import EventTextTab from './EventTextTab.vue'

interface Props {
  eventId?: string
  canEdit: boolean
  initialMedia?: EventPhoto[]
  eventData?: Event
  showCategorySpecificSections?: boolean // Controls visibility of category-specific sections
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'media-updated', media: EventPhoto[]): void
  (e: 'event-updated', event: Event): void
}>()

// Toast notifications with automatic cleanup
const { message, showSuccess, showError } = useToast()

// State
const media = ref<EventPhoto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showUploadModal = ref(false)
const showDeleteModal = ref(false)
const mediaToDelete = ref<EventPhoto | null>(null)
const deleting = ref(false)

// Local event data - synced with props
const localEventData = ref<Event | undefined>(props.eventData ? { ...props.eventData } : undefined)

// Drag and drop state
const draggedMedia = ref<EventPhoto | null>(null)

// Template refs for sections
const paymentMethodsSectionRef = ref<InstanceType<typeof PaymentMethodsSection> | null>(null)
const basicMediaSectionRef = ref<InstanceType<typeof BasicMediaSection> | null>(null)
const eventTextTabRef = ref<InstanceType<typeof EventTextTab> | null>(null)

// Watch for prop changes to sync localEventData
watch(
  () => props.eventData,
  (newEventData) => {
    localEventData.value = newEventData ? { ...newEventData } : undefined
  },
  { deep: true },
)


// Methods
const fetchMedia = async () => {
  // If we have initial media from props, use that instead of making an API call
  if (props.initialMedia) {
    media.value = [...props.initialMedia].sort((a, b) => a.order - b.order)
    return
  }

  // Guard against undefined eventId
  if (!props.eventId) {
    media.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await mediaService.getEventMedia(props.eventId)
    if (response.success && response.data) {
      // Normalize API response - ensure it's always an array
      media.value = Array.isArray(response.data)
        ? response.data.sort((a, b) => a.order - b.order)
        : []
    } else {
      showError(response.message || 'Failed to load media')
      media.value = []
    }
  } catch (err) {
    console.error('Failed to fetch media:', err)
    showError('Network error while loading media')
    media.value = []
  } finally {
    loading.value = false
  }
}

const openUploadModal = () => {
  showUploadModal.value = true
}

const deleteMedia = (mediaItem: EventPhoto) => {
  mediaToDelete.value = mediaItem
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!mediaToDelete.value || !props.eventId) return

  deleting.value = true
  try {
    const response = await mediaService.deleteEventMedia(props.eventId, mediaToDelete.value.id)
    if (response.success) {
      // Remove from array
      media.value = media.value.filter((item) => item.id !== mediaToDelete.value!.id)
      showDeleteModal.value = false
      mediaToDelete.value = null
      // Emit updated media to parent
      emit('media-updated', media.value)
      showSuccess('Photo deleted successfully')
    } else {
      showError(response.message || 'Failed to delete media')
    }
  } catch (err) {
    console.error('Failed to delete media:', err)
    showError('Network error while deleting media')
  } finally {
    deleting.value = false
  }
}

const toggleFeatured = async (mediaItem: EventPhoto) => {
  if (!props.eventId) return

  try {
    const response = await mediaService.updateEventMedia(props.eventId, mediaItem.id, {
      is_featured: !mediaItem.is_featured,
    })
    if (response.success && response.data) {
      // Update the item in the array
      const index = media.value.findIndex((item) => item.id === mediaItem.id)
      if (index !== -1) {
        media.value[index] = response.data
        // Emit updated media to parent
        emit('media-updated', media.value)
        showSuccess('Featured status updated')
      }
    } else {
      showError(response.message || 'Failed to update featured status')
    }
  } catch (err) {
    console.error('Failed to update featured status:', err)
    showError('Network error while updating featured status')
  }
}

const uploadBatchStart = ref(0)

const handleMediaUploaded = (newMedia: EventPhoto) => {
  // Track the starting count before upload
  if (uploadBatchStart.value === 0) {
    uploadBatchStart.value = media.value.length
  }

  media.value.push(newMedia)
  media.value.sort((a, b) => a.order - b.order)

  // Emit updated media to parent
  emit('media-updated', media.value)
}

// Watch for modal closing to show success message
watch(showUploadModal, (newValue, oldValue) => {
  if (oldValue === true && newValue === false && uploadBatchStart.value > 0) {
    // Modal just closed, calculate how many photos were uploaded
    const uploadedCount = media.value.length - uploadBatchStart.value

    if (uploadedCount > 0) {
      showSuccess(`${uploadedCount} ${uploadedCount === 1 ? 'photo' : 'photos'} uploaded successfully`)
    }

    // Reset the batch counter
    uploadBatchStart.value = 0
  }
})

const handleEventUpdated = (updatedEvent: Event) => {
  // Force reactivity by creating a new object reference
  localEventData.value = { ...updatedEvent }
  // Then emit to parent
  emit('event-updated', updatedEvent)
}

// Drag and drop handlers
const handleDragStart = (mediaItem: EventPhoto) => {
  draggedMedia.value = mediaItem
}

const handleDragEnd = async (targetMedia: EventPhoto | null) => {
  if (
    !draggedMedia.value ||
    !targetMedia ||
    draggedMedia.value.id === targetMedia.id ||
    !props.eventId
  ) {
    draggedMedia.value = null
    return
  }

  // Find both items in the current array
  const draggedIndex = media.value.findIndex((item) => item.id === draggedMedia.value!.id)
  const targetIndex = media.value.findIndex((item) => item.id === targetMedia.id)

  if (draggedIndex === -1 || targetIndex === -1) {
    draggedMedia.value = null
    return
  }

  // Create new array with reordered items
  const newMedia = [...media.value]
  const [draggedMediaData] = newMedia.splice(draggedIndex, 1)
  newMedia.splice(targetIndex, 0, draggedMediaData)

  // Update the order values for all media items
  newMedia.forEach((item, index) => {
    item.order = index
  })

  const updates = newMedia.map((item, index) => ({
    id: item.id,
    order: index,
  }))

  // Optimistic update - force reactivity by creating new array reference
  media.value = [...newMedia]

  // Emit updated media to parent
  emit('media-updated', media.value)

  try {
    const response = await mediaService.bulkReorderEventMedia(props.eventId, { updates })
    if (!response.success) {
      // Rollback on failure - refetch media
      await fetchMedia()
      showError(response.message || 'Failed to reorder media')
    }
  } catch (err) {
    console.error('Failed to reorder media:', err)
    // Rollback on failure - refetch media
    await fetchMedia()
    showError('Network error while reordering media')
  } finally {
    draggedMedia.value = null
  }
}

// Lifecycle
onMounted(() => {
  fetchMedia()
})

// Expose methods for parent component (Smart FAB)
defineExpose({
  openAddModal: () => {
    // Open upload modal for photo gallery
    showUploadModal.value = true
  },
  openPhotoGalleryModal: () => {
    // Open upload modal for photo gallery
    showUploadModal.value = true
  },
  // Method to trigger payment method addition
  openPaymentMethodModal: () => {
    paymentMethodsSectionRef.value?.openAddModal()
  },
  // Method to trigger dress code addition
  openDressCodeModal: () => {
    basicMediaSectionRef.value?.openDressCodeModal()
  },
  // Method to trigger event text editing
  openEventTextModal: () => {
    eventTextTabRef.value?.openAddModal()
  }
})
</script>

<style scoped>
.media-item {
  transition: transform 0.2s ease;
}

.media-item:hover {
  transform: translateY(-2px);
}

.media-item.dragging {
  transform: rotate(2deg) scale(1.05);
  z-index: 10;
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

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
