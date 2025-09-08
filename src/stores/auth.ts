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

      console.debug('Auth Store: Starting login process', { email: credentials.email })
      const response = await authService.login(credentials)
      console.debug('Auth Store: Login response received', { success: response.success, hasData: !!response.data })

      if (response.success && response.data) {
        // Response now has nested tokens object: { tokens: { access, refresh }, user }
        setUser(response.data.user)
        console.debug('Auth Store: User set successfully', { userId: response.data.user.id, email: response.data.user.email })
        return { success: true }
      } else {
        const errorMsg = response.message || 'Login failed'
        console.error('Auth Store: Login failed', { error: errorMsg, response })
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Network error during login'
      console.error('Auth Store: Login exception caught', { error: err, message: (err as Error).message })
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
          password: userData.password
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
      console.error('Logout error:', err)
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
        const updatedUser = { ...user.value, ...response.data }
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
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    try {
      // Check if user is stored in storage
      let storedUser: User | null = null
      let hasValidAuth = false
      
      try {
        storedUser = authService.getUser()
        hasValidAuth = authService.isAuthenticated()
      } catch (storageError) {
        console.warn('Storage error during auth initialization:', storageError)
        // In development, we can continue without stored auth
        if (isDevelopment) {
          console.info('Continuing in development mode despite storage error')
          return
        }
        // In production, clear potentially corrupted storage and continue
        try {
          authService.clearTokens()
          authService.clearUser()
        } catch (clearError) {
          console.error('Failed to clear corrupted storage:', clearError)
        }
        return
      }
      
      if (storedUser && hasValidAuth) {
        setUser(storedUser)
        
        // Only try to verify token if we're in a production environment
        // or if the API is available (to prevent dev mode white screen)
        try {
          const isValid = await authService.ensureValidToken()
          if (isValid) {
            // Try to fetch fresh profile data
            try {
              await fetchProfile()
            } catch (profileError) {
              console.warn('Failed to fetch fresh profile, continuing with cached data:', profileError)
              // Continue with cached user data
            }
          } else {
            // Token is invalid, clear auth state
            console.info('Token validation failed, clearing auth state')
            await logout()
          }
        } catch (networkError) {
          console.warn('Network unavailable during auth init, continuing offline:', networkError)
          // Continue with cached user data in dev mode or when network is unavailable
          if (isDevelopment) {
            console.info('Development mode: continuing with cached auth data despite network error')
          }
        }
      } else {
        if (isDevelopment) {
          console.info('No valid auth data found during initialization')
        }
      }
    } catch (err) {
      console.error('Critical error during auth initialization:', err)
      
      // In development, don't clear everything on unexpected errors
      if (!isDevelopment) {
        try {
          await logout()
        } catch (logoutError) {
          console.error('Failed to logout after init error:', logoutError)
        }
      } else {
        console.warn('Development mode: not clearing auth state due to initialization error')
      }
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
    googleLogin
  }
})