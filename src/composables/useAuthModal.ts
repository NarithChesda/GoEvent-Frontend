import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

interface UseAuthModalOptions {
  onAuthenticated?: () => void
  onClosed?: () => void
  requireAuth?: boolean
}

/**
 * Composable for managing modal-based authentication
 * Provides a unified interface for triggering authentication modals
 * without causing page redirects or resource reloads
 */
export function useAuthModal(options: UseAuthModalOptions = {}) {
  const authStore = useAuthStore()
  const showAuthModal = ref(false)

  // Computed properties
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)

  // Methods
  const openAuthModal = () => {
    if (!isAuthenticated.value) {
      showAuthModal.value = true
    }
  }

  const closeAuthModal = () => {
    showAuthModal.value = false
    if (options.onClosed) {
      options.onClosed()
    }
  }

  const handleAuthenticated = () => {
    showAuthModal.value = false
    if (options.onAuthenticated) {
      options.onAuthenticated()
    }
  }

  /**
   * Requires authentication before executing an action
   * If user is authenticated, executes the action immediately
   * If not authenticated, opens the auth modal
   *
   * @param action - Function to execute after authentication
   * @returns Promise that resolves when action is completed or user cancels
   */
  const requireAuth = (action: () => void | Promise<void>): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isAuthenticated.value) {
        // User is already authenticated, execute action immediately
        try {
          const result = action()
          if (result instanceof Promise) {
            result.then(() => resolve(true)).catch(() => resolve(false))
          } else {
            resolve(true)
          }
        } catch {
          resolve(false)
        }
      } else {
        // User needs to authenticate
        const originalOnAuthenticated = options.onAuthenticated
        const originalOnClosed = options.onClosed

        // Temporarily override callbacks
        options.onAuthenticated = async () => {
          try {
            const result = action()
            if (result instanceof Promise) {
              await result
            }
            resolve(true)
          } catch {
            resolve(false)
          } finally {
            // Restore original callback
            options.onAuthenticated = originalOnAuthenticated
            if (originalOnAuthenticated) {
              originalOnAuthenticated()
            }
          }
        }

        options.onClosed = () => {
          resolve(false)
          // Restore original callback
          options.onClosed = originalOnClosed
          if (originalOnClosed) {
            originalOnClosed()
          }
        }

        openAuthModal()
      }
    })
  }

  /**
   * Executes an action if user is authenticated, otherwise shows auth modal
   * This is a simpler version of requireAuth that doesn't return a promise
   *
   * @param action - Function to execute if authenticated
   */
  const withAuth = (action: () => void | Promise<void>) => {
    if (isAuthenticated.value) {
      action()
    } else {
      openAuthModal()
    }
  }

  /**
   * Decorator function to make any function require authentication
   * Usage: const protectedFunction = authRequired(() => { ... })
   */
  const authRequired = <T extends (...args: any[]) => void | Promise<void>>(fn: T): T => {
    return ((...args: Parameters<T>) => {
      withAuth(() => fn(...args))
    }) as T
  }

  /**
   * Higher-order function that wraps a component method to require authentication
   * Usage in component: const handleProtectedAction = authRequired(actualAction)
   */
  const protectAction = <T extends (...args: any[]) => any>(action: T) => {
    return (...args: Parameters<T>) => {
      if (isAuthenticated.value) {
        return action(...args)
      } else {
        openAuthModal()
        return false
      }
    }
  }

  return {
    // State
    showAuthModal,
    isAuthenticated,
    user,

    // Methods
    openAuthModal,
    closeAuthModal,
    handleAuthenticated,
    requireAuth,
    withAuth,
    authRequired,
    protectAction,

    // Event handlers (for use in templates)
    onAuthModalClose: closeAuthModal,
    onUserAuthenticated: handleAuthenticated,
  }
}

/**
 * Global auth modal state for cases where you need to share
 * auth modal state across multiple components
 */
const globalAuthModalState = ref({
  isVisible: false,
  pendingAction: null as (() => void | Promise<void>) | null,
})

export function useGlobalAuthModal() {
  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)

  const showGlobalAuthModal = (action?: () => void | Promise<void>) => {
    if (isAuthenticated.value && action) {
      // User is already authenticated, execute action immediately
      action()
      return
    }

    globalAuthModalState.value.isVisible = true
    globalAuthModalState.value.pendingAction = action || null
  }

  const closeGlobalAuthModal = () => {
    globalAuthModalState.value.isVisible = false
    globalAuthModalState.value.pendingAction = null
  }

  const handleGlobalAuthenticated = async () => {
    const { pendingAction } = globalAuthModalState.value

    // Close modal first
    globalAuthModalState.value.isVisible = false
    globalAuthModalState.value.pendingAction = null

    // Execute pending action if any
    if (pendingAction) {
      try {
        const result = pendingAction()
        if (result instanceof Promise) {
          await result
        }
      } catch (error) {
        console.error('Error executing pending action after authentication:', error)
      }
    }
  }

  return {
    // Global state
    globalAuthModalState,
    isAuthenticated,
    user,

    // Methods
    showGlobalAuthModal,
    closeGlobalAuthModal,
    handleGlobalAuthenticated,

    // Computed for template usage
    isGlobalAuthModalVisible: computed(() => globalAuthModalState.value.isVisible),
  }
}
