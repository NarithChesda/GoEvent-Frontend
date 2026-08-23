import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { vendorService } from '@/services/api'
import { apiClient } from '@/services/api/core/ApiClient'
import { useAuthStore } from '@/stores/auth'
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

// Shared across every useVendorProfile() call site so nav chrome that remounts
// on each route change (TopNavBar, MobileTabBar) doesn't refire the vendor-profile
// lookup - and its guaranteed 404 for non-vendor accounts - on every navigation.
const sharedVendorProfile = ref<VendorProfile | null>(null)
const sharedError = ref<string | null>(null)
let hasFetchedOnce = false
let inFlightLoad: Promise<void> | null = null
// The user the cached result belongs to. Signing in/out or switching accounts in
// the same tab invalidates the cache without needing an external reset call.
let cachedForUserId: number | null = null

/**
 * Clears the shared vendor-profile cache. Must be called on logout (see App.vue's
 * authStore.isAuthenticated watcher) - otherwise the next signed-in user in the same
 * tab would see the previous user's cached vendor profile until a forced reload.
 */
export function resetVendorProfileCache() {
  sharedVendorProfile.value = null
  sharedError.value = null
  hasFetchedOnce = false
  inFlightLoad = null
  cachedForUserId = null
}

export function useVendorProfile(options: UseVendorProfileOptions = {}) {
  const { autoLoad = true } = options
  const { t } = useI18n()
  const authStore = useAuthStore()

  // State
  const vendorProfile = ref<VendorProfile | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  // Writing artwork - uploading one or clearing one - is not saving the form.
  // They shared one flag, so picking a logo spun the save button and popped the
  // unsaved-changes bar, while saving a typed change spun both image buttons -
  // each telling the user that something they had not touched was in progress.
  const isArtworkBusy = ref(false)
  const error = ref<string | null>(null)
  // Failing to *fetch* the profile and failing to *write* one are different
  // situations and only the first is a state the whole tab should collapse into.
  // They shared one ref, so a rejected create - a validation message about one
  // field - flipped `vendorState` to 'error' (the profile is still null, after
  // all), unmounting the form the user had just filled in and replacing it with
  // 'Failed to load vendor profile' and a Try Again button that reloaded nothing.
  const loadError = ref<string | null>(null)
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
    if (loadError.value && !vendorProfile.value) return 'error'
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
   * Load vendor profile. Reuses the shared session-wide result unless `force`
   * is set (e.g. after creating/updating the profile elsewhere).
   */
  const loadProfile = async (force = false) => {
    // `/vendor-profile/me/` is an authenticated endpoint - firing it while signed
    // out costs a guaranteed 401 (plus a doomed token-refresh round trip) on every
    // page load for anonymous visitors, since the nav bars mount on public routes.
    if (!authStore.isAuthenticated) {
      resetVendorProfileCache()
      vendorProfile.value = null
      loadError.value = null
      isLoading.value = false
      resetForm()
      return
    }

    // A cache built for a different user (or for the signed-out state) is stale.
    const currentUserId = authStore.user?.id ?? null
    if (cachedForUserId !== currentUserId) {
      hasFetchedOnce = false
      inFlightLoad = null
      sharedVendorProfile.value = null
      sharedError.value = null
    }

    if (!force && (hasFetchedOnce || inFlightLoad)) {
      if (inFlightLoad) {
        isLoading.value = true
        await inFlightLoad
        isLoading.value = false
      }
      vendorProfile.value = sharedVendorProfile.value
      loadError.value = sharedError.value
      if (vendorProfile.value) syncFormFromProfile()
      else resetForm()
      return
    }

    isLoading.value = true
    loadError.value = null

    inFlightLoad = (async () => {
      try {
        // apiClient resolves HTTP errors as { success: false, status } - it does not
        // throw - so the 404 ("not a vendor yet") case is handled here, not in catch.
        const response = await vendorService.getMyProfile()

        if (response.success && response.data) {
          sharedVendorProfile.value = response.data
          sharedError.value = null
          hasFetchedOnce = true
          cachedForUserId = currentUserId
        } else if (response.status === 404) {
          // Normal for any account that hasn't become a vendor.
          sharedVendorProfile.value = null
          sharedError.value = null
          hasFetchedOnce = true
          cachedForUserId = currentUserId
        } else {
          // Genuine failure (401/403/500/offline) - never cache it as "not a vendor",
          // or a verified vendor loses their listings UI for the rest of the session.
          sharedVendorProfile.value = null
          sharedError.value = t('settings.vendor.messages.loadFailed')
          console.error('Error loading vendor profile:', response.status, response.message)
        }
      } catch (err: any) {
        sharedVendorProfile.value = null
        sharedError.value = t('settings.vendor.messages.loadFailed')
        console.error('Error loading vendor profile:', err)
      }
    })()

    await inFlightLoad
    inFlightLoad = null

    vendorProfile.value = sharedVendorProfile.value
    loadError.value = sharedError.value
    if (vendorProfile.value) syncFormFromProfile()
    else resetForm()
    isLoading.value = false
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
        sharedVendorProfile.value = response.data
        hasFetchedOnce = true
        cachedForUserId = authStore.user?.id ?? null
        syncFormFromProfile()
        successMessage.value = t('settings.vendor.messages.createSuccess')
        return { success: true }
      } else {
        error.value = response.message || t('settings.vendor.messages.createFailed')
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err?.message || t('settings.vendor.messages.unexpectedError')
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
        sharedVendorProfile.value = response.data
        syncFormFromProfile()
        successMessage.value = t('settings.vendor.messages.updateSuccess')
        return { success: true }
      } else {
        error.value = response.message || t('settings.vendor.messages.updateFailed')
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err?.message || t('settings.vendor.messages.unexpectedError')
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Writes one artwork field, which is a one-field multipart PATCH either way:
   * a `File` uploads it, and the empty string clears it. The empty string is
   * this backend's convention for removing an image everywhere else too (hosts,
   * dress codes, template assets) - DRF reads a blank multipart value for a
   * nullable ImageField as `null`, and the model's `save()` then deletes the
   * file that was there, so a removal cannot be undone by the API.
   */
  const writeArtwork = async (
    field: 'logo' | 'cover_image',
    value: File | '',
    messageKeys: { success: string; failure: string },
  ) => {
    isArtworkBusy.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append(field, value)

      const response = await vendorService.updateMyProfile(formData)

      if (response.success && response.data) {
        vendorProfile.value = response.data
        sharedVendorProfile.value = response.data
        successMessage.value = t(messageKeys.success)
        return { success: true }
      } else {
        error.value = response.message || t(messageKeys.failure)
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err?.message || t('settings.vendor.messages.unexpectedError')
      return { success: false, error: error.value }
    } finally {
      isArtworkBusy.value = false
    }
  }

  /**
   * Upload logo
   */
  const uploadLogo = (file: File) =>
    writeArtwork('logo', file, {
      success: 'settings.vendor.messages.logoSuccess',
      failure: 'settings.vendor.messages.logoFailed',
    })

  /**
   * Remove the logo
   */
  const removeLogo = () =>
    writeArtwork('logo', '', {
      success: 'settings.vendor.messages.logoRemoved',
      failure: 'settings.vendor.messages.logoRemoveFailed',
    })

  /**
   * Upload cover image
   */
  const uploadCoverImage = (file: File) =>
    writeArtwork('cover_image', file, {
      success: 'settings.vendor.messages.coverSuccess',
      failure: 'settings.vendor.messages.coverFailed',
    })

  /**
   * Remove the cover image
   */
  const removeCoverImage = () =>
    writeArtwork('cover_image', '', {
      success: 'settings.vendor.messages.coverRemoved',
      failure: 'settings.vendor.messages.coverRemoveFailed',
    })

  /**
   * Clear messages
   */
  const clearMessages = () => {
    error.value = null
    loadError.value = null
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

  // Auto-load once authenticated. Watching (rather than a plain onMounted) matters
  // for the long-lived nav bars: they mount before auth is restored and stay mounted
  // across sign-in, so a mount-only fetch would either fire signed-out or never
  // re-run for a user who signs in without a full page reload.
  if (autoLoad) {
    watch(() => authStore.isAuthenticated, () => loadProfile(), { immediate: true })
  }

  return {
    // State
    vendorProfile,
    vendorForm,
    isLoading,
    isSaving,
    isArtworkBusy,
    error,
    loadError,
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
    removeLogo,
    uploadCoverImage,
    removeCoverImage,
    syncFormFromProfile,
    resetForm,
    clearMessages,
    clearSuccessAfterDelay,
  }
}
