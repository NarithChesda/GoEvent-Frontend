import { apiService, type ApiResponse } from './api'

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

  // Local storage management
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  private setAccessToken(accessToken: string): void {
    localStorage.setItem('access_token', accessToken)
  }

  private setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user))
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  getUser(): User | null {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }

  clearTokens(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  clearUser(): void {
    localStorage.removeItem('user')
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  async ensureValidToken(): Promise<boolean> {
    const accessToken = this.getAccessToken()
    
    if (!accessToken) {
      return false
    }

    // If token is not expired, it's valid
    if (!this.isTokenExpired(accessToken)) {
      return true
    }

    // Try to refresh the token
    const refreshResponse = await this.refreshToken()
    return refreshResponse.success
  }
}

export const authService = new AuthService()