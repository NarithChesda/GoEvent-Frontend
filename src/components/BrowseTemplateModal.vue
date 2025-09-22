<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click="handleModalClose">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />

        <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
          <div
            class="relative w-full max-w-6xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
            @click.stop
          >
            <!-- Header -->
            <TemplateModalHeader @close="handleModalClose" />

            <!-- Filters -->
            <TemplateFilters
              v-model:search-query="searchQuery"
              v-model:selected-category="selectedCategoryId"
              :categories="categories"
              @clear-filters="clearFilters"
            />

            <!-- Templates Content -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-8 bg-white/30 backdrop-blur-sm min-h-0">
              <!-- Loading State -->
              <TemplateLoadingState v-if="loading" />

              <!-- Templates Grid -->
              <TemplateGrid
                v-else-if="filteredTemplates.length > 0"
                :templates="filteredTemplates"
                :selected-template-id="selectedTemplateId"
                @select-template="handleTemplateSelection"
              />

              <!-- Empty State -->
              <TemplateEmptyState
                v-else
                :has-filters="Boolean(searchQuery || selectedCategoryId)"
                @clear-filters="clearFilters"
              />

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
import { watch, onMounted } from 'vue'
import type { EventTemplate } from '../services/api'
import { useTemplateApi } from '../composables/useTemplateApi'
import { useTemplateFiltering } from '../composables/useTemplateFiltering'
import { useTemplateSelection } from '../composables/useTemplateSelection'

// Import child components
import TemplateModalHeader from './template/TemplateModalHeader.vue'
import TemplateFilters from './template/TemplateFilters.vue'
import TemplateLoadingState from './template/TemplateLoadingState.vue'
import TemplateGrid from './template/TemplateGrid.vue'
import TemplateEmptyState from './template/TemplateEmptyState.vue'
import TemplateMessage from './template/TemplateMessage.vue'
import TemplateModalFooter from './template/TemplateModalFooter.vue'

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
