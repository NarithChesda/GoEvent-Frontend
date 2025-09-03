<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Text Content</h2>
        <p class="text-sm text-slate-600 mt-1">Manage multi-language text content for your event</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center"
      >
        <Plus class="w-4 h-4 mr-2" />
        Add Text Content
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
      <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center">
        <FileText class="w-5 h-5 text-blue-600 mr-2" />
        Content Filters
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="flex flex-col space-y-1.5">
          <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Type</label>
          <select
            v-model="filters.textType"
            @change="applyFilters"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/70 backdrop-blur-sm"
          >
            <option value="">All Types</option>
            <option value="cover_header">Cover Header</option>
            <option value="welcome_message">Welcome Message</option>
            <option value="instructions">Instructions</option>
            <option value="description">Description</option>
            <option value="short_description">Short Description</option>
            <option value="date_text">Date Text</option>
            <option value="time_text">Time Text</option>
            <option value="location_text">Location Text</option>
            <option value="thank_you_message">Thank You Message</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div class="flex flex-col space-y-1.5">
          <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Language</label>
          <select
            v-model="filters.language"
            @change="applyFilters"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/70 backdrop-blur-sm"
          >
            <option value="">All Languages</option>
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

        <div class="flex flex-col space-y-1.5">
          <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</label>
          <select
            v-model="filters.isActive"
            @change="applyFilters"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/70 backdrop-blur-sm"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8">
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-slate-600">Loading text content...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 text-center">
      <div class="text-lg text-red-600 font-semibold mb-4">{{ error }}</div>
      <button
        @click="fetchTexts"
        class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-red-500/25"
      >
        Try again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTexts.length === 0" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center">
      <FileText class="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-slate-900 mb-2">
        {{ allTexts.length === 0 ? 'No Text Content Yet' : 'No Matching Text Content' }}
      </h3>
      <p class="text-slate-600 mb-6">
        {{ allTexts.length === 0
          ? 'Start building your event content by adding your first text content.'
          : 'Try adjusting your filters to see more content.'
        }}
      </p>
      <button
        v-if="allTexts.length === 0"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center mx-auto"
      >
        <Plus class="w-4 h-4 mr-2" />
        Add Your First Text Content
      </button>
    </div>

    <!-- Text Content List -->
    <div v-else class="space-y-6">
      <!-- Group by text type -->
      <div
        v-for="(group, textType) in groupedTexts"
        :key="textType"
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
      >
        <div class="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-white/20">
          <h3 class="text-lg font-bold text-slate-900 flex items-center">
            <component :is="getTextTypeIcon(textType)" class="w-5 h-5 mr-2 text-blue-600" />
            {{ getTextTypeLabel(textType) }}
            <span class="ml-2 text-sm text-slate-500">({{ group.length }} item{{ group.length !== 1 ? 's' : '' }})</span>
          </h3>
        </div>

        <div class="p-6 space-y-4">
          <EventTextCard
            v-for="text in group"
            :key="text.id"
            :text="text"
            @edit="editText"
            @delete="deleteText"
          />
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <CreateEventTextModal
      v-if="showCreateModal"
      :event-id="eventId"
      @close="showCreateModal = false"
      @created="handleTextCreated"
    />

    <!-- Edit Modal -->
    <EditEventTextModal
      v-if="showEditModal && selectedText"
      :event-id="eventId"
      :text="selectedText"
      @close="showEditModal = false"
      @updated="handleTextUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleteLoading"
      title="Delete Text Content"
      :item-name="textToDelete?.title || (textToDelete?.content ? textToDelete.content.substring(0, 50) + (textToDelete.content.length > 50 ? '...' : '') : '')"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, FileText, MessageSquare, Info, Calendar, Clock, MapPin, Heart } from 'lucide-vue-next'
import { eventTextsService, type EventText } from '../services/api'
import EventTextCard from './EventTextCard.vue'
import CreateEventTextModal from './CreateEventTextModal.vue'
import EditEventTextModal from './EditEventTextModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
}

const props = defineProps<Props>()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const allTexts = ref<EventText[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedText = ref<EventText | null>(null)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)
const textToDelete = ref<EventText | null>(null)

// Filters
const filters = reactive({
  textType: '',
  language: '',
  isActive: ''
})

// Computed
const filteredTexts = computed(() => {
  return allTexts.value.filter(text => {
    if (filters.textType && text.text_type !== filters.textType) return false
    if (filters.language && text.language !== filters.language) return false
    if (filters.isActive !== '' && text.is_active.toString() !== filters.isActive) return false
    return true
  })
})

const groupedTexts = computed(() => {
  const groups: Record<string, EventText[]> = {}

  filteredTexts.value.forEach(text => {
    if (!groups[text.text_type]) {
      groups[text.text_type] = []
    }
    groups[text.text_type].push(text)
  })

  // Sort texts within each group by order, then language
  Object.keys(groups).forEach(textType => {
    groups[textType].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order
      return a.language.localeCompare(b.language)
    })
  })

  return groups
})


// Methods
const fetchTexts = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await eventTextsService.getEventTexts(props.eventId)

    if (response.success && response.data) {
      if (response.data.results && Array.isArray(response.data.results)) {
        allTexts.value = response.data.results
      } else {
        allTexts.value = []
      }
    } else {
      error.value = response.message || 'Failed to load text content'
    }
  } catch (err) {
    error.value = 'Network error while loading text content'
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  // Filters are reactive, so this just triggers re-computation
}

const editText = (text: EventText) => {
  selectedText.value = text
  showEditModal.value = true
}

const deleteText = (textId: number) => {
  const text = allTexts.value.find(t => t.id === textId)
  if (!text) return

  textToDelete.value = text
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!textToDelete.value) return

  deleteLoading.value = true

  try {
    const response = await eventTextsService.deleteEventText(props.eventId, textToDelete.value.id)

    if (response.success) {
      allTexts.value = allTexts.value.filter(t => t.id !== textToDelete.value!.id)
      showDeleteModal.value = false
      textToDelete.value = null
    } else {
      alert(response.message || 'Failed to delete text content')
    }
  } catch (err) {
    alert('Network error while deleting text content')
  } finally {
    deleteLoading.value = false
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  textToDelete.value = null
}

const handleTextCreated = (newText: EventText) => {
  allTexts.value.push(newText)
  showCreateModal.value = false
}

const handleTextUpdated = (updatedText: EventText) => {
  const index = allTexts.value.findIndex(t => t.id === updatedText.id)
  if (index !== -1) {
    allTexts.value[index] = updatedText
  }
  showEditModal.value = false
  selectedText.value = null
}

const getTextTypeLabel = (textType: string): string => {
  const labels: Record<string, string> = {
    'cover_header': 'Cover Header',
    'welcome_message': 'Welcome Message',
    'instructions': 'Instructions',
    'description': 'Description',
    'short_description': 'Short Description',
    'date_text': 'Date Text',
    'time_text': 'Time Text',
    'location_text': 'Location Text',
    'thank_you_message': 'Thank You Message',
    'custom': 'Custom Content'
  }
  return labels[textType] || textType
}

const getTextTypeIcon = (textType: string) => {
  const icons: Record<string, any> = {
    'cover_header': FileText,
    'welcome_message': MessageSquare,
    'instructions': Info,
    'description': FileText,
    'short_description': FileText,
    'date_text': Calendar,
    'time_text': Clock,
    'location_text': MapPin,
    'thank_you_message': Heart,
    'custom': FileText
  }
  return icons[textType] || FileText
}

const getLanguageName = (languageCode: string): string => {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'kh': 'Khmer',
    'fr': 'French',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh-cn': 'Chinese (Simplified)',
    'th': 'Thai',
    'vn': 'Vietnamese'
  }
  return languageNames[languageCode] || languageCode.toUpperCase()
}

// Lifecycle
onMounted(() => {
  fetchTexts()
})
</script>

<style scoped>
/* Add any additional scoped styles if needed */
</style>
