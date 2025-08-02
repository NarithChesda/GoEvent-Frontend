<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Background overlay -->
    <div class="fixed inset-0 bg-black bg-opacity-50" @click="closeModal"></div>
    
    <!-- Modal content -->
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 class="text-xl font-bold text-slate-900">Browse Templates</h3>
            <p class="text-sm text-slate-600 mt-1">Choose a design that matches your event style</p>
          </div>
          <button
            @click="closeModal"
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <!-- Filters -->
        <div class="p-6 border-b border-slate-200 space-y-4">
          <!-- Category Filter -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-slate-700 mr-2">Categories:</span>
            <button
              @click="selectedCategory = null"
              :class="[
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              All
            </button>
            <button
              v-for="category in categories"
              :key="category.id"
              @click="selectedCategory = category.id"
              :class="[
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                selectedCategory === category.id
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
              :style="selectedCategory === category.id ? { backgroundColor: category.color } : {}"
            >
              <span>{{ category.name }}</span>
            </button>
          </div>

          <!-- Search -->
          <div class="relative max-w-md">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search templates..."
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>
        </div>

        <!-- Templates Content -->
        <div class="flex-1 overflow-y-auto p-6" style="max-height: calc(90vh - 200px);">
          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="n in 6" :key="n" class="animate-pulse">
              <div class="bg-slate-200 rounded-lg h-48"></div>
              <div class="mt-2 space-y-1">
                <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                <div class="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <!-- Templates Grid -->
          <div v-else-if="filteredTemplates.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="template in filteredTemplates"
              :key="template.id"
              @click="selectTemplate(template)"
              :class="[
                'group cursor-pointer bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200',
                selectedTemplateId === template.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300'
              ]"
            >
              <!-- Template Preview -->
              <div class="relative h-40 overflow-hidden">
                <img 
                  :src="template.preview_image || '/api/placeholder/400/300'" 
                  :alt="template.name"
                  class="w-full h-full object-cover"
                />
                
                <!-- Price -->
                <div class="absolute top-2 right-2">
                  <span class="bg-white/90 text-slate-900 text-sm font-bold px-2 py-1 rounded">
                    ${{ template.package_plan.price }}
                  </span>
                </div>

                <!-- Selection indicator -->
                <div v-if="selectedTemplateId === template.id" class="absolute top-2 left-2">
                  <div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check class="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <!-- Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                <!-- Template title overlay -->
                <div class="absolute bottom-2 left-2 right-2">
                  <h4 class="font-semibold text-white text-sm truncate">{{ template.name }}</h4>
                  <p class="text-xs text-white/80 truncate">{{ template.package_plan.name }}</p>
                </div>
              </div>
              
              <!-- Template Details -->
              <div class="p-3">
                <div class="flex items-center justify-between mb-2">
                  <span 
                    v-if="template.package_plan.category"
                    class="text-xs px-2 py-1 rounded text-white"
                    :style="{ backgroundColor: template.package_plan.category.color || '#64748b' }"
                  >
                    {{ template.package_plan.category.name }}
                  </span>
                  <span class="text-lg font-bold text-slate-900">${{ template.package_plan.price }}</span>
                </div>
                
                <!-- Features Preview -->
                <div v-if="template.package_plan.features && template.package_plan.features.length > 0">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="feature in template.package_plan.features.slice(0, 2)"
                      :key="feature"
                      class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded"
                    >
                      {{ feature }}
                    </span>
                    <span v-if="template.package_plan.features.length > 2" class="text-xs text-slate-500">
                      +{{ template.package_plan.features.length - 2 }} more
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette class="w-8 h-8 text-slate-400" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">No Templates Found</h3>
            <p class="text-slate-600">
              {{ searchQuery || selectedCategory 
                 ? 'Try adjusting your filters to see more templates.' 
                 : 'No templates are available at the moment.' }}
            </p>
            <button
              v-if="searchQuery || selectedCategory"
              @click="clearFilters"
              class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="message" class="mt-4 p-4 rounded-lg" :class="message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'">
            <div class="flex items-center">
              <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
              <X v-else class="w-5 h-5 mr-2" />
              <span>{{ message.text }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between p-6 border-t border-slate-200">
          <div class="text-sm text-slate-600">
            {{ filteredTemplates.length }} template{{ filteredTemplates.length !== 1 ? 's' : '' }} found
          </div>
          <div class="flex gap-3">
            <button
              @click="closeModal"
              class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="confirmSelection"
              :disabled="!selectedTemplateId || selecting"
              :class="[
                'px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                selectedTemplateId && !selecting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              ]"
            >
              <Loader2 v-if="selecting" class="w-4 h-4 animate-spin" />
              <CheckCircle v-else class="w-4 h-4" />
              {{ selecting ? 'Selecting...' : 'Select Template' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  X,
  Search,
  Check,
  CheckCircle,
  Palette,
  Loader2
} from 'lucide-vue-next'
import { type EventTemplate, eventTemplateService } from '../services/api'

interface Props {
  isOpen: boolean
  eventId: string
  eventCategory?: number
}

interface Category {
  id: number
  name: string
  color: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'template-selected': [template: EventTemplate]
}>()

// State
const loading = ref(false)
const selecting = ref(false)
const templates = ref<EventTemplate[]>([])
const selectedTemplateId = ref<number | null>(null)
const searchQuery = ref('')
const selectedCategory = ref<number | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Computed
const categories = computed(() => {
  const categoryMap = new Map<number, Category>()
  
  templates.value.forEach(template => {
    if (template.package_plan.category) {
      const cat = template.package_plan.category
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        color: cat.color
      })
    }
  })
  
  return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const filteredTemplates = computed(() => {
  let filtered = templates.value

  // Filter by category
  if (selectedCategory.value !== null) {
    filtered = filtered.filter(template => 
      template.package_plan.category?.id === selectedCategory.value
    )
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.package_plan.name.toLowerCase().includes(query) ||
      template.package_plan.category?.name.toLowerCase().includes(query) ||
      (template.package_plan.features && template.package_plan.features.some(feature => 
        feature.toLowerCase().includes(query)
      ))
    )
  }

  return filtered
})

// Mock template data for testing
const getMockTemplates = (): EventTemplate[] => [
  {
    id: 1,
    name: "Elegant Wedding Template",
    package_plan: {
      id: 1,
      name: "Premium Plan",
      price: "299.00",
      commission: "15.00",
      features: [
        "Custom color palette",
        "Premium fonts",
        "Video backgrounds",
        "Advanced animations",
        "RSVP management",
        "Guest messaging"
      ],
      category: {
        id: 1,
        name: "Wedding",
        color: "#ff6b6b"
      }
    },
    preview_image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop",
    template_colors: [],
    template_fonts: [],
    open_envelope_button: "",
    basic_decoration_photo: "",
    basic_background_photo: "",
    standard_cover_video: "",
    standard_background_video: "",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z"
  },
  {
    id: 2,
    name: "Corporate Conference Template",
    package_plan: {
      id: 2,
      name: "Business Plan",
      price: "199.00",
      commission: "10.00",
      features: [
        "Professional design",
        "Agenda management",
        "Speaker profiles",
        "Registration forms"
      ],
      category: {
        id: 2,
        name: "Business",
        color: "#4ecdc4"
      }
    },
    preview_image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
    template_colors: [],
    template_fonts: [],
    open_envelope_button: "",
    basic_decoration_photo: "",
    basic_background_photo: "",
    standard_cover_video: "",
    standard_background_video: "",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z"
  },
  {
    id: 3,
    name: "Birthday Party Template",
    package_plan: {
      id: 3,
      name: "Standard Plan",
      price: "99.00",
      commission: "5.00",
      features: [
        "Colorful design",
        "Photo gallery",
        "RSVP tracking",
        "Gift registry"
      ],
      category: {
        id: 3,
        name: "Birthday",
        color: "#ffd93d"
      }
    },
    preview_image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop",
    template_colors: [],
    template_fonts: [],
    open_envelope_button: "",
    basic_decoration_photo: "",
    basic_background_photo: "",
    standard_cover_video: "",
    standard_background_video: "",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z"
  },
  {
    id: 4,
    name: "Graduation Ceremony Template",
    package_plan: {
      id: 4,
      name: "Academic Plan",
      price: "149.00",
      commission: "8.00",
      features: [
        "Academic styling",
        "Achievement showcase",
        "Photo memories",
        "Guest book"
      ],
      category: {
        id: 4,
        name: "Graduation",
        color: "#6c5ce7"
      }
    },
    preview_image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop",
    template_colors: [],
    template_fonts: [],
    open_envelope_button: "",
    basic_decoration_photo: "",
    basic_background_photo: "",
    standard_cover_video: "",
    standard_background_video: "",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z"
  }
]

// Methods
const loadTemplates = async () => {
  loading.value = true
  try {
    console.log('Loading templates...')
    const response = await eventTemplateService.browseTemplates()
    console.log('Templates response:', response)
    
    if (response.success && response.data) {
      templates.value = response.data.templates || []
      console.log('Loaded templates:', templates.value.length)
      
      // Auto-select event category if provided
      if (props.eventCategory && !selectedCategory.value) {
        selectedCategory.value = props.eventCategory
      }
    } else {
      console.warn('API failed, using mock data:', response)
      // Use mock data as fallback
      templates.value = getMockTemplates()
    }
  } catch (error) {
    console.warn('API error, using mock data:', error)
    // Use mock data as fallback
    templates.value = getMockTemplates()
  } finally {
    loading.value = false
  }
}

const selectTemplate = (template: EventTemplate) => {
  selectedTemplateId.value = template.id
}

const confirmSelection = async () => {
  if (!selectedTemplateId.value || selecting.value) return

  const selectedTemplate = templates.value.find(t => t.id === selectedTemplateId.value)
  if (!selectedTemplate) return

  selecting.value = true
  clearMessage()
  
  try {
    console.log('Selecting template:', selectedTemplate.id, 'for event:', props.eventId)
    
    // Try API first
    try {
      const response = await eventTemplateService.selectEventTemplate(props.eventId, selectedTemplateId.value)
      console.log('Selection response:', response)
      
      if (response.success && response.data) {
        // The response now contains the updated event data
        console.log('Template selected successfully via API')
        showMessage('success', 'Template selected successfully!')
        
        // Wait a bit to show the success message
        setTimeout(() => {
          emit('template-selected', selectedTemplate)
          closeModal()
        }, 1000)
        return
      } else {
        console.warn('API response not successful:', response)
        showMessage('error', 'Failed to select template. Please try again.')
        return
      }
    } catch (apiError) {
      console.warn('API selection failed:', apiError)
      showMessage('error', 'Unable to connect to server. Template will be selected locally.')
      
      // Wait a bit to show the error message, then proceed with local selection
      setTimeout(() => {
        emit('template-selected', selectedTemplate)
        closeModal()
      }, 2000)
      return
    }
    
  } catch (error) {
    console.error('Error selecting template:', error)
    showMessage('error', 'An unexpected error occurred. Please try again.')
  } finally {
    selecting.value = false
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
}

const clearMessage = () => {
  message.value = null
}

const closeModal = () => {
  emit('close')
  // Reset state
  selectedTemplateId.value = null
  searchQuery.value = ''
  selectedCategory.value = null
  clearMessage()
}

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadTemplates()
  }
})

// Lifecycle
onMounted(() => {
  if (props.isOpen) {
    loadTemplates()
  }
})
</script>