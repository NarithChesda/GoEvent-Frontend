import { ref, computed, type Ref } from 'vue'
import type { EventTemplate } from '../services/api'

/**
 * Composable for template selection state management
 */
export function useTemplateSelection(templates: Ref<EventTemplate[]>) {
  // Selection state
  const selectedTemplateId = ref<number | null>(null)

  // Computed properties
  const selectedTemplate = computed(
    () => templates.value.find((template) => template.id === selectedTemplateId.value) || null,
  )

  const hasSelection = computed(() => selectedTemplateId.value !== null)

  // Actions
  const selectTemplate = (template: EventTemplate): void => {
    selectedTemplateId.value = template.id
  }

  const selectTemplateById = (templateId: number | null): void => {
    selectedTemplateId.value = templateId
  }

  const clearSelection = (): void => {
    selectedTemplateId.value = null
  }

  const isTemplateSelected = (templateId: number): boolean => {
    return selectedTemplateId.value === templateId
  }

  return {
    // State
    selectedTemplateId,

    // Computed
    selectedTemplate,
    hasSelection,

    // Actions
    selectTemplate,
    selectTemplateById,
    clearSelection,
    isTemplateSelected,
  }
}
