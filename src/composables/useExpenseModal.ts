import { ref, watch, nextTick, type Ref } from 'vue'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'

/**
 * Composable for managing modal state with focus trap and accessibility
 */
export function useExpenseModal() {
  const isModalOpen = ref(false)
  const modalRef = ref<HTMLElement>()
  const submitting = ref(false)
  const error = ref<string | null>(null)

  const { activate, deactivate } = useFocusTrap(modalRef, {
    immediate: false,
    escapeDeactivates: true
  })

  // Activate/deactivate focus trap when modal opens/closes
  watch(isModalOpen, async (isOpen) => {
    if (isOpen) {
      await nextTick()
      activate()
    } else {
      deactivate()
    }
  })

  const openModal = () => {
    isModalOpen.value = true
    error.value = null
  }

  const closeModal = () => {
    isModalOpen.value = false
    error.value = null
    submitting.value = false
  }

  return {
    isModalOpen,
    modalRef,
    submitting,
    error,
    openModal,
    closeModal
  }
}
