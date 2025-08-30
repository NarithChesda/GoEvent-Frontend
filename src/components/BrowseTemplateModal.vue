<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click="closeModal">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
          <div 
            class="relative w-full max-w-6xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-8 py-4 sm:py-6 text-white flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <LayoutTemplate class="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h2 class="text-lg sm:text-2xl font-bold truncate">Browse Templates</h2>
                    <p class="text-white/80 text-xs sm:text-sm mt-1 hidden sm:block">Choose a design that matches your event style</p>
                  </div>
                </div>
                <button
                  @click="closeModal"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Filters -->
            <div class="p-4 sm:p-8 border-b border-slate-200/20 space-y-4 sm:space-y-6 bg-white/50 backdrop-blur-sm flex-shrink-0">
          <!-- Category Filter -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs sm:text-sm font-medium text-slate-700 mr-1 sm:mr-2 flex-shrink-0">Categories:</span>
            <button
              @click="selectedCategory = null"
              :class="[
                'px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0',
                selectedCategory === null
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white/70 text-slate-600 hover:bg-white hover:shadow-md'
              ]"
            >
              All
            </button>
            <button
              v-for="category in categories"
              :key="category.id"
              @click="selectedCategory = category.id"
              :class="[
                'px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 flex-shrink-0',
                selectedCategory === category.id
                  ? 'text-white shadow-lg'
                  : 'bg-white/70 text-slate-600 hover:bg-white hover:shadow-md'
              ]"
              :style="selectedCategory === category.id ? { backgroundColor: category.color } : {}"
            >
              <span class="truncate">{{ category.name }}</span>
            </button>
          </div>

          <!-- Search -->
          <div class="relative w-full sm:max-w-md">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search templates..."
              class="w-full pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
            >
          </div>
        </div>

            <!-- Templates Content -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-8 bg-white/30 backdrop-blur-sm min-h-0">
          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div v-for="n in 6" :key="n" class="animate-pulse">
              <div class="bg-slate-200 rounded-lg h-48"></div>
              <div class="mt-2 space-y-1">
                <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                <div class="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <!-- Templates Grid -->
          <div v-else-if="filteredTemplates.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div
              v-for="template in filteredTemplates"
              :key="template.id"
              @click="selectTemplate(template)"
              :class="[
                'group cursor-pointer bg-white/80 backdrop-blur-sm border rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
                selectedTemplateId === template.id
                  ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
                  : 'border-white/40 hover:border-blue-300'
              ]"
            >
              <!-- Template Preview -->
              <div class="relative h-32 sm:h-40 overflow-hidden">
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
                <div class="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 right-1 sm:right-2">
                  <h4 class="font-semibold text-white text-xs sm:text-sm truncate">{{ template.name }}</h4>
                  <p class="text-xs text-white/80 truncate hidden sm:block">{{ template.package_plan.name }}</p>
                </div>
              </div>
              
              <!-- Template Details -->
              <div class="p-2 sm:p-3">
                <div class="flex items-center justify-between mb-2">
                  <span 
                    v-if="template.package_plan.category"
                    class="text-xs px-2 py-1 rounded text-white truncate flex-shrink-0"
                    :style="{ backgroundColor: template.package_plan.category.color || '#64748b' }"
                  >
                    {{ template.package_plan.category.name }}
                  </span>
                  <span class="text-sm sm:text-lg font-bold text-slate-900 ml-2">${{ template.package_plan.price }}</span>
                </div>
                
                <!-- Features Preview -->
                <div v-if="template.package_plan.features && template.package_plan.features.length > 0" class="hidden sm:block">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="feature in template.package_plan.features.slice(0, 2)"
                      :key="feature"
                      class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded truncate"
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
              class="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25"
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
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-8 border-t border-slate-200/20 bg-white/50 backdrop-blur-sm flex-shrink-0 gap-4 sm:gap-0">
          <div class="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
            {{ filteredTemplates.length }} template{{ filteredTemplates.length !== 1 ? 's' : '' }} found
          </div>
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              @click="closeModal"
              class="px-4 sm:px-6 py-2 sm:py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium text-sm sm:text-base order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              @click="confirmSelection"
              :disabled="!selectedTemplateId || selecting"
              :class="[
                'px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2',
                selectedTemplateId && !selecting
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:scale-[1.02]'
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
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  X,
  Search,
  Check,
  CheckCircle,
  Palette,
  Loader2,
  LayoutTemplate
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

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: all 0.3s ease;
  transform-origin: center;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}
</style>