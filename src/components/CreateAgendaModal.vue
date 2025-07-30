<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto" @click="$emit('close')">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <div class="flex min-h-full items-center justify-center p-4">
          <div 
            class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 class="text-xl font-bold text-slate-900">Create Agenda Item</h3>
                <p class="text-sm text-slate-600 mt-1">Add a new item to your event schedule</p>
              </div>
              <button
                @click="$emit('close')"
                class="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="createAgendaItem" class="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div class="p-6 space-y-6">
                <!-- Basic Information -->
                <div class="space-y-4">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <Calendar class="w-4 h-4 mr-2" />
                    Basic Information
                  </h4>
                  
                  <!-- Title -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Title <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.title"
                      type="text"
                      required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Enter agenda item title"
                    />
                  </div>

                  <!-- Description -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      v-model="formData.description"
                      rows="3"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
                      placeholder="Describe this agenda item"
                    ></textarea>
                  </div>

                  <!-- Agenda Type -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Type <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.agenda_type"
                      required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    >
                      <option value="session">Session</option>
                      <option value="keynote">Keynote</option>
                      <option value="workshop">Workshop</option>
                      <option value="panel">Panel Discussion</option>
                      <option value="break">Break</option>
                      <option value="networking">Networking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <!-- Schedule Information -->
                <div class="space-y-4">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <Clock class="w-4 h-4 mr-2" />
                    Schedule
                  </h4>
                  
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Date -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Date
                      </label>
                      <input
                        v-model="formData.date"
                        type="date"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      />
                    </div>

                    <!-- Start Time -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Start Time
                      </label>
                      <input
                        v-model="formData.start_time_text"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        placeholder="e.g., 9:00 AM"
                      />
                    </div>

                    <!-- End Time -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        End Time
                      </label>
                      <input
                        v-model="formData.end_time_text"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        placeholder="e.g., 10:00 AM"
                      />
                    </div>
                  </div>

                  <!-- Date Text -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Date Display Text
                    </label>
                    <input
                      v-model="formData.date_text"
                      type="text"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., Day 1 - Monday"
                    />
                  </div>
                </div>

                <!-- Location & Virtual -->
                <div class="space-y-4">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <MapPin class="w-4 h-4 mr-2" />
                    Location
                  </h4>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Physical Location -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Physical Location
                      </label>
                      <input
                        v-model="formData.location"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        placeholder="e.g., Conference Room A"
                      />
                    </div>

                    <!-- Virtual Link -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Virtual Link
                      </label>
                      <input
                        v-model="formData.virtual_link"
                        type="url"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                  </div>

                  <!-- Speaker -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Speaker(s)
                    </label>
                    <input
                      v-model="formData.speaker"
                      type="text"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., Dr. Jane Smith, CEO of TechCorp"
                    />
                  </div>
                </div>

                <!-- Display Options -->
                <div class="space-y-4">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <Palette class="w-4 h-4 mr-2" />
                    Display Options
                  </h4>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Color -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Theme Color
                      </label>
                      <div class="flex items-center space-x-3">
                        <input
                          v-model="formData.color"
                          type="color"
                          class="w-12 h-12 border border-gray-200 rounded-xl cursor-pointer"
                        />
                        <input
                          v-model="formData.color"
                          type="text"
                          class="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder="#3498db"
                        />
                      </div>
                    </div>

                    <!-- Featured -->
                    <div class="flex items-center space-x-3 pt-8">
                      <input
                        v-model="formData.is_featured"
                        type="checkbox"
                        id="is_featured"
                        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label for="is_featured" class="text-sm font-medium text-slate-700">
                        Mark as featured item
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Translations Section -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="font-semibold text-slate-900 flex items-center">
                      <Languages class="w-4 h-4 mr-2" />
                      Translations
                    </h4>
                    <button
                      type="button"
                      @click="showAddTranslation = true"
                      class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Plus class="w-4 h-4" />
                      <span>Add Translation</span>
                    </button>
                  </div>

                  <!-- Translation List -->
                  <div v-if="formData.translations && formData.translations.length > 0" class="space-y-3">
                    <div
                      v-for="(translation, index) in formData.translations"
                      :key="index"
                      class="bg-gray-50 rounded-xl p-4 relative"
                    >
                      <button
                        type="button"
                        @click="removeTranslation(index)"
                        class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X class="w-4 h-4" />
                      </button>
                      
                      <div class="space-y-3 pr-8">
                        <div>
                          <label class="block text-xs font-medium text-slate-600 mb-1">
                            Language: {{ getLanguageName(translation.language) }}
                          </label>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              v-model="translation.title"
                              type="text"
                              placeholder="Translated title"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.speaker"
                              type="text"
                              placeholder="Translated speaker"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <textarea
                          v-model="translation.description"
                          rows="2"
                          placeholder="Translated description"
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <!-- Add Translation Modal -->
                  <div v-if="showAddTranslation" class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h5 class="font-medium text-slate-900">Add Translation</h5>
                      <button
                        type="button"
                        @click="showAddTranslation = false"
                        class="text-gray-400 hover:text-gray-600"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div class="space-y-3">
                      <select
                        v-model="newTranslation.language"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select language</option>
                        <option v-for="lang in availableLanguages" :key="lang.code" :value="lang.code">
                          {{ lang.name }}
                        </option>
                      </select>
                      
                      <div class="flex space-x-2">
                        <button
                          type="button"
                          @click="addTranslation"
                          :disabled="!newTranslation.language"
                          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          @click="showAddTranslation = false"
                          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="px-6 py-3 text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading || !formData.title"
                  class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ loading ? 'Creating...' : 'Create Agenda Item' }}
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
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Palette, 
  Languages, 
  Plus 
} from 'lucide-vue-next'
import { agendaService, type CreateAgendaRequest, type EventAgendaItem, type AgendaTranslation } from '../services/api'

interface Props {
  eventId: string
}

interface Emits {
  close: []
  created: [item: EventAgendaItem]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const showAddTranslation = ref(false)

// Available languages (matching API documentation)
const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'kh', name: 'Khmer' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'th', name: 'Thai' },
  { code: 'vn', name: 'Vietnamese' }
]

// Form data
const formData = reactive<CreateAgendaRequest>({
  title: '',
  description: '',
  agenda_type: 'session',
  date: '',
  date_text: '',
  start_time_text: '',
  end_time_text: '',
  speaker: '',
  location: '',
  virtual_link: '',
  order: 0,
  is_featured: false,
  color: '#3498db',
  translations: []
})

// New translation
const newTranslation = reactive<Omit<AgendaTranslation, 'id' | 'agenda' | 'created_at' | 'updated_at'>>({
  language: '',
  title: '',
  description: '',
  date_text: '',
  start_time_text: '',
  end_time_text: '',
  speaker: ''
})

// Methods
const getLanguageName = (code: string) => {
  return availableLanguages.find(lang => lang.code === code)?.name || code
}

const addTranslation = () => {
  if (!newTranslation.language) return
  
  // Check if translation for this language already exists
  if (formData.translations?.some(t => t.language === newTranslation.language)) {
    alert('Translation for this language already exists')
    return
  }
  
  if (!formData.translations) {
    formData.translations = []
  }
  
  formData.translations.push({ ...newTranslation })
  
  // Reset form
  Object.assign(newTranslation, {
    language: '',
    title: '',
    description: '',
    date_text: '',
    start_time_text: '',
    end_time_text: '',
    speaker: ''
  })
  
  showAddTranslation.value = false
}

const removeTranslation = (index: number) => {
  if (formData.translations) {
    formData.translations.splice(index, 1)
  }
}

const createAgendaItem = async () => {
  loading.value = true
  
  try {
    const response = await agendaService.createAgendaItem(props.eventId, formData)
    if (response.success && response.data) {
      emit('created', response.data)
    } else {
      alert(response.message || 'Failed to create agenda item')
    }
  } catch (error) {
    console.error('Error creating agenda item:', error)
    alert('Network error while creating agenda item')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>