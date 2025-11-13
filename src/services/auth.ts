import { apiService, type ApiResponse } from './api'
import { secureStorage } from '../utils/secureStorage'
import { tokenManager } from './tokenManager'

// Import API base URL for direct fetch in logout
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

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
            return {
              success: false,
              message: 'Invalid response format from server',
            }
          }
        }
      } catch (processingError) {
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
      // Capture tokens before clearing
      const accessToken = this.getAccessToken()
      const refreshToken = this.getRefreshToken()

      // Make logout request with refresh token in body
      // Don't await - fire and forget for better UX
      if (refreshToken) {
        fetch(`${API_BASE_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ refresh: refreshToken }),
        }).catch((error) => {
          // Silent error handling
        })
      }

      // Clear local auth data immediately for better UX
      this.clearTokens()
      this.clearUser()

      return {
        success: true,
        data: { message: 'Successfully logged out' },
      }
    } catch (error) {
      // Even on error, clear local data
      this.clearTokens()
      this.clearUser()
      return {
        success: true,
        data: { message: 'Logged out locally' },
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
            return {
              success: false,
              message: 'Invalid response format from server',
            }
          }
        }
      } catch (processingError) {
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
            return {
              success: false,
              message: 'Invalid response format from server',
            }
          }
        }
      } catch (processingError) {
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

  // Token management - simplified to use tokenManager
  private setTokens(accessToken: string, refreshToken: string): void {
    tokenManager.setTokens(accessToken, refreshToken)
  }

  setUser(user: User): void {
    try {
      // Sanitize user data before storing
      const sanitizedUser = this.sanitizeUserData(user)
      secureStorage.setItem('user', JSON.stringify(sanitizedUser))
    } catch (error) {
      // Silent error handling
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
    return tokenManager.getAccessToken()
  }

  getRefreshToken(): string | null {
    return tokenManager.getRefreshToken()
  }

  getUser(): User | null {
    try {
      const userData = secureStorage.getItem('user')
      if (!userData) return null

      const user = JSON.parse(userData)

      // Basic validation of user object
      if (!user || typeof user !== 'object' || !user.id || !user.email) {
        this.clearUser()
        return null
      }

      return user
    } catch (error) {
      this.clearUser()
      return null
    }
  }

  clearTokens(): void {
    tokenManager.clearTokens()
  }

  clearUser(): void {
    secureStorage.removeItem('user')
  }

  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated()
  }

  /**
   * Ensure token is valid - delegates to tokenManager for single source of truth
   *
   * IMPROVEMENTS:
   * - Uses tokenManager.ensureValidToken() as single source of truth
   * - No redundant validation caching
   * - Better error handling
   */
  async ensureValidToken(): Promise<boolean> {
    try {
      return await tokenManager.ensureValidToken(
        // Verify callback - validates token with server
        async (token: string) => {
          const response = await apiService.post('/api/auth/token/verify/', { token })
          return response.success
        },
        // Refresh callback - gets new tokens from server
        async (refreshToken: string) => {
          const response = await apiService.post<TokenRefreshResponse>(
            '/api/auth/token/refresh/',
            { refresh: refreshToken }
          )

          if (response.success && response.data) {
            return {
              access: response.data.access,
              refresh: response.data.refresh,
            }
          }

          throw new Error('Token refresh failed')
        }
      )
    } catch (error) {
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
      const auth = data.authentication
      return {
        tokens: {
          access: auth.access_token || auth.access,
          refresh: auth.refresh_token || auth.refresh,
        },
        user: data.user,
      }
    }

    return null
  }
}

export const authService = new AuthService()
