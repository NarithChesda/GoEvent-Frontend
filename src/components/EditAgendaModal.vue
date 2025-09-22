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
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-8 py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Edit2 class="w-5 h-5" />
                  </div>
                  <h2 class="text-2xl font-bold">Edit Agenda Item</h2>
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
            <form @submit.prevent="updateAgendaItem" class="p-8 space-y-6">
              <div class="space-y-6">
                <!-- Basic Information -->
                <div class="space-y-4">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <Calendar class="w-4 h-4 mr-2" />
                    Basic Information
                  </h4>

                  <!-- Title -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Title <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.title"
                      type="text"
                      required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      placeholder="Enter agenda item title"
                    />
                  </div>

                  <!-- Description -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      v-model="formData.description"
                      rows="3"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                      placeholder="Describe this agenda item"
                    ></textarea>
                  </div>

                  <!-- Agenda Type -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Type <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="formData.agenda_type"
                      required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
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
                      <label class="block text-sm font-medium text-slate-700 mb-2"> Date </label>
                      <input
                        v-model="formData.date"
                        type="date"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                          class="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
                          placeholder="#3498db"
                        />
                      </div>
                    </div>

                    <!-- Icon Selection -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2"> Icon </label>
                      <button
                        type="button"
                        @click="showIconPicker = true"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                      >
                        <div class="flex items-center space-x-3">
                          <div
                            v-if="getSelectedIcon()"
                            class="w-8 h-8 flex items-center justify-center"
                            v-html="getSelectedIcon()?.svg_code"
                          ></div>
                          <Sparkles v-else class="w-5 h-5 text-gray-400" />
                          <span class="text-slate-700">{{
                            getSelectedIcon()?.name || 'Select an icon'
                          }}</span>
                        </div>
                        <ChevronDown class="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <!-- Featured Checkbox -->
                  <div class="flex items-center space-x-3">
                    <input
                      v-model="formData.is_featured"
                      type="checkbox"
                      id="is_featured"
                      class="w-4 h-4 text-[#1e90ff] border-gray-300 rounded focus:ring-[#1e90ff]"
                    />
                    <label for="is_featured" class="text-sm font-medium text-slate-700">
                      Mark as featured item
                    </label>
                  </div>

                  <!-- Icon Picker Modal -->
                  <div
                    v-if="showIconPicker"
                    class="bg-gray-50 border border-gray-200 rounded-xl p-4"
                  >
                    <div class="flex items-center justify-between mb-4">
                      <h5 class="font-medium text-slate-900">Select Icon</h5>
                      <button
                        type="button"
                        @click="showIconPicker = false"
                        class="text-gray-400 hover:text-gray-600"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>

                    <div class="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                      <!-- No Icon Option -->
                      <button
                        type="button"
                        @click="selectIcon(null)"
                        class="p-3 rounded-lg border-2 transition-all duration-200"
                        :class="
                          formData.icon_id === null
                            ? 'border-[#1e90ff] bg-[#E6F4FF]'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        "
                      >
                        <X class="w-6 h-6 mx-auto text-gray-400" />
                        <p class="text-xs mt-1 text-gray-600">None</p>
                      </button>

                      <!-- Available Icons -->
                      <button
                        v-for="icon in availableIcons"
                        :key="icon.id"
                        type="button"
                        @click="selectIcon(icon.id)"
                        class="p-3 rounded-lg border-2 transition-all duration-200"
                        :class="
                          formData.icon_id === icon.id
                            ? 'border-[#1e90ff] bg-[#E6F4FF]'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        "
                        :title="icon.name"
                      >
                        <div class="w-6 h-6 mx-auto" v-html="icon.svg_code"></div>
                        <p class="text-xs mt-1 text-gray-600 truncate">{{ icon.name }}</p>
                      </button>
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
                      class="text-[#1e90ff] hover:text-[#1873cc] text-sm font-medium flex items-center space-x-1"
                    >
                      <Plus class="w-4 h-4" />
                      <span>Add Translation</span>
                    </button>
                  </div>

                  <!-- Translation List -->
                  <div
                    v-if="formData.translations && formData.translations.length > 0"
                    class="space-y-3"
                  >
                    <div
                      v-for="(translation, index) in formData.translations"
                      :key="translation.id || index"
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
                        <div class="flex items-center justify-between">
                          <label class="block text-xs font-medium text-slate-600">
                            Language: {{ getLanguageName(translation.language) }}
                          </label>
                          <span
                            v-if="translation.id"
                            class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full"
                          >
                            Saved
                          </span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              v-model="translation.title"
                              type="text"
                              placeholder="Translated title"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.speaker"
                              type="text"
                              placeholder="Translated speaker"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <input
                              v-model="translation.date_text"
                              type="text"
                              placeholder="Translated date text"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.start_time_text"
                              type="text"
                              placeholder="Translated start time"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.end_time_text"
                              type="text"
                              placeholder="Translated end time"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                            />
                          </div>
                        </div>

                        <textarea
                          v-model="translation.description"
                          rows="2"
                          placeholder="Translated description"
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <!-- Add Translation Modal -->
                  <div
                    v-if="showAddTranslation"
                    class="bg-[#E6F4FF] border border-[#87CEEB] rounded-xl p-4"
                  >
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
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                      >
                        <option value="">Select language</option>
                        <option
                          v-for="lang in availableLanguages"
                          :key="lang.code"
                          :value="lang.code"
                        >
                          {{ lang.name }}
                        </option>
                      </select>

                      <div class="flex space-x-2">
                        <button
                          type="button"
                          @click="addTranslation"
                          :disabled="!newTranslation.language"
                          class="px-4 py-2 bg-[#1e90ff] text-white rounded-lg hover:bg-[#1873cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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

              <!-- Action Buttons -->
              <div
                class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200"
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
                  :disabled="loading || !formData.title"
                  class="px-8 py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <span
                    v-if="loading"
                    class="w-5 h-5 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ loading ? 'Updating...' : 'Update Agenda Item' }}
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
import { ref, reactive, onMounted } from 'vue'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Palette,
  Languages,
  Plus,
  Sparkles,
  ChevronDown,
  Edit2,
} from 'lucide-vue-next'
import {
  agendaService,
  coreDataService,
  type EventAgendaItem,
  type AgendaTranslation,
  type AgendaIcon,
} from '../services/api'

interface Props {
  eventId: string
  item: EventAgendaItem
}

interface Emits {
  close: []
  updated: [item: EventAgendaItem]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const showAddTranslation = ref(false)
const availableIcons = ref<AgendaIcon[]>([])
const showIconPicker = ref(false)

// Available languages (matching API documentation)
const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'kh', name: 'Khmer' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'th', name: 'Thai' },
  { code: 'vn', name: 'Vietnamese' },
]

// Form data - initialize with item data
const formData = reactive({
  title: props.item.title,
  description: props.item.description,
  agenda_type: props.item.agenda_type,
  date: props.item.date,
  date_text: props.item.date_text,
  start_time_text: props.item.start_time_text,
  end_time_text: props.item.end_time_text,
  speaker: props.item.speaker,
  location: props.item.location,
  virtual_link: props.item.virtual_link,
  order: props.item.order,
  is_featured: props.item.is_featured,
  color: props.item.color,
  icon_id: props.item.icon?.id || null,
  translations: [...props.item.translations], // Create a copy
})

// New translation
const newTranslation = reactive<
  Omit<AgendaTranslation, 'id' | 'agenda' | 'created_at' | 'updated_at'>
>({
  language: '',
  title: '',
  description: '',
  date_text: '',
  start_time_text: '',
  end_time_text: '',
  speaker: '',
})

// Computed
const availableLanguagesForAdd = ref(
  availableLanguages.filter((lang) => !formData.translations.some((t) => t.language === lang.code)),
)

// Methods
const fetchIcons = async () => {
  try {
    const response = await coreDataService.getIcons()
    if (response.success && response.data) {
      availableIcons.value = response.data
    }
  } catch (error) {
    console.error('Error fetching icons:', error)
  }
}

const getSelectedIcon = () => {
  return availableIcons.value.find((icon) => icon.id === formData.icon_id)
}

const selectIcon = (iconId: number | null) => {
  formData.icon_id = iconId
  showIconPicker.value = false
}

const getLanguageName = (code: string) => {
  return availableLanguages.find((lang) => lang.code === code)?.name || code
}

const addTranslation = () => {
  if (!newTranslation.language) return

  // Check if translation for this language already exists
  if (formData.translations.some((t) => t.language === newTranslation.language)) {
    alert('Translation for this language already exists')
    return
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
    speaker: '',
  })

  // Update available languages
  availableLanguagesForAdd.value = availableLanguages.filter(
    (lang) => !formData.translations.some((t) => t.language === lang.code),
  )

  showAddTranslation.value = false
}

const removeTranslation = (index: number) => {
  formData.translations.splice(index, 1)

  // Update available languages
  availableLanguagesForAdd.value = availableLanguages.filter(
    (lang) => !formData.translations.some((t) => t.language === lang.code),
  )
}

const updateAgendaItem = async () => {
  loading.value = true

  try {
    // Clean the translations data - remove server-generated fields
    const cleanedTranslations = formData.translations.map((translation) => ({
      language: translation.language,
      title: translation.title || '',
      description: translation.description || '',
      date_text: translation.date_text || '',
      start_time_text: translation.start_time_text || '',
      end_time_text: translation.end_time_text || '',
      speaker: translation.speaker || '',
      // Note: 'agenda' field is now excluded from serializer, no need to include it
    }))

    // Build request data - always include translations array to ensure deletions are handled
    // The API replaces ALL existing translations when translations array is provided
    const requestData = { ...formData }

    const validTranslations = cleanedTranslations.filter(
      (t) => t.language && t.language.trim() !== '',
    )

    // Always set translations array (even if empty) to ensure server sync
    requestData.translations = validTranslations

    const response = await agendaService.updateAgendaItem(props.eventId, props.item.id, requestData)
    if (response.success && response.data) {
      emit('updated', response.data)
    } else {
      alert(response.message || 'Failed to update agenda item')
    }
  } catch (error) {
    alert('Network error while updating agenda item')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Update available languages on mount
  availableLanguagesForAdd.value = availableLanguages.filter(
    (lang) => !formData.translations.some((t) => t.language === lang.code),
  )

  // Fetch available icons
  fetchIcons()
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
