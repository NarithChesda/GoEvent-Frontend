<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Media</h3>
      <p class="text-lg text-slate-600 mt-1 leading-relaxed">Manage all visual content and media for your event</p>
    </div>

    <!-- Media Tabs -->
    <div class="border-b border-slate-200">
      <nav class="-mb-px flex space-x-8">
        <button
          @click="activeSection = 'basic'"
          :class="[
            'whitespace-nowrap pb-2 px-1 border-b-2 font-semibold text-base',
            activeSection === 'basic'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          ]"
        >
          Basic Media
        </button>
        <button
          @click="activeSection = 'gallery'"
          :class="[
            'whitespace-nowrap pb-2 px-1 border-b-2 font-semibold text-base',
            activeSection === 'gallery'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          ]"
        >
          Photo Gallery
        </button>
        <button
          @click="activeSection = 'embeds'"
          :class="[
            'whitespace-nowrap pb-2 px-1 border-b-2 font-semibold text-base',
            activeSection === 'embeds'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          ]"
        >
          Videos & Maps
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="mt-6">
      <!-- Basic Media Section -->
      <div v-if="activeSection === 'basic'">
        <div v-if="!localEventData && props.eventId" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-lg text-slate-600 leading-relaxed">Loading media...</span>
        </div>
        <BasicMediaSection 
          v-else
          :event-data="localEventData" 
          :can-edit="canEdit"
          @updated="handleEventUpdated"
        />
      </div>

      <!-- Photo Gallery Section -->
      <div v-if="activeSection === 'gallery'">
        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="i in 8" :key="i" class="animate-pulse">
            <div class="bg-slate-200 aspect-square rounded-2xl"></div>
            <div class="mt-3 space-y-2">
              <div class="h-4 bg-slate-200 rounded w-3/4"></div>
              <div class="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <div class="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
            <AlertCircle class="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p class="text-lg text-red-600 font-semibold leading-relaxed">{{ error }}</p>
            <button 
              @click="fetchMedia"
              class="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>

        <!-- Gallery Header -->
        <div v-else class="space-y-6">
          <div class="flex justify-between items-center">
            <div>
              <h4 class="text-xl font-bold text-slate-900 leading-tight tracking-tight">Photo Gallery</h4>
              <p class="text-lg text-slate-600 mt-1 leading-relaxed">Upload and manage event photos with drag & drop ordering</p>
            </div>
            <button
              v-if="canEdit && eventData && props.eventId"
              @click="openUploadModal"
              class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2"
            >
              <Upload class="w-4 h-4" />
              <span>Upload Photos</span>
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="!Array.isArray(media) || media.length === 0" class="text-center py-12">
            <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md mx-auto">
              <ImageIcon class="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h4 class="text-xl font-bold text-slate-900 mb-2 leading-tight tracking-tight">No Photos Yet</h4>
              <p class="text-lg text-slate-600 mb-6 leading-relaxed">Upload photos to showcase your event's atmosphere and venue.</p>
              <button
                v-if="canEdit && eventData && props.eventId"
                @click="openUploadModal"
                class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2 mx-auto"
              >
                <Upload class="w-4 h-4" />
                <span>Upload First Photos</span>
              </button>
            </div>
          </div>

          <!-- Media Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <MediaCard
              v-for="mediaItem in media"
              :key="mediaItem.id"
              :media="mediaItem"
              :can-edit="canEdit"
              :draggable="canEdit"
              @edit="editMedia"
              @delete="deleteMedia"
              @set-featured="toggleFeatured"
              @drag-start="handleDragStart"
              @drag-end="handleDragEnd"
              class="media-item"
              :data-id="mediaItem.id"
            />
          </div>
        </div>
      </div>

      <!-- Videos & Maps Section -->
      <div v-if="activeSection === 'embeds'">
        <EmbedsSection 
          :event-data="localEventData" 
          :can-edit="canEdit"
          @updated="handleEventUpdated"
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

    <!-- Edit Modal -->
    <EditMediaModal
      v-if="showEditModal && selectedMedia && props.eventId"
      :event-id="props.eventId"
      :media="selectedMedia"
      @close="showEditModal = false"
      @updated="handleMediaUpdated"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive } from 'vue'
import { Upload, ImageIcon, AlertCircle } from 'lucide-vue-next'
import { mediaService, type EventPhoto, type Event } from '../services/api'
import MediaCard from './MediaCard.vue'
import UploadMediaModal from './UploadMediaModal.vue'
import EditMediaModal from './EditMediaModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import BasicMediaSection from './BasicMediaSection.vue'
import EmbedsSection from './EmbedsSection.vue'

interface Props {
  eventId?: string
  canEdit: boolean
  initialMedia?: EventPhoto[]
  eventData?: Event
}

interface Emits {
  'media-updated': [media: EventPhoto[]]
  'event-updated': [event: Event]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const media = ref<EventPhoto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const activeSection = ref<'basic' | 'gallery' | 'embeds'>('basic')
const showUploadModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedMedia = ref<EventPhoto | null>(null)
const mediaToDelete = ref<EventPhoto | null>(null)
const deleting = ref(false)

// Local reactive eventData state
const localEventData = ref<Event | undefined>(props.eventData ? { ...props.eventData } : undefined)

// Drag and drop state
const draggedMedia = ref<EventPhoto | null>(null)

// Watch for prop changes
watch(() => props.eventData, (newEventData) => {
  if (newEventData) {
    localEventData.value = { ...newEventData }
  } else {
    localEventData.value = undefined
  }
}, { deep: true })

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
      // The API returns the photos directly as an array in this case
      if (Array.isArray(response.data)) {
        media.value = response.data.sort((a, b) => a.order - b.order)
      } else {
        media.value = []
      }
    } else {
      error.value = response.message || 'Failed to load media'
      media.value = []
    }
  } catch {
    error.value = 'Network error while loading media'
    media.value = []
  } finally {
    loading.value = false
  }
}

const openUploadModal = () => {
  showUploadModal.value = true
}

const editMedia = (mediaItem: EventPhoto) => {
  selectedMedia.value = mediaItem
  showEditModal.value = true
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
      if (Array.isArray(media.value)) {
        media.value = media.value.filter(item => item.id !== mediaToDelete.value!.id)
      } else {
        media.value = []
      }
      showDeleteModal.value = false
      mediaToDelete.value = null
      // Emit updated media to parent
      emit('media-updated', media.value)
    } else {
      error.value = response.message || 'Failed to delete media'
    }
  } catch {
    error.value = 'Network error while deleting media'
  } finally {
    deleting.value = false
  }
}

const toggleFeatured = async (mediaItem: EventPhoto) => {
  if (!props.eventId) return
  
  try {
    const response = await mediaService.updateEventMedia(props.eventId, mediaItem.id, {
      is_featured: !mediaItem.is_featured
    })
    if (response.success && response.data) {
      // Update the item in the array
      const index = media.value.findIndex(item => item.id === mediaItem.id)
      if (index !== -1) {
        media.value[index] = response.data
        // Emit updated media to parent
        emit('media-updated', media.value)
      }
    } else {
      error.value = response.message || 'Failed to update featured status'
    }
  } catch {
    error.value = 'Network error while updating featured status'
  }
}

const handleMediaUploaded = (newMedia: EventPhoto) => {
  if (Array.isArray(media.value)) {
    media.value.push(newMedia)
    media.value.sort((a, b) => a.order - b.order)
  } else {
    media.value = [newMedia]
  }
  showUploadModal.value = false
  // Emit updated media to parent
  emit('media-updated', media.value)
}

const handleMediaUpdated = (updatedMedia: EventPhoto) => {
  if (Array.isArray(media.value)) {
    const index = media.value.findIndex(item => item.id === updatedMedia.id)
    if (index !== -1) {
      media.value[index] = updatedMedia
    }
  } else {
    media.value = [updatedMedia]
  }
  showEditModal.value = false
  selectedMedia.value = null
  // Emit updated media to parent
  emit('media-updated', media.value)
}

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
  if (!draggedMedia.value || !targetMedia || draggedMedia.value.id === targetMedia.id || !props.eventId) {
    draggedMedia.value = null
    return
  }

  // Ensure media.value is an array
  if (!Array.isArray(media.value)) {
    draggedMedia.value = null
    return
  }

  // Find both items in the current array
  const draggedIndex = media.value.findIndex(item => item.id === draggedMedia.value!.id)
  const targetIndex = media.value.findIndex(item => item.id === targetMedia.id)
  
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
    order: index
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
      error.value = response.message || 'Failed to reorder media'
    }
  } catch {
    // Rollback on failure - refetch media
    await fetchMedia()
    error.value = 'Network error while reordering media'
  } finally {
    draggedMedia.value = null
  }
}

// Lifecycle
onMounted(() => {
  fetchMedia()
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
</style>