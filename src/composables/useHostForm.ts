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

export function useHostForm(eventId: string, host?: EventHost, existingHosts?: EventHost[]) {
  // Track the current host for edit mode detection
  const currentHost = ref<EventHost | undefined>(host)

  // Track existing hosts for order calculation
  const currentExistingHosts = ref<EventHost[] | undefined>(existingHosts)

  // Determine mode
  const isEditMode = computed(() => !!currentHost.value)

  // Calculate max order from existing hosts
  const maxOrder = computed(() => {
    if (!currentExistingHosts.value || currentExistingHosts.value.length === 0) {
      return 0
    }
    return Math.max(...currentExistingHosts.value.map((h) => h.order), 0)
  })

  // State
  const loading = ref(false)
  const fieldErrors = ref<Record<string, string[]>>({})
  const generalError = ref<string>('')
  const emailError = ref<string>('')

  // Calculate initial order for new hosts (append to end)
  const getInitialOrder = (): number => {
    if (host) return host.order
    if (!existingHosts || existingHosts.length === 0) return 0
    return Math.max(...existingHosts.map((h) => h.order), 0) + 1
  }

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
    order: getInitialOrder(),
    translations: host ? host.translations.map(t => ({ ...t })) : [],
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
      return { data: sanitizeFormData() as unknown as Record<string, unknown>, hasChanges: true }
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
        name: sanitizePlainText(t.name || '', MAX_NAME_LENGTH),
        parent_a_name: sanitizePlainText(t.parent_a_name || '', MAX_NAME_LENGTH),
        parent_b_name: sanitizePlainText(t.parent_b_name || '', MAX_NAME_LENGTH),
        title: sanitizePlainText(t.title || '', MAX_TITLE_LENGTH),
        bio: sanitizeRichContent(t.bio || '', MAX_BIO_LENGTH),
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

  // Helper to calculate reorder updates when inserting at a specific position
  const calculateReorderUpdates = (
    targetOrder: number,
    excludeId?: number,
  ): { id: number; order: number }[] => {
    if (!currentExistingHosts.value) return []

    // Filter hosts that need to be shifted (order >= target, not the current host)
    const hostsToShift = currentExistingHosts.value.filter((h) => {
      if (excludeId && h.id === excludeId) return false
      return h.order >= targetOrder
    })

    // Sort by current order and assign new orders (shift down by 1)
    return hostsToShift
      .sort((a, b) => a.order - b.order)
      .map((h, index) => ({
        id: h.id,
        order: targetOrder + index + 1,
      }))
  }

  // Helper to calculate full reorder when moving a host to a new position
  const calculateMoveReorderUpdates = (
    hostId: number,
    oldOrder: number,
    newOrder: number,
  ): { id: number; order: number }[] => {
    if (!currentExistingHosts.value || oldOrder === newOrder) return []

    const others = currentExistingHosts.value
      .filter((h) => h.id !== hostId)
      .sort((a, b) => a.order - b.order)

    // Build new order array by inserting at the target position
    const result: { id: number; order: number }[] = []
    let orderIndex = 0

    for (const h of others) {
      if (orderIndex === newOrder) {
        orderIndex++
      }
      result.push({ id: h.id, order: orderIndex })
      orderIndex++
    }

    // Add the moving host at its new position
    result.push({ id: hostId, order: newOrder })

    // Only return hosts whose order actually changed
    return result.filter((update) => {
      const original = currentExistingHosts.value?.find((h) => h.id === update.id)
      return original && original.order !== update.order
    })
  }

  // Create host
  const createHost = async (
    profileImageFile: File | null,
  ): Promise<{ success: boolean; data?: EventHost; message?: string }> => {
    loading.value = true
    fieldErrors.value = {}
    generalError.value = ''

    try {
      // Validate
      if (!validateEmail() || !validateUrls() || !validateProfileImage(profileImageFile)) {
        loading.value = false
        return { success: false, message: generalError.value || 'Validation failed' }
      }

      const requestData = sanitizeFormData()
      let response

      if (profileImageFile) {
        response = await hostsService.createHostWithFile(eventId, requestData, profileImageFile)
      } else {
        response = await hostsService.createHost(eventId, requestData)
      }

      if (response.success && response.data) {
        const createdHost = response.data

        // If inserting at a specific position (not at the end), reorder other hosts
        const reorderUpdates = calculateReorderUpdates(createdHost.order, createdHost.id)

        if (reorderUpdates.length > 0) {
          const allUpdates = [{ id: createdHost.id, order: createdHost.order }, ...reorderUpdates]
          try {
            const reorderResponse = await hostsService.bulkReorderHosts(eventId, {
              updates: allUpdates,
            })
            if (!reorderResponse.success) {
              console.error('Reorder failed after create:', reorderResponse.message)
            }
          } catch (reorderError) {
            console.error('Error during post-create reorder:', reorderError)
          }
        }

        return { success: true, data: createdHost }
      } else {
        if (response.errors && typeof response.errors === 'object') {
          fieldErrors.value = response.errors as Record<string, string[]>
        }
        generalError.value = response.message || 'Failed to create host'
        return { success: false, message: generalError.value }
      }
    } catch (error) {
      console.error('Error creating host:', error)
      generalError.value = 'Network error. Please check your connection and try again.'
      return { success: false, message: generalError.value }
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

    const originalOrder = currentHost.value.order
    const newOrder = formData.order
    const orderChanged = originalOrder !== newOrder

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
        // IMPORTANT: FormData PATCH may have different semantics than JSON PATCH
        // We must include ALL current field values to prevent the backend from clearing them
        const formDataPayload = sanitizeFormData()

        response = await hostsService.updateHostWithFile(
          eventId,
          currentHost.value.id,
          formDataPayload,
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
        const updatedHost = response.data

        // If position changed, reorder sibling hosts to match
        if (orderChanged) {
          const reorderUpdates = calculateMoveReorderUpdates(updatedHost.id, originalOrder, newOrder)
          if (reorderUpdates.length > 0) {
            try {
              const reorderResponse = await hostsService.bulkReorderHosts(eventId, {
                updates: reorderUpdates,
              })
              if (!reorderResponse.success) {
                console.error('Reorder failed after update:', reorderResponse.message)
              }
            } catch (reorderError) {
              console.error('Error during post-update reorder:', reorderError)
            }
          }
        }

        // Update original form data to reflect saved state
        originalFormData.value = {
          name: updatedHost.name || '',
          parent_a_name: updatedHost.parent_a_name || '',
          parent_b_name: updatedHost.parent_b_name || '',
          title: updatedHost.title || '',
          bio: updatedHost.bio || '',
          profile_image: updatedHost.profile_image || '',
          email: updatedHost.email || '',
          linkedin_url: updatedHost.linkedin_url || '',
          twitter_url: updatedHost.twitter_url || '',
          website_url: updatedHost.website_url || '',
          order: updatedHost.order || 0,
          translations: updatedHost.translations ? updatedHost.translations.map(t => ({ ...t })) : [],
        }
        return { success: true, data: updatedHost }
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
  const resetForm = (newHost?: EventHost, newExistingHosts?: EventHost[]) => {
    currentHost.value = newHost
    currentExistingHosts.value = newExistingHosts
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
    // For new hosts, default to maxOrder + 1 so they appear at the end
    const currentMaxOrder = newExistingHosts?.length
      ? Math.max(...newExistingHosts.map((h) => h.order), 0)
      : 0
    formData.order = newHost?.order ?? (currentMaxOrder + 1)
    // Deep copy translations to avoid shared references
    formData.translations = newHost ? newHost.translations.map(t => ({ ...t })) : []

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
        // Deep copy translations to avoid shared references with formData
        translations: newHost.translations ? newHost.translations.map(t => ({ ...t })) : [],
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
    maxOrder,

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
