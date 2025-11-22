<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-[100] overflow-y-auto" @click="handleModalClose">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />

        <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
          <div
            class="relative w-full max-w-5xl lg:max-w-6xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
            @click.stop
          >
            <!-- Header (neutral style to match Add Agenda Item) -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <LayoutTemplate class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Browse Templates</h2>
                </div>
                <button
                  @click="handleModalClose"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
                  type="button"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Filters -->
            <TemplateFilters
              v-model:search-query="searchQuery"
              v-model:selected-category="selectedCategoryId"
              v-model:selected-plan="selectedPlan"
              :categories="categories"
              @clear-filters="clearFilters"
            />

            <!-- Templates Content -->
            <div class="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-white/30 backdrop-blur-sm min-h-0">
              <!-- Loading State -->
              <TemplateLoadingState v-if="loading" />

              <!-- Templates Grid Only -->
              <div v-else>
                <TemplateGrid
                  v-if="filteredTemplates.length > 0"
                  :templates="filteredTemplates"
                  :selected-template-id="selectedTemplateId"
                  @select-template="handleTemplateSelection"
                />

                <TemplateEmptyState
                  v-else
                  :has-filters="Boolean(searchQuery || selectedCategoryId)"
                  @clear-filters="clearFilters"
                />
              </div>

              <!-- Messages -->
              <TemplateMessage v-if="message" :message="message" />
            </div>

            <!-- Footer -->
            <TemplateModalFooter
              :filtered-count="filteredTemplates.length"
              :has-selection="hasSelection"
              :is-selecting="selecting"
              @cancel="handleModalClose"
              @confirm="handleConfirmSelection"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, ref } from 'vue'
import type { EventTemplate } from '../services/api'
import { useTemplateApi } from '../composables/useTemplateApi'
import { useTemplateFiltering } from '../composables/useTemplateFiltering'
import { useTemplateSelection } from '../composables/useTemplateSelection'

// Import child components
// Header uses neutral style inline (no gradient header component)
import TemplateFilters from './template/TemplateFilters.vue'
import TemplateLoadingState from './template/TemplateLoadingState.vue'
import TemplateGrid from './template/TemplateGrid.vue'
import TemplateEmptyState from './template/TemplateEmptyState.vue'
import TemplateMessage from './template/TemplateMessage.vue'
import TemplateModalFooter from './template/TemplateModalFooter.vue'
import { X, LayoutTemplate } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  eventId: string
  eventCategory?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'template-selected': [template: EventTemplate]
}>()

// Composables
const {
  loading,
  selecting,
  templates,
  message,
  loadTemplates,
  selectTemplate: selectTemplateApi,
  resetState,
} = useTemplateApi()

const {
  searchQuery,
  selectedCategoryId,
  selectedPlan,
  categories,
  filteredTemplates,
  clearFilters,
  setCategoryFilter,
} = useTemplateFiltering(templates)

const { selectedTemplateId, selectedTemplate, hasSelection, selectTemplate, clearSelection } =
  useTemplateSelection(templates)

// Event handlers
const handleModalClose = (): void => {
  emit('close')
  resetModalState()
}

const handleTemplateSelection = (template: EventTemplate): void => {
  selectTemplate(template)
}

const handleConfirmSelection = async (): Promise<void> => {
  if (!selectedTemplate.value || selecting.value) return

  const result = await selectTemplateApi(props.eventId, selectedTemplate.value.id)

  if (result.success && result.template) {
    // Add delay for success message visibility
    setTimeout(
      () => {
        emit('template-selected', result.template!)
        handleModalClose()
      },
      result.template === selectedTemplate.value ? 1000 : 2000,
    )
  }
}

const resetModalState = (): void => {
  clearSelection()
  clearFilters()
  resetState()
}

const initializeModal = async (): Promise<void> => {
  await loadTemplates()

  // Auto-select event category if provided
  if (props.eventCategory && !selectedCategoryId.value) {
    setCategoryFilter(props.eventCategory)
  }
}

// Watchers
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      initializeModal()
    } else {
      resetModalState()
    }
  },
)

// Lifecycle
onMounted(() => {
  if (props.isOpen) {
    initializeModal()
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
