<template>
  <div class="space-y-6 sm:space-y-8">
    <div>
      <h4 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">Videos & Maps</h4>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">Embed YouTube videos and Google Maps location</p>
    </div>

    <!-- YouTube Embed -->
    <div class="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
      <div class="mb-3 sm:mb-4">
        <h5 class="text-sm sm:text-base font-semibold text-slate-900 mb-1.5 sm:mb-2">YouTube Video</h5>
        <p class="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">Embed a YouTube video for your event</p>
      </div>

      <div class="space-y-3 sm:space-y-4">
        <div>
          <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">YouTube Embed URL</label>
          <input
            v-model="formData.youtube_embed_link"
            type="url"
            :disabled="!canEdit"
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
            class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <p class="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
            Get this from YouTube → Share → Embed, then copy the src URL
          </p>
        </div>

        <!-- YouTube Preview -->
        <div v-if="formData.youtube_embed_link" class="relative">
          <iframe
            :src="formData.youtube_embed_link"
            class="w-full h-48 sm:h-56 md:h-64 rounded-xl sm:rounded-2xl"
            frameborder="0"
            allowfullscreen
          ></iframe>
          <button
            v-if="canEdit && eventData"
            @click="confirmRemoveYouTube"
            class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 sm:p-2 rounded-full transition-colors duration-200"
          >
            <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div v-else class="border-2 border-dashed border-slate-300 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <Youtube class="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-1.5 sm:mb-2" />
          <p class="text-xs sm:text-sm text-slate-600">No YouTube video embedded</p>
        </div>
      </div>
    </div>

    <!-- Google Maps Embed -->
    <div class="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
      <div class="mb-3 sm:mb-4">
        <h5 class="text-sm sm:text-base font-semibold text-slate-900 mb-1.5 sm:mb-2">Event Location</h5>
        <p class="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">Embed Google Maps to show your event location</p>
      </div>

      <div class="space-y-3 sm:space-y-4">
        <div>
          <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Google Maps Embed URL</label>
          <input
            v-model="formData.google_map_embed_link"
            type="url"
            :disabled="!canEdit"
            placeholder="https://www.google.com/maps/embed?pb=..."
            class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <p class="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
            Get this from Google Maps → Share → Embed a map, then copy the src URL
          </p>
        </div>

        <!-- Maps Preview -->
        <div v-if="formData.google_map_embed_link" class="relative">
          <iframe
            :src="formData.google_map_embed_link"
            class="w-full h-48 sm:h-56 md:h-64 rounded-xl sm:rounded-2xl"
            style="border: 0"
            allowfullscreen
            loading="lazy"
          ></iframe>
          <button
            v-if="canEdit && eventData"
            @click="confirmRemoveMap"
            class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 sm:p-2 rounded-full transition-colors duration-200"
          >
            <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div v-else class="border-2 border-dashed border-slate-300 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <MapPin class="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-1.5 sm:mb-2" />
          <p class="text-xs sm:text-sm text-slate-600">No location map embedded</p>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div v-if="canEdit && eventData && hasChanges" class="flex justify-end">
      <button
        @click="saveChanges"
        :disabled="saving"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-xl font-medium transition-all duration-300 sm:hover:scale-105 shadow-lg shadow-emerald-500/25 flex items-center space-x-1.5 sm:space-x-2 disabled:opacity-50"
      >
        <div
          v-if="saving"
          class="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        <Save v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
      </button>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccess" class="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
      <div class="flex items-center space-x-2 sm:space-x-3">
        <CheckCircle class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
        <p class="text-xs sm:text-sm text-green-700 font-medium">Embed links updated successfully!</p>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
      <div class="flex items-center space-x-2 sm:space-x-3">
        <AlertCircle class="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
        <p class="text-xs sm:text-sm text-red-700 font-medium">{{ error }}</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleting"
      :title="deleteModalData.title"
      :item-name="deleteModalData.itemName"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Youtube, MapPin, X, Save, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { eventsService, type Event } from '../services/api'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventData?: Event
  canEdit: boolean
}

interface Emits {
  updated: [event: Event]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const formData = ref({
  youtube_embed_link: props.eventData?.youtube_embed_link || '',
  google_map_embed_link: props.eventData?.google_map_embed_link || '',
})

const saving = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteModalData = ref({
  title: '',
  itemName: '',
  fieldToDelete: '',
})

// Computed
const hasChanges = computed(() => {
  if (!props.eventData) return false

  return (
    formData.value.youtube_embed_link !== (props.eventData.youtube_embed_link || '') ||
    formData.value.google_map_embed_link !== (props.eventData.google_map_embed_link || '')
  )
})

// Watch for prop changes
watch(
  () => props.eventData,
  (newEventData) => {
    if (newEventData) {
      formData.value = {
        youtube_embed_link: newEventData.youtube_embed_link || '',
        google_map_embed_link: newEventData.google_map_embed_link || '',
      }
    }
  },
  { immediate: true },
)

// Methods
const saveChanges = async () => {
  if (!props.eventData) return

  saving.value = true
  error.value = null
  showSuccess.value = false

  try {
    // Prepare data - convert empty strings to null for removal
    const updateData = {
      youtube_embed_link: formData.value.youtube_embed_link.trim() || null,
      google_map_embed_link: formData.value.google_map_embed_link.trim() || null,
    }

    const response = await eventsService.patchEvent(props.eventData.id, updateData)

    if (response.success && response.data) {
      emit('updated', response.data)
      showSuccess.value = true

      // Hide success message after 3 seconds
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    } else {
      error.value = response.message || 'Failed to update embed links'
    }
  } catch (err) {
    error.value = 'Network error while updating embed links'
  } finally {
    saving.value = false
  }
}

// Delete confirmation functions
const confirmRemoveYouTube = () => {
  deleteModalData.value = {
    title: 'Remove YouTube Video',
    itemName: 'YouTube Video Embed',
    fieldToDelete: 'youtube_embed_link',
  }
  showDeleteModal.value = true
}

const confirmRemoveMap = () => {
  deleteModalData.value = {
    title: 'Remove Google Map',
    itemName: 'Google Maps Embed',
    fieldToDelete: 'google_map_embed_link',
  }
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  if (!props.eventData) return

  deleting.value = true
  error.value = null
  showSuccess.value = false

  try {
    const updateData = {
      [deleteModalData.value.fieldToDelete]: null,
    }

    const response = await eventsService.patchEvent(props.eventData.id, updateData)

    if (response.success && response.data) {
      // Update local form data
      if (deleteModalData.value.fieldToDelete === 'youtube_embed_link') {
        formData.value.youtube_embed_link = ''
      } else if (deleteModalData.value.fieldToDelete === 'google_map_embed_link') {
        formData.value.google_map_embed_link = ''
      }

      emit('updated', response.data)
      showDeleteModal.value = false
      showSuccess.value = true

      // Hide success message after 3 seconds
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    } else {
      error.value = response.message || 'Failed to remove embed'
    }
  } catch (err) {
    error.value = 'Network error while removing embed'
  } finally {
    deleting.value = false
  }
}

// Validate URLs
const validateYouTubeUrl = (url: string): boolean => {
  if (!url) return true // Empty is valid
  // Updated pattern to allow query parameters and additional URL components
  const youtubeEmbedPattern = /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+(\?.*)?$/
  return youtubeEmbedPattern.test(url)
}

const validateGoogleMapsUrl = (url: string): boolean => {
  if (!url) return true // Empty is valid
  // Updated pattern to allow any query parameters after /embed
  const mapsEmbedPattern = /^https:\/\/www\.google\.com\/maps\/embed(\?.*)?$/
  return mapsEmbedPattern.test(url)
}

// Watch for URL validation
watch(
  () => formData.value.youtube_embed_link,
  (newValue) => {
    if (newValue && !validateYouTubeUrl(newValue)) {
      error.value =
        'Please enter a valid YouTube embed URL (https://www.youtube.com/embed/VIDEO_ID)'
    } else if (error.value?.includes('YouTube')) {
      error.value = null
    }
  },
)

watch(
  () => formData.value.google_map_embed_link,
  (newValue) => {
    if (newValue && !validateGoogleMapsUrl(newValue)) {
      error.value =
        'Please enter a valid Google Maps embed URL (https://www.google.com/maps/embed/...)'
    } else if (error.value?.includes('Google Maps')) {
      error.value = null
    }
  },
)
</script>
