import { ref, type Ref } from 'vue'
import { type EventTemplate, eventTemplateService } from '../services/api'

interface LoadTemplateOptions {
  templateId: string
  eventId: string
  existingDetails?: EventTemplate | null
}

/**
 * Composable for managing template loading operations
 * Provides centralized template data management with multiple loading strategies
 */
export function useTemplateLoader() {
  const selectedTemplateDetails = ref<EventTemplate | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // AbortController for request cancellation
  let abortController: AbortController | null = null

  /**
   * Load template details using multiple fallback strategies
   */
  const loadTemplateDetails = async (options: LoadTemplateOptions): Promise<void> => {
    const { templateId, eventId, existingDetails } = options

    if (!templateId) {
      clearTemplate()
      return
    }

    // Cancel previous request if still pending
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    loading.value = true
    error.value = null

    try {
      // Strategy 1: Use existing details if available (most efficient)
      if (existingDetails) {
        selectedTemplateDetails.value = existingDetails
        return
      }

      // Strategy 2: Use dedicated template-info API
      const response = await eventTemplateService.getEventTemplateInfo(eventId)
      if (response.success && response.data) {
        selectedTemplateDetails.value = response.data
        return
      }

      // Strategy 3: Fallback to browse templates API
      const browseResponse = await eventTemplateService.browseTemplates()
      if (browseResponse.success && browseResponse.data) {
        const foundTemplate = browseResponse.data.templates.find(
          (t: EventTemplate) => String(t.id) === String(templateId)
        )
        selectedTemplateDetails.value = foundTemplate || null
        
        if (!foundTemplate) {
          throw new Error(`Template with ID ${templateId} not found`)
        }
        return
      }

      throw new Error('All template loading strategies failed')
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error loading template details:', err)
        error.value = err.message
        selectedTemplateDetails.value = null
      }
    } finally {
      loading.value = false
      abortController = null
    }
  }

  /**
   * Load template details with automatic retry logic
   */
  const loadTemplateDetailsWithRetry = async (
    options: LoadTemplateOptions,
    maxRetries = 2
  ): Promise<void> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await loadTemplateDetails(options)
        return // Success, exit retry loop
      } catch (err) {
        console.warn(`Template details load attempt ${attempt + 1} failed:`, err)
        
        if (attempt === maxRetries) {
          error.value = 'Failed to load template details after multiple attempts'
          throw err
        } else {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
        }
      }
    }
  }

  /**
   * Clear template data and cancel any pending requests
   */
  const clearTemplate = (): void => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    
    selectedTemplateDetails.value = null
    loading.value = false
    error.value = null
  }

  /**
   * Set template details directly (for when template is selected via UI)
   */
  const setTemplateDetails = (template: EventTemplate | null): void => {
    selectedTemplateDetails.value = template
    error.value = null
  }

  return {
    // State
    selectedTemplateDetails: selectedTemplateDetails as Ref<EventTemplate | null>,
    loading: loading as Ref<boolean>,
    error: error as Ref<string | null>,

    // Methods
    loadTemplateDetails,
    loadTemplateDetailsWithRetry,
    clearTemplate,
    setTemplateDetails
  }
}