import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export interface ProfileFormData {
  first_name: string
  last_name: string
  email: string
  username: string
  bio: string
  phone_number: string
  telegram_link: string
  payment_link: string
}

export interface UseProfileFormOptions {
  redirectOnUnauthenticated?: boolean
}

export function useProfileForm(options: UseProfileFormOptions = {}) {
  const { redirectOnUnauthenticated = true } = options

  const router = useRouter()
  const authStore = useAuthStore()

  // Form state
  const profileForm = ref<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    bio: '',
    phone_number: '',
    telegram_link: '',
    payment_link: '',
  })

  // UI state
  const successMessage = ref('')
  const errorMessage = ref('')
  const isSubmitting = ref(false)

  // Computed
  const isPartner = computed(() => authStore.user?.is_partner ?? false)

  /**
   * Sync form data with auth store user data
   */
  const syncFormWithStore = () => {
    if (authStore.user) {
      profileForm.value = {
        first_name: authStore.user.first_name || '',
        last_name: authStore.user.last_name || '',
        email: authStore.user.email || '',
        username: authStore.user.username || '',
        bio: authStore.user.bio || '',
        phone_number: authStore.user.phone_number || '',
        telegram_link: authStore.user.telegram_link || '',
        payment_link: authStore.user.payment_link || '',
      }
    }
  }

  /**
   * Format telegram link to proper URL format
   */
  const formatTelegramLink = (link: string): string => {
    let telegramLink = link.trim()
    if (!telegramLink) return ''

    if (!telegramLink.startsWith('http')) {
      if (telegramLink.startsWith('t.me/') || telegramLink.startsWith('telegram.me/')) {
        telegramLink = 'https://' + telegramLink
      } else if (telegramLink.startsWith('@')) {
        telegramLink = 'https://t.me/' + telegramLink.substring(1)
      } else if (!telegramLink.includes('/')) {
        telegramLink = 'https://t.me/' + telegramLink
      }
    }

    return telegramLink
  }

  /**
   * Format payment link to proper URL format
   */
  const formatPaymentLink = (link: string): string => {
    let paymentLink = link.trim()
    if (!paymentLink) return ''

    if (!paymentLink.startsWith('http')) {
      paymentLink = 'https://' + paymentLink
    }

    return paymentLink
  }

  /**
   * Handle profile form submission
   */
  const handleProfileUpdate = async () => {
    successMessage.value = ''
    errorMessage.value = ''

    try {
      isSubmitting.value = true

      // Build update data
      const updateData: Record<string, string> = {
        first_name: profileForm.value.first_name?.trim() || '',
        last_name: profileForm.value.last_name?.trim() || '',
        email: profileForm.value.email?.trim() || '',
        username: profileForm.value.username?.trim() || '',
        bio: profileForm.value.bio?.trim() || '',
        phone_number: profileForm.value.phone_number?.trim() || '',
      }

      // Handle telegram link formatting
      updateData.telegram_link = formatTelegramLink(profileForm.value.telegram_link || '')

      // Handle payment link for partners
      if (isPartner.value) {
        updateData.payment_link = formatPaymentLink(profileForm.value.payment_link || '')
      }

      const result = await authStore.updateProfile(updateData)

      if (result.success) {
        successMessage.value = 'Profile updated successfully!'

        setTimeout(() => {
          successMessage.value = ''
        }, 3000)

        return { success: true }
      } else {
        errorMessage.value = result.error || 'Failed to update profile'
        return { success: false, error: errorMessage.value }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      errorMessage.value = 'An unexpected error occurred'
      return { success: false, error: errorMessage.value }
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Clear messages
   */
  const clearMessages = () => {
    successMessage.value = ''
    errorMessage.value = ''
  }

  /**
   * Set error message (used by child composables/components)
   */
  const setErrorMessage = (message: string) => {
    errorMessage.value = message
  }

  /**
   * Set success message (used by child composables/components)
   */
  const setSuccessMessage = (message: string) => {
    successMessage.value = message
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }

  // Initialize form on mount
  onMounted(() => {
    if (!authStore.isAuthenticated && redirectOnUnauthenticated) {
      router.push('/signin')
      return
    }

    syncFormWithStore()
  })

  // Watch for changes to authStore.user and sync the form
  watch(
    () => authStore.user,
    (newUser) => {
      if (newUser) {
        syncFormWithStore()
      }
    },
    { deep: true }
  )

  return {
    // State
    profileForm,
    successMessage,
    errorMessage,
    isSubmitting,

    // Computed
    isPartner,

    // Methods
    handleProfileUpdate,
    syncFormWithStore,
    clearMessages,
    setErrorMessage,
    setSuccessMessage,
  }
}
