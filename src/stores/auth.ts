import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type User, type LoginRequest, type RegisterRequest } from '../services/auth'
import type { TelegramBotLoginUser } from '../composables/useTelegramBotLogin'

export const useAuthStore = defineStore('auth', () => {
  /*
   * State — hydrated from storage **synchronously**, at store creation.
   *
   * It used to start null and be filled in by `initializeAuth()` from App.vue's
   * `onMounted`, which is too late: the router's first `beforeEach` runs while
   * main.ts is still awaiting its locale chunk, so the guard asked "is this user
   * signed in?" before anyone had looked in storage, got `null`, and redirected
   * to /signin. SignInView has no bounce-back for an already-signed-in visitor,
   * so whether the user landed back on their page depended entirely on
   * initializeAuth finishing and the redirect being re-driven. Reading storage
   * here costs one synchronous localStorage hit and removes the race outright.
   */
  const user = ref<User | null>(authService.getUser())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /*
   * Getters — gated on the *session*, not on the access token.
   *
   * `authService.isAuthenticated()` is false for the 23 hours of every 24 in
   * which the 60-minute access token has expired but the refresh token has not.
   * Gating on it signed people out mid-session; an expired access token is a
   * recoverable state that ApiClient repairs on the first 401. See
   * tokenManager.hasSession().
   */
  const isAuthenticated = computed(() => !!user.value && authService.hasSession())
  const userInitials = computed(() => {
    if (!user.value) return ''

    const firstName = user.value.first_name || user.value.username || ''
    const lastName = user.value.last_name || ''

    const firstInitial = firstName.length > 0 ? firstName.charAt(0) : ''
    const lastInitial = lastName.length > 0 ? lastName.charAt(0) : ''

    return `${firstInitial}${lastInitial}`.toUpperCase() || 'U'
  })

  // Actions
  const setUser = (userData: User | null) => {
    user.value = userData
    // Persist user data to storage for consistency across page refreshes
    if (userData) {
      authService.setUser(userData)
    } else {
      authService.clearUser()
    }
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true)
      clearError()

      const response = await authService.login(credentials)

      if (response.success && response.data) {
        // Response now has nested tokens object: { tokens: { access, refresh }, user }
        setUser(response.data.user)
        return { success: true }
      } else {
        const errorMsg = response.message || 'Login failed'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch {
      const errorMsg = 'Network error during login'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      setLoading(true)
      clearError()

      const response = await authService.register(userData)

      if (response.success && response.data) {
        // After successful registration, automatically log in
        const loginResponse = await authService.login({
          email: userData.email,
          password: userData.password,
        })

        if (loginResponse.success && loginResponse.data) {
          // Handle nested tokens object in login response after registration
          setUser(loginResponse.data.user)
          return { success: true }
        } else {
          return { success: true, message: 'Registration successful! Please log in.' }
        }
      } else {
        const errorMsg = response.message || 'Registration failed'
        setError(errorMsg)
        return { success: false, error: errorMsg, errors: response.errors }
      }
    } catch {
      const errorMsg = 'Network error during registration'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await authService.logout()
    } catch {
      // Silent error handling
    } finally {
      setUser(null)
      setLoading(false)
      clearError()
    }
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await authService.getProfile()

      if (response.success && response.data) {
        setUser(response.data)
        return { success: true }
      } else {
        const errorMsg = response.message || 'Failed to fetch profile'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch {
      const errorMsg = 'Network error while fetching profile'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      setLoading(true)
      clearError()

      const response = await authService.updateProfile(profileData)

      if (response.success && response.data) {
        // The backend returns { message, user } so we need to extract the user object
        // Some endpoints return just the user object, others return { user: {...} }
        const userData = (response.data as any).user || response.data
        const updatedUser = { ...user.value, ...userData } as User

        // setUser now handles both reactive state AND storage persistence
        setUser(updatedUser)

        return { success: true }
      } else {
        const errorMsg = response.message || 'Failed to update profile'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch {
      const errorMsg = 'Network error while updating profile'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Confirm the hydrated session with the server, and repair a stale access
   * token — **without ever ending a session over a bad network**.
   *
   * The store is already populated from storage by the time this runs, so this
   * is no longer what makes the user appear signed in; it is only the
   * reconciliation pass. The order matters: a missing refresh token is the one
   * state that justifies clearing, and `ensureValidToken()` returning false is
   * not that state — it is also what a timeout looks like — so the verdict is
   * read back off the session itself.
   */
  const initializeAuth = async () => {
    try {
      if (!authService.hasSession()) {
        // Nothing left to refresh with. Anything still in storage is dead
        // weight that would otherwise render a signed-in shell over a session
        // the server will refuse.
        if (user.value || authService.getUser() || authService.getAccessToken()) {
          await logout()
        }
        return
      }

      if (!user.value) {
        // A live session whose cached user is missing or unreadable: fetch the
        // profile rather than treat it as signed out. fetchProfile's own 401
        // path goes through ApiClient, which refreshes and retries first.
        await fetchProfile()
        return
      }

      const isValid = await authService.ensureValidToken()

      if (isValid) {
        // Refresh the cached profile in the background — never awaited, so a
        // slow network cannot hold up the first paint.
        fetchProfile().catch(() => {
          // Cached user data stands.
        })
        return
      }

      /*
       * ensureValidToken() answers false for a rejected refresh token *and* for
       * a request that never made it out. tokenManager clears the tokens only in
       * the first case, so the session itself is the verdict: still holding one
       * means "try again on the next request", not "sign out".
       */
      if (!authService.hasSession()) {
        await logout()
      }
    } catch {
      // Never sign out on an unexpected error — the cached session stands.
    }
  }

  /**
   * The session ended server-side (tokenManager.endSession). Storage is already
   * empty; this drops the in-memory user so the app stops rendering a signed-in
   * shell. Routing is App.vue's job — the store must not know about the router.
   */
  const handleSessionExpired = () => {
    user.value = null
    isLoading.value = false
  }

  const googleLogin = async (accessToken: string) => {
    try {
      setLoading(true)
      clearError()

      const response = await authService.googleLogin({ access_token: accessToken })

      if (response.success && response.data) {
        // Google login also returns nested tokens object: { tokens: { access, refresh }, user }
        setUser(response.data.user)
        return { success: true }
      } else {
        const errorMsg = response.message || 'Google login failed'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch {
      const errorMsg = 'Network error during Google login'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const telegramLogin = async (telegramData: any) => {
    try {
      setLoading(true)
      clearError()

      const response = await authService.telegramLogin(telegramData)

      if (response.success && response.data) {
        // Telegram login returns nested tokens object: { tokens: { access, refresh }, user }
        setUser(response.data.user)
        return { success: true }
      } else {
        const errorMsg = response.message || 'Telegram login failed'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch {
      const errorMsg = 'Network error during Telegram login'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle successful Telegram bot login
   * This is called after the useTelegramBotLogin composable completes authentication
   */
  const telegramBotLogin = async (
    telegramUser: TelegramBotLoginUser,
    accessToken: string,
    refreshToken: string
  ) => {
    try {
      setLoading(true)
      clearError()

      // Store tokens using the auth service
      authService.setUser({
        id: telegramUser.id,
        email: telegramUser.email,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        profile_picture: telegramUser.profile_picture || undefined,
        logo: telegramUser.logo || undefined,
        bio: telegramUser.bio,
        date_joined: telegramUser.created_at,
        is_active: true,
        is_verified: telegramUser.is_verified,
        is_partner: telegramUser.is_partner,
        is_staff: telegramUser.is_staff,
        phone_number: telegramUser.phone_number || undefined,
        telegram_link: telegramUser.telegram_link || undefined,
        payment_link: telegramUser.payment_link || undefined,
      })

      // Import and use tokenManager to set the tokens
      const { tokenManager } = await import('../services/tokenManager')
      tokenManager.setTokens(accessToken, refreshToken)

      // Set user in the store
      setUser({
        id: telegramUser.id,
        email: telegramUser.email,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        profile_picture: telegramUser.profile_picture || undefined,
        logo: telegramUser.logo || undefined,
        bio: telegramUser.bio,
        date_joined: telegramUser.created_at,
        is_active: true,
        is_verified: telegramUser.is_verified,
        is_partner: telegramUser.is_partner,
        is_staff: telegramUser.is_staff,
        phone_number: telegramUser.phone_number || undefined,
        telegram_link: telegramUser.telegram_link || undefined,
        payment_link: telegramUser.payment_link || undefined,
      })

      return { success: true }
    } catch {
      const errorMsg = 'Failed to complete Telegram bot login'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    userInitials,
    // Actions
    setUser,
    setLoading,
    setError,
    clearError,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    initializeAuth,
    handleSessionExpired,
    googleLogin,
    telegramLogin,
    telegramBotLogin,
  }
})
