<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="true" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Transition name="modal-content">
          <div v-if="true" class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 class="text-xl font-bold text-slate-900">Edit Media</h2>
                <p class="text-sm text-slate-600 mt-1">Update media information and settings</p>
              </div>
              <button
                @click="$emit('close')"
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors duration-200"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-6 space-y-6">
              <!-- Image Preview -->
              <div class="space-y-4">
                <label class="block text-sm font-medium text-slate-700">Current Image</label>
                <div class="relative w-full max-w-md mx-auto">
                  <div class="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                    <img
                      :src="media.image"
                      :alt="media.caption || 'Event media'"
                      class="w-full h-full object-cover"
                      @error="handleImageError"
                    />
                    
                    <!-- Featured Badge -->
                    <div v-if="formData.is_featured" class="absolute top-3 left-3">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                        <Star class="w-3 h-3 mr-1" />
                        Featured
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Form Fields -->
              <div class="space-y-4">
                <!-- Caption -->
                <div>
                  <label for="caption" class="block text-sm font-medium text-slate-700 mb-2">
                    Caption
                  </label>
                  <input
                    id="caption"
                    v-model="formData.caption"
                    type="text"
                    placeholder="Enter a caption for this image"
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                  <p class="text-xs text-slate-500 mt-1">Describe what this image shows</p>
                </div>

                <!-- Featured Toggle -->
                <div class="flex items-start space-x-3">
                  <input
                    id="is_featured"
                    v-model="formData.is_featured"
                    type="checkbox"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <label for="is_featured" class="text-sm font-medium text-slate-700">
                      Mark as featured content
                    </label>
                    <p class="text-xs text-slate-500 mt-1">Featured images are highlighted and may appear in special sections</p>
                  </div>
                </div>
              </div>

              <!-- Media Information -->
              <div class="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 class="text-sm font-medium text-slate-700">Media Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-slate-500">Upload Date:</span>
                    <span class="ml-2 text-slate-900">{{ formatDate(media.created_at) }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500">Status:</span>
                    <span :class="[
                      'ml-2 px-2 py-0.5 rounded-full text-xs font-medium',
                      media.is_featured 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    ]">
                      {{ media.is_featured ? 'Featured' : 'Standard' }}
                    </span>
                  </div>
                </div>
                <div class="text-xs text-slate-500 mt-2">
                  <p><strong>Note:</strong> Use drag and drop in the media gallery to change the display order.</p>
                </div>
              </div>

              <!-- Error Display -->
              <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div class="flex items-start space-x-3">
                  <AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-medium text-red-800">Update Error</p>
                    <p class="text-sm text-red-600 mt-1">{{ error }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                @click="$emit('close')"
                :disabled="updating"
                class="px-6 py-3 bg-white hover:bg-gray-50 text-slate-700 border border-gray-300 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                @click="updateMedia"
                :disabled="updating || !hasChanges"
                class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:hover:scale-100 flex items-center space-x-2"
              >
                <div v-if="updating" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <Save v-else class="w-4 h-4" />
                <span>{{ updating ? 'Updating...' : 'Save Changes' }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X, Star, Save, AlertCircle } from 'lucide-vue-next'
import { mediaService, type EventPhoto } from '../services/api'

interface Props {
  eventId: string
  media: EventPhoto
}

interface Emits {
  close: []
  updated: [media: EventPhoto]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const formData = ref({
  caption: '',
  is_featured: false
})

const updating = ref(false)
const error = ref<string | null>(null)

// Computed
const hasChanges = computed(() => {
  return (
    formData.value.caption !== (props.media.caption || '') ||
    formData.value.is_featured !== props.media.is_featured
  )
})

// Methods
const handleImageError = () => {
  console.error('Failed to load media image')
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

const updateMedia = async () => {
  if (!hasChanges.value) return
  
  updating.value = true
  error.value = null
  
  try {
    const response = await mediaService.updateEventMedia(props.eventId, props.media.id, {
      caption: formData.value.caption || undefined,
      is_featured: formData.value.is_featured
    })
    
    if (response.success && response.data) {
      emit('updated', response.data)
    } else {
      error.value = response.message || 'Failed to update media'
    }
  } catch {
    error.value = 'Network error while updating media'
  } finally {
    updating.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Initialize form with current media data
  formData.value = {
    caption: props.media.caption || '',
    is_featured: props.media.is_featured
  }
})
</script>

<style scoped>
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-content-enter-active,
.modal-content-leave-active {
  transition: all 0.3s ease;
}

.modal-content-enter-from,
.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}
</style>