import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type User, type LoginRequest, type RegisterRequest } from '../services/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && authService.isAuthenticated())
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
        // Merge the updated data with existing user data to avoid losing fields
        // The backend response.data should contain the complete updated user object
        const updatedUser = { ...user.value, ...response.data } as User

        // setUser now handles both reactive state AND storage persistence
        setUser(updatedUser)

        return { success: true }
      } else {
        const errorMsg = response.message || 'Failed to update profile'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Network error while updating profile'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const initializeAuth = async () => {
    const isDevelopment =
      import.meta.env.DEV ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    try {
      // Check if user is stored in storage
      let storedUser: User | null = null
      let hasValidAuth = false

      try {
        storedUser = authService.getUser()
        hasValidAuth = authService.isAuthenticated()
      } catch (storageError) {
        // In development, we can continue without stored auth
        if (isDevelopment) {
          return
        }
        // In production, clear potentially corrupted storage and continue
        try {
          authService.clearTokens()
          authService.clearUser()
        } catch (clearError) {
          // Silent error handling
        }
        return
      }

      if (storedUser && hasValidAuth) {
        setUser(storedUser)

        // Verify token validity - ensureValidToken now uses caching internally
        // so this won't make excessive server calls
        try {
          const isValid = await authService.ensureValidToken()

          if (isValid) {
            // Optionally try to fetch fresh profile data in the background
            // Don't await this to speed up app initialization
            fetchProfile().catch((profileError) => {
              // Silently continue with cached user data
            })
          } else {
            // Token is definitively invalid (not just a network error)
            await logout()
          }
        } catch (networkError) {
          // Network error during validation - don't logout
          // The user can continue with cached data
          // In production, we're more lenient with network errors
          // Users can still use the app with cached data if they just lost connection temporarily
        }
      }
    } catch (err) {
      // Don't logout on unexpected errors - this could be a transient issue
      // Let the user continue with cached data if available
    }
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
    } catch (err) {
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
    } catch (err) {
      const errorMsg = 'Network error during Telegram login'
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
    googleLogin,
    telegramLogin,
  }
})
