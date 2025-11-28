/**
 * Profile Picture Upload Composable
 * Handles profile image upload, preview, and removal with optional cropping
 */

import { ref, type Ref } from 'vue'
import { useImageCropper } from './useImageCropper'

const MAX_PROFILE_IMAGE_SIZE = 3 * 1024 * 1024 // 3MB

export function useProfilePictureUpload(initialImageUrl?: string, enableCropping = false) {
  // State
  const profilePictureInput = ref<HTMLInputElement | null>(null)
  const profilePicturePreview = ref<string | null>(null)
  const profilePictureUploading = ref(false)
  const selectedProfileImageFile = ref<File | null>(null)
  const imageRemoved = ref(false) // Explicit tracking for image removal
  const tempImageForCropping = ref<string | null>(null)
  const tempFileForCropping = ref<File | null>(null)

  // Image cropper (only initialized if cropping is enabled)
  const imageCropper = enableCropping ? useImageCropper() : null

  // Methods
  const triggerProfilePictureUpload = () => {
    profilePictureInput.value?.click()
  }

  const handleProfilePictureSelect = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // When cropping is enabled, allow large files (user will crop them)
    // When cropping is disabled, validate size immediately
    if (!enableCropping && file.size > MAX_PROFILE_IMAGE_SIZE) {
      alert('File size must be less than 3MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string

      if (enableCropping && imageCropper) {
        // Store for cropping
        tempImageForCropping.value = imageDataUrl
        tempFileForCropping.value = file
        // Open cropper modal
        imageCropper.openCropper(imageDataUrl, file)
      } else {
        // No cropping - directly set the file and preview
        selectedProfileImageFile.value = file
        profilePicturePreview.value = imageDataUrl
        imageRemoved.value = false
      }
    }
    reader.readAsDataURL(file)

    // Clear input
    if (input) input.value = ''
  }

  const handleCropApply = async () => {
    if (!imageCropper) {
      console.error('handleCropApply: imageCropper is null')
      return
    }

    // Use JPEG with good compression and max dimensions to reduce file size
    // Max 1024x1024 is more than enough for profile avatars
    const result = await imageCropper.applyCrop({
      outputFileName: tempFileForCropping.value?.name.replace(/\.[^/.]+$/, '.jpg') || 'cropped-avatar.jpg',
      outputFormat: 'image/jpeg',
      outputQuality: 0.85, // Good balance between quality and file size
      aspectRatio: 1,
      maxWidth: 1024,
      maxHeight: 1024,
    })

    if (result) {
      selectedProfileImageFile.value = result.file
      profilePicturePreview.value = result.preview
      imageRemoved.value = false
    } else {
      console.error('handleCropApply: applyCrop returned null - cropper ref may not be set')
    }

    // Clear temp values
    tempImageForCropping.value = null
    tempFileForCropping.value = null
  }

  const removeProfilePicture = (formDataProfileImage: Ref<string>) => {
    formDataProfileImage.value = ''
    profilePicturePreview.value = null
    selectedProfileImageFile.value = null
    imageRemoved.value = true // Explicit tracking
  }

  const resetProfilePicture = (initialImage?: string) => {
    profilePicturePreview.value = null
    selectedProfileImageFile.value = null
    imageRemoved.value = false
    // Update the initial image reference if needed (for re-opening with different data)
    // Note: initialProfileImage is captured at composable creation, so we don't update it here
  }

  const validateFileSize = (): { valid: boolean; error?: string } => {
    if (!selectedProfileImageFile.value) {
      return { valid: true } // No file selected is valid
    }

    if (selectedProfileImageFile.value.size > MAX_PROFILE_IMAGE_SIZE) {
      return {
        valid: false,
        error: `Image file size must be less than 3MB. Current size: ${(selectedProfileImageFile.value.size / (1024 * 1024)).toFixed(2)}MB`,
      }
    }

    return { valid: true }
  }

  const openCropperWithExistingImage = async (imageUrl: string) => {
    if (!enableCropping || !imageCropper) return

    try {
      // Fetch the existing image as a blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      // Create a File object from the blob
      const fileName = imageUrl.split('/').pop() || 'profile-image.jpg'
      const file = new File([blob], fileName, { type: blob.type })

      // Store for cropping
      tempImageForCropping.value = imageUrl
      tempFileForCropping.value = file

      // Open cropper modal
      imageCropper.openCropper(imageUrl, file)
    } catch (error) {
      console.error('Error loading image for cropping:', error)
      alert('Failed to load image for cropping. Please try uploading a new image.')
    }
  }

  // Build return object with proper typing
  const baseReturn = {
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
    handleCropApply,
    validateFileSize,
    openCropperWithExistingImage,
  }

  // Add cropper state only if cropping is enabled
  if (imageCropper) {
    return {
      ...baseReturn,
      showCropper: imageCropper.showCropper,
      cropperImage: imageCropper.cropperImage,
      closeCropper: imageCropper.closeCropper,
      setCropperRef: imageCropper.setCropperRef,
    }
  }

  return {
    ...baseReturn,
    // Provide default values when cropping is disabled
    showCropper: ref(false),
    cropperImage: ref<string | null>(null),
    closeCropper: () => {},
    setCropperRef: () => {},
  }
}
