<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-3 sm:p-4">
          <div
            ref="modalRef"
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 sm:px-8 py-4 sm:py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 sm:space-x-3">
                  <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Edit class="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 class="text-lg sm:text-2xl font-bold">Edit Media</h2>
                    <p class="text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1">Update media information and settings</p>
                  </div>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6">
              <!-- Image Preview -->
              <div class="space-y-3 sm:space-y-4">
                <label class="block text-xs sm:text-sm font-semibold text-slate-700">Current Image</label>
                <div class="relative w-full max-w-md mx-auto">
                  <div class="aspect-square bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden">
                    <img
                      :src="media.image"
                      :alt="media.caption || 'Event media'"
                      class="w-full h-full object-cover"
                      @error="handleImageError"
                    />

                    <!-- Featured Badge -->
                    <div v-if="formData.is_featured" class="absolute top-2 left-2 sm:top-3 sm:left-3">
                      <span
                        class="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg"
                      >
                        <Star class="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                        Featured
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Form Fields -->
              <div class="space-y-3 sm:space-y-4">
                <!-- Caption -->
                <div>
                  <label for="caption" class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Caption
                  </label>
                  <input
                    id="caption"
                    v-model="formData.caption"
                    type="text"
                    placeholder="Enter a caption for this image"
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  />
                  <p class="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Describe what this image shows</p>
                </div>

                <!-- Featured Toggle -->
                <div class="flex items-start space-x-2 sm:space-x-3">
                  <input
                    id="is_featured"
                    v-model="formData.is_featured"
                    type="checkbox"
                    class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1e90ff] border-gray-300 rounded focus:ring-[#1e90ff] mt-0.5 sm:mt-1"
                  />
                  <div>
                    <label for="is_featured" class="text-xs sm:text-sm font-semibold text-slate-700">
                      Mark as featured content
                    </label>
                    <p class="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                      Featured images are highlighted and may appear in special sections
                    </p>
                  </div>
                </div>
              </div>

              <!-- Media Information -->
              <div class="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h4 class="text-xs sm:text-sm font-semibold text-slate-700">Media Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span class="text-slate-500">Upload Date:</span>
                    <span class="ml-1.5 sm:ml-2 text-slate-900">{{ formatDate(media.created_at) }}</span>
                  </div>
                  <div>
                    <span class="text-slate-500">Status:</span>
                    <span
                      :class="[
                        'ml-1.5 sm:ml-2 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-medium',
                        media.is_featured
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800',
                      ]"
                    >
                      {{ media.is_featured ? 'Featured' : 'Standard' }}
                    </span>
                  </div>
                </div>
                <div class="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">
                  <p>
                    <strong>Note:</strong> Use drag and drop in the media gallery to change the
                    display order.
                  </p>
                </div>
              </div>

              <!-- Error Display -->
              <div v-if="error" class="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl">
                <div class="flex items-start space-x-2 sm:space-x-3">
                  <AlertCircle class="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p class="text-xs sm:text-sm font-medium text-red-800">Update Error</p>
                    <p class="text-xs sm:text-sm text-red-600 mt-0.5 sm:mt-1">{{ error }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-4 p-4 sm:p-6 md:p-8 border-t border-gray-200"
            >
              <button
                type="button"
                @click="$emit('close')"
                :disabled="updating"
                class="flex-1 sm:flex-none px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="updateMedia"
                :disabled="updating || !hasChanges"
                class="flex-1 sm:flex-none px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg sm:rounded-xl font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 sm:hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                <div
                  v-if="updating"
                  class="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2"
                ></div>
                <Save v-else class="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                {{ updating ? 'Updating...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X, Star, Save, AlertCircle, Edit } from 'lucide-vue-next'
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

// Refs
const modalRef = ref<HTMLElement>()

// State
const formData = ref({
  caption: '',
  is_featured: false,
})

const updating = ref(false)
const error = ref<string | null>(null)

// Methods
const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

// Computed
const hasChanges = computed(() => {
  return (
    formData.value.caption !== (props.media.caption || '') ||
    formData.value.is_featured !== props.media.is_featured
  )
})

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
      minute: '2-digit',
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
      is_featured: formData.value.is_featured,
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
    is_featured: props.media.is_featured,
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
