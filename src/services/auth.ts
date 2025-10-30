import { apiService, type ApiResponse } from './api'
import { secureStorage } from '../utils/secureStorage'
import { jwtUtils } from '../utils/jwtUtils'

// Import API base URL for direct fetch in logout
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Validation cache to prevent excessive server validation
const VALIDATION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let lastValidationTime: number = 0
let lastValidationResult: boolean = false

export interface User {
  id: number
  email: string
  username: string
  first_name?: string
  last_name?: string
  profile_picture?: string
  logo?: string
  bio?: string
  date_joined: string
  is_active: boolean
  is_verified?: boolean
  is_partner?: boolean
  phone_number?: string
  telegram_link?: string
  payment_link?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  tokens: {
    access: string
    refresh: string
  }
  user: User
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  password_confirm: string
  first_name?: string
  last_name?: string
}

export interface RegisterResponse {
  user: User
  message: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface TokenRefreshRequest {
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
  refresh: string
}

export interface GoogleLoginRequest {
  access_token: string
}

export interface TelegramAuthData {
  id: string
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: string
  hash: string
}

class AuthService {
  // Authentication endpoints
  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiService.post<RegisterResponse>('/api/auth/register/', data)
    return response
  }

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>('/api/auth/login/', data)

    if (response.success && response.data) {
      // Enhanced validation and handling of login response
      try {
        // Check for expected nested structure: { tokens: { access, refresh }, user }
        if (this.isValidLoginResponse(response.data)) {
          this.setTokens(response.data.tokens.access, response.data.tokens.refresh)
          this.setUser(response.data.user)
        } else {
          // Try to handle alternative response formats
          const normalizedResponse = this.normalizeLoginResponse(response.data)
          if (normalizedResponse) {
            this.setTokens(normalizedResponse.tokens.access, normalizedResponse.tokens.refresh)
            this.setUser(normalizedResponse.user)
          } else {
            console.error('Unexpected login response structure:', response.data)
            return {
              success: false,
              message: 'Invalid response format from server',
            }
          }
        }
      } catch (processingError) {
        console.error('Error processing login response:', processingError)
        return {
          success: false,
          message: 'Failed to process login response',
        }
      }
    }

    return response
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      // CRITICAL: Capture tokens BEFORE setting logout mode to prevent any storage interference
      const accessToken = this.getAccessTokenDirect()
      const refreshToken = this.getRefreshTokenDirect()

      // Now set logout mode to prevent any further storage operations
      secureStorage.setLogoutMode(true)

      // Make logout request with refresh token in body as documented
      const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          ...(refreshToken ? { refresh: refreshToken } : {}),
        }),
      })

      // Always clear tokens regardless of response
      this.clearTokens()
      this.clearUser()

      // Reset logout mode
      secureStorage.setLogoutMode(false)

      // Convert response to ApiResponse format
      if (response.ok || response.status === 404) {
        const responseData = response.ok ? await response.json() : null
        return {
          success: true,
          data: responseData || { message: 'Successfully logged out' },
        }
      } else {
        // Even if logout API fails, we've cleared local tokens so logout is successful
        return {
          success: true,
          data: { message: 'Logged out locally' },
        }
      }
    } catch (error) {
      // Clear tokens even if network fails and reset logout mode
      this.clearTokens()
      this.clearUser()
      secureStorage.setLogoutMode(false)
      console.error('Logout error:', error)
      return {
        success: true,
        data: { message: 'Logged out locally due to network error' },
      }
    }
  }

  async googleLogin(data: GoogleLoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>('/api/auth/google/login/', data)

    if (response.success && response.data) {
      // Enhanced validation for Google login as well
      try {
        if (this.isValidLoginResponse(response.data)) {
          this.setTokens(response.data.tokens.access, response.data.tokens.refresh)
          this.setUser(response.data.user)
        } else {
          const normalizedResponse = this.normalizeLoginResponse(response.data)
          if (normalizedResponse) {
            this.setTokens(normalizedResponse.tokens.access, normalizedResponse.tokens.refresh)
            this.setUser(normalizedResponse.user)
          } else {
            console.error('Unexpected Google login response structure:', response.data)
            return {
              success: false,
              message: 'Invalid response format from server',
            }
          }
        }
      } catch (processingError) {
        console.error('Error processing Google login response:', processingError)
        return {
          success: false,
          message: 'Failed to process Google login response',
        }
      }
    }

    return response
  }

  async telegramLogin(data: TelegramAuthData): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>('/api/auth/telegram/login/', data)

    if (response.success && response.data) {
      // Enhanced validation for Telegram login
      try {
        if (this.isValidLoginResponse(response.data)) {
          this.setTokens(response.data.tokens.access, response.data.tokens.refresh)
          this.setUser(response.data.user)
        } else {
          const normalizedResponse = this.normalizeLoginResponse(response.data)
          if (normalizedResponse) {
            this.setTokens(normalizedResponse.tokens.access, normalizedResponse.tokens.refresh)
            this.setUser(normalizedResponse.user)
          } else {
            console.error('Unexpected Telegram login response structure:', response.data)
            return {
              success: false,
              message: 'Invalid response format from server',
            }
          }
        }
      } catch (processingError) {
        console.error('Error processing Telegram login response:', processingError)
        return {
          success: false,
          message: 'Failed to process Telegram login response',
        }
      }
    }

    return response
  }

  // Profile endpoints
  async getProfile(): Promise<ApiResponse<User>> {
    return apiService.get<User>('/api/auth/profile/')
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiService.patch<User>('/api/auth/profile/', data)

    // Note: Storage persistence is now handled by auth store's setUser()
    // to avoid duplicate storage operations
    // The auth store will call authService.setUser() after merging the data

    return response
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<unknown>> {
    return apiService.post('/api/auth/change-password/', data)
  }

  // Token management
  async refreshToken(): Promise<ApiResponse<TokenRefreshResponse>> {
    const refreshToken = this.getRefreshToken()

    if (!refreshToken) {
      return {
        success: false,
        message: 'No refresh token available',
      }
    }

    const response = await apiService.post<TokenRefreshResponse>('/api/auth/token/refresh/', {
      refresh: refreshToken,
    })

    if (response.success && response.data) {
      // Handle token rotation: both access and refresh tokens are returned
      this.setTokens(response.data.access, response.data.refresh)
    } else {
      // If refresh fails, clear tokens but preserve user data
      // The auth store's logout() will handle full cleanup if needed
      this.clearTokens()
    }

    return response
  }

  async verifyToken(): Promise<ApiResponse<unknown>> {
    const accessToken = this.getAccessToken()

    if (!accessToken) {
      return {
        success: false,
        message: 'No access token available',
      }
    }

    return apiService.post('/api/auth/token/verify/', {
      token: accessToken,
    })
  }

  // Secure storage management
  private setTokens(accessToken: string, refreshToken: string): void {
    // Validate token format before storing
    if (
      !secureStorage.isValidTokenFormat(accessToken) ||
      !secureStorage.isValidTokenFormat(refreshToken)
    ) {
      console.warn('Invalid token format detected')
      return
    }

    secureStorage.setItem('access_token', accessToken)
    secureStorage.setItem('refresh_token', refreshToken)

    // Clear validation cache when new tokens are set
    this.clearValidationCache()

    // Migrate existing localStorage data if present
    secureStorage.migrateToSecureStorage(['access_token', 'refresh_token', 'user'])
  }

  private setAccessToken(accessToken: string): void {
    if (!secureStorage.isValidTokenFormat(accessToken)) {
      console.warn('Invalid access token format detected')
      return
    }

    secureStorage.setItem('access_token', accessToken)
  }

  setUser(user: User): void {
    try {
      // Sanitize user data before storing
      const sanitizedUser = this.sanitizeUserData(user)
      secureStorage.setItem('user', JSON.stringify(sanitizedUser))
    } catch (error) {
      console.error('Failed to store user data:', error)
    }
  }

  /**
   * Sanitize user data to prevent XSS
   */
  private sanitizeUserData(user: User): User {
    const sanitize = (str: string | undefined): string | undefined => {
      if (!str) return str
      return str.replace(/[<>\"'&]/g, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        }
        return escapeMap[match] || match
      })
    }

    return {
      ...user,
      email: sanitize(user.email) || user.email,
      username: sanitize(user.username) || user.username,
      first_name: sanitize(user.first_name),
      last_name: sanitize(user.last_name),
      bio: sanitize(user.bio),
      phone_number: sanitize(user.phone_number),
      telegram_link: sanitize(user.telegram_link),
      payment_link: sanitize(user.payment_link),
    }
  }

  getAccessToken(): string | null {
    try {
      const token = secureStorage.getItem('access_token')

      // Validate token format if we got a token
      if (token && !secureStorage.isValidTokenFormat(token)) {
        console.warn('Invalid token format in storage, clearing tokens')
        this.clearTokens()
        return null
      }

      return token
    } catch (error) {
      console.error('Error retrieving access token from storage:', error)
      return null
    }
  }

  /**
   * Get access token directly from storage without any validation or migration
   * Used during logout to prevent token corruption
   */
  private getAccessTokenDirect(): string | null {
    try {
      return secureStorage.getItemDirect('access_token')
    } catch (error) {
      console.error('Error retrieving access token directly:', error)
      return null
    }
  }

  getRefreshToken(): string | null {
    try {
      const token = secureStorage.getItem('refresh_token')

      // Validate token format if we got a token
      if (token && !secureStorage.isValidTokenFormat(token)) {
        console.warn('Invalid refresh token format in storage, clearing tokens')
        this.clearTokens()
        return null
      }

      return token
    } catch (error) {
      console.error('Error retrieving refresh token from storage:', error)
      return null
    }
  }

  /**
   * Get refresh token directly from storage without any validation or migration
   * Used during logout to prevent token corruption
   */
  private getRefreshTokenDirect(): string | null {
    try {
      return secureStorage.getItemDirect('refresh_token')
    } catch (error) {
      console.error('Error retrieving refresh token directly:', error)
      return null
    }
  }

  getUser(): User | null {
    try {
      const userData = secureStorage.getItem('user')
      if (!userData) return null

      const user = JSON.parse(userData)

      // Basic validation of user object
      if (!user || typeof user !== 'object' || !user.id || !user.email) {
        console.warn('Invalid user data in storage:', {
          hasUser: !!user,
          type: typeof user,
          hasId: !!user?.id,
          hasEmail: !!user?.email,
          userData: user,
        })
        this.clearUser()
        return null
      }

      return user
    } catch (error) {
      console.error('Failed to parse user data:', error)
      this.clearUser()
      return null
    }
  }

  clearTokens(): void {
    secureStorage.removeItem('access_token')
    secureStorage.removeItem('refresh_token')
    // Clear validation cache when tokens are cleared
    lastValidationTime = 0
    lastValidationResult = false
  }

  clearUser(): void {
    secureStorage.removeItem('user')
  }

  /**
   * Clear validation cache (useful after token refresh or login)
   */
  clearValidationCache(): void {
    lastValidationTime = 0
    lastValidationResult = false
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  /**
   * Check if we should attempt token refresh based on actual token expiration
   */
  private shouldRefreshToken(): boolean {
    try {
      const accessToken = this.getAccessToken()

      if (!accessToken) {
        return false // No token to refresh
      }

      // Check if token is expired or will expire within 5 minutes
      const isExpired = jwtUtils.isTokenExpired(accessToken)
      const willExpireSoon = jwtUtils.willExpireSoon(accessToken, 5)

      if (isExpired) {
        console.info('Access token is expired, refresh needed')
        return true
      }

      if (willExpireSoon) {
        console.info('Access token will expire soon, proactive refresh needed')
        return true
      }

      return false
    } catch (error) {
      console.warn('Error checking token expiration, will attempt refresh:', error)
      return true
    }
  }

  /**
   * Validate token by making a server request instead of parsing JWT
   */
  async validateTokenWithServer(): Promise<boolean> {
    try {
      const response = await this.verifyToken()
      return response.success
    } catch {
      return false
    }
  }

  async ensureValidToken(): Promise<boolean> {
    try {
      const accessToken = this.getAccessToken()

      if (!accessToken) {
        console.info('No access token found')
        return false
      }

      // Check validation cache first to avoid excessive server calls
      const now = Date.now()
      if (now - lastValidationTime < VALIDATION_CACHE_DURATION && lastValidationResult) {
        console.debug('Using cached validation result')
        return true
      }

      // Check if token is expired client-side first
      const isExpired = jwtUtils.isTokenExpired(accessToken)

      if (isExpired === true) {
        console.info('Access token is expired, attempting refresh')
        const refreshResponse = await this.refreshToken()

        if (refreshResponse.success) {
          console.info('Token refreshed successfully')
          lastValidationTime = now
          lastValidationResult = true
          return true
        }

        console.warn('Token refresh failed')
        lastValidationTime = now
        lastValidationResult = false
        return false
      }

      // Check if token will expire soon and proactively refresh
      if (this.shouldRefreshToken()) {
        console.info('Token will expire soon, proactive refresh')

        const refreshResponse = await this.refreshToken()
        if (refreshResponse.success) {
          console.info('Proactive token refresh successful')
          lastValidationTime = now
          lastValidationResult = true
          return true
        }

        // If proactive refresh fails, check if current token is still valid
        console.warn('Proactive refresh failed, checking current token validity')
        const isStillValid = await this.validateTokenWithServer()

        lastValidationTime = now
        lastValidationResult = isStillValid
        return isStillValid
      }

      // Token should be valid, update cache
      lastValidationTime = now
      lastValidationResult = true
      return true
    } catch (error) {
      console.error('Error in ensureValidToken:', error)
      lastValidationTime = Date.now()
      lastValidationResult = false
      return false
    }
  }

  /**
   * Validate if the login response has the expected nested structure
   */
  private isValidLoginResponse(data: any): data is LoginResponse {
    return (
      data &&
      typeof data === 'object' &&
      data.tokens &&
      typeof data.tokens === 'object' &&
      typeof data.tokens.access === 'string' &&
      typeof data.tokens.refresh === 'string' &&
      data.user &&
      typeof data.user === 'object' &&
      data.user.id &&
      data.user.email
    )
  }

  /**
   * Try to normalize different possible response formats to the expected structure
   */
  private normalizeLoginResponse(data: any): LoginResponse | null {
    if (!data || typeof data !== 'object') {
      return null
    }

    // Case 1: Direct token fields (legacy format)
    if (data.access && data.refresh && data.user) {
      console.debug('Normalizing legacy login response format')
      return {
        tokens: {
          access: data.access,
          refresh: data.refresh,
        },
        user: data.user,
      }
    }

    // Case 2: Token object at root level (alternative format)
    if (data.token && data.user) {
      console.debug('Normalizing token object login response format')
      return {
        tokens: {
          access: data.token.access || data.token,
          refresh: data.token.refresh || data.refresh_token,
        },
        user: data.user,
      }
    }

    // Case 3: Different nested structure
    if (data.authentication && data.user) {
      console.debug('Normalizing authentication object login response format')
      const auth = data.authentication
      return {
        tokens: {
          access: auth.access_token || auth.access,
          refresh: auth.refresh_token || auth.refresh,
        },
        user: data.user,
      }
    }

    console.warn('Unable to normalize login response format:', {
      keys: Object.keys(data),
      structure: {
        hasTokens: !!data.tokens,
        hasUser: !!data.user,
        hasAccess: !!data.access,
        hasRefresh: !!data.refresh,
        hasToken: !!data.token,
      },
    })

    return null
  }
}

export const authService = new AuthService()
