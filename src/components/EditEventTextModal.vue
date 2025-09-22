<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto" @click="$emit('close')">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <FileEdit class="w-5 h-5" />
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold">Edit Text Content</h2>
                    <p class="text-blue-100 mt-1">Update your event text content</p>
                  </div>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="updateText" class="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div class="p-6 space-y-6">
                <!-- Text Type and Language -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Text Type -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Text Type <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.text_type"
                      required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    >
                      <option value="">Select type</option>
                      <option value="cover_header">Cover Header</option>
                      <option value="welcome_message">Welcome Message</option>
                      <option value="instructions">Instructions</option>
                      <option value="description">Description</option>
                      <option value="short_description">Short Description</option>
                      <option value="date_text">Date Text</option>
                      <option value="time_text">Time Text</option>
                      <option value="location_text">Location Text</option>
                      <option value="thank_you_message">Thank You Message</option>
                      <option value="custom">Custom Content</option>
                    </select>
                  </div>

                  <!-- Language -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Language <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.language"
                      required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    >
                      <option value="">Select language</option>
                      <option value="en">English</option>
                      <option value="kh">Khmer</option>
                      <option value="fr">French</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="zh-cn">Chinese (Simplified)</option>
                      <option value="th">Thai</option>
                      <option value="vn">Vietnamese</option>
                    </select>
                  </div>
                </div>

                <!-- Title -->
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    v-model="formData.title"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    placeholder="Enter title for this text content"
                  />
                </div>

                <!-- Content -->
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Content <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    v-model="formData.content"
                    rows="6"
                    required
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                    placeholder="Enter the text content..."
                  ></textarea>
                  <div class="mt-1 text-xs text-slate-500">
                    {{ formData.content.length }} characters
                  </div>
                </div>

                <!-- Order and Status -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Order -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Display Order
                    </label>
                    <input
                      v-model.number="formData.order"
                      type="number"
                      min="0"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      placeholder="0"
                    />
                    <div class="mt-1 text-xs text-slate-500">Lower numbers appear first</div>
                  </div>

                  <!-- Active Status -->
                  <div class="flex items-center pt-8">
                    <input
                      v-model="formData.is_active"
                      type="checkbox"
                      id="is_active_edit"
                      class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label for="is_active_edit" class="ml-2 text-sm font-semibold text-slate-700">
                      Active (visible to users)
                    </label>
                  </div>
                </div>

                <!-- Type Description -->
                <div
                  v-if="formData.text_type"
                  class="bg-blue-50 border border-blue-200 rounded-xl p-4"
                >
                  <div class="flex items-start">
                    <Info class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 class="text-sm font-medium text-blue-900 mb-1">
                        {{ getTypeTitle(formData.text_type) }}
                      </h4>
                      <p class="text-sm text-blue-700">
                        {{ getTypeDescription(formData.text_type) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Metadata -->
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div class="flex items-center justify-between text-sm text-slate-600">
                    <div class="flex items-center space-x-4">
                      <span>ID: {{ text.id }}</span>
                      <span v-if="text.created_at">Created: {{ formatDate(text.created_at) }}</span>
                    </div>
                    <span v-if="text.updated_at">Updated: {{ formatDate(text.updated_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div
                class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 p-8"
              >
                <button
                  type="button"
                  @click="$emit('close')"
                  class="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="
                    loading || !formData.text_type || !formData.language || !formData.content
                  "
                  class="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <Loader v-if="loading" class="w-5 h-5 mr-2 animate-spin" />
                  {{ loading ? 'Updating...' : 'Update Text Content' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { X, Info, FileEdit, Loader } from 'lucide-vue-next'
import { eventTextsService, type EventText } from '../services/api'

interface Props {
  eventId: string
  text: EventText
}

interface Emits {
  close: []
  updated: [text: EventText]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)

// Form data - initialize with text data
const formData = reactive({
  text_type: props.text.text_type,
  language: props.text.language,
  title: props.text.title,
  content: props.text.content,
  order: props.text.order,
  is_active: props.text.is_active,
})

// Methods
const updateText = async () => {
  loading.value = true

  try {
    const requestData = { ...formData }

    // Clean up empty title
    if (!requestData.title?.trim()) {
      requestData.title = ''
    }

    const response = await eventTextsService.updateEventText(
      props.eventId,
      props.text.id,
      requestData,
    )
    if (response.success && response.data) {
      emit('updated', response.data)
    } else {
      alert(response.message || 'Failed to update text content')
    }
  } catch (error) {
    alert('Network error while updating text content')
  } finally {
    loading.value = false
  }
}

const getTypeTitle = (textType: string): string => {
  const titles: Record<string, string> = {
    welcome_message: 'Welcome Message',
    instructions: 'Instructions',
    description: 'Description',
    short_description: 'Short Description',
    date_text: 'Date Text',
    time_text: 'Time Text',
    location_text: 'Location Text',
    thank_you_message: 'Thank You Message',
    custom: 'Custom Content',
  }
  return titles[textType] || textType
}

const getTypeDescription = (textType: string): string => {
  const descriptions: Record<string, string> = {
    welcome_message: 'Greeting message displayed to attendees when they view the event.',
    instructions: 'Important guidelines, rules, or step-by-step directions for attendees.',
    description: 'Detailed information about the event, its purpose, and what to expect.',
    short_description: 'Brief summary of the event for previews and cards.',
    date_text: 'Human-readable date information (e.g., "3 days", "August 15-17").',
    time_text: 'Human-readable time information (e.g., "9 AM - 5 PM PST").',
    location_text: 'Venue or location details beyond the basic address.',
    thank_you_message: 'Message shown after registration or event completion.',
    custom: 'Any other type of content specific to your event needs.',
  }
  return descriptions[textType] || 'Custom text content for your event.'
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}
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
