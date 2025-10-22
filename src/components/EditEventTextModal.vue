<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header (neutral to match CreateAgendaModal) -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <FileEdit class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Edit Text Content</h2>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="updateText" class="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div class="space-y-4 sm:space-y-5 md:space-y-6">
                <!-- Text Type and Language -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <!-- Text Type -->
                  <div>
                    <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                      Text Type <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.text_type"
                      required
                      class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22%23475569%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpolyline points%3D%226 9 12 15 18 9%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_0.5rem_center] bg-no-repeat pr-10"
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
                    <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                      Language <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.language"
                      required
                      class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22%23475569%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpolyline points%3D%226 9 12 15 18 9%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_0.5rem_center] bg-no-repeat pr-10"
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
                  <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Title (Optional)
                  </label>
                  <input
                    v-model="formData.title"
                    type="text"
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    placeholder="Enter an optional title"
                  />
                </div>

                <!-- Content -->
                <div>
                  <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Content <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    v-model="formData.content"
                    rows="6"
                    required
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                    placeholder="Enter the text content..."
                  ></textarea>
                  <div class="mt-1 text-xs text-slate-500">
                    {{ formData.content.length }} characters
                  </div>
                </div>

                <!-- Minimalist: removed order/active controls, info, and metadata -->
              </div>

              <!-- Action Buttons -->
              <div
                class="flex flex-row justify-end gap-2 sm:gap-3 md:gap-4 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200"
              >
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="
                    loading || !formData.text_type || !formData.language || !formData.content
                  "
                  class="flex-1 sm:flex-none px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg sm:rounded-xl font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 sm:hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <span
                    v-if="loading"
                    class="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
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
import { X, FileEdit } from 'lucide-vue-next'
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

// Form data - initialize with text data (minimal)
const formData = reactive({
  text_type: props.text.text_type,
  language: props.text.language,
  title: props.text.title || '',
  content: props.text.content || '',
})

// Methods
const updateText = async () => {
  loading.value = true

  try {
    // Build minimalist payload; keep status active
    const requestData = {
      text_type: formData.text_type,
      language: formData.language,
      title: formData.title,
      content: formData.content,
      is_active: true,
    }

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
