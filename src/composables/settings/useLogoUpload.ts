import { ref, computed, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { uploadService } from '@/services/upload'
import { apiService } from '@/services/api'
import type { User } from '@/services/auth'

export interface UseLogoUploadOptions {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function useLogoUpload(options: UseLogoUploadOptions = {}) {
  const authStore = useAuthStore()

  // Refs
  const logoFileInput = ref<HTMLInputElement | null>(null)
  const logoPreview = ref<string>('')
  const logoUploadLoading = ref(false)
  const logoTimestamp = ref(Date.now())

  // Computed: Check if user is a partner (only partners can upload logos)
  const isPartner = computed(() => authStore.user?.is_partner ?? false)

  // Computed: Logo URL with cache busting
  const logoUrl = computed(() => {
    if (logoPreview.value) {
      return logoPreview.value
    }

    if (authStore.user?.logo) {
      const baseUrl = apiService.getProfilePictureUrl(authStore.user.logo)
      if (baseUrl) {
        // Add timestamp to bust browser cache when image changes
        const separator = baseUrl.includes('?') ? '&' : '?'
        return `${baseUrl}${separator}t=${logoTimestamp.value}`
      }
    }

    return null
  })

  /**
   * Trigger file input click to open file picker
   */
  const triggerLogoUpload = () => {
    if (!isPartner.value) {
      options.onError?.('Only partners can upload logos')
      return
    }
    logoFileInput.value?.click()
  }

  /**
   * Set the logo file input ref (used in template)
   */
  const setLogoFileInputRef = (el: HTMLInputElement | null) => {
    logoFileInput.value = el
  }

  /**
   * Handle logo file selection and upload
   */
  const handleLogoFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    try {
      logoUploadLoading.value = true

      // Create preview first for better UX
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          logoPreview.value = e.target.result as string
        }
      }
      reader.onerror = () => {
        console.error('Failed to read file for preview')
      }
      reader.readAsDataURL(file)

      // Upload file with enhanced security validation
      const response = await uploadService.uploadLogo(file)

      if (response.success && response.data) {
        // The API can return the user object in different formats
        let userData: User | null = null

        if (response.data.user && response.data.user.id) {
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
          authStore.setUser(userData)
        } else {
          const logoUrlValue = response.data.logo || response.data.url
          await authStore.updateProfile({ logo: logoUrlValue })
        }

        await nextTick()
        logoTimestamp.value = Date.now()
        logoPreview.value = ''

        options.onSuccess?.('Logo updated successfully!')
        return { success: true }
      } else {
        const errorMsg = response.message || 'Failed to upload logo'
        options.onError?.(errorMsg)
        logoPreview.value = ''
        return { success: false, error: errorMsg }
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      const errorMsg = 'Failed to upload logo'
      options.onError?.(errorMsg)
      logoPreview.value = ''
      return { success: false, error: errorMsg }
    } finally {
      logoUploadLoading.value = false
      if (target) target.value = ''
    }
  }

  /**
   * Handle logo image load error
   */
  const handleLogoImageError = (event: Event) => {
    console.error('Logo failed to load:', (event.target as HTMLImageElement)?.src)
    options.onError?.('Failed to load logo. Please try refreshing the page.')
  }

  /**
   * Handle logo image load success (silent success)
   */
  const handleLogoImageLoad = () => {
    // Logo loaded successfully - no action needed
  }

  return {
    // Refs
    logoFileInput,
    logoPreview,
    logoUploadLoading,
    logoTimestamp,

    // Computed
    isPartner,
    logoUrl,

    // Methods
    triggerLogoUpload,
    setLogoFileInputRef,
    handleLogoFileSelect,
    handleLogoImageError,
    handleLogoImageLoad,
  }
}
