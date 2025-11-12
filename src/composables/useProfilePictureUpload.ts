/**
 * Profile Picture Upload Composable
 * Handles profile image upload, preview, and removal
 */

import { ref, type Ref } from 'vue'

const MAX_PROFILE_IMAGE_SIZE = 3 * 1024 * 1024 // 3MB

export function useProfilePictureUpload(initialImageUrl?: string) {
  // State
  const profilePictureInput = ref<HTMLInputElement | null>(null)
  const profilePicturePreview = ref<string | null>(null)
  const profilePictureUploading = ref(false)
  const selectedProfileImageFile = ref<File | null>(null)
  const imageRemoved = ref(false) // Explicit tracking for image removal

  // Methods
  const triggerProfilePictureUpload = () => {
    profilePictureInput.value?.click()
  }

  const handleProfilePictureSelect = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      alert('File size must be less than 3MB')
      return
    }

    // Store the file for later upload
    selectedProfileImageFile.value = file
    imageRemoved.value = false // Reset removal flag when new image is selected

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      profilePicturePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Clear input
    if (input) input.value = ''
  }

  const removeProfilePicture = (formDataProfileImage: Ref<string>) => {
    formDataProfileImage.value = ''
    profilePicturePreview.value = null
    selectedProfileImageFile.value = null
    imageRemoved.value = true // Explicit tracking
  }

  const resetProfilePicture = () => {
    profilePicturePreview.value = null
    selectedProfileImageFile.value = null
    imageRemoved.value = false
  }

  return {
    // Refs
    profilePictureInput,

    // State
    profilePicturePreview,
    profilePictureUploading,
    selectedProfileImageFile,
    imageRemoved,

    // Methods
    triggerProfilePictureUpload,
    handleProfilePictureSelect,
    removeProfilePicture,
    resetProfilePicture,
  }
}
