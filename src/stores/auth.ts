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

      const response = await authService.login(credentials)

      if (response.success && response.data) {
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
          password: userData.password
        })

        if (loginResponse.success && loginResponse.data) {
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
    try {
      // Check if user is stored in localStorage
      const storedUser = authService.getUser()
      if (storedUser && authService.isAuthenticated()) {
        setUser(storedUser)
        
        // Only try to verify token if we're in a production environment
        // or if the API is available (to prevent dev mode white screen)
        try {
          const isValid = await authService.ensureValidToken()
          if (isValid) {
            await fetchProfile()
          } else {
            // Token is invalid, clear auth state
            await logout()
          }
        } catch (networkError) {
          console.warn('Network unavailable during auth init, continuing offline:', networkError)
          // Continue with cached user data in dev mode
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
      // Don't logout on initialization errors, just continue
    }
  }

  const googleLogin = async (accessToken: string) => {
    try {
      setLoading(true)
      clearError()

      const response = await authService.googleLogin({ access_token: accessToken })

      if (response.success && response.data) {
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