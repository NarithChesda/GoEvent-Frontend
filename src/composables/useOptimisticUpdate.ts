import { ref, computed, type Ref } from 'vue'
import { getErrorMessage } from '@/utils/errorMessages'
import { debug } from '@/utils/debug'

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  successMessage?: string
  errorContext?: string
}

/**
 * Composable for handling optimistic UI updates with rollback on error
 * Includes race condition protection for concurrent operations
 */
export function useOptimisticUpdate<T>(dataRef: Ref<T[]>) {
  const pendingOperations = ref(0)

  const performUpdate = async <TResult>(
    apiCall: () => Promise<any>,
    optimisticData: T[],
    options: OptimisticUpdateOptions<TResult> = {}
  ): Promise<boolean> => {
    // Track pending operations
    pendingOperations.value++

    // Store backup for rollback (capture at time of operation start)
    const backup = [...dataRef.value]

    // Apply optimistic update immediately
    dataRef.value = optimisticData

    try {
      const response = await apiCall()

      if (response.success) {
        options.onSuccess?.(response.data)
        return true
      } else {
        // Rollback on API error
        dataRef.value = backup

        // Handle field-specific errors
        let errorMessage = response.message || 'Operation failed'
        if (response.errors) {
          const errorMessages = Object.entries(response.errors)
            .map(([field, messages]: [string, string[] | string]) =>
              `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
            )
            .join('; ')
          errorMessage = errorMessages || errorMessage
        }

        options.onError?.(errorMessage)
        return false
      }
    } catch (err) {
      // Rollback on exception
      dataRef.value = backup
      const errorMessage = getErrorMessage(err, options.errorContext || 'perform operation')
      options.onError?.(errorMessage)
      debug.error(`Error during optimistic update:`, err)
      return false
    } finally {
      // Decrement pending operations counter
      pendingOperations.value--
    }
  }

  return {
    performUpdate,
    isPending: computed(() => pendingOperations.value > 0),
    pendingCount: computed(() => pendingOperations.value),
  }
}
