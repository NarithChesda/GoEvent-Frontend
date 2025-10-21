import { ref } from 'vue'
import { type EventTemplate, eventTemplateService } from '../services/api'

export interface Message {
  type: 'success' | 'error'
  text: string
}

/**
 * Mock template data for development and fallback
 */
const getMockTemplates = (): EventTemplate[] => [
  {
    id: 1,
    name: 'Elegant Wedding Template',
    package_plan: {
      id: 1,
      name: 'Premium Plan',
      price: '299.00',
      commission: '15.00',
      features: [
        'Custom color palette',
        'Premium fonts',
        'Video backgrounds',
        'Advanced animations',
        'RSVP management',
        'Guest messaging',
      ],
      category: {
        id: 1,
        name: 'Wedding',
        color: '#ff6b6b',
      },
    },
    preview_image:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
    template_colors: [],
    template_fonts: [],
    open_envelope_button: '',
    basic_decoration_photo: '',
    basic_background_photo: '',
    standard_cover_video: '',
    standard_background_video: '',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:45:00Z',
  },
  {
    id: 2,
    name: 'Corporate Conference Template',
    package_plan: {
      id: 2,
      name: 'Business Plan',
      price: '199.00',
      commission: '10.00',
      features: [
        'Professional design',
        'Agenda management',
        'Speaker profiles',
        'Registration forms',
      ],
      category: {
        id: 2,
        name: 'Business',
        color: '#4ecdc4',
      },
    },
    preview_image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    template_colors: [],
    template_fonts: [],
    open_envelope_button: '',
    basic_decoration_photo: '',
    basic_background_photo: '',
    standard_cover_video: '',
    standard_background_video: '',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:45:00Z',
  },
  {
    id: 3,
    name: 'Birthday Party Template',
    package_plan: {
      id: 3,
      name: 'Standard Plan',
      price: '99.00',
      commission: '5.00',
      features: ['Colorful design', 'Photo gallery', 'RSVP tracking', 'Gift registry'],
      category: {
        id: 3,
        name: 'Birthday',
        color: '#ffd93d',
      },
    },
    preview_image:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
    template_colors: [],
    template_fonts: [],
    open_envelope_button: '',
    basic_decoration_photo: '',
    basic_background_photo: '',
    standard_cover_video: '',
    standard_background_video: '',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:45:00Z',
  },
  {
    id: 4,
    name: 'Graduation Ceremony Template',
    package_plan: {
      id: 4,
      name: 'Academic Plan',
      price: '149.00',
      commission: '8.00',
      features: ['Academic styling', 'Achievement showcase', 'Photo memories', 'Guest book'],
      category: {
        id: 4,
        name: 'Graduation',
        color: '#6c5ce7',
      },
    },
    preview_image:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
    template_colors: [],
    template_fonts: [],
    open_envelope_button: '',
    basic_decoration_photo: '',
    basic_background_photo: '',
    standard_cover_video: '',
    standard_background_video: '',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:45:00Z',
  },
]

/**
 * Composable for template API operations
 */
export function useTemplateApi() {
  // Loading states
  const loading = ref(false)
  const selecting = ref(false)

  // Data state
  const templates = ref<EventTemplate[]>([])
  const message = ref<Message | null>(null)

  /**
   * Load templates from API with fallback to mock data
   */
  const loadTemplates = async (): Promise<void> => {
    loading.value = true
    clearMessage()

    try {
      const response = await eventTemplateService.browseTemplates()

      if (response.success && response.data) {
        templates.value = response.data.templates || []
      } else {
        templates.value = getMockTemplates()
      }
    } catch (error) {
      templates.value = getMockTemplates()
    } finally {
      loading.value = false
    }
  }

  /**
   * Select a template for an event
   */
  const selectTemplate = async (
    eventId: string,
    templateId: number,
  ): Promise<{ success: boolean; template?: EventTemplate }> => {
    if (selecting.value) return { success: false }

    const selectedTemplate = templates.value.find((t) => t.id === templateId)
    if (!selectedTemplate) {
      showMessage('error', 'Template not found.')
      return { success: false }
    }

    selecting.value = true
    clearMessage()

    try {
      try {
        const response = await eventTemplateService.selectEventTemplate(eventId, templateId)

        if (response.success && response.data) {
          showMessage('success', 'Template selected successfully!')
          return { success: true, template: selectedTemplate }
        } else {
          console.warn('API response not successful:', response)
          showMessage('error', 'Failed to select template. Please try again.')
          return { success: false }
        }
      } catch (apiError) {
        console.warn('API selection failed:', apiError)
        showMessage('error', 'Unable to connect to server. Template will be selected locally.')
        // Return success for local fallback
        return { success: true, template: selectedTemplate }
      }
    } catch (error) {
      console.error('Error selecting template:', error)
      showMessage('error', 'An unexpected error occurred. Please try again.')
      return { success: false }
    } finally {
      selecting.value = false
    }
  }

  /**
   * Show a message to the user
   */
  const showMessage = (type: 'success' | 'error', text: string): void => {
    message.value = { type, text }
  }

  /**
   * Clear the current message
   */
  const clearMessage = (): void => {
    message.value = null
  }

  /**
   * Reset all state
   */
  const resetState = (): void => {
    templates.value = []
    clearMessage()
    loading.value = false
    selecting.value = false
  }

  return {
    // State
    loading,
    selecting,
    templates,
    message,

    // Actions
    loadTemplates,
    selectTemplate,
    showMessage,
    clearMessage,
    resetState,
  }
}
