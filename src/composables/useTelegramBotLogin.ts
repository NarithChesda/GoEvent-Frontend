import { ref, onUnmounted } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

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
        stopPolling()
      } else if (result.is_completed && result.tokens && result.user) {
        status.value = 'completed'
        user.value = result.user
        tokens.value = result.tokens
        linkedInvitations.value = result.linked_invitations || 0
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
    token.value = null
    deepLink.value = null
    expiresIn.value = 0
    status.value = 'idle'
    error.value = null
    user.value = null
    tokens.value = null
    linkedInvitations.value = 0
  }

  // Clean up on unmount
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
    // Actions
    initiateLogin,
    openTelegram,
    reset,
  }
}
