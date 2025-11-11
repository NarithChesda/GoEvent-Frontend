/**
 * Host Form Management Composable
 * Handles form state, validation, and submission for host creation/editing
 */

import { ref, reactive, computed } from 'vue'
import { hostsService, type EventHost, type CreateHostRequest } from '@/services/api'
import { sanitizePlainText, sanitizeRichContent } from '@/utils/sanitize'
import { inputValidator } from '@/utils/inputValidation'

// Constants
const MAX_PROFILE_IMAGE_SIZE = 3 * 1024 * 1024 // 3MB
const MAX_NAME_LENGTH = 100
const MAX_TITLE_LENGTH = 150
const MAX_BIO_LENGTH = 1000

interface HostFormData {
  name: string
  parent_a_name: string
  parent_b_name: string
  title: string
  bio: string
  profile_image: string
  email: string
  linkedin_url: string
  twitter_url: string
  website_url: string
  order: number
  translations: any[]
}

export function useHostForm(eventId: string, host?: EventHost) {
  // Determine mode
  const isEditMode = computed(() => !!host)

  // State
  const loading = ref(false)
  const fieldErrors = ref<Record<string, string[]>>({})
  const generalError = ref<string>('')
  const emailError = ref<string>('')

  // Form data - initialize with host data (edit mode) or empty values (create mode)
  const formData = reactive<HostFormData>({
    name: host?.name || '',
    parent_a_name: host?.parent_a_name || '',
    parent_b_name: host?.parent_b_name || '',
    title: host?.title || '',
    bio: host?.bio || '',
    profile_image: host?.profile_image || '',
    email: host?.email || '',
    linkedin_url: host?.linkedin_url || '',
    twitter_url: host?.twitter_url || '',
    website_url: host?.website_url || '',
    order: host?.order || 0,
    translations: host ? [...host.translations] : [],
  })

  // Validation
  const isValidHttpUrl = (urlString: string): boolean => {
    if (!urlString || urlString.trim() === '') return true

    try {
      const url = new URL(urlString)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const validateEmail = (): boolean => {
    emailError.value = ''

    if (formData.email && formData.email.trim() !== '') {
      const result = inputValidator.validateEmail(formData.email)
      if (!result.isValid) {
        emailError.value = result.errors[0] || 'Invalid email address'
        return false
      } else {
        formData.email = result.sanitizedValue || formData.email
      }
    }
    return true
  }

  const validateUrls = (): boolean => {
    const urls = [
      { field: 'LinkedIn', value: formData.linkedin_url },
      { field: 'Twitter', value: formData.twitter_url },
      { field: 'Website', value: formData.website_url },
    ]

    for (const { field, value } of urls) {
      if (value && !isValidHttpUrl(value)) {
        generalError.value = `Invalid ${field} URL. Please use http:// or https:// URLs only.`
        return false
      }
    }
    return true
  }

  const validateProfileImage = (file: File | null): boolean => {
    if (!file) return true

    if (!file.type.startsWith('image/')) {
      generalError.value = 'Invalid file type. Please select an image file.'
      return false
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      generalError.value = 'File size exceeds 3MB limit. Please select a smaller image.'
      return false
    }

    return true
  }

  // Sanitize data
  const sanitizeFormData = (): CreateHostRequest => {
    const requestData: CreateHostRequest = {
      name: sanitizePlainText(formData.name, MAX_NAME_LENGTH),
      parent_a_name: sanitizePlainText(formData.parent_a_name || '', MAX_NAME_LENGTH),
      parent_b_name: sanitizePlainText(formData.parent_b_name || '', MAX_NAME_LENGTH),
      title: sanitizePlainText(formData.title || '', MAX_TITLE_LENGTH),
      bio: sanitizeRichContent(formData.bio || '', MAX_BIO_LENGTH),
      email: formData.email || '',
      linkedin_url: formData.linkedin_url || '',
      twitter_url: formData.twitter_url || '',
      website_url: formData.website_url || '',
      order: formData.order || 0,
    }

    // Sanitize translations
    const cleanedTranslations = formData.translations.map((translation) => ({
      language: translation.language,
      name: sanitizePlainText(translation.name || '', MAX_NAME_LENGTH),
      parent_a_name: sanitizePlainText(translation.parent_a_name || '', MAX_NAME_LENGTH),
      parent_b_name: sanitizePlainText(translation.parent_b_name || '', MAX_NAME_LENGTH),
      title: sanitizePlainText(translation.title || '', MAX_TITLE_LENGTH),
      bio: sanitizeRichContent(translation.bio || '', MAX_BIO_LENGTH),
    }))

    requestData.translations = cleanedTranslations.filter((t) => t.language && t.language.trim() !== '')

    return requestData
  }

  // Create host
  const createHost = async (
    profileImageFile: File | null,
  ): Promise<{ success: boolean; data?: EventHost }> => {
    loading.value = true
    fieldErrors.value = {}
    generalError.value = ''

    try {
      // Validate
      if (!validateEmail() || !validateUrls() || !validateProfileImage(profileImageFile)) {
        loading.value = false
        return { success: false }
      }

      const requestData = sanitizeFormData()
      let response

      if (profileImageFile) {
        response = await hostsService.createHostWithFile(eventId, requestData, profileImageFile)
      } else {
        response = await hostsService.createHost(eventId, requestData)
      }

      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        if (response.errors && typeof response.errors === 'object') {
          fieldErrors.value = response.errors as Record<string, string[]>
        }
        generalError.value = response.message || 'Failed to create host'
        return { success: false }
      }
    } catch (error) {
      console.error('Error creating host:', error)
      generalError.value = 'Network error. Please check your connection and try again.'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  // Update host
  const updateHost = async (
    profileImageFile: File | null,
    imageRemoved: boolean,
  ): Promise<{ success: boolean; data?: EventHost }> => {
    if (!host) {
      generalError.value = 'No host to update'
      return { success: false }
    }

    loading.value = true
    fieldErrors.value = {}
    generalError.value = ''

    try {
      // Validate
      if (!validateEmail() || !validateUrls() || !validateProfileImage(profileImageFile)) {
        loading.value = false
        return { success: false }
      }

      const requestData = sanitizeFormData()

      // Determine if image changed
      const hasNewImage = !!profileImageFile
      const isRemovingImage = imageRemoved && !!host.profile_image
      const imageChanged = hasNewImage || isRemovingImage

      let response

      if (imageChanged) {
        response = await hostsService.updateHostWithFile(
          eventId,
          host.id,
          requestData,
          profileImageFile || undefined,
        )
      } else {
        response = await hostsService.patchHost(eventId, host.id, requestData)
      }

      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        if (response.errors && typeof response.errors === 'object') {
          fieldErrors.value = response.errors as Record<string, string[]>
        }
        generalError.value = response.message || 'Failed to update host'
        return { success: false }
      }
    } catch (error) {
      console.error('Error updating host:', error)
      generalError.value = 'Network error. Please check your connection and try again.'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  // Reset errors
  const resetErrors = () => {
    fieldErrors.value = {}
    generalError.value = ''
    emailError.value = ''
  }

  return {
    // State
    formData,
    loading,
    isEditMode,

    // Errors
    fieldErrors,
    generalError,
    emailError,

    // Validation
    validateEmail,

    // Actions
    createHost,
    updateHost,
    resetErrors,
  }
}
