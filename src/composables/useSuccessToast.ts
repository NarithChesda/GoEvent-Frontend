import { ref, onUnmounted } from 'vue'

/**
 * Composable for displaying success toast notifications
 */
export function useSuccessToast() {
  const showToast = ref(false)
  const message = ref('')
  let timeoutId: number | null = null

  const showSuccess = (msg: string, duration = 3000) => {
    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    message.value = msg
    showToast.value = true

    timeoutId = window.setTimeout(() => {
      showToast.value = false
      timeoutId = null
    }, duration)
  }

  const hideToast = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    showToast.value = false
  }

  // Cleanup timeout on component unmount to prevent memory leaks
  onUnmounted(() => {
    hideToast()
  })

  return {
    showToast,
    message,
    showSuccess,
    hideToast
  }
}
