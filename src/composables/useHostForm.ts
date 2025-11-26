/**
 * Host Form Management Composable
 * Handles form state, validation, and submission for host creation/editing
 */

import { ref, reactive, computed, type Ref } from 'vue'
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
  // Track the current host for edit mode detection
  const currentHost = ref<EventHost | undefined>(host)

  // Determine mode
  const isEditMode = computed(() => !!currentHost.value)

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

  // Original form values for dirty tracking (only used in edit mode)
  const originalFormData = ref<HostFormData | null>(null)

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

  // Sanitize data (for create - sends all fields)
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

  // Build dirty update payload - only includes changed fields
  const buildDirtyUpdatePayload = (): { data: Record<string, unknown>; hasChanges: boolean } => {
    if (!originalFormData.value) {
      // No original data, send all fields
      return { data: sanitizeFormData(), hasChanges: true }
    }

    const updateData: Record<string, unknown> = {}
    const original = originalFormData.value

    // Check text fields
    const currentName = sanitizePlainText(formData.name, MAX_NAME_LENGTH)
    if (currentName !== (original.name || '')) {
      updateData.name = currentName
    }

    const currentParentAName = sanitizePlainText(formData.parent_a_name || '', MAX_NAME_LENGTH)
    if (currentParentAName !== (original.parent_a_name || '')) {
      updateData.parent_a_name = currentParentAName
    }

    const currentParentBName = sanitizePlainText(formData.parent_b_name || '', MAX_NAME_LENGTH)
    if (currentParentBName !== (original.parent_b_name || '')) {
      updateData.parent_b_name = currentParentBName
    }

    const currentTitle = sanitizePlainText(formData.title || '', MAX_TITLE_LENGTH)
    if (currentTitle !== (original.title || '')) {
      updateData.title = currentTitle
    }

    const currentBio = sanitizeRichContent(formData.bio || '', MAX_BIO_LENGTH)
    if (currentBio !== (original.bio || '')) {
      updateData.bio = currentBio
    }

    const currentEmail = formData.email || ''
    if (currentEmail !== (original.email || '')) {
      updateData.email = currentEmail
    }

    const currentLinkedinUrl = formData.linkedin_url || ''
    if (currentLinkedinUrl !== (original.linkedin_url || '')) {
      updateData.linkedin_url = currentLinkedinUrl
    }

    const currentTwitterUrl = formData.twitter_url || ''
    if (currentTwitterUrl !== (original.twitter_url || '')) {
      updateData.twitter_url = currentTwitterUrl
    }

    const currentWebsiteUrl = formData.website_url || ''
    if (currentWebsiteUrl !== (original.website_url || '')) {
      updateData.website_url = currentWebsiteUrl
    }

    // Check if order changed
    if ((formData.order || 0) !== (original.order || 0)) {
      updateData.order = formData.order || 0
    }

    // Check translations - compare by serializing
    const currentTranslations = formData.translations
      .filter((t) => t.language && t.language.trim() !== '')
      .map((t) => ({
        language: t.language,
        name: sanitizePlainText(t.name || '', MAX_NAME_LENGTH),
        parent_a_name: sanitizePlainText(t.parent_a_name || '', MAX_NAME_LENGTH),
        parent_b_name: sanitizePlainText(t.parent_b_name || '', MAX_NAME_LENGTH),
        title: sanitizePlainText(t.title || '', MAX_TITLE_LENGTH),
        bio: sanitizeRichContent(t.bio || '', MAX_BIO_LENGTH),
      }))

    const originalTranslations = (original.translations || [])
      .filter((t: any) => t.language && t.language.trim() !== '')
      .map((t: any) => ({
        language: t.language,
        name: t.name || '',
        parent_a_name: t.parent_a_name || '',
        parent_b_name: t.parent_b_name || '',
        title: t.title || '',
        bio: t.bio || '',
      }))

    // Simple comparison - if translations differ, include all translations
    if (JSON.stringify(currentTranslations) !== JSON.stringify(originalTranslations)) {
      updateData.translations = currentTranslations
    }

    return {
      data: updateData,
      hasChanges: Object.keys(updateData).length > 0,
    }
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

  // Update host (with dirty tracking - only sends changed fields)
  const updateHost = async (
    profileImageFile: File | null,
    imageRemoved: boolean,
  ): Promise<{ success: boolean; data?: EventHost; message?: string }> => {
    if (!currentHost.value) {
      generalError.value = 'No host to update'
      return { success: false, message: 'No host to update' }
    }

    loading.value = true
    fieldErrors.value = {}
    generalError.value = ''

    try {
      // Validate
      if (!validateEmail() || !validateUrls() || !validateProfileImage(profileImageFile)) {
        loading.value = false
        return { success: false, message: generalError.value || 'Validation failed' }
      }

      // Determine if image changed
      const hasNewImage = !!profileImageFile
      const isRemovingImage = imageRemoved && !!currentHost.value.profile_image
      const imageChanged = hasNewImage || isRemovingImage

      // Build dirty payload - only changed fields
      const { data: updateData, hasChanges } = buildDirtyUpdatePayload()

      // If nothing changed (no field changes and no image changes), inform user
      if (!hasChanges && !imageChanged) {
        loading.value = false
        return { success: true, message: 'No changes to save' }
      }

      let response

      if (imageChanged) {
        // When image changes, we need to use FormData
        // Pass the removeImage flag to indicate if we're explicitly removing the image
        const formDataPayload = hasChanges ? updateData : {}
        response = await hostsService.updateHostWithFile(
          eventId,
          currentHost.value.id,
          formDataPayload as any,
          profileImageFile || undefined,
          isRemovingImage, // Pass the removeImage flag
        )
      } else if (hasChanges) {
        // Only field changes, no image - use PATCH with only changed fields
        response = await hostsService.patchHost(eventId, currentHost.value.id, updateData as Partial<CreateHostRequest>)
      } else {
        // No changes at all - shouldn't reach here due to early return above
        loading.value = false
        return { success: true, message: 'No changes to save' }
      }

      if (response.success && response.data) {
        // Update original form data to reflect saved state
        originalFormData.value = {
          name: response.data.name || '',
          parent_a_name: response.data.parent_a_name || '',
          parent_b_name: response.data.parent_b_name || '',
          title: response.data.title || '',
          bio: response.data.bio || '',
          profile_image: response.data.profile_image || '',
          email: response.data.email || '',
          linkedin_url: response.data.linkedin_url || '',
          twitter_url: response.data.twitter_url || '',
          website_url: response.data.website_url || '',
          order: response.data.order || 0,
          translations: response.data.translations ? [...response.data.translations] : [],
        }
        return { success: true, data: response.data }
      } else {
        if (response.errors && typeof response.errors === 'object') {
          fieldErrors.value = response.errors as Record<string, string[]>
        }
        generalError.value = response.message || 'Failed to update host'
        return { success: false, message: generalError.value }
      }
    } catch (error) {
      console.error('Error updating host:', error)
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
    emailError.value = ''
  }

  // Reset form with new host data (for when host prop changes)
  const resetForm = (newHost?: EventHost) => {
    currentHost.value = newHost
    formData.name = newHost?.name || ''
    formData.parent_a_name = newHost?.parent_a_name || ''
    formData.parent_b_name = newHost?.parent_b_name || ''
    formData.title = newHost?.title || ''
    formData.bio = newHost?.bio || ''
    formData.profile_image = newHost?.profile_image || ''
    formData.email = newHost?.email || ''
    formData.linkedin_url = newHost?.linkedin_url || ''
    formData.twitter_url = newHost?.twitter_url || ''
    formData.website_url = newHost?.website_url || ''
    formData.order = newHost?.order || 0
    formData.translations = newHost ? [...newHost.translations] : []

    // Store original values for dirty tracking (only in edit mode)
    if (newHost) {
      originalFormData.value = {
        name: newHost.name || '',
        parent_a_name: newHost.parent_a_name || '',
        parent_b_name: newHost.parent_b_name || '',
        title: newHost.title || '',
        bio: newHost.bio || '',
        profile_image: newHost.profile_image || '',
        email: newHost.email || '',
        linkedin_url: newHost.linkedin_url || '',
        twitter_url: newHost.twitter_url || '',
        website_url: newHost.website_url || '',
        order: newHost.order || 0,
        translations: newHost.translations ? [...newHost.translations] : [],
      }
    } else {
      originalFormData.value = null
    }

    resetErrors()
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
    resetForm,
  }
}
