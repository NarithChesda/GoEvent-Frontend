import { ref, computed, type Ref } from 'vue'
import { eventsService, type Event as ApiEvent } from '@/services/api'

/**
 * Media types supported by the upload system
 */
export type MediaType = 'image' | 'video' | 'audio'

/**
 * Media field names in the Event model
 */
export type MediaFieldName = 'banner_image' | 'logo_one' | 'logo_two' | 'event_video' | 'music'

/**
 * File validation configuration for each media type
 */
interface MediaTypeConfig {
  validTypes: string[]
  maxSize: number
  maxSizeMB: number
  typeName: string
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Configuration map for media types
 */
const MEDIA_TYPE_CONFIGS: Record<MediaType, MediaTypeConfig> = {
  image: {
    validTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    typeName: 'JPG, PNG, GIF, or WebP images'
  },
  video: {
    validTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
    maxSize: 100 * 1024 * 1024, // 100MB
    maxSizeMB: 100,
    typeName: 'MP4, MOV, AVI, or WebM videos'
  },
  audio: {
    validTypes: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/mpeg'],
    maxSize: 50 * 1024 * 1024, // 50MB
    maxSizeMB: 50,
    typeName: 'MP3, WAV, OGG, AAC, or FLAC audio files'
  }
}

/**
 * Composable for handling media uploads with validation and API calls
 *
 * @param eventData - Reactive reference to the current event data
 * @param onUpdate - Callback when media is successfully uploaded or removed
 */
export function useMediaUpload(
  eventData: Ref<ApiEvent | undefined>,
  onUpdate?: (event: ApiEvent) => void
) {
  // Track uploading state for each field
  const uploading = ref<Record<string, boolean>>({})

  // Track deletion state
  const deleting = ref(false)

  // Error message
  const error = ref<string | null>(null)

  /**
   * Check if a specific field is currently uploading
   */
  const isUploading = computed(() => (fieldName: string) => uploading.value[fieldName] === true)

  /**
   * Check if any upload is in progress
   */
  const hasActiveUpload = computed(() => Object.values(uploading.value).some(Boolean))

  /**
   * Validate a file against media type constraints
   */
  const validateFile = (file: File, type: MediaType): ValidationResult => {
    error.value = null

    const config = MEDIA_TYPE_CONFIGS[type]

    if (!config) {
      return { valid: false, error: 'Invalid media type' }
    }

    // Validate file type
    if (!config.validTypes.includes(file.type)) {
      const errorMsg = `Invalid file type. Please upload ${config.typeName}.`
      error.value = errorMsg
      return { valid: false, error: errorMsg }
    }

    // Validate file size
    if (file.size > config.maxSize) {
      const errorMsg = `File too large. Maximum size is ${config.maxSizeMB}MB.`
      error.value = errorMsg
      return { valid: false, error: errorMsg }
    }

    return { valid: true }
  }

  /**
   * Upload a media file to the API
   */
  const uploadMedia = async (fieldName: MediaFieldName, file: File): Promise<boolean> => {
    if (!eventData.value?.id) {
      error.value = 'Event data not available'
      return false
    }

    uploading.value[fieldName] = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append(fieldName, file)

      const response = await eventsService.updateEventWithFiles(eventData.value.id, formData)

      if (response.success && response.data) {
        onUpdate?.(response.data)
        return true
      } else {
        error.value = response.message || `Failed to upload ${fieldName}`
        return false
      }
    } catch (err) {
      console.error(`Error uploading ${fieldName}:`, err)
      error.value = 'Network error occurred while uploading'
      return false
    } finally {
      uploading.value[fieldName] = false
    }
  }

  /**
   * Remove a media file from the API
   */
  const removeMedia = async (fieldName: MediaFieldName): Promise<boolean> => {
    if (!eventData.value?.id) {
      error.value = 'Event data not available'
      return false
    }

    deleting.value = true
    error.value = null

    try {
      const updateData = { [fieldName]: null }
      const response = await eventsService.patchEvent(eventData.value.id, updateData)

      if (response.success && response.data) {
        onUpdate?.(response.data)
        return true
      } else {
        error.value = response.message || `Failed to remove ${fieldName}`
        return false
      }
    } catch (err) {
      console.error(`Error removing ${fieldName}:`, err)
      error.value = 'Network error occurred while removing media'
      return false
    } finally {
      deleting.value = false
    }
  }

  /**
   * Handle file upload with validation
   */
  const handleFileUpload = async (
    event: Event,
    fieldName: MediaFieldName,
    mediaType: MediaType
  ): Promise<boolean> => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    // Reset input value to allow re-uploading the same file
    target.value = ''

    if (!file) {
      return false
    }

    // Validate file
    const validation = validateFile(file, mediaType)
    if (!validation.valid) {
      return false
    }

    // Upload file
    return await uploadMedia(fieldName, file)
  }

  /**
   * Clear all errors
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    uploading: computed(() => uploading.value),
    deleting: computed(() => deleting.value),
    error: computed(() => error.value),

    // Computed
    isUploading,
    hasActiveUpload,

    // Methods
    validateFile,
    uploadMedia,
    removeMedia,
    handleFileUpload,
    clearError
  }
}
