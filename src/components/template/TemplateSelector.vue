<template>
  <div v-if="showModal" class="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center z-50 p-2 sm:p-4">
    <div class="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b">
        <div class="flex-1 min-w-0">
          <h3 class="text-xl sm:text-2xl font-bold text-slate-900 truncate">Choose a Template</h3>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
            <p class="text-sm text-slate-600">Select a professional template for your event</p>
            <div v-if="event.category" class="flex items-center space-x-2">
              <div 
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: event.category_color || '#6b7280' }"
              ></div>
              <span class="text-xs font-medium text-slate-700 truncate">{{ event.category_name }}</span>
            </div>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 transition-colors p-1 ml-2 flex-shrink-0"
        >
          <X class="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <!-- Enhanced Filter Controls -->
      <div class="px-4 sm:px-6 py-3 bg-slate-50 border-b">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <!-- Filter Info -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div v-if="event.category" 
                class="w-4 h-4 rounded-full flex-shrink-0"
                :style="{ backgroundColor: event.category_color || '#6b7280' }"
              ></div>
              <span class="text-sm font-medium">
                {{ getFilterDisplayText() }}
              </span>
              <span class="text-xs text-slate-500">
                ({{ filteredTemplatesCount }} available)
              </span>
            </div>
          </div>
          
          <!-- Category Filter Chips -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="toggleCategoryFilter()"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                categoryFilterActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              ]"
              v-if="event.category && availableCategories.length > 0"
            >
              <div class="flex items-center space-x-1.5">
                <div 
                  class="w-2.5 h-2.5 rounded-full"
                  :style="{ backgroundColor: event.category_color || '#6b7280' }"
                ></div>
                <span>{{ event.category_name }}</span>
              </div>
            </button>
            
            <button
              v-for="category in otherAvailableCategories"
              :key="category.id"
              @click="setActiveCategory(category)"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                activeCategoryFilter?.id === category.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              ]"
            >
              <div class="flex items-center space-x-1.5">
                <div 
                  class="w-2.5 h-2.5 rounded-full"
                  :style="{ backgroundColor: category.color }"
                ></div>
                <span>{{ category.name }}</span>
              </div>
            </button>
            
            <button
              @click="clearCategoryFilter()"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                !categoryFilterActive && !activeCategoryFilter
                  ? 'bg-slate-600 text-white shadow-lg' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              ]"
            >
              All Categories
            </button>
          </div>
        </div>
      </div>

      <!-- Template Grid -->
      <div class="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar template-grid">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-slate-600 text-sm">Loading templates...</p>
        </div>

        <!-- Template Grid -->
        <div v-else-if="displayedTemplates.length > 0" class="space-y-6">
          <!-- Results Count -->
          <div class="text-sm text-slate-600">
            Showing {{ displayedTemplates.length }} of {{ templates.length }} templates
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <div
              v-for="template in displayedTemplates"
              :key="template.id"
              class="group cursor-pointer"
              @click="selectTemplate(template)"
            >
              <div 
                class="bg-white border-2 rounded-xl sm:rounded-2xl overflow-hidden template-selection-transition hover:shadow-xl template-card"
                :class="{
                  'border-blue-500 ring-2 ring-blue-200 shadow-lg': selectedTemplate?.id === template.id,
                  'border-slate-200 hover:border-blue-300': selectedTemplate?.id !== template.id
                }"
                tabindex="0"
                @keydown.enter="selectTemplate(template)"
                @keydown.space.prevent="selectTemplate(template)"
              >
                <!-- Preview Image -->
                <div class="aspect-video relative overflow-hidden bg-slate-100">
                  <!-- Loading placeholder for image -->
                  <div v-if="!imageLoaded[template.id]" class="absolute inset-0 bg-slate-200 shimmer"></div>
                  
                  <img 
                    v-if="template.preview_image"
                    :src="template.preview_image" 
                    :alt="template.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    @load="onImageLoad(template.id)"
                    @error="onImageError(template.id)"
                    :class="{ 'opacity-0': !imageLoaded[template.id] }"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Image class="w-8 h-8 sm:w-12 sm:h-12 text-slate-300" />
                  </div>
                  
                  <!-- Selection Indicator -->
                  <div v-if="selectedTemplate?.id === template.id" 
                       class="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                    <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <CheckCircle class="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <!-- Category Badge -->
                  <div v-if="template.package_plan?.category" class="absolute top-2 left-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur-sm"
                          :style="{ backgroundColor: template.package_plan.category.color }">
                      {{ template.package_plan.category.name }}
                    </span>
                  </div>
                  
                  <!-- Price Badge -->
                  <div class="absolute top-2 right-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-bold bg-white/95 backdrop-blur-sm text-slate-900 shadow-lg">
                      ${{ template.package_plan?.price || '0.00' }}
                    </span>
                  </div>
                  
                  <!-- Preview Button -->
                  <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      @click.stop="$emit('preview-template', template)"
                      class="bg-white/90 backdrop-blur-sm text-slate-700 p-1.5 rounded-lg shadow-lg hover:bg-white transition-colors touch-target"
                      title="Preview Template"
                      tabindex="-1"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Template Info -->
                <div class="p-3 sm:p-4">
                  <h4 class="font-semibold text-slate-900 mb-1 truncate" :title="template.name">{{ template.name }}</h4>
                  <p class="text-sm text-slate-600 mb-3 truncate" :title="template.package_plan?.name">{{ template.package_plan?.name || 'Standard Plan' }}</p>
                  
                  <!-- Color Preview -->
                  <div v-if="template.template_colors?.length > 0" class="flex items-center space-x-1 mb-3">
                    <div 
                      v-for="(color, idx) in template.template_colors.slice(0, 4)" 
                      :key="idx"
                      class="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-inner border border-white"
                      :style="{ backgroundColor: color.hex_color_code }"
                      :title="color.name"
                    ></div>
                    <span v-if="template.template_colors.length > 4" class="text-xs text-slate-500 ml-1">
                      +{{ template.template_colors.length - 4 }}
                    </span>
                  </div>

                  <!-- Features Preview -->
                  <div class="space-y-1">
                    <div 
                      v-for="(feature, idx) in (template.package_plan?.features || []).slice(0, 2)" 
                      :key="idx"
                      class="flex items-center text-xs text-slate-600"
                    >
                      <CheckCircle class="w-3 h-3 mr-1.5 text-green-600 flex-shrink-0" />
                      <span class="truncate">{{ feature }}</span>
                    </div>
                    <p v-if="(template.package_plan?.features || []).length > 2" class="text-xs text-blue-600 font-medium">
                      +{{ (template.package_plan?.features || []).length - 2 }} more features
                    </p>
                  </div>
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
          <p class="text-slate-600 mb-4">{{ getEmptyStateMessage() }}</p>
          <button
            v-if="categoryFilterActive || activeCategoryFilter"
            @click="clearCategoryFilter()"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Templates
          </button>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t bg-slate-50">
        <div class="flex items-center space-x-4">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <div v-if="selectedTemplate" class="hidden sm:flex items-center space-x-2 text-sm text-slate-600">
            <span>Selected:</span>
            <span class="font-medium text-slate-900">{{ selectedTemplate.name }}</span>
            <span class="text-green-600 font-semibold">${{ selectedTemplate.package_plan?.price || '0.00' }}</span>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button
            v-if="selectedTemplate"
            @click="$emit('preview-template', selectedTemplate)"
            class="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center"
          >
            <Eye class="w-4 h-4 mr-2" />
            Preview
          </button>
          
          <button
            @click="confirmSelection"
            :disabled="!selectedTemplate || isSelecting"
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <div v-if="isSelecting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {{ isSelecting ? 'Selecting...' : 'Select Template' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  X, 
  Eye, 
  CheckCircle, 
  Image, 
  Palette 
} from 'lucide-vue-next'
import type { Event, EventTemplate } from '@/services/api'

interface Category {
  id: number
  name: string
  color: string
}

interface Props {
  showModal: boolean
  event: Event
  templates: EventTemplate[]
  loading: boolean
  selectedTemplate: EventTemplate | null
  isSelecting: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'select-template': [template: EventTemplate]
  'preview-template': [template: EventTemplate]
  'confirm-selection': []
}>()

// State
const categoryFilterActive = ref(false)
const activeCategoryFilter = ref<Category | null>(null)
const imageLoaded = ref<Record<number, boolean>>({})

// Computed properties
const availableCategories = computed(() => {
  const categories = new Map<number, Category>()
  props.templates.forEach(template => {
    if (template.package_plan?.category) {
      const category = template.package_plan.category
      categories.set(category.id, {
        id: category.id,
        name: category.name,
        color: category.color || '#6b7280'
      })
    }
  })
  return Array.from(categories.values())
})

const otherAvailableCategories = computed(() => {
  return availableCategories.value.filter(cat => 
    cat.id !== props.event.category
  )
})

const displayedTemplates = computed(() => {
  let filtered = [...props.templates]

  if (categoryFilterActive.value && props.event.category) {
    filtered = filtered.filter(template => 
      template.package_plan?.category?.id === props.event.category
    )
  } else if (activeCategoryFilter.value) {
    filtered = filtered.filter(template => 
      template.package_plan?.category?.id === activeCategoryFilter.value?.id
    )
  }

  return filtered
})

const filteredTemplatesCount = computed(() => displayedTemplates.value.length)

// Methods
const selectTemplate = (template: EventTemplate) => {
  emit('select-template', template)
}

const confirmSelection = () => {
  emit('confirm-selection')
}

const toggleCategoryFilter = () => {
  categoryFilterActive.value = !categoryFilterActive.value
  if (categoryFilterActive.value) {
    activeCategoryFilter.value = null
  }
}

const setActiveCategory = (category: Category) => {
  activeCategoryFilter.value = category
  categoryFilterActive.value = false
}

const clearCategoryFilter = () => {
  categoryFilterActive.value = false
  activeCategoryFilter.value = null
}

const onImageLoad = (templateId: number) => {
  imageLoaded.value[templateId] = true
}

const onImageError = (templateId: number) => {
  imageLoaded.value[templateId] = true
}

const getFilterDisplayText = () => {
  if (categoryFilterActive.value && props.event.category_name) {
    return `${props.event.category_name} Templates`
  } else if (activeCategoryFilter.value) {
    return `${activeCategoryFilter.value.name} Templates`
  } else {
    return 'All Templates'
  }
}

const getEmptyStateMessage = () => {
  if (categoryFilterActive.value) {
    return `No templates found for ${props.event.category_name} category.`
  } else if (activeCategoryFilter.value) {
    return `No templates found for ${activeCategoryFilter.value.name} category.`
  } else {
    return 'No templates are currently available.'
  }
}

// Watch for template changes to reset image loading state
watch(() => props.templates, () => {
  imageLoaded.value = {}
})
</script>

<style scoped>
.shimmer {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.template-selection-transition {
  transition: all 0.2s ease-in-out;
}

.template-card:hover {
  transform: translateY(-2px);
}

.touch-target {
  min-width: 44px;
  min-height: 44px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>