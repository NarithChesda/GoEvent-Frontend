/**
 * Profile Picture Upload Composable
 * Handles profile image upload, preview, and removal with optional cropping
 */

import { onUnmounted, ref, type Ref } from 'vue'
import { useImageCropper } from './useImageCropper'
import { compressImage } from '@/utils/imageCompression'

const MAX_PROFILE_IMAGE_SIZE = 3 * 1024 * 1024 // 3MB

/**
 * Bounding box for the working copy handed to the cropper.
 *
 * Same idea as the event banner's SOURCE_MAX_DIMENSION: the browser should
 * never decode a 50MP camera bitmap just to draw a crop box over it, but the
 * working copy stays far larger than the 1024px output so anyone cropping
 * *into* their photo still has pixels to spare.
 */
const CROP_SOURCE_MAX_DIMENSION = 4096
/** Near-transparent: the crop is re-encoded from this copy anyway. */
const CROP_SOURCE_QUALITY = 0.95

export function useProfilePictureUpload(initialImageUrl?: string, enableCropping = false) {
  // State
  const profilePictureInput = ref<HTMLInputElement | null>(null)
  const profilePicturePreview = ref<string | null>(null)
  const profilePictureUploading = ref(false)
  const selectedProfileImageFile = ref<File | null>(null)
  const imageRemoved = ref(false) // Explicit tracking for image removal
  const tempFileForCropping = ref<File | null>(null)
  /** True while an oversized source is being downscaled for the cropper. */
  const preparingImage = ref(false)
  /**
   * Object URL of the *original* photo the host picked, kept for as long as the
   * form is open.
   *
   * This is what the cropper reads, both the first time and on every re-crop.
   * Re-cropping used to read `profilePicturePreview`, which is the previous
   * crop's output — so the frame could only ever be tightened, never widened or
   * moved back out. An object URL rather than a data URL because sources can be
   * tens of megabytes and base64 inflates that by a third again in memory.
   */
  const sourceObjectUrl = ref<string | null>(null)
  /**
   * Whether the applied crop mirrored the photo left to right.
   *
   * Held next to the source for the same reason: a re-crop reopens the original
   * file, which knows nothing about the mirror, so without this the flip would
   * silently undo itself the moment the host reframed the photo.
   */
  const cropFlipHorizontal = ref(false)

  const releaseSource = () => {
    if (sourceObjectUrl.value) {
      URL.revokeObjectURL(sourceObjectUrl.value)
      sourceObjectUrl.value = null
    }
  }

  // Image cropper (only initialized if cropping is enabled)
  const imageCropper = enableCropping ? useImageCropper() : null

  // Methods
  const triggerProfilePictureUpload = () => {
    profilePictureInput.value?.click()
  }

  const handleProfilePictureSelect = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    // Clear the input straight away so picking the same file twice still fires.
    if (input) input.value = ''

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

    if (enableCropping && imageCropper) {
      preparingImage.value = true
      try {
        // Only images past the bounding box are re-encoded; anything smaller
        // comes back as the original file untouched.
        const working = await compressImage(file, {
          maxWidth: CROP_SOURCE_MAX_DIMENSION,
          maxHeight: CROP_SOURCE_MAX_DIMENSION,
          quality: CROP_SOURCE_QUALITY,
        })

        releaseSource()
        cropFlipHorizontal.value = false
        sourceObjectUrl.value = URL.createObjectURL(working)
        tempFileForCropping.value = working
        imageCropper.openCropper(sourceObjectUrl.value, working)
      } catch {
        alert('Failed to read that image. Please try another file.')
      } finally {
        preparingImage.value = false
      }
      return
    }

    // No cropping - directly set the file and preview
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedProfileImageFile.value = file
      profilePicturePreview.value = e.target?.result as string
      imageRemoved.value = false
    }
    reader.readAsDataURL(file)
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

    // `sourceObjectUrl` is deliberately kept: it is what a re-crop reads, so the
    // host can widen the frame again after applying a tight one.
  }

  const removeProfilePicture = (formDataProfileImage: Ref<string>) => {
    formDataProfileImage.value = ''
    profilePicturePreview.value = null
    selectedProfileImageFile.value = null
    tempFileForCropping.value = null
    cropFlipHorizontal.value = false
    releaseSource()
    imageRemoved.value = true // Explicit tracking
  }

  const resetProfilePicture = (_initialImage?: string) => {
    profilePicturePreview.value = null
    selectedProfileImageFile.value = null
    tempFileForCropping.value = null
    cropFlipHorizontal.value = false
    releaseSource()
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

  /**
   * Re-open the cropper on the photo currently attached to the host.
   *
   * When the host picked a file in this session the original is already in
   * memory, so `imageUrl` is ignored and the crop starts from that original
   * rather than from the crop it produced. Otherwise the stored image is
   * fetched and handed to the cropper as an object URL — the same-origin blob
   * keeps the crop canvas untainted, which a remote `<img src>` would not.
   */
  const openCropperWithExistingImage = async (imageUrl: string) => {
    if (!enableCropping || !imageCropper) return

    if (sourceObjectUrl.value) {
      imageCropper.openCropper(sourceObjectUrl.value, tempFileForCropping.value)
      return
    }

    preparingImage.value = true
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      const fileName = imageUrl.split('/').pop() || 'profile-image.jpg'
      const file = new File([blob], fileName, { type: blob.type })

      releaseSource()
      cropFlipHorizontal.value = false
      sourceObjectUrl.value = URL.createObjectURL(blob)
      tempFileForCropping.value = file

      imageCropper.openCropper(sourceObjectUrl.value, file)
    } catch (error) {
      console.error('Error loading image for cropping:', error)
      alert('Failed to load image for cropping. Please try uploading a new image.')
    } finally {
      preparingImage.value = false
    }
  }

  onUnmounted(releaseSource)

  // Build return object with proper typing
  const baseReturn = {
    // Refs
    profilePictureInput,

    // State
    profilePicturePreview,
    profilePictureUploading,
    preparingImage,
    cropFlipHorizontal,
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
