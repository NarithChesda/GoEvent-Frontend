import { ref, computed } from 'vue'
import { eventsService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface UseEventLikeOptions {
  onLoginRequired?: () => void
  onError?: (error: string) => void
  onSuccess?: (liked: boolean, likesCount: number) => void
}

/**
 * Composable for managing event like functionality with optimistic updates
 */
export function useEventLike(
  eventId: string,
  initialIsLiked: boolean = false,
  initialLikesCount: number = 0,
  options: UseEventLikeOptions = {}
) {
  const authStore = useAuthStore()

  const isLiked = ref(initialIsLiked)
  const likesCount = ref(initialLikesCount)
  const isLoading = ref(false)

  const toggleLike = async () => {
    // Check authentication
    if (!authStore.isAuthenticated) {
      options.onLoginRequired?.()
      return { success: false, error: 'Login required' }
    }

    if (isLoading.value) {
      return { success: false, error: 'Operation in progress' }
    }

    isLoading.value = true

    // Store previous state for rollback
    const previousIsLiked = isLiked.value
    const previousLikesCount = likesCount.value

    // Optimistic update
    isLiked.value = !isLiked.value
    likesCount.value = isLiked.value ? likesCount.value + 1 : likesCount.value - 1

    try {
      const response = await eventsService.toggleLike(eventId)

      if (response.success && response.data) {
        // Update with actual server values
        isLiked.value = response.data.liked
        likesCount.value = response.data.likes_count
        options.onSuccess?.(response.data.liked, response.data.likes_count)
        return { success: true, data: response.data }
      } else {
        // Rollback on API error
        isLiked.value = previousIsLiked
        likesCount.value = previousLikesCount
        const errorMessage = response.message || 'Failed to update like status'
        options.onError?.(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      // Rollback on exception
      isLiked.value = previousIsLiked
      likesCount.value = previousLikesCount
      const errorMessage = err instanceof Error ? err.message : 'Failed to update like status'
      options.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  // Update state externally (e.g., when event data is refreshed)
  const updateState = (liked: boolean, count: number) => {
    isLiked.value = liked
    likesCount.value = count
  }

  return {
    isLiked: computed(() => isLiked.value),
    likesCount: computed(() => likesCount.value),
    isLoading: computed(() => isLoading.value),
    toggleLike,
    updateState,
  }
}

/**
 * Composable for fetching user's liked events
 */
export function useMyLikedEvents() {
  const authStore = useAuthStore()

  const events = ref<Awaited<ReturnType<typeof eventsService.getMyLikedEvents>>['data']>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchLikedEvents = async () => {
    if (!authStore.isAuthenticated) {
      error.value = 'Login required'
      return { success: false, error: 'Login required' }
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await eventsService.getMyLikedEvents()

      if (response.success && response.data) {
        events.value = response.data
        return { success: true, data: response.data }
      } else {
        error.value = response.message || 'Failed to fetch liked events'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch liked events'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    events: computed(() => events.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    fetchLikedEvents,
  }
}
