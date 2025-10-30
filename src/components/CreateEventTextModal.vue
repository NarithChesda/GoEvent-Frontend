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
            <!-- Header (neutral to match Edit modal) -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <FileText class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Add Text Content</h2>
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
            <form @submit.prevent="createText" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <!-- Text Type and Language -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <!-- Text Type -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Text Type <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.text_type"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
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
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown class="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <!-- Language -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Language <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.language"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
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
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown class="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Title
                </label>
                <input
                  v-model="formData.title"
                  type="text"
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                  placeholder="Enter title for this text content"
                />
              </div>

              <!-- Content -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Content <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="formData.content"
                  rows="6"
                  required
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                  placeholder="Enter the text content..."
                ></textarea>
                <div class="mt-1 text-xs text-slate-500">
                  {{ formData.content.length }} characters
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading || !formData.text_type || !formData.language || !formData.content"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="loading"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ loading ? 'Creating...' : 'Create Text Content' }}
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
import { X, FileText, ChevronDown } from 'lucide-vue-next'
import { eventTextsService, type EventText, type CreateEventTextRequest } from '../services/api'

interface Props {
  eventId: string
}

interface Emits {
  close: []
  created: [text: EventText]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)

// Form data (minimal)
const formData = reactive<CreateEventTextRequest>({
  text_type: '',
  language: '',
  title: '',
  content: '',
})

// Methods
const createText = async () => {
  loading.value = true

  try {
    // Minimalist payload; keep status active
    const requestData: CreateEventTextRequest = {
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

    const response = await eventTextsService.createEventText(props.eventId, requestData)
    if (response.success && response.data) {
      emit('created', response.data)
    } else {
      alert(response.message || 'Failed to create text content')
    }
  } catch (error) {
    alert('Network error while creating text content')
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
