import { ref, onUnmounted } from 'vue'

export type ToastType = 'success' | 'error'

export interface ToastMessage {
  type: ToastType
  text: string
}

/**
 * Composable for displaying toast notifications with automatic cleanup
 */
export function useToast(defaultDuration = 5000) {
  const message = ref<ToastMessage | null>(null)
  let timeoutId: number | null = null

  const clearTimeout = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const showToast = (type: ToastType, text: string, duration = defaultDuration) => {
    clearTimeout()
    message.value = { type, text }

    timeoutId = window.setTimeout(() => {
      message.value = null
      timeoutId = null
    }, duration)
  }

  const showSuccess = (text: string, duration?: number) => {
    showToast('success', text, duration)
  }

  const showError = (text: string, duration?: number) => {
    showToast('error', text, duration)
  }

  const hideToast = () => {
    clearTimeout()
    message.value = null
  }

  // Cleanup timeout on component unmount to prevent memory leaks
  onUnmounted(() => {
    clearTimeout()
  })

  return {
    message,
    showToast,
    showSuccess,
    showError,
    hideToast
  }
}
