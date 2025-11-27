<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h5 class="font-semibold text-slate-900">Showcase Texts</h5>
        <p class="text-sm text-slate-600">Add multi-language text content for your event showcase</p>
      </div>
      <button
        v-if="allTexts.length > 0"
        @click="showTextDrawer = true"
        class="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 focus:ring-slate-500"
      >
        <Pencil class="w-4 h-4" />
        <span>Edit</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading">
      <div class="flex justify-center py-6 sm:py-8">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error">
      <div class="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div class="flex items-center space-x-2">
          <AlertCircle class="w-5 h-5 text-red-500" />
          <div class="flex-1">
            <p class="text-sm text-red-600 font-medium">{{ error }}</p>
            <button
              @click="fetchTexts"
              class="text-red-600 text-sm hover:text-red-700 underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="allTexts.length === 0">
      <div
        @click="showTextDrawer = true"
        class="border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group"
      >
        <div class="flex flex-col items-center justify-center min-h-[120px]">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 bg-slate-200 group-hover:bg-emerald-100">
            <Plus class="w-8 h-8 transition-colors text-slate-400 group-hover:text-emerald-600" />
          </div>
          <p class="font-semibold transition-colors text-slate-600 group-hover:text-slate-900">No text content added</p>
          <p class="text-sm text-slate-500 mt-1">Add multi-language text for your event showcase</p>
          <p class="text-xs text-slate-400 mt-1">Click to add</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-3 sm:space-y-4">
      <!-- Language Tabs -->
      <div class="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
        <div class="border-b border-slate-200 bg-slate-50/50" role="tablist" aria-label="Language tabs">
          <div class="flex overflow-x-auto scrollbar-hide">
            <button
              v-for="lang in availableLanguages"
              :key="lang"
              @click="selectedLanguage = lang"
              role="tab"
              :aria-selected="selectedLanguage === lang"
              :aria-controls="`tabpanel-${lang}`"
              :id="`tab-${lang}`"
              :class="[
                'flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors relative',
                selectedLanguage === lang
                  ? 'text-[#1e90ff] bg-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              ]"
            >
              {{ getLanguageName(lang) }}
              <span
                v-if="selectedLanguage === lang"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e90ff]"
              ></span>
            </button>
          </div>
        </div>

        <!-- Text List for Selected Language -->
        <div
          role="tabpanel"
          :id="`tabpanel-${selectedLanguage}`"
          :aria-labelledby="`tab-${selectedLanguage}`"
          class="divide-y divide-slate-100"
        >
          <div
            v-for="text in textsForSelectedLanguage"
            :key="text.id"
            class="p-3 sm:p-4 hover:bg-slate-50/50 transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <!-- Text Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <component
                    :is="getTextTypeIcon(text.text_type)"
                    class="w-3.5 h-3.5 text-[#1e90ff] flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span class="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    {{ getTextTypeLabel(text.text_type) }}
                  </span>
                  <span
                    v-if="!text.is_active"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
                  >
                    Inactive
                  </span>
                </div>

                <!-- Title if exists -->
                <div v-if="text.title" class="text-sm font-medium text-slate-900 mb-0.5">
                  {{ text.title }}
                </div>

                <!-- Content Preview -->
                <p class="text-sm text-slate-600 line-clamp-2">
                  {{ text.content }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  @click="deleteText(text.id)"
                  class="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  :aria-label="`Delete ${getTextTypeLabel(text.text_type)}`"
                >
                  <Trash2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <!-- Empty state for selected language -->
          <div v-if="textsForSelectedLanguage.length === 0" class="p-6 text-center">
            <p class="text-sm text-slate-500">No text content for {{ getLanguageName(selectedLanguage) }}</p>
          </div>
        </div>
      </div>

      <!-- Add Another Text Button -->
      <div
        @click="showTextDrawer = true"
        class="border-2 border-dashed rounded-2xl p-6 transition-all duration-300 text-center border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group"
      >
        <div class="flex flex-col items-center justify-center">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 bg-slate-200 group-hover:bg-emerald-100">
            <Plus class="w-6 h-6 transition-colors text-slate-400 group-hover:text-emerald-600" />
          </div>
          <p class="text-sm font-semibold transition-colors text-slate-600 group-hover:text-slate-900">Add or Edit Text Content</p>
          <p class="text-xs text-slate-400 mt-1">Click to manage</p>
        </div>
      </div>
    </div>

    <!-- Edit Event Text Drawer -->
    <EditEventTextDrawer
      v-model="showTextDrawer"
      :event-id="eventId"
      :existing-texts="allTexts"
      @saved="handleTextsSaved"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleteLoading"
      title="Delete Text Content"
      :item-name="
        textToDelete?.title ||
        (textToDelete?.content
          ? textToDelete.content.substring(0, 50) + (textToDelete.content.length > 50 ? '...' : '')
          : '')
      "
      :warning-message="deleteError || undefined"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, type Component } from 'vue'
import {
  FileText,
  MessageSquare,
  Info,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Trash2,
  Plus,
  AlertCircle,
  Pencil,
} from 'lucide-vue-next'
import { eventTextsService, type EventText } from '../services/api'
import EditEventTextDrawer from './EditEventTextDrawer.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
}

const props = defineProps<Props>()

// Track component mount state to prevent state updates after unmount
let isMounted = true
onUnmounted(() => {
  isMounted = false
})

// State
const loading = ref(true)
const error = ref<string | null>(null)
const deleteError = ref<string | null>(null)
const allTexts = ref<EventText[]>([])
const selectedLanguage = ref<string>('')
const showTextDrawer = ref(false)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)
const textToDelete = ref<EventText | null>(null)

// Constants
const LANGUAGE_PRIORITY = ['en', 'kh', 'fr', 'ja', 'ko', 'zh-cn', 'th', 'vn'] as const

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  kh: 'Khmer',
  fr: 'French',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-cn': 'Chinese (Simplified)',
  th: 'Thai',
  vn: 'Vietnamese',
}

const TEXT_TYPE_LABELS: Record<string, string> = {
  cover_header: 'Cover Header',
  welcome_message: 'Welcome Message',
  instructions: 'Instructions',
  description: 'Description',
  short_description: 'Short Description',
  date_text: 'Date Text',
  time_text: 'Time Text',
  location_text: 'Location Text',
  thank_you_message: 'Thank You Message',
  sorry_message: 'Sorry Message',
  custom: 'Custom Content',
}

const TEXT_TYPE_PRIORITY = [
  'cover_header',
  'welcome_message',
  'description',
  'short_description',
  'date_text',
  'time_text',
  'location_text',
  'instructions',
  'thank_you_message',
  'sorry_message',
  'custom',
] as const

const TEXT_TYPE_ICONS: Record<string, Component> = {
  cover_header: FileText,
  welcome_message: MessageSquare,
  instructions: Info,
  description: FileText,
  short_description: FileText,
  date_text: Calendar,
  time_text: Clock,
  location_text: MapPin,
  thank_you_message: Heart,
  sorry_message: MessageSquare,
  custom: FileText,
}

// Computed: Get unique languages from texts, sorted by priority
const availableLanguages = computed(() => {
  const langs = [...new Set(allTexts.value.map((t) => t.language))]
  return langs.sort((a, b) => {
    const aIdx = LANGUAGE_PRIORITY.indexOf(a as typeof LANGUAGE_PRIORITY[number])
    const bIdx = LANGUAGE_PRIORITY.indexOf(b as typeof LANGUAGE_PRIORITY[number])
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b)
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  })
})

// Watch for available languages changes to set default selection
watch(availableLanguages, (langs) => {
  if (langs.length > 0 && !langs.includes(selectedLanguage.value)) {
    selectedLanguage.value = langs[0]
  }
}, { immediate: true })

// Computed: Get texts for selected language, sorted by type priority
const textsForSelectedLanguage = computed(() => {
  return allTexts.value
    .filter((t) => t.language === selectedLanguage.value)
    .sort((a, b) => {
      const aIdx = TEXT_TYPE_PRIORITY.indexOf(a.text_type as typeof TEXT_TYPE_PRIORITY[number])
      const bIdx = TEXT_TYPE_PRIORITY.indexOf(b.text_type as typeof TEXT_TYPE_PRIORITY[number])
      if (aIdx === -1 && bIdx === -1) return a.order - b.order
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    })
})

// Helper functions
const getTextTypeLabel = (textType: string): string => TEXT_TYPE_LABELS[textType] || textType

const getTextTypeIcon = (textType: string): Component => TEXT_TYPE_ICONS[textType] || FileText

const getLanguageName = (code: string): string => LANGUAGE_NAMES[code] || code.toUpperCase()

// Methods
const fetchTexts = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await eventTextsService.getEventTexts(props.eventId)

    if (!isMounted) return

    if (response.success && response.data) {
      if (response.data.results && Array.isArray(response.data.results)) {
        allTexts.value = response.data.results
      } else {
        allTexts.value = []
      }
    } else {
      error.value = response.message || 'Failed to load text content'
    }
  } catch {
    if (!isMounted) return
    error.value = 'Network error while loading text content'
  } finally {
    if (isMounted) {
      loading.value = false
    }
  }
}

const deleteText = (textId: number) => {
  const text = allTexts.value.find((t) => t.id === textId)
  if (!text) return

  textToDelete.value = text
  deleteError.value = null
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!textToDelete.value) return

  deleteLoading.value = true
  deleteError.value = null

  try {
    const response = await eventTextsService.deleteEventText(props.eventId, textToDelete.value.id)

    if (!isMounted) return

    if (response.success) {
      allTexts.value = allTexts.value.filter((t) => t.id !== textToDelete.value!.id)
      showDeleteModal.value = false
      textToDelete.value = null
    } else {
      deleteError.value = response.message || 'Failed to delete text content'
    }
  } catch {
    if (!isMounted) return
    deleteError.value = 'Network error while deleting text content'
  } finally {
    if (isMounted) {
      deleteLoading.value = false
    }
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  textToDelete.value = null
  deleteError.value = null
}

const handleTextsSaved = () => {
  // Refresh texts from server after drawer saves
  fetchTexts()
}

// Lifecycle
onMounted(() => {
  fetchTexts()
})

// Expose method for parent component (Smart FAB)
defineExpose({
  openAddModal: () => {
    showTextDrawer.value = true
  }
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
