import { ref, onUnmounted } from 'vue'

/**
 * Composable for handling file uploads with proper cleanup
 */
export function useFileUpload() {
  const selectedFile = ref<File | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)
  const previewUrl = ref<string | null>(null)

  // Track created object URLs for cleanup
  const objectUrls = new Set<string>()

  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      selectedFile.value = target.files[0]

      // Create preview URL and track it
      if (previewUrl.value) {
        revokePreviewUrl()
      }

      const url = URL.createObjectURL(target.files[0])
      previewUrl.value = url
      objectUrls.add(url)
    }
  }

  const clearFile = () => {
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    revokePreviewUrl()
  }

  const revokePreviewUrl = () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      objectUrls.delete(previewUrl.value)
      previewUrl.value = null
    }
  }

  // Cleanup all object URLs on unmount
  onUnmounted(() => {
    objectUrls.forEach(url => URL.revokeObjectURL(url))
    objectUrls.clear()
  })

  return {
    selectedFile,
    fileInput,
    previewUrl,
    handleFileChange,
    clearFile,
    revokePreviewUrl
  }
}
