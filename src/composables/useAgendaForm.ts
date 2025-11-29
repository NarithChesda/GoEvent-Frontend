/**
 * Agenda Form Management Composable
 * Handles form state, validation, and submission for agenda item creation/editing
 */

import { ref, reactive, computed } from 'vue'
import {
  agendaService,
  coreDataService,
  type EventAgendaItem,
  type AgendaIcon,
  type CreateAgendaRequest,
} from '@/services/api'
import { sanitizePlainText, validateUrl } from '@/utils/sanitize'

// Type for agenda_type to ensure type safety
type AgendaType = CreateAgendaRequest['agenda_type']

// Constants
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_SPEAKER_LENGTH = 200
const MAX_LOCATION_LENGTH = 200
const MAX_TIME_TEXT_LENGTH = 50
const MAX_DATE_TEXT_LENGTH = 100

interface AgendaFormData {
  title: string
  description: string
  agenda_type: AgendaType
  date: string
  date_text: string
  start_time_text: string
  end_time_text: string
  speaker: string
  location: string
  virtual_link: string
  order: number
  is_featured: boolean
  color: string
  icon_id: number | null
  translations: any[]
}

export function useAgendaForm(
  eventId: string,
  item?: EventAgendaItem,
  existingAgendaItems?: EventAgendaItem[],
) {
  // Track the current item for edit mode detection
  const currentItem = ref<EventAgendaItem | undefined>(item)

  // Track existing items for order calculation
  const currentExistingItems = ref<EventAgendaItem[] | undefined>(existingAgendaItems)

  // Determine mode
  const isEditMode = computed(() => !!currentItem.value)

  // Calculate max order from existing items
  const maxOrder = computed(() => {
    if (!currentExistingItems.value || currentExistingItems.value.length === 0) {
      return 0
    }
    return Math.max(...currentExistingItems.value.map(i => i.order), 0)
  })

  // State
  const loading = ref(false)
  const availableIcons = ref<AgendaIcon[]>([])
  const fieldErrors = ref<Record<string, string>>({})
  const generalError = ref<string>('')
  const urlValidationError = ref<string>('')

  // Helper function to get the latest agenda item (most recent by order or date)
  const getLatestAgendaItem = (): EventAgendaItem | null => {
    if (!existingAgendaItems || existingAgendaItems.length === 0) {
      return null
    }
    const sorted = [...existingAgendaItems].sort((a, b) => b.order - a.order)
    return sorted[0]
  }

  // Helper function to get unique languages from existing agenda items
  const getExistingLanguages = (): Set<string> => {
    const languages = new Set<string>()

    if (!existingAgendaItems || existingAgendaItems.length === 0) {
      return languages
    }

    existingAgendaItems.forEach((item) => {
      item.translations.forEach((translation) => {
        if (translation.language && translation.language.trim() !== '') {
          languages.add(translation.language)
        }
      })
    })

    return languages
  }

  // Get auto-fill data from latest agenda item in create mode
  const latestAgendaItem = !item ? getLatestAgendaItem() : null

  // Calculate initial order for new items (append to end)
  const getInitialOrder = (): number => {
    if (item) return item.order
    if (!existingAgendaItems || existingAgendaItems.length === 0) return 0
    return Math.max(...existingAgendaItems.map(i => i.order), 0) + 1
  }

  // Form data - initialize with item data (edit mode) or auto-filled values (create mode)
  const formData = reactive<AgendaFormData>({
    title: item?.title || '',
    description: item?.description || '',
    agenda_type: item?.agenda_type || 'session',
    date: item?.date || latestAgendaItem?.date || '',
    date_text: item?.date_text || latestAgendaItem?.date_text || '',
    start_time_text: item?.start_time_text || '',
    end_time_text: item?.end_time_text || '',
    speaker: item?.speaker || '',
    location: item?.location || '',
    virtual_link: item?.virtual_link || '',
    order: getInitialOrder(),
    is_featured: item?.is_featured || false,
    color: item?.color || '#3498db',
    icon_id: item?.icon?.id || null,
    translations: item ? [...item.translations] : [],
  })

  // Original form values for dirty tracking (only used in edit mode)
  const originalFormData = ref<AgendaFormData | null>(null)

  // Fetch available icons
  const fetchIcons = async () => {
    try {
      const response = await coreDataService.getIcons()
      if (response.success && response.data) {
        availableIcons.value = response.data
      }
    } catch (error) {
      console.error('Error fetching icons:', error)
    }
  }

  // Get selected icon
  const getSelectedIcon = () => {
    return availableIcons.value.find((icon) => icon.id === formData.icon_id)
  }

  // Sanitize form data
  const sanitizeFormData = () => {
    // Clear previous errors
    fieldErrors.value = {}
    urlValidationError.value = ''

    // Validate and sanitize virtual_link if provided
    if (formData.virtual_link && formData.virtual_link.trim() !== '') {
      const urlValidation = validateUrl(formData.virtual_link)
      if (!urlValidation.isValid) {
        urlValidationError.value = urlValidation.errors[0] || 'Invalid URL'
        fieldErrors.value.virtual_link = urlValidation.errors[0] || 'Invalid URL'
        return null
      }
      formData.virtual_link = urlValidation.sanitized
    }

    // Sanitize text fields with appropriate length limits
    const sanitizedData = {
      title: sanitizePlainText(formData.title, MAX_TITLE_LENGTH),
      description: sanitizePlainText(formData.description, MAX_DESCRIPTION_LENGTH),
      speaker: sanitizePlainText(formData.speaker, MAX_SPEAKER_LENGTH),
      location: sanitizePlainText(formData.location, MAX_LOCATION_LENGTH),
      start_time_text: sanitizePlainText(formData.start_time_text, MAX_TIME_TEXT_LENGTH),
      end_time_text: sanitizePlainText(formData.end_time_text, MAX_TIME_TEXT_LENGTH),
      date_text: sanitizePlainText(formData.date_text, MAX_DATE_TEXT_LENGTH),
      virtual_link: formData.virtual_link,
      date: formData.date,
      agenda_type: formData.agenda_type,
      order: formData.order,
      is_featured: formData.is_featured,
      color: formData.color,
      icon_id: formData.icon_id,
    }

    // Sanitize translation fields
    const sanitizedTranslations = formData.translations.map((translation) => ({
      language: translation.language,
      title: sanitizePlainText(translation.title || '', MAX_TITLE_LENGTH),
      description: sanitizePlainText(translation.description || '', MAX_DESCRIPTION_LENGTH),
      date_text: sanitizePlainText(translation.date_text || '', MAX_DATE_TEXT_LENGTH),
      start_time_text: sanitizePlainText(translation.start_time_text || '', MAX_TIME_TEXT_LENGTH),
      end_time_text: sanitizePlainText(translation.end_time_text || '', MAX_TIME_TEXT_LENGTH),
      speaker: sanitizePlainText(translation.speaker || '', MAX_SPEAKER_LENGTH),
    }))

    return {
      ...sanitizedData,
      translations: sanitizedTranslations.filter((t) => t.language && t.language.trim() !== ''),
    }
  }

  // Helper to calculate reorder updates when inserting at a specific position
  const calculateReorderUpdates = (
    targetOrder: number,
    excludeId?: number,
    targetDate?: string | null,
  ): { id: number; order: number }[] => {
    if (!currentExistingItems.value) return []

    // Filter items that need to be shifted (same date, order >= target, not the current item)
    const itemsToShift = currentExistingItems.value.filter((item) => {
      if (excludeId && item.id === excludeId) return false
      // Only shift items on the same date (or both null/unscheduled)
      const itemDate = item.date || null
      const target = targetDate !== undefined ? targetDate : null
      if (itemDate !== target) return false
      return item.order >= targetOrder
    })

    // Sort by current order and assign new orders (shift down by 1)
    return itemsToShift
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({
        id: item.id,
        order: targetOrder + index + 1,
      }))
  }

  // Create agenda item
  const createAgendaItem = async (): Promise<{
    success: boolean
    data?: EventAgendaItem
    message?: string
  }> => {
    loading.value = true
    fieldErrors.value = {}
    generalError.value = ''

    try {
      const sanitizedData = sanitizeFormData()
      if (!sanitizedData) {
        loading.value = false
        return { success: false, message: generalError.value || 'Validation failed' }
      }

      const response = await agendaService.createAgendaItem(eventId, sanitizedData)
      if (response.success && response.data) {
        const createdItem = response.data

        // If inserting at a specific position (not at the end), reorder other items
        const reorderUpdates = calculateReorderUpdates(
          createdItem.order,
          createdItem.id,
          createdItem.date,
        )

        if (reorderUpdates.length > 0) {
          // Include the created item in the reorder to ensure consistent ordering
          const allUpdates = [
            { id: createdItem.id, order: createdItem.order },
            ...reorderUpdates,
          ]
          try {
            const reorderResponse = await agendaService.bulkReorderAgendaItems(eventId, { updates: allUpdates })
            if (!reorderResponse.success) {
              console.error('Reorder failed after create:', reorderResponse.message)
              // Item was created but ordering may be incorrect - still return success
              // The parent component will reload the list to get correct order
            }
          } catch (reorderError) {
            console.error('Error during post-create reorder:', reorderError)
            // Item was created but ordering may be incorrect - still return success
          }
        }

        return { success: true, data: createdItem }
      } else {
        if (response.errors && typeof response.errors === 'object') {
          Object.entries(response.errors).forEach(([field, messages]) => {
            fieldErrors.value[field] = Array.isArray(messages) ? messages[0] : messages
          })
        }
        generalError.value = response.message || 'Failed to create agenda item'
        return { success: false, message: generalError.value }
      }
    } catch (error) {
      console.error('Error creating agenda item:', error)
      generalError.value = 'Network error. Please check your connection and try again.'
      return { success: false, message: generalError.value }
    } finally {
      loading.value = false
    }
  }

  // Helper to calculate full reorder when moving an item to a new position
  const calculateMoveReorderUpdates = (
    itemId: number,
    oldOrder: number,
    newOrder: number,
    itemDate: string | null,
  ): { id: number; order: number }[] => {
    if (!currentExistingItems.value || oldOrder === newOrder) return []

    // Get all items on the same date, excluding the moving item
    const sameDate = currentExistingItems.value
      .filter((item) => {
        if (item.id === itemId) return false
        const d = item.date || null
        return d === itemDate
      })
      .sort((a, b) => a.order - b.order)

    // Build new order array by inserting at the target position
    const result: { id: number; order: number }[] = []
    let orderIndex = 0

    for (const item of sameDate) {
      // Skip the target position for the moving item
      if (orderIndex === newOrder) {
        orderIndex++
      }
      result.push({ id: item.id, order: orderIndex })
      orderIndex++
    }

    // Add the moving item at its new position
    result.push({ id: itemId, order: newOrder })

    // Only return items whose order actually changed
    return result.filter((update) => {
      const original = currentExistingItems.value?.find((i) => i.id === update.id)
      return original && original.order !== update.order
    })
  }

  // Update agenda item
  const updateAgendaItem = async (): Promise<{
    success: boolean
    data?: EventAgendaItem
    message?: string
  }> => {
    if (!currentItem.value) {
      generalError.value = 'No agenda item to update'
      return { success: false, message: 'No agenda item to update' }
    }

    loading.value = true
    fieldErrors.value = {}
    generalError.value = ''

    const originalOrder = currentItem.value.order
    const originalDate = currentItem.value.date || null
    const newOrder = formData.order
    const newDate = formData.date || null
    const orderChanged = originalOrder !== newOrder
    const dateChanged = originalDate !== newDate

    try {
      const sanitizedData = sanitizeFormData()
      if (!sanitizedData) {
        loading.value = false
        return { success: false, message: generalError.value || 'Validation failed' }
      }

      const response = await agendaService.updateAgendaItem(
        eventId,
        currentItem.value.id,
        sanitizedData,
      )
      if (response.success && response.data) {
        const updatedItem = response.data

        // If order or date changed, we need to reorder items
        if (orderChanged || dateChanged) {
          let reorderUpdates: { id: number; order: number }[] = []

          if (dateChanged) {
            // Moving to a different date - insert at position in new date group
            reorderUpdates = calculateReorderUpdates(
              updatedItem.order,
              updatedItem.id,
              updatedItem.date,
            )
            if (reorderUpdates.length > 0) {
              const allUpdates = [
                { id: updatedItem.id, order: updatedItem.order },
                ...reorderUpdates,
              ]
              try {
                const reorderResponse = await agendaService.bulkReorderAgendaItems(eventId, { updates: allUpdates })
                if (!reorderResponse.success) {
                  console.error('Reorder failed after update (date change):', reorderResponse.message)
                }
              } catch (reorderError) {
                console.error('Error during post-update reorder (date change):', reorderError)
              }
            }
          } else if (orderChanged) {
            // Same date, just moving position
            reorderUpdates = calculateMoveReorderUpdates(
              updatedItem.id,
              originalOrder,
              newOrder,
              newDate,
            )
            if (reorderUpdates.length > 0) {
              try {
                const reorderResponse = await agendaService.bulkReorderAgendaItems(eventId, { updates: reorderUpdates })
                if (!reorderResponse.success) {
                  console.error('Reorder failed after update (order change):', reorderResponse.message)
                }
              } catch (reorderError) {
                console.error('Error during post-update reorder (order change):', reorderError)
              }
            }
          }
        }

        return { success: true, data: updatedItem }
      } else {
        if (response.errors && typeof response.errors === 'object') {
          Object.entries(response.errors).forEach(([field, messages]) => {
            fieldErrors.value[field] = Array.isArray(messages) ? messages[0] : messages
          })
        }
        generalError.value = response.message || 'Failed to update agenda item'
        return { success: false, message: generalError.value }
      }
    } catch (error) {
      console.error('Error updating agenda item:', error)
      generalError.value = 'Network error. Please check your connection and try again.'
      return { success: false, message: generalError.value }
    } finally {
      loading.value = false
    }
  }

  // Reset errors
  const resetErrors = () => {
    fieldErrors.value = {}
    generalError.value = ''
    urlValidationError.value = ''
  }

  // Reset form with new item data (for when item prop changes)
  const resetForm = (newItem?: EventAgendaItem, newExistingItems?: EventAgendaItem[]) => {
    currentItem.value = newItem
    currentExistingItems.value = newExistingItems

    // Get auto-fill data in create mode
    const latestItem = !newItem && newExistingItems ?
      [...newExistingItems].sort((a, b) => b.order - a.order)[0] : null

    formData.title = newItem?.title || ''
    formData.description = newItem?.description || ''
    formData.agenda_type = newItem?.agenda_type || 'session'
    formData.date = newItem?.date || latestItem?.date || ''
    formData.date_text = newItem?.date_text || latestItem?.date_text || ''
    formData.start_time_text = newItem?.start_time_text || ''
    formData.end_time_text = newItem?.end_time_text || ''
    formData.speaker = newItem?.speaker || ''
    formData.location = newItem?.location || ''
    formData.virtual_link = newItem?.virtual_link || ''
    // For new items, default to maxOrder + 1 so they appear at the end
    const currentMaxOrder = newExistingItems?.length
      ? Math.max(...newExistingItems.map(i => i.order), 0)
      : 0
    formData.order = newItem?.order ?? (currentMaxOrder + 1)
    formData.is_featured = newItem?.is_featured || false
    formData.color = newItem?.color || '#3498db'
    formData.icon_id = newItem?.icon?.id || null
    formData.translations = newItem ? [...newItem.translations] : []

    // In create mode, auto-populate translation tabs based on existing agenda items
    if (!newItem && newExistingItems && newExistingItems.length > 0) {
      const existingLanguages = new Set<string>()
      newExistingItems.forEach((i) => {
        i.translations.forEach((t) => {
          if (t.language && t.language.trim() !== '' && t.language !== 'en') {
            existingLanguages.add(t.language)
          }
        })
      })

      existingLanguages.forEach((langCode) => {
        if (!formData.translations.some((t) => t.language === langCode)) {
          formData.translations.push({
            language: langCode,
            title: '',
            description: '',
            date_text: '',
            start_time_text: '',
            end_time_text: '',
            speaker: '',
          })
        }
      })
    }

    // Store original values for dirty tracking (only in edit mode)
    if (newItem) {
      originalFormData.value = { ...formData, translations: [...formData.translations] }
    } else {
      originalFormData.value = null
    }

    resetErrors()
  }

  // Initialize translations for create mode
  const initializeTranslationsForCreate = () => {
    if (!isEditMode.value && existingAgendaItems && existingAgendaItems.length > 0) {
      const existingLanguages = getExistingLanguages()
      existingLanguages.forEach((langCode) => {
        if (langCode !== 'en' && !formData.translations.some((t) => t.language === langCode)) {
          formData.translations.push({
            language: langCode,
            title: '',
            description: '',
            date_text: '',
            start_time_text: '',
            end_time_text: '',
            speaker: '',
          })
        }
      })
    }
  }

  return {
    // State
    formData,
    loading,
    isEditMode,
    availableIcons,
    maxOrder,

    // Errors
    fieldErrors,
    generalError,
    urlValidationError,

    // Icon methods
    fetchIcons,
    getSelectedIcon,

    // Actions
    createAgendaItem,
    updateAgendaItem,
    resetErrors,
    resetForm,
    initializeTranslationsForCreate,
  }
}
