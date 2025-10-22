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
            <!-- Header (neutral style) -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Calendar class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Create Agenda Item</h2>
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
            <form @submit.prevent="createAgendaItem" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div class="space-y-5">
                <!-- Basic Information -->
                <div class="space-y-3 sm:space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <Calendar class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
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
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      placeholder="Enter agenda item title"
                    />
                  </div>
                </div>

                <!-- Schedule Information -->
                <div class="space-y-3 sm:space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <Clock class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Schedule
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <!-- Date -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2"> Date </label>
                      <input
                        v-model="formData.date"
                        type="date"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
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
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="e.g., 9:00 AM"
                      />
                    </div>
                  </div>

                  <!-- More schedule options (collapsible) -->
                  <div class="rounded-xl border border-slate-200 bg-white/70">
                    <button
                      type="button"
                      class="w-full flex items-center justify-between px-4 py-3"
                      @click="scheduleMoreOpen = !scheduleMoreOpen"
                      :aria-expanded="scheduleMoreOpen ? 'true' : 'false'"
                      aria-controls="schedule-more-section"
                    >
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-slate-700">More Schedule Options</span>
                        <span class="hidden sm:inline text-xs text-slate-500">End time and date text</span>
                      </div>
                      <svg
                        class="h-4 w-4 text-slate-500 transition-transform"
                        :class="scheduleMoreOpen ? 'rotate-180' : ''"
                        viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    <Transition name="collapse">
                      <div v-show="scheduleMoreOpen" id="schedule-more-section" class="px-4 pb-4 space-y-3">
                        <!-- End Time -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            End Time
                          </label>
                          <input
                            v-model="formData.end_time_text"
                            type="text"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            placeholder="e.g., 10:00 AM"
                          />
                        </div>

                        <!-- Date Text -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            Date Display Text
                          </label>
                          <input
                            v-model="formData.date_text"
                            type="text"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            placeholder="e.g., Day 1 - Monday"
                          />
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>

                <!-- Additional Details (collapsible) -->
                <div class="rounded-xl border border-slate-200 bg-white/70">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-4 py-3"
                    @click="detailsOpen = !detailsOpen"
                    :aria-expanded="detailsOpen ? 'true' : 'false'"
                    aria-controls="details-section"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-slate-700">Additional Details</span>
                      <span class="hidden sm:inline text-xs text-slate-500">Description and type</span>
                    </div>
                    <svg
                      class="h-4 w-4 text-slate-500 transition-transform"
                      :class="detailsOpen ? 'rotate-180' : ''"
                      viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <Transition name="collapse">
                    <div v-show="detailsOpen" id="details-section" class="px-4 pb-4 space-y-3">
                      <!-- Description -->
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          Description
                        </label>
                        <textarea
                          v-model="formData.description"
                          rows="3"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                          placeholder="Describe this agenda item"
                        ></textarea>
                      </div>

                      <!-- Agenda Type -->
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          Type
                        </label>
                        <select
                          v-model="formData.agenda_type"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
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
                  </Transition>
                </div>

                <!-- Location & Speaker (collapsible) -->
                <div class="rounded-xl border border-slate-200 bg-white/70">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-4 py-3"
                    @click="locationOpen = !locationOpen"
                    :aria-expanded="locationOpen ? 'true' : 'false'"
                    aria-controls="location-section"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-slate-700">Location & Speaker</span>
                      <span class="hidden sm:inline text-xs text-slate-500">Optional</span>
                    </div>
                    <svg
                      class="h-4 w-4 text-slate-500 transition-transform"
                      :class="locationOpen ? 'rotate-180' : ''"
                      viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <Transition name="collapse">
                    <div v-show="locationOpen" id="location-section" class="px-4 pb-4 space-y-3">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <!-- Physical Location -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            Physical Location
                          </label>
                          <input
                            v-model="formData.location"
                            type="text"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
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
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
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
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                          placeholder="e.g., Dr. Jane Smith, CEO of TechCorp"
                        />
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Display Options (collapsible) -->
                <div class="rounded-xl border border-slate-200 bg-white/70">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-4 py-3"
                    @click="displayOpen = !displayOpen"
                    :aria-expanded="displayOpen ? 'true' : 'false'"
                    aria-controls="display-section"
                  >
                    <div class="flex items-center gap-2">
                      <Palette class="w-3.5 h-3.5 mr-1.5" />
                      <span class="text-sm font-medium text-slate-700">Display Options</span>
                    </div>
                    <svg
                      class="h-4 w-4 text-slate-500 transition-transform"
                      :class="displayOpen ? 'rotate-180' : ''"
                      viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <Transition name="collapse">
                    <div v-show="displayOpen" id="display-section" class="px-4 pb-4 space-y-3">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <!-- Color -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            Theme Color
                          </label>
                          <div class="flex items-center gap-3">
                            <input
                              v-model="formData.color"
                              type="color"
                              class="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer"
                            />
                            <input
                              v-model="formData.color"
                              type="text"
                              class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
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
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200 flex items-center justify-between bg-white/90"
                          >
                            <div class="flex items-center gap-3">
                              <div
                                v-if="getSelectedIcon()"
                                class="w-7 h-7 flex items-center justify-center"
                                v-html="getSelectedIcon()?.svg_code"
                              ></div>
                              <Sparkles v-else class="w-5 h-5 text-slate-400" />
                              <span class="text-slate-700">{{
                                getSelectedIcon()?.name || 'Select an icon'
                              }}</span>
                            </div>
                            <ChevronDown class="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </div>

                      <!-- Featured Checkbox -->
                      <div class="flex items-center gap-3">
                        <input
                          v-model="formData.is_featured"
                          type="checkbox"
                          id="is_featured"
                          class="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-200"
                        />
                        <label for="is_featured" class="text-sm font-medium text-slate-700">
                          Mark as featured item
                        </label>
                      </div>

                      <!-- Icon Picker Modal -->
                      <div
                        v-if="showIconPicker"
                        class="bg-slate-50 border border-slate-200 rounded-xl p-4"
                      >
                        <div class="flex items-center justify-between mb-4">
                          <h5 class="font-medium text-slate-900">Select Icon</h5>
                          <button
                            type="button"
                            @click="showIconPicker = false"
                            class="text-slate-400 hover:text-slate-600"
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
                                ? 'border-sky-500 bg-sky-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            "
                          >
                            <X class="w-6 h-6 mx-auto text-slate-400" />
                            <p class="text-xs mt-1 text-slate-600">None</p>
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
                                ? 'border-sky-500 bg-sky-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            "
                            :title="icon.name"
                          >
                            <div class="w-6 h-6 mx-auto" v-html="icon.svg_code"></div>
                            <p class="text-xs mt-1 text-slate-600 truncate">{{ icon.name }}</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Transition>
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
                              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.start_time_text"
                              type="text"
                              placeholder="Translated start time"
                              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                            />
                          </div>
                        </div>
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
                  :disabled="loading || !formData.title"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="loading"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
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
} from 'lucide-vue-next'
import {
  agendaService,
  coreDataService,
  type CreateAgendaRequest,
  type EventAgendaItem,
  type AgendaTranslation,
  type AgendaIcon,
} from '../services/api'

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
const availableIcons = ref<AgendaIcon[]>([])
const showIconPicker = ref(false)
const detailsOpen = ref(false)
const locationOpen = ref(false)
const displayOpen = ref(false)
const scheduleMoreOpen = ref(false)

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
  icon_id: null,
  translations: [],
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
  if (formData.translations?.some((t) => t.language === newTranslation.language)) {
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
    speaker: '',
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

// Lifecycle
onMounted(() => {
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

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
