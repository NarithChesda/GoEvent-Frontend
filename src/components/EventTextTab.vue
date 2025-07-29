<template>
  <div class="event-text-tab">
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Text Content</h2>
        <p class="text-lg text-slate-600 mt-1 leading-relaxed">Manage multi-language text content for your event</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center space-x-2"
      >
        <Plus class="w-4 h-4" />
        <span>Add Text Content</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap gap-4">
      <div class="flex items-center space-x-2">
        <label class="text-sm font-semibold text-slate-700 uppercase tracking-wider">Type:</label>
        <select
          v-model="filters.textType"
          @change="applyFilters"
          class="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        >
          <option value="">All Types</option>
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

      <div class="flex items-center space-x-2">
        <label class="text-sm font-semibold text-slate-700 uppercase tracking-wider">Language:</label>
        <select
          v-model="filters.language"
          @change="applyFilters"
          class="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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

      <div class="flex items-center space-x-2">
        <label class="text-sm font-semibold text-slate-700 uppercase tracking-wider">Status:</label>
        <select
          v-model="filters.isActive"
          @change="applyFilters"
          class="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="text-lg text-slate-600 leading-relaxed">Loading text content...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <div class="text-lg text-red-600 font-semibold leading-relaxed mb-2">{{ error }}</div>
      <button
        @click="fetchTexts"
        class="text-red-700 hover:text-red-800 font-medium"
      >
        Try again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTexts.length === 0" class="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
      <FileText class="w-16 h-16 text-slate-400 mx-auto mb-4" />
      <h3 class="text-xl font-bold text-slate-900 mb-2 leading-tight tracking-tight">
        {{ allTexts.length === 0 ? 'No text content yet' : 'No matching text content' }}
      </h3>
      <p class="text-lg text-slate-600 mb-4 leading-relaxed">
        {{ allTexts.length === 0 
          ? 'Create your first text content to manage event information' 
          : 'Try adjusting your filters to see more content' 
        }}
      </p>
      <button
        v-if="allTexts.length === 0"
        @click="showCreateModal = true"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
      >
        Add Text Content
      </button>
    </div>

    <!-- Text Content List -->
    <div v-else class="space-y-4">
      <!-- Group by text type -->
      <div
        v-for="(group, textType) in groupedTexts"
        :key="textType"
        class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
      >
        <div class="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-900 leading-snug tracking-tight flex items-center">
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
      :item-name="textToDelete?.title || textToDelete?.content.substring(0, 50) + (textToDelete?.content.length > 50 ? '...' : '')"
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