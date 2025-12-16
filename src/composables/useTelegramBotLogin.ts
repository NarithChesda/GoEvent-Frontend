import { ref, computed, onUnmounted } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Storage key for persisting pending login state (survives page navigation)
const TELEGRAM_LOGIN_STORAGE_KEY = 'goevent_telegram_pending_login'

// Interface for persisted login state
interface TelegramPendingLoginState {
  token: string
  deepLink: string
  expiresAt: number // Unix timestamp when login session expires
  showcaseUrl: string // URL to return to after login
}

export interface TelegramBotLoginToken {
  token: string
  deep_link: string
  expires_in: number
}

export interface TelegramBotLoginUser {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  profile_picture: string | null
  bio: string
  is_verified: boolean
  is_partner: boolean
  phone_number: string | null
  payment_link: string | null
  telegram_link: string | null
  logo: string | null
  telegram_id: number
  telegram_chat_id: number
  telegram_auth_date: string
  created_at: string
  updated_at: string
}

export interface TelegramBotLoginStatus {
  is_completed: boolean
  is_expired: boolean
  message?: string
  user?: TelegramBotLoginUser
  tokens?: {
    access: string
    refresh: string
  }
  linked_invitations?: number
}

export type TelegramBotLoginState = 'idle' | 'pending' | 'completed' | 'expired' | 'error'

// Persistence functions (outside composable to be shared across instances)
function persistPendingLogin(tokenStr: string, deepLinkStr: string, expiresInSec: number): void {
  const state: TelegramPendingLoginState = {
    token: tokenStr,
    deepLink: deepLinkStr,
    expiresAt: Date.now() + expiresInSec * 1000,
    showcaseUrl: window.location.href,
  }
  try {
    localStorage.setItem(TELEGRAM_LOGIN_STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('[TelegramBotLogin] Failed to persist pending login state:', e)
  }
}

function getPendingLogin(): TelegramPendingLoginState | null {
  try {
    const stored = localStorage.getItem(TELEGRAM_LOGIN_STORAGE_KEY)
    if (!stored) return null

    const state: TelegramPendingLoginState = JSON.parse(stored)

    // Check if expired
    if (Date.now() >= state.expiresAt) {
      clearPendingLogin()
      return null
    }

    return state
  } catch (e) {
    clearPendingLogin()
    return null
  }
}

function clearPendingLogin(): void {
  try {
    localStorage.removeItem(TELEGRAM_LOGIN_STORAGE_KEY)
  } catch (e) {
    // Silent fail
  }
}

// Export for use in other components
export { getPendingLogin, clearPendingLogin }

export function useTelegramBotLogin() {
  const token = ref<string | null>(null)
  const deepLink = ref<string | null>(null)
  const expiresIn = ref<number>(0)
  const status = ref<TelegramBotLoginState>('idle')
  const error = ref<string | null>(null)
  const user = ref<TelegramBotLoginUser | null>(null)
  const tokens = ref<{ access: string; refresh: string } | null>(null)
  const linkedInvitations = ref<number>(0)

  let pollInterval: ReturnType<typeof setInterval> | null = null
  let expireTimeout: ReturnType<typeof setTimeout> | null = null

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    if (expireTimeout) {
      clearTimeout(expireTimeout)
      expireTimeout = null
    }
  }

  const initiateLogin = async (): Promise<TelegramBotLoginToken | null> => {
    try {
      status.value = 'pending'
      error.value = null

      const response = await fetch(`${API_BASE_URL}/api/auth/telegram/bot/initiate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many attempts. Please try again later.')
        }
        throw new Error('Failed to initiate Telegram login')
      }

      const data: TelegramBotLoginToken = await response.json()
      token.value = data.token
      deepLink.value = data.deep_link
      expiresIn.value = data.expires_in

      // Persist state for recovery after navigation (important for in-app browsers like Messenger)
      persistPendingLogin(data.token, data.deep_link, data.expires_in)

      // Start polling for completion
      startPolling(data.token, data.expires_in)

      return data
    } catch (err) {
      status.value = 'error'
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      return null
    }
  }

  const checkStatus = async (tokenStr: string): Promise<TelegramBotLoginStatus | null> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/telegram/bot/status/${tokenStr}/`,
        {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invalid or expired token')
        }
        throw new Error('Failed to check login status')
      }

      return await response.json()
    } catch (err) {
      return null
    }
  }

  const startPolling = (tokenStr: string, expiresInSec: number) => {
    // Clear any existing polling
    stopPolling()

    // Poll every 2 seconds
    pollInterval = setInterval(async () => {
      const result = await checkStatus(tokenStr)

      if (!result) {
        // Error checking status, continue polling
        return
      }

      if (result.is_expired) {
        status.value = 'expired'
        clearPendingLogin() // Clear persisted state on expiration
        stopPolling()
      } else if (result.is_completed && result.tokens && result.user) {
        status.value = 'completed'
        user.value = result.user
        tokens.value = result.tokens
        linkedInvitations.value = result.linked_invitations || 0
        clearPendingLogin() // Clear persisted state on success
        stopPolling()
      }
    }, 2000)

    // Set expiration timeout
    expireTimeout = setTimeout(() => {
      if (status.value === 'pending') {
        status.value = 'expired'
      }
      stopPolling()
    }, expiresInSec * 1000)
  }

  const openTelegram = () => {
    if (deepLink.value) {
      window.open(deepLink.value, '_blank')
    }
  }

  const reset = () => {
    stopPolling()
    clearPendingLogin() // Also clear persisted state on reset
    token.value = null
    deepLink.value = null
    expiresIn.value = 0
    status.value = 'idle'
    error.value = null
    user.value = null
    tokens.value = null
    linkedInvitations.value = 0
  }

  /**
   * Resume polling from persisted state.
   * This is called when the page loads and there's a pending login session
   * (e.g., user navigated away to Telegram and came back).
   * Returns the remaining seconds if resumed successfully, or 0 if no pending login.
   */
  const resumePolling = (): number => {
    const pendingLogin = getPendingLogin()
    if (!pendingLogin) return 0

    // Calculate remaining time
    const remainingMs = pendingLogin.expiresAt - Date.now()
    if (remainingMs <= 0) {
      clearPendingLogin()
      return 0
    }

    const remainingSecs = Math.ceil(remainingMs / 1000)

    // Restore state
    token.value = pendingLogin.token
    deepLink.value = pendingLogin.deepLink
    expiresIn.value = remainingSecs
    status.value = 'pending'

    // Resume polling with remaining time
    startPolling(pendingLogin.token, remainingSecs)

    return remainingSecs
  }

  // Computed property to check if there's a pending login
  const hasPendingLogin = computed(() => getPendingLogin() !== null)

  // Clean up on unmount (but don't clear persisted state - that survives navigation)
  onUnmounted(stopPolling)

  return {
    // State
    token,
    deepLink,
    expiresIn,
    status,
    error,
    user,
    tokens,
    linkedInvitations,
    // Computed
    hasPendingLogin,
    // Actions
    initiateLogin,
    openTelegram,
    reset,
    resumePolling,
  }
}
