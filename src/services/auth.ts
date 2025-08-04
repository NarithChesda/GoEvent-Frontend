import { apiService, type ApiResponse } from './api'
import { secureStorage } from '../utils/secureStorage'

export interface User {
  id: number
  email: string
  username: string
  first_name?: string
  last_name?: string
  profile_picture?: string
  bio?: string
  date_joined: string
  is_active: boolean
  is_verified?: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
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
}

export interface GoogleLoginRequest {
  access_token: string
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
      // Store tokens in localStorage
      this.setTokens(response.data.access, response.data.refresh)
      
      // Store user data
      this.setUser(response.data.user)
    }
    
    return response
  }

  async logout(): Promise<ApiResponse<any>> {
    const response = await apiService.post('/api/auth/logout/')
    
    // Clear local storage regardless of API response
    this.clearTokens()
    this.clearUser()
    
    return response
  }

  async googleLogin(data: GoogleLoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>('/api/auth/google/login/', data)
    
    if (response.success && response.data) {
      this.setTokens(response.data.access, response.data.refresh)
      this.setUser(response.data.user)
    }
    
    return response
  }

  // Profile endpoints
  async getProfile(): Promise<ApiResponse<User>> {
    return apiService.get<User>('/api/auth/profile/me/')
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiService.put<User>('/api/auth/profile/', data)
    
    if (response.success && response.data) {
      this.setUser(response.data)
    }
    
    return response
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<any>> {
    return apiService.post('/api/auth/change-password/', data)
  }

  // Token management
  async refreshToken(): Promise<ApiResponse<TokenRefreshResponse>> {
    const refreshToken = this.getRefreshToken()
    
    if (!refreshToken) {
      return {
        success: false,
        message: 'No refresh token available'
      }
    }

    const response = await apiService.post<TokenRefreshResponse>('/api/auth/token/refresh/', {
      refresh: refreshToken
    })

    if (response.success && response.data) {
      this.setAccessToken(response.data.access)
    } else {
      // If refresh fails, clear all tokens
      this.clearTokens()
      this.clearUser()
    }

    return response
  }

  async verifyToken(): Promise<ApiResponse<any>> {
    const accessToken = this.getAccessToken()
    
    if (!accessToken) {
      return {
        success: false,
        message: 'No access token available'
      }
    }

    return apiService.post('/api/auth/token/verify/', {
      token: accessToken
    })
  }

  // Secure storage management
  private setTokens(accessToken: string, refreshToken: string): void {
    // Validate token format before storing
    if (!secureStorage.isValidTokenFormat(accessToken) || !secureStorage.isValidTokenFormat(refreshToken)) {
      console.warn('Invalid token format detected')
      return
    }
    
    secureStorage.setItem('access_token', accessToken)
    secureStorage.setItem('refresh_token', refreshToken)
    
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

  private setUser(user: User): void {
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
          '&': '&amp;'
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
      bio: sanitize(user.bio)
    }
  }

  getAccessToken(): string | null {
    const token = secureStorage.getItem('access_token')
    
    // Validate token format
    if (token && !secureStorage.isValidTokenFormat(token)) {
      console.warn('Invalid token format in storage, clearing tokens')
      this.clearTokens()
      return null
    }
    
    return token
  }

  getRefreshToken(): string | null {
    const token = secureStorage.getItem('refresh_token')
    
    // Validate token format
    if (token && !secureStorage.isValidTokenFormat(token)) {
      console.warn('Invalid refresh token format in storage, clearing tokens')
      this.clearTokens()
      return null
    }
    
    return token
  }

  getUser(): User | null {
    try {
      const userData = secureStorage.getItem('user')
      if (!userData) return null
      
      const user = JSON.parse(userData)
      
      // Basic validation of user object
      if (!user || typeof user !== 'object' || !user.id || !user.email) {
        console.warn('Invalid user data in storage')
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
  }

  clearUser(): void {
    secureStorage.removeItem('user')
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  /**
   * Check if we should attempt token refresh
   * Uses a simple heuristic instead of parsing JWT client-side
   */
  private shouldRefreshToken(): boolean {
    const lastRefresh = secureStorage.getItem('last_token_refresh')
    if (!lastRefresh) return true
    
    const lastRefreshTime = parseInt(lastRefresh, 10)
    const now = Date.now()
    
    // Refresh if more than 50 minutes have passed (assuming 60-minute token expiry)
    return (now - lastRefreshTime) > (50 * 60 * 1000)
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
    const accessToken = this.getAccessToken()
    
    if (!accessToken) {
      return false
    }

    // Check if we should attempt refresh based on time heuristic
    if (this.shouldRefreshToken()) {
      // First try to validate current token with server
      const isValid = await this.validateTokenWithServer()
      
      if (isValid) {
        // Update last refresh time
        secureStorage.setItem('last_token_refresh', Date.now().toString())
        return true
      }
      
      // Token is invalid, try to refresh
      const refreshResponse = await this.refreshToken()
      if (refreshResponse.success) {
        secureStorage.setItem('last_token_refresh', Date.now().toString())
        return true
      }
      
      return false
    }
    
    // Token should still be valid based on time heuristic
    return true
  }
}

export const authService = new AuthService()