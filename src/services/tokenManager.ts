/**
 * Token Manager Service
 *
 * Centralized token management to avoid circular dependencies between api.ts and auth.ts.
 * This service handles token storage, validation, and refresh logic.
 */

import { secureStorage } from '../utils/secureStorage'
import { jwtUtils } from '../utils/jwtUtils'

// Token refresh state management
interface TokenRefreshState {
  isRefreshing: boolean
  refreshPromise: Promise<boolean> | null
}

const refreshState: TokenRefreshState = {
  isRefreshing: false,
  refreshPromise: null,
}

// Validation cache to prevent excessive checks
const VALIDATION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let lastValidationTime = 0
let lastValidationResult = false

export interface TokenPair {
  access: string
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
  refresh: string
}

class TokenManager {
  /**
   * Get access token from secure storage
   */
  getAccessToken(): string | null {
    try {
      const token = secureStorage.getItem('access_token')

      if (token && !secureStorage.isValidTokenFormat(token)) {
        console.warn('Invalid access token format in storage, clearing tokens')
        this.clearTokens()
        return null
      }

      return token
    } catch (error) {
      console.error('Error retrieving access token:', error)
      return null
    }
  }

  /**
   * Get refresh token from secure storage
   */
  getRefreshToken(): string | null {
    try {
      const token = secureStorage.getItem('refresh_token')

      if (token && !secureStorage.isValidTokenFormat(token)) {
        console.warn('Invalid refresh token format in storage, clearing tokens')
        this.clearTokens()
        return null
      }

      return token
    } catch (error) {
      console.error('Error retrieving refresh token:', error)
      return null
    }
  }

  /**
   * Store both access and refresh tokens
   */
  setTokens(accessToken: string, refreshToken: string): void {
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

  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    secureStorage.removeItem('access_token')
    secureStorage.removeItem('refresh_token')
    this.clearValidationCache()
  }

  /**
   * Clear validation cache
   */
  clearValidationCache(): void {
    lastValidationTime = 0
    lastValidationResult = false
  }

  /**
   * Check if user is authenticated (has valid access token)
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  /**
   * Check if token is expired or will expire soon
   */
  shouldRefreshToken(minutesBeforeExpiry: number = 5): boolean {
    try {
      const accessToken = this.getAccessToken()

      if (!accessToken) {
        return false // No token to refresh
      }

      const isExpired = jwtUtils.isTokenExpired(accessToken)
      const willExpireSoon = jwtUtils.willExpireSoon(accessToken, minutesBeforeExpiry)

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
      console.warn('Error checking token expiration:', error)
      return true
    }
  }

  /**
   * Attempt to refresh the access token using the refresh token
   * Returns a promise that resolves to true if refresh was successful
   *
   * This method ensures only one refresh happens at a time using a promise lock
   */
  async attemptTokenRefresh(
    refreshCallback: (refreshToken: string) => Promise<TokenRefreshResponse>
  ): Promise<boolean> {
    // If already refreshing, wait for that promise
    if (refreshState.isRefreshing && refreshState.refreshPromise) {
      console.debug('Token refresh already in progress, waiting...')
      return refreshState.refreshPromise
    }

    // Start a new refresh
    refreshState.isRefreshing = true
    refreshState.refreshPromise = (async () => {
      try {
        console.info('Attempting to refresh access token')

        const refreshToken = this.getRefreshToken()
        if (!refreshToken) {
          console.warn('No refresh token available')
          return false
        }

        const response = await refreshCallback(refreshToken)

        if (response && response.access && response.refresh) {
          console.info('Token refresh successful')
          this.setTokens(response.access, response.refresh)
          return true
        }

        console.warn('Token refresh failed: Invalid response')
        this.clearTokens()
        return false
      } catch (error) {
        console.error('Token refresh error:', error)
        this.clearTokens()
        return false
      } finally {
        refreshState.isRefreshing = false
        refreshState.refreshPromise = null
      }
    })()

    return refreshState.refreshPromise
  }

  /**
   * Validate token using cached result or server verification
   */
  async ensureValidToken(
    verifyCallback: (token: string) => Promise<boolean>,
    refreshCallback: (refreshToken: string) => Promise<TokenRefreshResponse>
  ): Promise<boolean> {
    try {
      const accessToken = this.getAccessToken()

      if (!accessToken) {
        console.info('No access token found')
        return false
      }

      // Check validation cache first
      const now = Date.now()
      if (now - lastValidationTime < VALIDATION_CACHE_DURATION && lastValidationResult) {
        console.debug('Using cached validation result')
        return true
      }

      // Check if token is expired client-side
      const isExpired = jwtUtils.isTokenExpired(accessToken)

      if (isExpired === true) {
        console.info('Access token is expired, attempting refresh')
        const refreshSuccess = await this.attemptTokenRefresh(refreshCallback)

        lastValidationTime = now
        lastValidationResult = refreshSuccess
        return refreshSuccess
      }

      // Check if token will expire soon and proactively refresh
      if (this.shouldRefreshToken()) {
        console.info('Token will expire soon, proactive refresh')

        const refreshSuccess = await this.attemptTokenRefresh(refreshCallback)
        if (refreshSuccess) {
          console.info('Proactive token refresh successful')
          lastValidationTime = now
          lastValidationResult = true
          return true
        }

        // If proactive refresh fails, check if current token is still valid
        console.warn('Proactive refresh failed, verifying current token')
        const isStillValid = await verifyCallback(accessToken)

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
}

export const tokenManager = new TokenManager()
