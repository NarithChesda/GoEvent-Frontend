import { ref, computed, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { uploadService } from '@/services/upload'
import { apiService } from '@/services/api'
import type { User } from '@/services/auth'

export interface UseProfilePictureUploadOptions {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function useProfilePictureUpload(options: UseProfilePictureUploadOptions = {}) {
  const authStore = useAuthStore()

  // Refs
  const fileInput = ref<HTMLInputElement | null>(null)
  const profilePicturePreview = ref<string>('')
  const uploadLoading = ref(false)
  const profilePictureTimestamp = ref(Date.now())

  // Computed: Profile picture URL with cache busting
  const profilePictureUrl = computed(() => {
    if (profilePicturePreview.value) {
      return profilePicturePreview.value
    }

    if (authStore.user?.profile_picture) {
      const baseUrl = apiService.getProfilePictureUrl(authStore.user.profile_picture)
      if (baseUrl) {
        // Add timestamp to bust browser cache when image changes
        const separator = baseUrl.includes('?') ? '&' : '?'
        return `${baseUrl}${separator}t=${profilePictureTimestamp.value}`
      }
    }

    return null
  })

  /**
   * Trigger file input click to open file picker
   */
  const triggerFileUpload = () => {
    fileInput.value?.click()
  }

  /**
   * Set the file input ref (used in template)
   */
  const setFileInputRef = (el: HTMLInputElement | null) => {
    fileInput.value = el
  }

  /**
   * Handle file selection and upload
   */
  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    try {
      uploadLoading.value = true

      // Create preview first for better UX
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          profilePicturePreview.value = e.target.result as string
        }
      }
      reader.onerror = () => {
        console.error('Failed to read file for preview')
      }
      reader.readAsDataURL(file)

      // Upload file with enhanced security validation
      const response = await uploadService.uploadProfilePicture(file)

      if (response.success && response.data) {
        // The API can return the user object in different formats:
        // Format 1: { user: {...} } - nested user object
        // Format 2: { id, email, ... } - direct user object
        let userData: User | null = null

        if (response.data.user && response.data.user.id) {
          // Nested user object
          userData = response.data.user
        } else if (response.data.id && response.data.email) {
          // Direct user object - construct proper User type
          userData = {
            id: response.data.id,
            email: response.data.email,
            username: response.data.username || authStore.user?.username || '',
            first_name: response.data.first_name || authStore.user?.first_name,
            last_name: response.data.last_name || authStore.user?.last_name,
            profile_picture: response.data.profile_picture || authStore.user?.profile_picture,
            logo: response.data.logo || authStore.user?.logo,
            bio: response.data.bio || authStore.user?.bio,
            date_joined: response.data.date_joined || authStore.user?.date_joined || new Date().toISOString(),
            is_active: response.data.is_active ?? authStore.user?.is_active ?? true,
            is_verified: response.data.is_verified ?? authStore.user?.is_verified,
            is_partner: response.data.is_partner ?? authStore.user?.is_partner,
            phone_number: response.data.phone_number || authStore.user?.phone_number,
            telegram_link: response.data.telegram_link || authStore.user?.telegram_link,
            payment_link: response.data.payment_link || authStore.user?.payment_link,
          }
        }

        if (userData) {
          // Update the entire user in the store
          authStore.setUser(userData)
        } else {
          // Fallback: just update profile_picture field
          const profilePictureUrl = response.data.profile_picture || response.data.url
          await authStore.updateProfile({ profile_picture: profilePictureUrl })
        }

        // Wait for Vue to update the DOM, then update timestamp and clear preview
        await nextTick()

        // Update timestamp to force image reload
        profilePictureTimestamp.value = Date.now()

        // Clear preview AFTER store is updated
        profilePicturePreview.value = ''

        options.onSuccess?.('Profile picture updated successfully!')
        return { success: true }
      } else {
        const errorMsg = response.message || 'Failed to upload profile picture'
        options.onError?.(errorMsg)
        profilePicturePreview.value = ''
        return { success: false, error: errorMsg }
      }
    } catch (error) {
      console.error('File upload error:', error)
      const errorMsg = 'Failed to upload profile picture'
      options.onError?.(errorMsg)
      profilePicturePreview.value = ''
      return { success: false, error: errorMsg }
    } finally {
      uploadLoading.value = false
      // Clear the input
      if (target) target.value = ''
    }
  }

  /**
   * Handle image load error
   */
  const handleImageError = (event: Event) => {
    console.error('Image failed to load:', (event.target as HTMLImageElement)?.src)
    options.onError?.('Failed to load profile picture. Please try refreshing the page.')
  }

  /**
   * Handle image load success (silent success)
   */
  const handleImageLoad = () => {
    // Image loaded successfully - no action needed
  }

  return {
    // Refs
    fileInput,
    profilePicturePreview,
    uploadLoading,
    profilePictureTimestamp,

    // Computed
    profilePictureUrl,

    // Methods
    triggerFileUpload,
    setFileInputRef,
    handleFileSelect,
    handleImageError,
    handleImageLoad,
  }
}
