import { ref, computed, onMounted } from 'vue'
import { vendorService } from '@/services/api'
import { apiClient } from '@/services/api/core/ApiClient'
import type {
  VendorProfile,
  CreateVendorProfileData,
  UpdateVendorProfileData,
  VendorVerificationStatus,
} from '@/services/api/types'

export interface VendorFormData {
  business_name: string
  description: string
  short_tagline: string
  phone: string
  email: string
  website: string
  telegram_username: string
  address: string
  city: string
  country: string
}

export type VendorState = 'loading' | 'not_vendor' | 'unverified' | 'pending' | 'verified' | 'error'

export interface UseVendorProfileOptions {
  autoLoad?: boolean
}

export function useVendorProfile(options: UseVendorProfileOptions = {}) {
  const { autoLoad = true } = options

  // State
  const vendorProfile = ref<VendorProfile | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Form state
  const vendorForm = ref<VendorFormData>({
    business_name: '',
    description: '',
    short_tagline: '',
    phone: '',
    email: '',
    website: '',
    telegram_username: '',
    address: '',
    city: '',
    country: '',
  })

  // Computed
  const vendorState = computed<VendorState>(() => {
    if (isLoading.value) return 'loading'
    if (error.value && !vendorProfile.value) return 'error'
    if (!vendorProfile.value) return 'not_vendor'

    const status = vendorProfile.value.verification_status
    if (status === 'verified') return 'verified'
    if (status === 'pending') return 'pending'
    return 'unverified'
  })

  const isVendor = computed(() => vendorProfile.value !== null)

  const verificationStatus = computed<VendorVerificationStatus | null>(() =>
    vendorProfile.value?.verification_status ?? null
  )

  const logoUrl = computed(() => {
    if (!vendorProfile.value?.logo) return null
    return apiClient.getProfilePictureUrl(vendorProfile.value.logo)
  })

  const coverImageUrl = computed(() => {
    if (!vendorProfile.value?.cover_image) return null
    return apiClient.getProfilePictureUrl(vendorProfile.value.cover_image)
  })

  /**
   * Sync form data from vendor profile
   */
  const syncFormFromProfile = () => {
    if (vendorProfile.value) {
      vendorForm.value = {
        business_name: vendorProfile.value.business_name || '',
        description: vendorProfile.value.description || '',
        short_tagline: vendorProfile.value.short_tagline || '',
        phone: vendorProfile.value.phone || '',
        email: vendorProfile.value.email || '',
        website: vendorProfile.value.website || '',
        telegram_username: vendorProfile.value.telegram_username || '',
        address: vendorProfile.value.address || '',
        city: vendorProfile.value.city || '',
        country: vendorProfile.value.country || '',
      }
    }
  }

  /**
   * Reset form to empty state
   */
  const resetForm = () => {
    vendorForm.value = {
      business_name: '',
      description: '',
      short_tagline: '',
      phone: '',
      email: '',
      website: '',
      telegram_username: '',
      address: '',
      city: '',
      country: '',
    }
  }

  /**
   * Load vendor profile
   */
  const loadProfile = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await vendorService.getMyProfile()

      if (response.success && response.data) {
        vendorProfile.value = response.data
        syncFormFromProfile()
      } else {
        // 404 means user doesn't have a vendor profile yet - this is normal
        vendorProfile.value = null
        resetForm()
      }
    } catch (err: any) {
      // 404 is expected for non-vendors
      if (err?.status === 404 || err?.message?.includes('404')) {
        vendorProfile.value = null
        resetForm()
      } else {
        error.value = 'Failed to load vendor profile'
        console.error('Error loading vendor profile:', err)
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create vendor profile (become a vendor)
   */
  const createProfile = async (data?: CreateVendorProfileData) => {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const profileData: CreateVendorProfileData = data || {
        business_name: vendorForm.value.business_name,
        description: vendorForm.value.description,
        short_tagline: vendorForm.value.short_tagline,
        phone: vendorForm.value.phone,
        email: vendorForm.value.email,
        website: vendorForm.value.website,
        telegram_username: vendorForm.value.telegram_username,
        address: vendorForm.value.address,
        city: vendorForm.value.city,
        country: vendorForm.value.country,
      }

      const response = await vendorService.createProfile(profileData)

      if (response.success && response.data) {
        vendorProfile.value = response.data
        syncFormFromProfile()
        successMessage.value = 'Vendor profile created successfully!'
        return { success: true }
      } else {
        error.value = response.message || 'Failed to create vendor profile'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err?.message || 'An unexpected error occurred'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Update vendor profile
   */
  const updateProfile = async (data?: UpdateVendorProfileData) => {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const profileData: UpdateVendorProfileData = data || {
        business_name: vendorForm.value.business_name,
        description: vendorForm.value.description,
        short_tagline: vendorForm.value.short_tagline,
        phone: vendorForm.value.phone,
        email: vendorForm.value.email,
        website: vendorForm.value.website,
        telegram_username: vendorForm.value.telegram_username,
        address: vendorForm.value.address,
        city: vendorForm.value.city,
        country: vendorForm.value.country,
      }

      const response = await vendorService.updateMyProfile(profileData)

      if (response.success && response.data) {
        vendorProfile.value = response.data
        syncFormFromProfile()
        successMessage.value = 'Vendor profile updated successfully!'
        return { success: true }
      } else {
        error.value = response.message || 'Failed to update vendor profile'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err?.message || 'An unexpected error occurred'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Upload logo
   */
  const uploadLogo = async (file: File) => {
    isSaving.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await vendorService.updateMyProfile(formData)

      if (response.success && response.data) {
        vendorProfile.value = response.data
        successMessage.value = 'Logo uploaded successfully!'
        return { success: true }
      } else {
        error.value = response.message || 'Failed to upload logo'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err?.message || 'An unexpected error occurred'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Upload cover image
   */
  const uploadCoverImage = async (file: File) => {
    isSaving.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('cover_image', file)

      const response = await vendorService.updateMyProfile(formData)

      if (response.success && response.data) {
        vendorProfile.value = response.data
        successMessage.value = 'Cover image uploaded successfully!'
        return { success: true }
      } else {
        error.value = response.message || 'Failed to upload cover image'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err?.message || 'An unexpected error occurred'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Clear messages
   */
  const clearMessages = () => {
    error.value = null
    successMessage.value = null
  }

  /**
   * Clear success message after delay
   */
  const clearSuccessAfterDelay = (delay = 3000) => {
    setTimeout(() => {
      successMessage.value = null
    }, delay)
  }

  // Auto-load on mount if enabled
  onMounted(() => {
    if (autoLoad) {
      loadProfile()
    }
  })

  return {
    // State
    vendorProfile,
    vendorForm,
    isLoading,
    isSaving,
    error,
    successMessage,

    // Computed
    vendorState,
    isVendor,
    verificationStatus,
    logoUrl,
    coverImageUrl,

    // Methods
    loadProfile,
    createProfile,
    updateProfile,
    uploadLogo,
    uploadCoverImage,
    syncFormFromProfile,
    resetForm,
    clearMessages,
    clearSuccessAfterDelay,
  }
}
