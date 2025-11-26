<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[580px] lg:w-[640px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-semibold text-white">
                  Event Text Content
                </h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- General error banner -->
          <div
            v-if="generalError"
            class="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          >
            <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-red-700">{{ generalError }}</p>
              <button
                type="button"
                @click="generalError = ''"
                class="text-xs text-red-600 hover:text-red-700 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent class="p-4 space-y-5 pb-24">
            <!-- Language Tabs Section -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-slate-900 flex items-center">
                  <Languages class="w-4 h-4 mr-2" />
                  Language
                </h4>
                <button
                  type="button"
                  @click="showAddLanguage = true"
                  class="text-[#1e90ff] hover:text-[#1873cc] text-sm font-medium flex items-center space-x-1"
                >
                  <Plus class="w-4 h-4" />
                  <span>Add Language</span>
                </button>
              </div>

              <!-- Language Tab Headers -->
              <div role="tablist" aria-label="Event text languages" class="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
                <button
                  v-for="lang in availableLanguages"
                  :key="lang"
                  type="button"
                  role="tab"
                  :id="'tab-' + lang"
                  :aria-selected="activeLanguage === lang"
                  :aria-controls="'tabpanel-' + lang"
                  :tabindex="activeLanguage === lang ? 0 : -1"
                  @click="activeLanguage = lang"
                  :class="[
                    'flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative group',
                    activeLanguage === lang
                      ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  ]"
                >
                  <span class="flex items-center gap-2">
                    <span>{{ getLanguageName(lang) }}</span>
                    <span v-if="lang === 'en'" class="text-xs text-slate-500">(Default)</span>
                    <button
                      v-if="lang !== 'en' && canRemoveLanguage(lang)"
                      type="button"
                      @click.stop="removeLanguage(lang)"
                      :aria-label="'Remove ' + getLanguageName(lang)"
                      class="opacity-0 group-hover:opacity-100 transition-opacity"
                      :class="activeLanguage === lang ? 'opacity-100' : ''"
                    >
                      <X class="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                    </button>
                  </span>
                </button>
              </div>

              <!-- Add Language Popup -->
              <div
                v-if="showAddLanguage"
                class="bg-[#E6F4FF] border border-[#87CEEB] rounded-xl p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <h5 class="font-medium text-slate-900">Add Language</h5>
                  <button
                    type="button"
                    @click="showAddLanguage = false"
                    class="text-gray-400 hover:text-gray-600"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Select Language
                    </label>
                    <div class="relative">
                      <select
                        v-model="newLanguage"
                        class="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Choose a language...</option>
                        <option
                          v-for="lang in languagesForAdd"
                          :key="lang.code"
                          :value="lang.code"
                        >
                          {{ lang.name }}
                        </option>
                      </select>
                      <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div class="flex space-x-2">
                    <button
                      type="button"
                      @click="addLanguage"
                      :disabled="!newLanguage"
                      class="px-4 py-2 bg-[#1e90ff] text-white rounded-lg hover:bg-[#1873cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Add Language
                    </button>
                    <button
                      type="button"
                      @click="showAddLanguage = false"
                      class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Text Type Fields for Active Language -->
            <div
              v-for="lang in availableLanguages"
              :key="lang"
              v-show="activeLanguage === lang"
              role="tabpanel"
              :id="'tabpanel-' + lang"
              :aria-labelledby="'tab-' + lang"
              tabindex="0"
              class="space-y-4"
            >
              <div class="text-sm text-slate-500 mb-4">
                Edit text content for <span class="font-medium text-slate-700">{{ getLanguageName(lang) }}</span>
              </div>

              <!-- Text Type Sections -->
              <div
                v-for="textType in TEXT_TYPES"
                :key="textType.value"
                class="border border-slate-200 rounded-xl overflow-hidden"
              >
                <!-- Section Header -->
                <button
                  type="button"
                  @click="toggleSection(lang, textType.value)"
                  class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <component
                      :is="textType.icon"
                      class="w-4 h-4 text-[#1e90ff]"
                      aria-hidden="true"
                    />
                    <span class="text-sm font-medium text-slate-900">{{ textType.label }}</span>
                    <span
                      v-if="hasContent(lang, textType.value)"
                      class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700"
                    >
                      Has content
                    </span>
                  </div>
                  <ChevronDown
                    class="w-4 h-4 text-slate-400 transition-transform"
                    :class="{ 'rotate-180': isSectionOpen(lang, textType.value) }"
                  />
                </button>

                <!-- Section Content (Expanded) -->
                <div
                  v-if="isSectionOpen(lang, textType.value)"
                  class="p-4 space-y-3 border-t border-slate-200"
                >
                  <!-- Title -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">
                      Title
                      <span class="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      v-model="getTextData(lang, textType.value).title"
                      type="text"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                      :placeholder="'Enter title for ' + textType.label.toLowerCase()"
                    />
                  </div>

                  <!-- Content -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">
                      Content
                    </label>
                    <textarea
                      v-model="getTextData(lang, textType.value).content"
                      rows="4"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white resize-none"
                      :placeholder="'Enter ' + textType.label.toLowerCase() + ' content...'"
                    ></textarea>
                    <div class="mt-1 text-xs text-slate-500">
                      {{ getTextData(lang, textType.value).content?.length || 0 }} characters
                    </div>
                  </div>

                  <!-- Delete button if this text exists in database -->
                  <div
                    v-if="getTextData(lang, textType.value).id"
                    class="pt-2 border-t border-slate-100"
                  >
                    <button
                      type="button"
                      @click="deleteText(lang, textType.value)"
                      class="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                      <span>Delete this text</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              @click="saveAllChanges"
              :disabled="loading || !hasChanges"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ loading ? 'Saving...' : 'Save Changes' }}</span>
            </button>

            <button
              type="button"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
        <Transition name="slide-up">
          <div v-if="message" class="absolute bottom-16 left-4 right-4 z-10">
            <div
              :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
              class="text-white px-3 py-2.5 rounded-lg shadow-lg flex items-center"
            >
              <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 mr-2 flex-shrink-0" />
              <AlertCircle v-else class="w-4 h-4 mr-2 flex-shrink-0" />
              <span class="text-xs">{{ message.text }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, type Component } from 'vue'
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader,
  Save,
  Languages,
  Plus,
  X,
  ChevronDown,
  Trash2,
  FileText,
  MessageSquare,
  Info,
  Calendar,
  Clock,
  MapPin,
  Heart,
} from 'lucide-vue-next'
import { eventTextsService, type EventText } from '@/services/api'

// Text types configuration
const TEXT_TYPES: { value: string; label: string; icon: Component }[] = [
  { value: 'cover_header', label: 'Cover Header', icon: FileText },
  { value: 'welcome_message', label: 'Welcome Message', icon: MessageSquare },
  { value: 'description', label: 'Description', icon: FileText },
  { value: 'short_description', label: 'Short Description', icon: FileText },
  { value: 'date_text', label: 'Date Text', icon: Calendar },
  { value: 'time_text', label: 'Time Text', icon: Clock },
  { value: 'location_text', label: 'Location Text', icon: MapPin },
  { value: 'instructions', label: 'Instructions', icon: Info },
  { value: 'thank_you_message', label: 'Thank You Message', icon: Heart },
  { value: 'sorry_message', label: 'Sorry Message', icon: MessageSquare },
  { value: 'custom', label: 'Custom Content', icon: FileText },
]

// Language configuration
const ALL_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'kh', name: 'Khmer' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'th', name: 'Thai' },
  { code: 'vn', name: 'Vietnamese' },
]

interface Props {
  modelValue: boolean
  eventId: string
  existingTexts: EventText[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const generalError = ref('')
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const activeLanguage = ref('en')
const showAddLanguage = ref(false)
const newLanguage = ref('')

// Track which sections are open: { 'en:cover_header': true, ... }
const openSections = ref<Record<string, boolean>>({})

// Track manually added languages (so they stay visible even without content)
const addedLanguages = ref<Set<string>>(new Set())

// Form data structure: { 'en:cover_header': { id?, title, content }, ... }
interface TextFormData {
  id?: number
  title: string
  content: string
  originalTitle?: string
  originalContent?: string
}
const formData = reactive<Record<string, TextFormData>>({})

// Track original data to detect changes
const originalData = ref<Record<string, TextFormData>>({})

// Computed: available languages (languages that have any content or are added)
const availableLanguages = computed(() => {
  const langs = new Set<string>(['en']) // Always include English

  // Add languages from existing texts
  props.existingTexts.forEach(text => {
    langs.add(text.language)
  })

  // Add manually added languages
  addedLanguages.value.forEach(lang => {
    langs.add(lang)
  })

  // Add languages from form data that have content
  Object.keys(formData).forEach(key => {
    const lang = key.split(':')[0]
    if (formData[key].content || formData[key].title) {
      langs.add(lang)
    }
  })

  return Array.from(langs).sort((a, b) => {
    const aIdx = ALL_LANGUAGES.findIndex(l => l.code === a)
    const bIdx = ALL_LANGUAGES.findIndex(l => l.code === b)
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b)
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  })
})

// Computed: languages available to add
const languagesForAdd = computed(() => {
  return ALL_LANGUAGES.filter(lang => !availableLanguages.value.includes(lang.code))
})

// Computed: check if there are unsaved changes
const hasChanges = computed(() => {
  for (const key of Object.keys(formData)) {
    const current = formData[key]
    const original = originalData.value[key]

    if (!original) {
      // New entry
      if (current.content || current.title) return true
    } else {
      // Check for modifications
      if (current.title !== original.originalTitle ||
          current.content !== original.originalContent) {
        return true
      }
    }
  }

  // Check for deletions
  for (const key of Object.keys(originalData.value)) {
    if (originalData.value[key].id && !formData[key]) {
      return true
    }
  }

  return false
})

// Helper functions
const getLanguageName = (code: string): string => {
  return ALL_LANGUAGES.find(l => l.code === code)?.name || code.toUpperCase()
}

const getFormKey = (lang: string, textType: string): string => {
  return `${lang}:${textType}`
}

const getTextData = (lang: string, textType: string): TextFormData => {
  const key = getFormKey(lang, textType)
  if (!formData[key]) {
    formData[key] = { title: '', content: '' }
  }
  return formData[key]
}

const hasContent = (lang: string, textType: string): boolean => {
  const data = formData[getFormKey(lang, textType)]
  return !!(data?.content || data?.title)
}

const isSectionOpen = (lang: string, textType: string): boolean => {
  return openSections.value[getFormKey(lang, textType)] || false
}

const toggleSection = (lang: string, textType: string) => {
  const key = getFormKey(lang, textType)
  openSections.value[key] = !openSections.value[key]
}

const canRemoveLanguage = (lang: string): boolean => {
  // Can remove if no saved texts exist for this language
  return !props.existingTexts.some(t => t.language === lang)
}

const addLanguage = () => {
  if (newLanguage.value && !availableLanguages.value.includes(newLanguage.value)) {
    const langToAdd = newLanguage.value
    // Track this language so it stays visible
    addedLanguages.value.add(langToAdd)
    // Initialize empty entries for all text types
    TEXT_TYPES.forEach(tt => {
      const key = getFormKey(langToAdd, tt.value)
      if (!formData[key]) {
        formData[key] = { title: '', content: '' }
      }
    })
    // Switch to the new language tab
    activeLanguage.value = langToAdd
    showAddLanguage.value = false
    newLanguage.value = ''
  }
}

const removeLanguage = (lang: string) => {
  // Remove from tracked added languages
  addedLanguages.value.delete(lang)

  // Remove all form data for this language
  TEXT_TYPES.forEach(tt => {
    const key = getFormKey(lang, tt.value)
    delete formData[key]
    delete openSections.value[key]
  })

  // Switch to English if removing current language
  if (activeLanguage.value === lang) {
    activeLanguage.value = 'en'
  }
}

const deleteText = async (lang: string, textType: string) => {
  const key = getFormKey(lang, textType)
  const data = formData[key]

  if (data?.id) {
    // Mark for deletion by clearing content
    formData[key] = { title: '', content: '', id: data.id }
    showMessage('success', 'Text will be deleted when you save changes')
  }
}

// Initialize form data from existing texts
const initializeFormData = () => {
  // Clear existing data
  Object.keys(formData).forEach(key => delete formData[key])
  Object.keys(openSections.value).forEach(key => delete openSections.value[key])
  addedLanguages.value.clear()
  originalData.value = {}

  // Initialize from existing texts
  props.existingTexts.forEach(text => {
    const key = getFormKey(text.language, text.text_type)
    formData[key] = {
      id: text.id,
      title: text.title || '',
      content: text.content || '',
      originalTitle: text.title || '',
      originalContent: text.content || '',
    }
    originalData.value[key] = {
      id: text.id,
      title: text.title || '',
      content: text.content || '',
      originalTitle: text.title || '',
      originalContent: text.content || '',
    }
  })

  // Ensure English has entries for all text types
  TEXT_TYPES.forEach(tt => {
    const key = getFormKey('en', tt.value)
    if (!formData[key]) {
      formData[key] = { title: '', content: '' }
    }
  })
}

// Show toast message
const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 4000)
}

// Close drawer
const closeDrawer = () => {
  emit('update:modelValue', false)
}

// Save all changes
const saveAllChanges = async () => {
  loading.value = true
  generalError.value = ''

  try {
    const operations: Promise<any>[] = []

    // Process all form data
    for (const key of Object.keys(formData)) {
      const [lang, textType] = key.split(':')
      const data = formData[key]
      const original = originalData.value[key]

      if (data.id) {
        // Existing text
        if (!data.content && !data.title) {
          // Delete if cleared
          operations.push(
            eventTextsService.deleteEventText(props.eventId, data.id)
          )
        } else if (data.title !== original?.originalTitle || data.content !== original?.originalContent) {
          // Update only changed fields using PATCH
          const patchData: Record<string, string | boolean> = {}

          if (data.title !== original?.originalTitle) {
            patchData.title = data.title
          }
          if (data.content !== original?.originalContent) {
            patchData.content = data.content
          }

          operations.push(
            eventTextsService.patchEventText(props.eventId, data.id, patchData)
          )
        }
      } else if (data.content) {
        // Create new if has content
        operations.push(
          eventTextsService.createEventText(props.eventId, {
            text_type: textType,
            language: lang,
            title: data.title,
            content: data.content,
            is_active: true,
          })
        )
      }
    }

    if (operations.length === 0) {
      showMessage('success', 'No changes to save')
      loading.value = false
      return
    }

    // Execute all operations
    const results = await Promise.all(operations)

    // Check for errors
    const errors = results.filter(r => !r.success)
    if (errors.length > 0) {
      showMessage('error', `${errors.length} operation(s) failed`)
    } else {
      showMessage('success', 'All changes saved successfully!')
      emit('saved')
      setTimeout(() => {
        closeDrawer()
      }, 1000)
    }
  } catch (error) {
    console.error('Error saving texts:', error)
    showMessage('error', 'Network error while saving')
  } finally {
    loading.value = false
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      // Reset form with current data when drawer opens
      initializeFormData()
      activeLanguage.value = 'en'
      showAddLanguage.value = false
      newLanguage.value = ''
      generalError.value = ''

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  },
)

// Watch for existingTexts changes
watch(
  () => props.existingTexts,
  () => {
    if (props.modelValue) {
      initializeFormData()
    }
  },
  { deep: true }
)
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

/* Slide up transition for toast */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Custom scrollbar */
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
