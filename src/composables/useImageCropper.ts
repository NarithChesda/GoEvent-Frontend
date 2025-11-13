/**
 * Image Cropper Composable
 * Handles image cropping logic and state management
 */

import { ref, type Ref } from 'vue'

export interface CropperOptions {
  aspectRatio?: number
  outputFileName?: string
  outputFormat?: 'image/png' | 'image/jpeg' | 'image/webp'
  outputQuality?: number
  maxWidth?: number
  maxHeight?: number
}

export function useImageCropper() {
  // State
  const showCropper = ref(false)
  const cropperImage = ref<string | null>(null)
  const cropper = ref<any>(null)
  const originalFile = ref<File | null>(null)

  // Methods
  const openCropper = (imageDataUrl: string, file: File | null = null) => {
    cropperImage.value = imageDataUrl
    originalFile.value = file
    showCropper.value = true
  }

  const closeCropper = () => {
    showCropper.value = false
  }

  const applyCrop = (
    options: CropperOptions = {}
  ): Promise<{ file: File; preview: string } | null> => {
    return new Promise((resolve) => {
      if (!cropper.value) {
        resolve(null)
        return
      }

      let { canvas } = cropper.value.getResult()
      if (!canvas) {
        resolve(null)
        return
      }

      // Resize canvas if maxWidth or maxHeight is specified
      if (options.maxWidth || options.maxHeight) {
        const maxWidth = options.maxWidth || Infinity
        const maxHeight = options.maxHeight || Infinity

        let width = canvas.width
        let height = canvas.height

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)

          // Create a new canvas with resized dimensions
          const resizedCanvas = document.createElement('canvas')
          resizedCanvas.width = width
          resizedCanvas.height = height

          const ctx = resizedCanvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(canvas, 0, 0, width, height)
            canvas = resizedCanvas
          }
        }
      }

      const outputFormat = options.outputFormat || 'image/png'
      const outputQuality = options.outputQuality || 0.95

      // Convert canvas to blob
      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob) {
            resolve(null)
            return
          }

          // Determine the output file name
          const fileName =
            options.outputFileName ||
            originalFile.value?.name ||
            `cropped-image.${outputFormat.split('/')[1]}`

          // Create a new File from the blob
          const croppedFile = new File([blob], fileName, {
            type: outputFormat,
          })

          // Create preview URL
          const reader = new FileReader()
          reader.onload = (e) => {
            const preview = e.target?.result as string

            // Close cropper
            showCropper.value = false

            resolve({
              file: croppedFile,
              preview,
            })
          }
          reader.readAsDataURL(croppedFile)
        },
        outputFormat,
        outputQuality
      )
    })
  }

  const setCropperRef = (cropperInstance: any) => {
    cropper.value = cropperInstance
  }

  return {
    // State
    showCropper,
    cropperImage,
    cropper,

    // Methods
    openCropper,
    closeCropper,
    applyCrop,
    setCropperRef,
  }
}
